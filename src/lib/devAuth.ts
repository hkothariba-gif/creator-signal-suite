// Dev-only quick-login helpers.
//
// These read Vite env vars that are ONLY meant for local/preview testing so a
// single persistent test account can be signed in with one click. The button
// that uses this (DevQuickLogin) renders nothing unless DEV_LOGIN_ENABLED is
// true, so nothing ships to a production build unless you explicitly opt in.
//
// IMPORTANT: any VITE_-prefixed var is bundled into client JS and is NOT secret.
// Only ever point these at a throwaway, low-privilege test account.

export const DEV_LOGIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_LOGIN === "true";

export const DEV_TEST_EMAIL = import.meta.env.VITE_DEV_TEST_EMAIL ?? "";

export const DEV_TEST_PASSWORD = import.meta.env.VITE_DEV_TEST_PASSWORD ?? "";

export const hasDevTestCredentials = () =>
  DEV_LOGIN_ENABLED && !!DEV_TEST_EMAIL && !!DEV_TEST_PASSWORD;
