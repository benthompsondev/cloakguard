import type { Detector, RawMatch } from '../types';
import { regexMatches } from './helpers';

/**
 * Well-known API key formats. One small pattern per provider family keeps
 * this list easy to review and extend.
 */
const API_KEY_PATTERNS: RegExp[] = [
  /\bsk[-_](?:live|test)[-_][A-Za-z0-9]{8,}\b/g, // Stripe-style
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g, // OpenAI project key
  /\bsk-[A-Za-z0-9]{20,}\b/g, // OpenAI-style
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, // AWS long-term or temporary access key ID
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, // GitHub tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\bAIza[0-9A-Za-z_-]{30,}\b/g, // Google API key
  /\bsk-ant-(?:api03-)?[A-Za-z0-9_-]{20,}\b/g, // Anthropic API key
  /\bglpat-[A-Za-z0-9_-]{20,}\b/g, // GitLab personal/project access token
  /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g, // GitHub fine-grained token
  /\b[rp]k_(?:live|test)_[A-Za-z0-9]{10,}\b/g, // Stripe restricted/publishable key
  /\b(?:AC|SK)[0-9a-fA-F]{32}\b/g, // Twilio account/API key SID
  /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g, // SendGrid API key
  /\bnpm_[A-Za-z0-9]{36}\b/g, // npm access token
  /\bya29\.[A-Za-z0-9_-]{20,}\b/g, // Google OAuth access token
  /\bAccountKey=[A-Za-z0-9+/]{86,}==/g, // Azure Storage account key assignment
  /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]{8,}\/B[A-Za-z0-9]{8,}\/[A-Za-z0-9_-]{20,}/g, // Slack incoming webhook
  /\bAuthorization:[ \t]*Basic[ \t]+[A-Za-z0-9+/]{12,}={0,2}/gi, // HTTP Basic authorization header
  /\bdop_v1_[0-9a-f]{64}\b/g, // DigitalOcean personal access token
  /\bpypi-[A-Za-z0-9_-]{50,}\b/g, // PyPI upload token
  /\bdckr_pat_[A-Za-z0-9_-]{20,}\b/g, // Docker access token
  /\bhf_[A-Za-z0-9]{30,}\b/g, // Hugging Face user access token
  /\bhvs\.[A-Za-z0-9_-]{20,}\b/g, // HashiCorp Vault service token
  /\bdapi[0-9a-f]{32}\b/g, // Databricks personal access token
  /\bshp(?:at|ca|pa|ss)_[0-9a-f]{32}\b/g, // Shopify access tokens
  /\bglrt-[A-Za-z0-9_-]{20,}\b/g, // GitLab runner authentication token
  /\bnfp_[A-Za-z0-9]{30,}\b/g, // Netlify personal access token
  /\bxkeysib-[0-9a-f]{64}\b/g, // Brevo API key
  /\bAGE-SECRET-KEY-1[A-Z0-9]{58}\b/g, // age identity secret key
  /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g, // Discord webhook
  /\b\d{8,10}:AA[A-Za-z0-9_-]{32,33}\b/g, // Telegram bot token
  /(?<=[?&]sig=)[A-Za-z0-9%+/_=-]{20,}/gi, // Azure SAS signature value
  /(?<=[?&]X-Amz-Signature=)[0-9a-f]{64}(?=&|$)/gi, // S3 presigned URL signature value
];

export const apiKeyDetector: Detector = {
  id: 'api-key',
  name: 'API key',
  category: 'secrets',
  severity: 'high',
  label: 'API_KEY',
  priority: 92,
  explanation: 'Matches a known API key format. Leaked keys grant direct account access.',
  detect: (text) => API_KEY_PATTERNS.flatMap((re) => regexMatches(text, re)),
};

/** "Bearer <token>" — the scheme word plus the credential that follows it. */
const BEARER_RE = /\bBearer\s+[A-Za-z0-9\-._~+/]{8,}=*/g;

export const bearerTokenDetector: Detector = {
  id: 'bearer-token',
  name: 'Bearer token',
  category: 'secrets',
  severity: 'high',
  label: 'TOKEN',
  priority: 95,
  explanation: 'Authorization bearer tokens allow anyone holding them to act as the user.',
  detect: (text) => regexMatches(text, BEARER_RE),
};

/**
 * JWT-shaped tokens: three base64url segments where the header starts with
 * "eyJ" ({" in base64). Signature segment may be empty (alg "none").
 */
const JWT_RE = /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]*/g;

export const jwtDetector: Detector = {
  id: 'jwt',
  name: 'JWT token',
  category: 'secrets',
  severity: 'high',
  label: 'TOKEN',
  priority: 90,
  explanation: 'JWTs often carry live session credentials and decodable identity claims.',
  detect: (text) => regexMatches(text, JWT_RE),
};

/**
 * Quoted literal assignments like password="...", client_secret: "...", and
 * compound variable names common in real scripts ($SmtpUserPass). Expressions,
 * variables, and command calls are deliberately excluded so sanitization
 * cannot turn executable PowerShell into placeholder text.
 */
const ASSIGNMENT_RE =
  /\b(?:[A-Za-z0-9_.-]{0,40}(?:password|passwd|passphrase|secret|credential|pass|pwd)|auth_token|access_token|refresh_token|api[-_]?key|token)\b\s*[:=]\s*(["'])([^"'\r\n]{4,})\1/gi;

/** Placeholder-looking values we should not re-flag, e.g. [SECRET_1] or <redacted>. */
const LOOKS_REDACTED = /^[[<*(]|^(?:x{4,}|\*{4,}|redacted|removed|hidden|none|null)$/i;

/** Config words that follow pass/secret-style keys but are not credentials. */
const BOOLEANISH = new Set([
  'true', 'false', 'yes', 'no', 'on', 'off', 'null', 'none', 'default', 'auto',
  'enabled', 'disabled', 'prompt', 'continue', 'stop', 'silentlycontinue', 'ignore', 'inquire',
]);

function isLikelySecretValue(value: string): boolean {
  if (LOOKS_REDACTED.test(value)) return false;
  if (value.startsWith('$') || value.includes('$(') || value.includes('${')) return false;
  if (BOOLEANISH.has(value.toLowerCase())) return false;
  return true;
}

export const secretAssignmentDetector: Detector = {
  id: 'secret-assignment',
  name: 'Password / secret assignment',
  category: 'secrets',
  severity: 'high',
  label: 'SECRET',
  priority: 80,
  explanation: 'A value assigned to a password/secret-style key is treated as a credential.',
  detect: (text): RawMatch[] =>
    regexMatches(text, ASSIGNMENT_RE, {
      group: 2,
      confidenceFor: (value) => (isLikelySecretValue(value) ? 'medium' : null),
    }),
};
