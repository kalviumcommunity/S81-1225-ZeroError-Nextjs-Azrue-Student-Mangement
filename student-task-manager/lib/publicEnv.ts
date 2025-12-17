// Client-safe environment accessors. Safe to import in Client Components.
export const publicEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? '',
};
