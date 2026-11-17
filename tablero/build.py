#!/usr/bin/env python3
"""Arma lo que se sube a la carpeta de SharePoint.

Uso:  python3 build.py

Genera en dist/:
  Manual-senalizacion/        Admin.html, Manual.html y public/ (css y js separados)
  Manual-senalizacion-aspx/   lo mismo con Admin.aspx y Manual.aspx
  un-archivo/                 cada página con todo su CSS y JS adentro (alternativa)

En las versiones separadas, cada HTML pide sus archivos con ?v=<versión> para que el
navegador no combine un HTML nuevo con un CSS o JS viejo guardado en caché.
"""
import re
import shutil
from pathlib import Path

SRC = Path(__file__).resolve().parent
DIST = SRC / 'dist'
PAGES = ['Manual.html', 'Admin.html']
ASPX_DIRECTIVE = '<%@ Page Language="C#" %>\n'


def app_version() -> str:
    js = (SRC / 'public' / 'js' / 'sharepoint.js').read_text(encoding='utf-8')
    m = re.search(r"const APP_VERSION = '([^']+)'", js)
    if not m:
        raise SystemExit('No se encontró APP_VERSION en public/js/sharepoint.js')
    return m.group(1)


def with_version(html: str, version: str) -> str:
    html = html.replace('<meta name="app-version" content="dev">', f'<meta name="app-version" content="{version}">')
    html = re.sub(r'(<link rel="stylesheet" href="public/[^"?]+)(">)', rf'\1?v={version}\2', html)
    html = re.sub(r'(<script src="public/[^"?]+)(">)', rf'\1?v={version}\2', html)
    if 'content="dev"' in html:
        raise SystemExit('Falta la etiqueta <meta name="app-version"> en una página')
    return html


def inline(html: str) -> str:
    def css(m):
        return '<style>\n' + (SRC / m.group(1)).read_text(encoding='utf-8') + '\n</style>'

    def js(m):
        content = (SRC / m.group(1)).read_text(encoding='utf-8')
        if re.search(r'</script', content, re.I):
            raise SystemExit(f'{m.group(1)} contiene "</script": rompería el HTML en línea')
        return '<script>\n' + content + '\n</script>'

    html = re.sub(r'<link rel="stylesheet" href="(public/[^"?]+)(?:\?v=[^"]*)?">', css, html)
    html = re.sub(r'<script src="(public/[^"?]+)(?:\?v=[^"]*)?"></script>', js, html)
    if re.search(r'<(link rel="stylesheet"|script src=)', html):
        raise SystemExit('Quedó una referencia externa sin incrustar')
    return html


def as_aspx(html: str, name: str) -> str:
    # ASP.NET interpretaría cualquier "<%" como código, así que no debe haber ninguno.
    if '<%' in html:
        raise SystemExit(f'{name} contiene "<%": no se puede usar como .aspx')
    return ASPX_DIRECTIVE + html


def write(path: Path, text: str, aspx=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8-sig' if aspx else 'utf-8')


def main():
    version = app_version()
    if DIST.exists():
        shutil.rmtree(DIST)
    sep = DIST / 'Manual-senalizacion'
    sep_aspx = DIST / 'Manual-senalizacion-aspx'
    single = DIST / 'un-archivo'

    for out in (sep, sep_aspx):
        shutil.copytree(SRC / 'public', out / 'public')
        for f in (out / 'public' / 'js').glob('*.js'):
            if '<%' in f.read_text(encoding='utf-8'):
                raise SystemExit(f'{f.name} contiene "<%"')

    for name in PAGES:
        html = with_version((SRC / name).read_text(encoding='utf-8'), version)
        aspx_name = Path(name).with_suffix('.aspx').name
        write(sep / name, html)
        write(sep_aspx / aspx_name, as_aspx(html, name), aspx=True)
        one = inline(html)
        write(single / name, one)
        write(single / aspx_name, as_aspx(one, name), aspx=True)

    print(f'Versión {version}')
    for folder in (sep, sep_aspx, single):
        files = sorted(p.relative_to(folder).as_posix() for p in folder.rglob('*') if p.is_file())
        print(f'  {folder.relative_to(SRC)}/: ' + ', '.join(files))


if __name__ == '__main__':
    main()
