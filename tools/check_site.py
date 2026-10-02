#!/usr/bin/env python3
"""check_site.py — controlli statici del sito (solo stdlib).

Verifica:
  1. ogni href/src relativo nelle pagine HTML punta a un file esistente (anche url() nei CSS e import nei JS);
  2. nessun path interno comincia con "/" (il sito vive in una sottocartella su GitHub Pages);
  3. i JSON in site/data (e site/dev/fixtures) sono JSON validi;
  4. manifest.webmanifest: JSON valido, icone esistenti;
  5. sw.js: ogni voce di PRECACHE esiste e non comincia con "/"; ogni file statico (html/css/js/svg/png/manifest,
     esclusi dev/ data/ tools/ e PRECACHE_SKIP) è in PRECACHE.
Uso:  python3 tools/check_site.py   (da site/ o da qualunque cwd). Exit 1 se ci sono problemi.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

SITE = Path(__file__).resolve().parent.parent
SKIP_SCHEMES = ("http:", "https:", "mailto:", "tel:", "data:", "javascript:", "blob:", "sms:", "geo:")
problems = []
warnings = []
# file statici volutamente fuori dalla precache (pagina di prova componenti, il SW stesso)
# tema unico (DIRECTION 2 ott 2026): i vecchi temi restano nel repo, non linkati né precacheati
PRECACHE_SKIP = {"_styleguide.html", "sw.js", "assets/css/themes/washi.css", "assets/css/themes/night.css"}


def rel(p):
    return str(Path(p).relative_to(SITE)) if str(p).startswith(str(SITE)) else str(p)


def check_ref(src_file, ref, what):
    """Controlla un riferimento trovato in src_file."""
    ref = (ref or "").strip()
    if not ref or ref.startswith("#") or ref.lower().startswith(SKIP_SCHEMES) or "${" in ref or "{{" in ref:
        return
    if ref.startswith("//"):
        problems.append(f"{rel(src_file)}: {what} protocol-relative/esterno non ammesso: {ref}")
        return
    if ref.startswith("/"):
        problems.append(f"{rel(src_file)}: {what} con path assoluto (slash iniziale): {ref}")
        return
    path = unquote(urlsplit(ref).path)
    if not path:
        return
    target = (src_file.parent / path).resolve()
    if path.endswith("/"):
        target = target / "index.html"
    if not target.exists():
        problems.append(f"{rel(src_file)}: {what} → file mancante: {ref}")
    elif SITE not in target.parents and target != SITE:
        problems.append(f"{rel(src_file)}: {what} esce dalla cartella site/: {ref}")


class RefParser(HTMLParser):
    ATTRS = {"href", "src", "xlink:href", "poster", "data-src"}

    def __init__(self):
        super().__init__()
        self.refs = []
        self.scripts = []
        self._in_script = False

    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k in self.ATTRS and v is not None:
                self.refs.append((f"<{tag} {k}>", v))
            if k == "srcset" and v:
                for part in v.split(","):
                    self.refs.append((f"<{tag} srcset>", part.strip().split(" ")[0]))
        self._in_script = tag == "script"

    def handle_endtag(self, tag):
        if tag == "script":
            self._in_script = False

    def handle_data(self, data):
        if self._in_script:
            self.scripts.append(data)


IMPORT_RE = re.compile(r"""(?:import\s[^'"]*?from\s*|import\s*\(\s*|^\s*import\s*)['"]([^'"]+)['"]""", re.M)
CSS_URL_RE = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""")
CSS_IMPORT_RE = re.compile(r"""@import\s+['"]([^'"]+)['"]""")


def check_js_imports(src_file, text):
    for m in IMPORT_RE.finditer(text):
        spec = m.group(1)
        if spec.startswith((".", "/")):
            check_ref(src_file, spec, "import")
        else:
            problems.append(f"{rel(src_file)}: import non relativo (CDN/bare) non ammesso: {spec}")


def main():
    html_files = sorted(SITE.rglob("*.html"))
    for f in html_files:
        p = RefParser()
        p.feed(f.read_text(encoding="utf-8"))
        for what, ref in p.refs:
            check_ref(f, ref, what)
        for s in p.scripts:
            check_js_imports(f, s)

    for f in sorted((SITE / "assets").rglob("*.js")) if (SITE / "assets").exists() else []:
        check_js_imports(f, f.read_text(encoding="utf-8"))

    for f in sorted((SITE / "assets").rglob("*.css")) if (SITE / "assets").exists() else []:
        t = f.read_text(encoding="utf-8")
        for m in CSS_URL_RE.finditer(t):
            check_ref(f, m.group(1), "url()")
        for m in CSS_IMPORT_RE.finditer(t):
            check_ref(f, m.group(1), "@import")

    # JSON
    for d in (SITE / "data", SITE / "dev" / "fixtures"):
        if not d.exists():
            if d.name == "data":
                warnings.append("cartella data/ assente")
            continue
        for f in sorted(d.glob("*.json")):
            try:
                json.loads(f.read_text(encoding="utf-8"))
            except (ValueError, UnicodeDecodeError) as e:
                problems.append(f"{rel(f)}: JSON non valido: {e}")

    # Manifest
    mf = SITE / "manifest.webmanifest"
    if not mf.exists():
        problems.append("manifest.webmanifest mancante")
    else:
        try:
            m = json.loads(mf.read_text(encoding="utf-8"))
            for key in ("start_url", "scope"):
                if str(m.get(key, "")).startswith("/"):
                    problems.append(f"manifest: {key} assoluto: {m.get(key)}")
            check_ref(mf, m.get("start_url", ""), "start_url")
            for ic in m.get("icons", []):
                check_ref(mf, ic.get("src", ""), "icon")
        except ValueError as e:
            problems.append(f"manifest.webmanifest: JSON non valido: {e}")

    # Service worker
    sw = SITE / "sw.js"
    if not sw.exists():
        problems.append("sw.js mancante")
    else:
        t = sw.read_text(encoding="utf-8")
        block = re.search(r"PRECACHE-BEGIN(.*?)PRECACHE-END", t, re.S)
        if not block:
            problems.append("sw.js: marcatori PRECACHE-BEGIN/END non trovati")
        else:
            entries = re.findall(r"""['"]([^'"]+)['"]""", block.group(1))
            if not entries:
                problems.append("sw.js: PRECACHE vuoto")
            for e in entries:
                if e.startswith("dev/"):
                    problems.append(f"sw.js: PRECACHE include dev/: {e}")
                check_ref(sw, e, "PRECACHE")
            # completezza: ogni file statico servito (pagine, css, js, icone, manifest) deve essere in PRECACHE
            listed = {e for e in entries}
            for f in sorted(SITE.rglob("*")):
                r = f.relative_to(SITE).as_posix()
                if not f.is_file() or r.split("/")[0] in ("dev", "data", "tools") or r in PRECACHE_SKIP:
                    continue
                if f.suffix in (".html", ".css", ".js", ".svg", ".png", ".webmanifest") and r not in listed:
                    problems.append(f"sw.js: file statico non in PRECACHE: {r}")
        if not re.search(r"CACHE_VERSION\s*=\s*['\"][^'\"]+['\"]", t):
            problems.append("sw.js: CACHE_VERSION non trovato")
        data_block = re.search(r"DATA-BEGIN(.*?)DATA-END", t, re.S)
        if data_block and (SITE / "data").exists():
            names = re.findall(r"'([a-z_]+)'", data_block.group(1))
            for n in names:
                if not (SITE / "data" / f"{n}.json").exists():
                    warnings.append(f"sw.js: data/{n}.json elencato ma assente")

    for w in warnings:
        print(f"AVVISO  {w}")
    for p in problems:
        print(f"ERRORE  {p}")
    print(f"\n{len(html_files)} pagine HTML controllate · {len(problems)} errori · {len(warnings)} avvisi")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
