Build scripts
=============

Este diretório contém utilitários para baixar e mesclar mapeamentos Pantone→HEX de fontes públicas.

Arquivos:
- `build_pantone.py` — script que processa `sources.txt` e gera `pantone_full.json` na raiz do projeto.
- `sources.txt` — lista de URLs raw ou caminhos locais (uma fonte por linha). Edite este arquivo para apontar para as suas fontes.

Como rodar (Windows PowerShell):

```powershell
python .\scripts\build_pantone.py
```

Opções:
- `--sources` — caminho para arquivo de fontes (padrão `scripts/sources.txt`).
- `--out` — caminho do JSON de saída (padrão `pantone_full.json`).
- `--log` — arquivo com o log das fontes processadas (padrão `scripts/sources-log.md`).

Aviso sobre licenças e precisão:
- Alguns mapeamentos Pantone→HEX disponíveis na web são aproximações e podem ter restrições de uso. Verifique as fontes e licenças antes de usar em produção.
- O script baixa conteúdo das URLs listadas; revise `sources.txt` e prefira fontes confiáveis.
