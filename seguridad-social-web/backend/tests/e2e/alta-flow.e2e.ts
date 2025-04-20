import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Alta manual (QR) flow feliz', async ({ page, request }) => {
  // 1) Abre la app
  await page.goto('/');
  // 2) Clic en “Obtener Alta”
  await page.click('text=Obtener Alta');
  // 3) Verifica QR (canvas)
  await expect(page.locator('canvas')).toBeVisible();

  // Intercepta callback
  page.route('**/verification/statusCallbackAlta/**', async route => {
    const payload = fs.readFileSync(path.resolve(__dirname, '../fixtures/altaCallback.json'), 'utf-8');
    await route.fulfill({ status: 200, contentType: 'application/json', body: payload });
  });

  // Extrae la URL del QR (por ej. data-url en el canvas)
  const qrUrl = await page.evaluate(() =>
    document.querySelector('canvas')?.getAttribute('data-url')
  );
  // Envía el callback simulado
  await request.post(qrUrl.replace('/verify', '/statusCallbackAlta/test-state'), {
    data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../fixtures/altaCallback.json'), 'utf-8'))
  });

  // 4) Comprueba el toast “Alta emitida”
  await expect(page.locator('text=Alta emitida')).toBeVisible();
});
