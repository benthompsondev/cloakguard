import { test, expect, type Page } from '@playwright/test';

// v1.5.x accessibility + narrow-screen regression coverage. Synthetic data
// only (the built-in sample and the NIRV fixture below).

const NARROW_SIZES = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
];

const SOURCE = [
  'NIRV processed the request. NIRV confirmed the export.',
  '$NirvExportID = 7',
].join('\n');

async function docOverflow(page: Page): Promise<{ cw: number; sw: number }> {
  return page.evaluate(() => ({
    cw: document.documentElement.clientWidth,
    sw: document.documentElement.scrollWidth,
  }));
}

for (const size of NARROW_SIZES) {
  test(`no horizontal document overflow at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/#/');

    const pre = await docOverflow(page);
    expect(pre.sw, 'pre-scan').toBeLessThanOrEqual(pre.cw);

    // Core controls stay discoverable at phone widths.
    await expect(page.getByRole('button', { name: 'Load sample' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Scan locally' })).toBeVisible();

    await page.getByRole('button', { name: 'Load sample' }).click();
    await page.getByRole('button', { name: 'Scan locally' }).click();
    await expect(page.getByText('Local scan complete')).toBeVisible();

    const post = await docOverflow(page);
    expect(post.sw, 'post-scan').toBeLessThanOrEqual(post.cw);
  });
}

test('custom-terms dialog moves focus in and hands it back on close', async ({ page }) => {
  await page.goto('/#/');
  const trigger = page.getByRole('button', { name: /Hide custom terms/ });
  await trigger.focus();
  await page.keyboard.press('Enter');

  // Focus lands inside the dialog, on the terms input.
  const dialog = page.getByRole('dialog', { name: 'Custom terms to hide' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Custom terms to hide' })).toBeFocused();

  // Escape closes and returns focus to the control that opened it.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the seeded Cloak List editor takes focus, and rescan lands on the Scan heading', async ({
  page,
}) => {
  await page.goto('/#/');
  await page.getByLabel('Source text input').fill(SOURCE);
  await page.getByRole('button', { name: 'Scan locally' }).click();
  await expect(page.getByText('Local scan complete')).toBeVisible();

  await page.getByLabel('Select NIRV').check();
  await page.getByRole('button', { name: /Build Portfolio Cloak List/ }).click();

  // The editor opened across a route change — its heading takes focus so
  // keyboard and screen-reader users land on the new context, not <body>.
  await expect(page.getByRole('heading', { name: 'Create Cloak List' })).toBeFocused();

  await page.getByRole('button', { name: 'Save, use this list & rescan' }).click();
  await expect(page.getByText(/Cloak List saved and applied/)).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Sanitize sensitive text/ }),
  ).toBeFocused();
});

test('hidden file inputs are not keyboard tab stops', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByLabel('Import a text file')).toHaveAttribute('tabindex', '-1');

  await page.goto('/#/settings/profiles');
  await expect(page.getByLabel('Import Cloak List from .txt')).toHaveAttribute('tabindex', '-1');
  await expect(page.getByLabel('Import Cloak List from JSON')).toHaveAttribute('tabindex', '-1');
});

test('main workflow controls are keyboard reachable and expanders announce state', async ({
  page,
}) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByRole('button', { name: 'Scan locally' }).click();
  await expect(page.getByText('Local scan complete')).toBeVisible();

  // Role-based focus checks over the post-scan surface.
  for (const name of ['Copy clean text', 'Download .txt', 'Clear session']) {
    const control = page.getByRole('button', { name, exact: true });
    await control.focus();
    await expect(control, name).toBeFocused();
  }

  // Expanders expose and update aria-expanded.
  const compare = page.getByRole('button', { name: /Compare output modes/ });
  await expect(compare).toHaveAttribute('aria-expanded', 'false');
  await compare.focus();
  await page.keyboard.press('Enter');
  await expect(compare).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Enter');
  await expect(compare).toHaveAttribute('aria-expanded', 'false');
});
