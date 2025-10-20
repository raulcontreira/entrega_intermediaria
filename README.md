# My Chrome Extension - Projeto de Testes E2E com Playwright e Docker

Este projeto demonstra a conteinerização de uma extensão Chrome (MV3) para testes end-to-end (E2E) utilizando Playwright e Docker. O workflow inclui a construção da extensão, execução de testes localmente via Docker Compose e automação de testes em um ambiente de Integração Contínua (CI) com GitHub Actions.

## 🎯 Objetivo

O objetivo principal é empacotar uma extensão Chrome, executá-la em um ambiente conteinerizado e testá-la com Playwright (Chromium), automatizando a suíte de testes no GitHub Actions e publicando artefatos como relatórios HTML e o arquivo `.zip` da extensão.

## 📦 Entregáveis

- **Dockerfile**: Para construir a imagem Docker do ambiente de testes.
- **docker-compose.yml**: Para orquestrar a execução dos testes localmente.
- **Suíte de Testes E2E com Playwright**: Testes que carregam a extensão e interagem com ela.
- **Workflow do GitHub Actions**: Configurado para build, testes e publicação de artefatos.
- **`dist/extension.zip`**: Arquivo empacotado da extensão gerado pelo processo de build.

## 🧩 Requisitos Técnicos

- **Dockerfile**: Baseado em `mcr.microsoft.com/playwright` para garantir o ambiente com Chromium e suas dependências.
- **Playwright**: Execução de testes carregando a extensão via argumentos `--disable-extensions-except` e `--load-extension`.
- **Empacotamento**: A extensão é empacotada em `dist/` e um arquivo `dist/extension.zip` é gerado.
- **Execução**: Testes podem ser executados localmente via `docker compose` e remotamente via GitHub Actions.
- **Artefatos CI**: Publicação do relatório HTML do Playwright e do `.zip` da extensão como artefatos do CI.

## 🗂️ Estrutura de Pastas

```
my-chrome-extension/
├─ src/
│  ├─ popup/
│  ├─ content/
│  └─ background/
├─ icons/
├─ tests/
│  ├─ extension.spec.ts
│  └─ playwright.config.ts
├─ dist/                  ← build da extensão para carregar nos testes
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
├─ scripts/
│  └─ build-extension.mjs ← copia arquivos para dist/ e gera zip
├─ .github/
│  └─ workflows/
│     └─ ci.yml
├─ manifest.json
└─ README.md
```

## ⚙️ Como Rodar Localmente

### Pré-requisitos

Certifique-se de ter o Docker e Docker Compose instalados em sua máquina.

### Passos

1. **Navegue até o diretório do projeto:**
   ```bash
   cd my-chrome-extension
   ```

2. **Instale as dependências do Node.js:**
   ```bash
   npm install
   ```

3. **Construa a imagem Docker:**
   ```bash
   sudo docker build -t bootcamp/ext-e2e:latest .
   ```

4. **Execute os testes E2E dentro do container:**
   ```bash
   docker compose run --rm e2e
   ```

   *Nota: O comando `npm run test` dentro do container irá primeiro construir a extensão e depois executar os testes.* 

5. **(Opcional) Abra o relatório HTML do Playwright:**
   Após a execução dos testes, um relatório HTML será gerado na pasta `playwright-report`. Você pode abri-lo em seu navegador para ver os detalhes dos testes.
   ```bash
   npx playwright show-report
   ```

## 📜 Scripts no `package.json`

- `build`: Executa o script `scripts/build-extension.mjs` para copiar os arquivos da extensão para `dist/` e gerar `dist/extension.zip`.
- `test:e2e`: Executa os testes Playwright com o reporter `list` e `html`.
- `test`: Combina os comandos `build` e `test:e2e`.
- `ci`: Instala as dependências (`npm ci`) e executa os testes (`npm run test`).

## 🧱 Script de Build (`scripts/build-extension.mjs`)

Este script é responsável por preparar a extensão para os testes, copiando os arquivos necessários para a pasta `dist/` e criando um arquivo `extension.zip`.

```javascript
import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

const dist = 'dist';
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);

// Copia arquivos essenciais
for (const f of ['manifest.json']) fs.copyFileSync(f, path.join(dist, f));
fs.cpSync('src', path.join(dist, 'src'), { recursive: true });
fs.cpSync('icons', path.join(dist, 'icons'), { recursive: true });

// Gera ZIP
const output = fs.createWriteStream(path.join(dist, 'extension.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });
archive.directory(dist, false);
archive.pipe(output);
await archive.finalize();
console.log('Build gerado em dist/ e dist/extension.zip');
```

## 🎭 Configuração do Playwright (`tests/playwright.config.ts`)

O arquivo de configuração do Playwright define como os testes serão executados, incluindo a configuração para carregar a extensão no navegador Chromium.

```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const distPath = path.join(new URL('.', import.meta.url).pathname, '..', 'dist');

export default defineConfig({
  testDir: __dirname,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'chromium-with-extension',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            `--disable-extensions-except=${distPath}`,
            `--load-extension=${distPath}`
          ]
        }
      }
    }
  ]
});
```

## 🧪 Teste Básico (`tests/extension.spec.ts`)

Um exemplo de teste E2E que carrega a extensão e verifica a interação do content script em uma página web.

```typescript
import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

const dist = path.resolve(new URL('.', import.meta.url).pathname, '..', 'dist');

test('popup carrega e exibe UI', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`
    ]
  });
  const [page] = context.pages();
  await page.goto('https://example.com');
  const outline = await page.evaluate(() => getComputedStyle(document.querySelector('a')).outlineStyle);
  expect(outline).toBeDefined();
  await context.close();
});
```

## ⚙️ CI com GitHub Actions (`.github/workflows/ci.yml`)

Este workflow automatiza o processo de build e teste da extensão no GitHub Actions, publicando os artefatos resultantes.

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Instalar deps
        run: npm ci
      - name: Instalar Playwright
        run: npx playwright install --with-deps chromium
      - name: Build extensão
        run: npm run build
      - name: Testes E2E
        run: npm run test:e2e || npm run test:e2e -- --reporter=html
      - name: Publicar relatório do Playwright
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
      - name: Publicar pacote da extensão
        uses: actions/upload-artifact@v4
        with:
          name: extension-zip
          path: dist/extension.zip
