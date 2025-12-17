/*
 Validates required environment variables for the Student Management System.
 Fails fast with a readable message if any are missing.
*/

const REQUIRED = [
  'NEXT_PUBLIC_API_URL', // public OK
  'DATABASE_URL',        // server-only
  'AUTH_SECRET',         // server-only
  'JWT_SECRET',          // server-only
];

function mask(v) {
  if (!v) return v;
  if (v.length <= 6) return '***';
  return v.slice(0, 2) + '***' + v.slice(-2);
}

const envLabel = process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'unknown';
console.log(`[env] Building for environment: ${envLabel}`);

let missing = [];
for (const key of REQUIRED) {
  if (!process.env[key]) missing.push(key);
}

if (missing.length) {
  console.error('[env] Missing required environment variables:');
  for (const m of missing) console.error(` - ${m}`);
  process.exit(1);
}

console.log('[env] Required variables present:');
for (const key of REQUIRED) {
  const val = process.env[key];
  const safe = key.startsWith('NEXT_PUBLIC_');
  console.log(` - ${key}=${safe ? val : mask(val)}`);
}
