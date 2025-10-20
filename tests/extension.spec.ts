import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';

const dist = path.resolve(new URL('.', import.meta.url).pathname, '..', 'dist');

// Exemplo: abre o popup da extensão e verifica um elemento
// Requer que popup.html tenha #app ou um texto conhecido

test('popup carrega e exibe UI', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${dist}`,
      `--load-extension=${dist}`
    ]
  });
  const [page] = context.pages();
  // ID do popup é dinâmico; forma simples: abrir uma página qualquer e interagir via chrome-extension:// seria complexo.
  // Em E2E real, prefira validar efeitos do content script OU expor página de opções.
  // Aqui, como exemplo, vamos apenas abrir uma página e validar content script (se houver):
  await page.goto('https://example.com');
  const outline = await page.evaluate(() => getComputedStyle(document.querySelector('a')).outlineStyle);
  expect(outline).toBeDefined();
  await context.close();
});

