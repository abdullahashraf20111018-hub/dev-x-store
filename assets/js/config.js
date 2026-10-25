/* Dev-X Store · public configuration.
   Fill these 3 values after creating the Supabase project (Settings → API). The anon key is PUBLIC by design —
   what protects the data is Row Level Security. NEVER put the service_role key here or anywhere in this repo. */
window.DEVX_CONFIG = {
  SUPABASE_URL: "",          // e.g. https://abcdxyz.supabase.co
  SUPABASE_ANON_KEY: "",     // the "anon / public" key
  TURNSTILE_SITE_KEY: "",    // optional: Cloudflare Turnstile site key (also enable CAPTCHA in Supabase → Auth → Attack Protection)
  WHATSAPP: "201507410800"   // store WhatsApp number, international format without +
};
