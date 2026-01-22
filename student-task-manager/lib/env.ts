// Server-only environment accessors. This file must only be imported on the server.
import 'server-only';

type NonEmptyString = string & { __brand: 'NonEmptyString' };

function required(name: string): NonEmptyString {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v as NonEmptyString;
}

export const env = {
  // public values should be read through process.env directly in client code
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',

  // server-only secrets
  DATABASE_URL: required('DATABASE_URL'),
  AUTH_SECRET: required('AUTH_SECRET'),
  JWT_SECRET: required('JWT_SECRET'),

  // email (SendGrid)
  SENDGRID_API_KEY: required('SENDGRID_API_KEY'),
  SENDGRID_SENDER: required('SENDGRID_SENDER'),

  APP_ENV: process.env.APP_ENV ?? process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV ?? 'unknown',
};
