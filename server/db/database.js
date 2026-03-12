const { createClient } = require('@supabase/supabase-js');

let supabase;

function initDatabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.\n' +
      'Copy server/.env.example to server/.env and fill in your Supabase credentials.'
    );
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  console.log('Supabase client initialised');
  return supabase;
}

function getDb() {
  if (!supabase) throw new Error('Database not initialised. Call initDatabase() first.');
  return supabase;
}

module.exports = { initDatabase, getDb };
