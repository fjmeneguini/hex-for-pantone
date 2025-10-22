# Pantone Finder — HEX to Pantone (simples)

Pequeno app web que recebe um código HEX e encontra a cor Pantone mais próxima usando distância perceptual (CIEDE2000).

Como usar

- Insira um valor HEX (ex: `#1E90FF`) e clique em "Encontrar Pantone".
- Você pode carregar um arquivo JSON ou CSV com sua própria biblioteca Pantone.

Novas funcionalidades

- Controle de limite (threshold) de DeltaE: definir o máximo aceitável para correspondências.
- Botão "Copiar melhor": copia o melhor resultado para área de transferência.
- Exportar top (CSV): exporta os resultados mostrados para CSV.
- Parser CSV mais tolerante (detecta `,` ou `;` e busca a coluna `hex`).
- Destaque visual do melhor resultado.

Formato esperado do JSON

Um array de objetos com ao menos a propriedade `hex`. Exemplo:

[
  { "pantone": "PANTONE 186 C", "name": "Vermelho", "hex": "#C8102E" }
]

CSV mínimo: header com `hex` e/ou `pantone` e/ou `name`.

Notas técnicas

- Conversões: HEX → sRGB → XYZ → Lab.
- Distância: implementação do CIEDE2000.
- Resultado: mostra os 6 Pantones mais próximos e a distância.

Melhorias possíveis

- Adicionar caching, interface para salvar mapeamentos.
- Suporte a mais formatos e normalização de nomes.

Dataset e atribuição

- Um mapeamento Pantone→HEX público foi incorporado como `pantone_full.json` (origem: gist público com mapeamento hexadecimal para códigos Pantone). O arquivo no repositório é um recorte do dataset público para fins de demonstração.

Deploy

O site já está publicado no GitHub Pages a partir deste repositório. Para enviar atualizações, basta executar o script de deploy incluído:

```powershell
.\deploy_to_github.ps1
```

O script fará o commit (se houver mudanças) e fará push para a branch `main` do repositório remoto configurado no próprio script.

Se preferir, você também pode rodar os comandos git manualmente (equivalente):

```powershell
git add .
git commit -m "Atualização do site"
git push origin main
```

Autenticação: use SSH ou um Personal Access Token (PAT) conforme sua preferência.


