/**
 * Built in pieces so public secret scanners do not mistake this deliberately
 * fake detector fixture for a live credential.
 */
export const SYNTHETIC_STRIPE_SHAPED_KEY = ['sk', 'live', 'DEMO00000000000000000000'].join('_');

export const SYNTHETIC_AWS_ACCESS_KEY_ID = ['AKIA', 'IOSFODNN7EXAMPLE'].join('');
export const SYNTHETIC_AWS_TEMPORARY_ACCESS_KEY_ID = ['ASIA', 'IOSFODNN7EXAMPLE'].join('');

export const SYNTHETIC_GITHUB_TOKEN = [
  'ghp',
  'DEMO000000000000000000000000',
].join('_');

export const SYNTHETIC_ANTHROPIC_API_KEY = [
  'sk',
  'ant',
  'api03',
  'DEMO_NOT_REAL_00000000000000000000',
].join('-');

export const SYNTHETIC_BEARER_TOKEN = [
  'eyJhbGciOiJIUzI1NiJ9',
  'eyJkZW1vIjoibm90LXJlYWwifQ',
  'ZmFrZS1zaWduYXR1cmUtbm90LXJlYWw',
].join('.');

export const SYNTHETIC_PROVIDER_TOKENS = {
  openAiProject: ['sk', 'proj', `DEMO_${'A'.repeat(24)}`].join('-'),
  digitalOcean: ['dop', 'v1', 'a'.repeat(64)].join('_'),
  pypi: ['pypi', `DEMO_${'A'.repeat(50)}`].join('-'),
  docker: ['dckr', 'pat', `DEMO_${'A'.repeat(24)}`].join('_'),
  huggingFace: ['hf', `DEMO${'A'.repeat(30)}`].join('_'),
  hashicorpVault: ['hvs', `DEMO_${'A'.repeat(24)}`].join('.'),
  databricks: `dapi${'a'.repeat(32)}`,
  shopify: ['shpat', 'a'.repeat(32)].join('_'),
  gitlabRunner: ['glrt', `DEMO_${'A'.repeat(24)}`].join('-'),
  netlify: ['nfp', `DEMO${'A'.repeat(30)}`].join('_'),
  xKeySib: ['xkeysib', 'a'.repeat(64)].join('-'),
  ageSecret: `${['AGE', 'SECRET', 'KEY'].join('-')}-1${'A'.repeat(58)}`,
  discordWebhook: `https://${['discord', 'com'].join('.')}/api/webhooks/${'1'.repeat(18)}/${'A'.repeat(32)}`,
  telegramBot: `${'1'.repeat(9)}:AA${'A'.repeat(32)}`,
};
