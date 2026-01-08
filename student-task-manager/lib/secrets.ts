import 'server-only';
import { env } from './env';

// AWS
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
// Azure
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

type SecretsMap = Record<string, string>;

const provider = (process.env.SECRET_PROVIDER || '').toLowerCase(); // 'aws' | 'azure'
const cache: { value?: SecretsMap; fetchedAt?: number } = {};
const TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function isFresh() {
  return typeof cache.fetchedAt === 'number' && Date.now() - cache.fetchedAt! < TTL_MS;
}

async function fetchAwsSecrets(): Promise<SecretsMap> {
  const region = process.env.AWS_REGION;
  const secretId = process.env.SECRET_ARN || process.env.SECRET_ID;
  if (!region || !secretId) throw new Error('AWS secrets config missing: AWS_REGION and SECRET_ARN/SECRET_ID');

  const client = new SecretsManagerClient({ region });
  const res = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  const str = res.SecretString || '{}';
  const parsed = JSON.parse(str);
  return parsed as SecretsMap;
}

async function fetchAzureSecrets(): Promise<SecretsMap> {
  const vaultName = process.env.KEYVAULT_NAME;
  if (!vaultName) throw new Error('Azure secrets config missing: KEYVAULT_NAME');

  const vaultUrl = `https://${vaultName}.vault.azure.net`;
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);

  const namesCsv = process.env.SECRET_KEYS || '';
  const names = namesCsv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const out: SecretsMap = {};

  if (names.length) {
    for (const name of names) {
      const s = await client.getSecret(name);
      if (typeof s.value === 'string') out[name] = s.value;
    }
    return out;
  }

  // Fallback: list and fetch all
  for await (const prop of client.listPropertiesOfSecrets()) {
    if (!prop.name) continue;
    try {
      const s = await client.getSecret(prop.name);
      if (typeof s.value === 'string') out[prop.name] = s.value;
    } catch (e) {
      // ignore individual failures
    }
  }
  return out;
}

export async function getSecrets(): Promise<SecretsMap> {
  if (cache.value && isFresh()) return cache.value;

  let value: SecretsMap = {};
  if (provider === 'aws') value = await fetchAwsSecrets();
  else if (provider === 'azure') value = await fetchAzureSecrets();
  else value = {};

  cache.value = value;
  cache.fetchedAt = Date.now();
  return value;
}

// Helper to get a single secret with optional fallback to env
export async function getSecret(name: string): Promise<string | undefined> {
  const secrets = await getSecrets();
  return secrets[name] ?? process.env[name];
}
