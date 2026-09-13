import { createClient } from '@supabase/supabase-js';

let client = null;

// Built on first use, not at import time — createClient throws when the env
// vars are missing, and Next imports every route module during the build.
function getClient() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const supabase = new Proxy({}, {
  get: (_t, prop) => {
    const value = getClient()[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
