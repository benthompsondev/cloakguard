import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DemoBanner, isDemoBannerEnabled } from './DemoBanner';

describe('DemoBanner', () => {
  it('renders only when VITE_DEMO_BANNER is exactly 1', () => {
    expect(isDemoBannerEnabled('1')).toBe(true);
    expect(isDemoBannerEnabled('0')).toBe(false);
    expect(isDemoBannerEnabled('true')).toBe(false);
    expect(isDemoBannerEnabled('')).toBe(false);
    expect(isDemoBannerEnabled(undefined)).toBe(false);

    expect(renderToStaticMarkup(createElement(DemoBanner, { flag: '1' }))).toContain(
      'Online demo — everything runs in your browser and nothing is uploaded.',
    );
    const demoHtml = renderToStaticMarkup(createElement(DemoBanner, { flag: '1' }));
    expect(demoHtml).toContain('Download for Windows or Linux');
    expect(demoHtml).toContain('⭐ Star on GitHub');
    expect(demoHtml).toContain('https://github.com/benthompsondev/cloakscan/releases/latest');
    expect(renderToStaticMarkup(createElement(DemoBanner, { flag: '0' }))).toBe('');
  });
});
