import { beforeEach, describe, expect, it, vi } from 'vitest';

const tauriCore = vi.hoisted(() => ({
  isTauri: vi.fn(),
}));

const opener = vi.hoisted(() => ({
  openUrl: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => tauriCore);
vi.mock('@tauri-apps/plugin-opener', () => opener);

import { openExternal } from './ExternalLink';

describe('openExternal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes desktop URLs through the scoped Tauri opener', async () => {
    tauriCore.isTauri.mockReturnValue(true);
    opener.openUrl.mockResolvedValue(undefined);

    await expect(
      openExternal('https://github.com/benthompsondev/cloakguard/releases/latest'),
    ).resolves.toBe('desktop');
    expect(opener.openUrl).toHaveBeenCalledWith(
      'https://github.com/benthompsondev/cloakguard/releases/latest',
    );
  });

  it('leaves browser navigation to the normal anchor', async () => {
    tauriCore.isTauri.mockReturnValue(false);

    await expect(
      openExternal('https://benthompsondev.github.io/cloakguard/'),
    ).resolves.toBe('web');
    expect(opener.openUrl).not.toHaveBeenCalled();
  });
});
