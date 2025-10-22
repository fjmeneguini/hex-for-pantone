# Pantone Finder — HEX to Pantone (simples)

Pequeno app web que recebe um código HEX e encontra a cor Pantone mais próxima usando distância perceptual (CIEDE2000).

Como usar

- Abra `index.html` no seu navegador (duplo clique ou arraste para o navegador).
- Insira um valor HEX (ex: `#1E90FF`) e clique em "Encontrar Pantone".
- Você pode também carregar um arquivo JSON ou CSV com sua própria biblioteca Pantone.

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

Publicar no GitHub Pages (rápido)

1. Crie um repositório no GitHub e envie todos os arquivos deste projeto.
2. No GitHub, abra Settings → Pages e selecione a branch `main` e a pasta `/ (root)` como fonte, salve.
3. Aguarde alguns minutos e abra a URL fornecida pelo GitHub Pages.

Observação: Como o projeto usa apenas arquivos estáticos (HTML/CSS/JS/JSON), ele funciona diretamente no Pages sem build.

Deploy automático (script PowerShell)

Incluí um script `deploy_to_github.ps1` para facilitar o deploy ao seu repositório GitHub.

Pré-requisitos:
- Git instalado e disponível no PATH
- Permitir push: configure sua autenticação (credential helper, SSH ou token)

Uso rápido (PowerShell):

1. Abra PowerShell na pasta deste projeto.
2. (Opcional) Edite `deploy_to_github.ps1` e atualize a variável `$remoteRepo` com seu repositório: `https://github.com/fjmeneguini/hex-for-pantone.git`.
3. Execute:

```powershell
.\deploy_to_github.ps1
```

O script inicializa o repositório git (se ainda não existir), cria um commit e força push para a branch `main`. Depois, abra as configurações do repositório no GitHub e ative Pages apontando para `main`/`root`.

Se preferir uma alternativa GUI, você pode usar o GitHub Desktop ou fazer os passos manualmente:

```powershell
git init
git remote add origin https://github.com/fjmeneguini/hex-for-pantone.git
git add .
git commit -m "Deploy: atualizar site"
git branch -M main
git push -u origin main
```

Segurança / Tokens

- Para autenticação ao GitHub via HTTPS, você pode usar o credential helper (cache de credenciais) ou um Personal Access Token (PAT). Para PAT, crie o token no GitHub (Settings → Developer settings → Personal access tokens) e use-o quando solicitado pelo Git ao fazer push.
- Alternativamente use SSH se preferir não expor tokens.


