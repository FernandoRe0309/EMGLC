#!/usr/bin/env python3
"""Genera dist/Manual.html y dist/Admin.html (y sus versiones .aspx): cada uno con todo su CSS y JS adentro.

Uso:  python3 build.py
Los dos archivos se suben juntos a la misma carpeta de SharePoint.
"""
import re
from pathlib import Path

SRC = Path(__file__).resolve().parent
DIST = SRC / 'dist'

PAGES = {
    'Manual.html': SRC / 'index.html',
    'Admin.html': SRC / 'admin' / 'index.html',
}


def inline(page: Path) -> str:
    html = page.read_text(encoding='utf-8')
    base = page.parent

    def css(m):
        content = (base / m.group(1)).read_text(encoding='utf-8')
        return f'<style>\n{content}\n</style>'

    def js(m):
        content = (base / m.group(1)).read_text(encoding='utf-8')
        if re.search(r'</script', content, re.I):
            raise SystemExit(f'{m.group(1)} contiene "</script": rompería el HTML en línea')
        return f'<script>\n{content}\n</script>'

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
    html = re.sub(r'<script src="([^"]+)"></script>', js, html)
    if re.search(r'<(link rel="stylesheet"|script src=)', html):
        raise SystemExit(f'{page}: quedó una referencia externa sin incrustar')
    return html


ASPX_DIRECTIVE = '<%@ Page Language="C#" %>\n'


def main():
    DIST.mkdir(exist_ok=True)
    for name, page in PAGES.items():
        out = inline(page)
        (DIST / name).write_text(out, encoding='utf-8')
        print(f'{name}: {len(out.encode("utf-8")) / 1024:.0f} KB')
        # Versión .aspx para SharePoint: mismo contenido con la directiva de página.
        # ASP.NET interpretaría cualquier "<%" como código, así que no debe haber ninguno.
        if '<%' in out:
            raise SystemExit(f'{name} contiene "<%": no se puede usar como .aspx')
        aspx = Path(name).with_suffix('.aspx').name
        (DIST / aspx).write_text(ASPX_DIRECTIVE + out, encoding='utf-8-sig')
        print(f'{aspx}: {len((ASPX_DIRECTIVE + out).encode("utf-8")) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
