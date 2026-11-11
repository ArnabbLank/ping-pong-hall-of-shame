// Supabase connection. The publishable key is meant to be public: Row Level Security
// (schema.sql) is what protects the data. Never put a secret or service_role key here.
// Leave both empty to run in local demo mode (data stays in this browser).
window.PP_CONFIG = {
  supabaseUrl: "https://arycgeavmipqvlyfwkif.supabase.co",
  supabaseAnonKey: "sb_publishable_-Sm1GkMW8U0wK0t2Y72Cwg_yXLJWgop",
  // Optional meme clips you have the right to use, e.g. win: ["sounds/win-1.mp3", "sounds/win-2.mp3"].
  // Each win or loss plays one at random (up to 6 seconds). Leave empty to use the built-in synth sounds.
  sounds: { win: [], lose: [] }
};
