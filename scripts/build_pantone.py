#!/usr/bin/env python3
"""
build_pantone.py

Baixa e mescla fontes públicas (JSON/CSV) listadas em sources.txt
em um arquivo `pantone_full.json` normalizado.

Uso:
  python scripts\build_pantone.py [--sources path/to/sources.txt] [--out path]

O script tenta baixar URLs HTTP(S) e também aceita caminhos locais (relative/absolute).
Ele normaliza hex para '#RRGGBB', remove duplicatas (mantém a primeira ocorrência)
e grava um `sources-log.md` com as origens e contagens.

Notas de licença: o script não faz validação de licenças — verifique as fontes usadas.
"""

import argparse
import csv
import json
import os
import re
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError


HEX_RE = re.compile(r"#?[0-9a-fA-F]{6}$")


def read_text_from_source(src):
    # allow http(s) URLs or local file paths
    if src.startswith('http://') or src.startswith('https://'):
        try:
            req = Request(src, headers={'User-Agent':'pantone-builder/1.0'})
            with urlopen(req, timeout=20) as resp:
                data = resp.read().decode('utf-8', errors='replace')
                return data
        except (HTTPError, URLError) as e:
            print(f"[WARN] falha ao baixar {src}: {e}")
            return None
    else:
        # local file
        try:
            with open(src, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"[WARN] falha ao ler {src}: {e}")
            return None


def parse_json_text(text):
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
        # if it's an object with a key that holds the array
        for k in ('data','colors','items','entries'):
            if k in data and isinstance(data[k], list):
                return data[k]
    except Exception:
        return None


def detect_sep(line):
    # quick guess for separator
    if ';' in line and line.count(';') >= line.count(','):
        return ';'
    return ','


def parse_csv_text(text):
    lines = [l for l in text.splitlines() if l.strip()]
    if not lines:
        return []
    sep = detect_sep(lines[0])
    reader = csv.DictReader(lines, delimiter=sep)
    out = []
    for row in reader:
        out.append(dict(row))
    return out


def extract_entries(obj):
    # try to find hex/pantone/name fields
    hex_candidates = ['hex','color','colour','hexcode']
    pantone_candidates = ['pantone','code','id']
    name_candidates = ['name','title','description']

    if isinstance(obj, dict):
        keys = {k.lower():k for k in obj.keys()}
        entry = {}
        # find hex
        for cand in hex_candidates:
            if cand in keys:
                entry['hex'] = obj[keys[cand]]
                break
        # fallback: any value that looks like hex
        if 'hex' not in entry:
            for v in obj.values():
                if isinstance(v, str) and HEX_RE.search(v.strip()):
                    entry['hex'] = v
                    break
        # pantone/name
        for cand in pantone_candidates:
            if cand in keys:
                entry['pantone'] = obj[keys[cand]]
                break
        for cand in name_candidates:
            if cand in keys:
                entry['name'] = obj[keys[cand]]
                break
        return entry if 'hex' in entry else None
    return None


def normalize_hex(h):
    if not isinstance(h, str):
        return None
    s = h.strip().lstrip('#')
    if len(s) == 3:
        # expand shorthand e.g. abc -> aabbcc
        s = ''.join([c*2 for c in s])
    if re.fullmatch(r'[0-9a-fA-F]{6}', s):
        return '#' + s.upper()
    return None


def merge_sources(sources):
    entries = []
    sources_log = []
    seen = {}
    for src in sources:
        src = src.strip()
        if not src or src.startswith('#'):
            continue
        print(f"[INFO] processando: {src}")
        txt = read_text_from_source(src)
        if not txt:
            sources_log.append((src, 0, 'failed'))
            continue

        parsed = parse_json_text(txt)
        items = []
        if parsed is not None:
            # parsed is a list of objects
            items = parsed
        else:
            # try CSV
            try:
                items = parse_csv_text(txt)
            except Exception:
                items = []

        count_in = 0
        count_added = 0
        for obj in items:
            count_in += 1
            ex = extract_entries(obj) if isinstance(obj, dict) else None
            if not ex:
                # attempt simple parse for lines like hex,pantone
                continue
            hexn = normalize_hex(ex.get('hex',''))
            if not hexn:
                continue
            key = hexn
            if key in seen:
                continue
            seen[key] = True
            out = {'hex': hexn}
            if 'pantone' in ex and ex['pantone']:
                out['pantone'] = str(ex['pantone']).strip()
            if 'name' in ex and ex['name']:
                out['name'] = str(ex['name']).strip()
            entries.append(out)
            count_added += 1

        sources_log.append((src, count_in, count_added))
        print(f"  -> lidos: {count_in}, adicionados: {count_added}")

    return entries, sources_log


def write_outputs(entries, sources_log, out_path, log_path):
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    with open(log_path, 'w', encoding='utf-8') as f:
        f.write('# Sources log\n\n')
        total_in = sum(s[1] for s in sources_log if isinstance(s[1], int))
        total_added = len(entries)
        f.write(f'- fontes processadas: {len(sources_log)}\n')
        f.write(f'- total entradas (tentadas): {total_in}\n')
        f.write(f'- total final adicionadas: {total_added}\n\n')
        f.write('## Detalhes por fonte\n')
        for src, cnt_in, cnt_added in sources_log:
            f.write(f'- {src} — lidos: {cnt_in}, adicionados: {cnt_added}\n')


def load_sources_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return [l.strip() for l in f.readlines() if l.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sources', default='scripts/sources.txt', help='arquivo com URLs ou caminhos locais (uma por linha)')
    ap.add_argument('--out', default='pantone_full.json', help='arquivo de saída JSON normalizado')
    ap.add_argument('--log', default='scripts/sources-log.md', help='arquivo de log das fontes')
    args = ap.parse_args()

    if not os.path.exists(args.sources):
        print(f"Arquivo de fontes não encontrado: {args.sources}")
        sys.exit(1)

    sources = load_sources_file(args.sources)
    entries, sources_log = merge_sources(sources)
    # keep stable sort by hex
    entries = sorted(entries, key=lambda x: x['hex'])
    write_outputs(entries, sources_log, args.out, args.log)
    print(f"[OK] gerado {args.out} com {len(entries)} entradas. Log em {args.log}")


if __name__ == '__main__':
    main()
