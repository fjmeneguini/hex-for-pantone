# Pantone Finder — HEX to Pantone (simples)

Pequeno app web que recebe um código HEX e encontra a cor Pantone mais próxima usando distância perceptual (CIEDE2000).

Como usar

- Insira um valor HEX (ex: `#1E90FF`) e clique em "Encontrar Pantone".
- Você pode carregar um arquivo JSON ou CSV com sua própria biblioteca Pantone.

## Deploy — atualizar o site

```powershell
.\deploy_to_github.ps1
```

# Pantone Finder — HEX → Pantone

Este projeto é um utilitário web leve que encontra a cor Pantone mais próxima a partir de um código HEX. Foi pensado para simplificar o trabalho de designers e profissionais que precisam mapear cores digitais para a paleta Pantone.

---

## Visão geral das funcionalidades

- Entrada HEX: insira um código no formato `#RRGGBB` (o `#` é opcional). Exemplos válidos: `#1E90FF`, `1E90FF`.
- Biblioteca personalizável: carregue um arquivo JSON ou CSV com sua tabela Pantone/HEX.
- Métodos de comparação:
  - CIEDE2000 (padrão) — melhor para correspondência perceptual.
  - DeltaE76 — cálculo mais simples (distância euclidiana em Lab).
- Threshold (Max DeltaE): filtra resultados cuja distância perceptual for maior que o valor definido.
- Resultado:
  - Mostra o swatch da cor de entrada.
  - Lista os melhores matches (até 10), com swatch, nome/pantone, HEX e valor de DeltaE.
  - O melhor resultado é destacado visualmente.
- Ações úteis: copiar o melhor resultado para a área de transferência; exportar os resultados mostrados para CSV.

---

## Arquivos principais

- `index.html` — interface do usuário.
- `styles.css` — estilos da página (clean e responsivo).
- `app.js` — lógica principal: parsing, conversões de cor (HEX→Lab), cálculo de DeltaE, UI.
- `pantone_sample.json` — biblioteca de exemplo pequena.
- `pantone_full.json` — trecho de um mapeamento público Pantone→HEX (uso de exemplo).
- `deploy_to_github.ps1` — script PowerShell para enviar (commit + push) os arquivos para o repositório remoto.

---

## Como usar (interface)

1. Acesse o site: (o site já está publicado via GitHub Pages a partir deste repositório).
2. No campo "HEX", cole ou digite o código da cor.
3. (Opcional) Selecione o método de comparação (CIEDE2000 recomendado) e ajuste o "Max DeltaE" para definir a tolerância.
4. Clique em "Encontrar". O app exibirá o swatch de entrada e a lista dos Pantones mais próximos.
5. Use "Copiar melhor" para copiar o resultado principal, ou "Exportar CSV" para baixar os top matches.

---

## Como carregar sua biblioteca Pantone (JSON/CSV)

- JSON: arquivo com um array de objetos. Cada objeto deve ter ao menos a propriedade `hex`. Propriedades recomendadas: `pantone`, `name`, `hex`.

Exemplo JSON:

```json
[
  { "pantone": "PANTONE 186 C", "name": "Vermelho", "hex": "#C8102E" },
  { "pantone": "PANTONE 286 C", "hex": "#0033A0" }
]
```

- CSV: o parser detecta `,` ou `;` como separador e tenta localizar a coluna `hex`. Header recomendado: `hex,pantone,name`.

Após carregar o arquivo via controle "Escolher arquivo", o app mostrará quantas cores foram importadas e passará a usar essa biblioteca nas buscas.

---

## Detalhes técnicos (resumo)

- Conversões: HEX → sRGB linear → XYZ → CIE-Lab.
- Distância perceptual: CIEDE2000 implementado em `app.js` (mais alinhado com visão humana).
- Alternativa: DeltaE76 (euclidiana em Lab) implementada também para rapidez.

---

## Troubleshooting rápido

- Push falha por autenticação: verifique credenciais (use SSH ou Personal Access Token / credential helper).
- JSON inválido: valide no JSONLint antes de carregar.
- CSV sem header/sem coluna `hex`: edite o CSV para incluir uma coluna `hex` com valores no formato `#RRGGBB`.
- Resultados muito diferentes: Pantone é sistema de tintas; HEX é RGB aproximado. Para precisão crítica use guia física Pantone.

---

## Notas e atribuições

- O arquivo `pantone_full.json` é um recorte de um mapeamento público e serve como exemplo. Verifique licenças/atribuições caso importe datasets maiores.

---

## Contribuições

Pull requests são bem-vindas: sugestões de UI, performance, testes e datasets com licença clara.

---
