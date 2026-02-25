# FORC3 — API Keys Setup Guide
## Where to get every key you need

---

### REQUIRED — App won't work without these

**DATABASE_URL** — Supabase Transaction Pooler
Where: https://supabase.com → Your Project → Settings → Database → Connection string
Pick: "Transaction pooler" (NOT direct connection)
Format: postgresql://postgres.[id]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
Note: Port MUST be 6543, not 5432

**DIRECT_URL** — Supabase Direct Connection
Where: Same page, pick "Direct connection"
Format: postgresql://postgres.[id]:[password]@db.[id].supabase.co:5432/postgres

**JWT_SECRET** — Any random string
Just use: forc3-super-secret-jwt-key-change-in-production-2024

**CLAUDE_API_KEY** — Anthropic API
Where: https://console.anthropic.com/settings/keys
Click "Create Key", copy it
Format: sk-ant-api03-...
Cost: ~$0.003 per coach message

**NEXT_PUBLIC_SUPABASE_URL** — Supabase Project URL
Where: https://supabase.com → Project → Settings → API
Format: https://[id].supabase.co

**NEXT_PUBLIC_SUPABASE_ANON_KEY** — Supabase Anon Key
Where: Same page, "anon public" key
Format: eyJ... (long JWT)

---

### PAYMENTS — Needed to charge users

**STRIPE_SECRET_KEY**
Where: https://dashboard.stripe.com/apikeys
Use test key (sk_test_...) for development
Use live key (sk_live_...) for production

**STRIPE_PUBLISHABLE_KEY**
Where: Same page
Format: pk_test_... or pk_live_...

**STRIPE_WEBHOOK_SECRET**
Where: https://dashboard.stripe.com/webhooks
Add endpoint: https://yourdomain.com/api/stripe/webhook
Events: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated
Format: whsec_...

**STRIPE_MONTHLY_PRICE_ID**
Where: https://dashboard.stripe.com/products
Create product "FORC3 Premium", add monthly price $14.99
Format: price_...

**STRIPE_ANNUAL_PRICE_ID**
Where: Same product, add annual price $99.00
Format: price_...

---

### EXERCISE APIs — Free tiers are generous

**RAPIDAPI_KEY** — ExerciseDB (GIFs for 1300+ exercises)
Where: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
Click "Subscribe to Test" → Basic plan (FREE, 10 req/day)
Note: Use sparingly — seed once, cache forever
Also used for: API Ninjas exercises

---

### NUTRITION APIs — All have free tiers

**USDA_API_KEY** — US Government food database (unlimited free)
Where: https://fdc.nal.usda.gov/api-guide.html
Click "Get an API Key" — instant, no approval needed
Covers: 600,000+ foods, very accurate

**NUTRITIONIX_APP_ID + NUTRITIONIX_API_KEY** — Best for branded foods + NLP
Where: https://developer.nutritionix.com
Click "Sign Up for Free" → free tier: 500 requests/day
Best for: "I had a Big Mac" natural language logging
Format: app_id is 8 chars, api_key is long hex

**EDAMAM_APP_ID + EDAMAM_APP_KEY** — Recipe analysis
Where: https://developer.edamam.com
Sign up free → Food Database API
Free tier: 10,000 calls/month
Best for: Recipe nutrition, meal planning

**OPEN_FOOD_FACTS** — No key needed, completely free
Already works without any key
Covers: 2.5 million packaged foods, barcodes

**CALORIE_NINJAS_API_KEY** — Simple food search, generous free tier
Where: https://calorieninjas.com/api
Free: 10,000 requests/month
Best for: Simple whole foods, very fast

**FATSECRET_CLIENT_ID + FATSECRET_CLIENT_SECRET** — Restaurant chains
Where: https://platform.fatsecret.com/rest/server.api
Register free → get client credentials
Best for: Restaurant foods, brand-specific items

---

### INTEGRATIONS — Optional but powerful

**STRAVA_CLIENT_ID + STRAVA_CLIENT_SECRET**
Where: https://www.strava.com/settings/api
Create App, name it "FORC3"
Free for all personal use

**NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY** — Push notifications
Generate yourself (no account needed):
Run: npx web-push generate-vapid-keys
Paste both values into .env.local

---

### EMAIL — For sending coach emails

**RESEND_API_KEY**
Where: https://resend.com
Sign up free → API Keys → Create Key
Free tier: 3,000 emails/month
Format: re_...

**FROM_EMAIL**
Use: coach@forc3.app (once you set up domain in Resend)
For now: onboarding@resend.dev works on free tier

---

### MAPPING (Optional)

**NEXT_PUBLIC_MAPBOX_TOKEN** — For showing training routes
Where: https://account.mapbox.com/access-tokens
Free: 50,000 map loads/month

---

## COMPLETE .env.local TEMPLATE

Copy this into your .env.local file and fill in the values:

```
# ============================================
# DATABASE — REQUIRED
# ============================================
DATABASE_URL=postgresql://postgres.YOURPROJECTID:YOURPASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.YOURPROJECTID:YOURPASSWORD@db.YOURPROJECTID.supabase.co:5432/postgres

# ============================================
# AUTH — REQUIRED
# ============================================
JWT_SECRET=forc3-super-secret-jwt-key-change-in-production-2024
NEXTAUTH_URL=http://localhost:3000

# ============================================
# AI COACH — REQUIRED
# ============================================
CLAUDE_API_KEY=sk-ant-api03-YOUR-KEY-HERE

# ============================================
# SUPABASE STORAGE — REQUIRED
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECTID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyYOUR-ANON-KEY

# ============================================
# PAYMENTS — Add when ready to charge
# ============================================
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY
STRIPE_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_ID
STRIPE_ANNUAL_PRICE_ID=price_YOUR_ANNUAL_ID

# ============================================
# EXERCISE API
# ============================================
RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY
API_NINJAS_KEY=YOUR_API_NINJAS_KEY

# ============================================
# NUTRITION APIs — Add as you get them
# ============================================
USDA_API_KEY=YOUR_USDA_KEY
NUTRITIONIX_APP_ID=YOUR_APP_ID
NUTRITIONIX_API_KEY=YOUR_API_KEY
EDAMAM_APP_ID=YOUR_APP_ID
EDAMAM_APP_KEY=YOUR_APP_KEY
CALORIE_NINJAS_API_KEY=YOUR_KEY
FATSECRET_CLIENT_ID=YOUR_CLIENT_ID
FATSECRET_CLIENT_SECRET=YOUR_CLIENT_SECRET
# Open Food Facts needs no key

# ============================================
# INTEGRATIONS
# ============================================
STRAVA_CLIENT_ID=YOUR_CLIENT_ID
STRAVA_CLIENT_SECRET=YOUR_CLIENT_SECRET
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback

# ============================================
# PUSH NOTIFICATIONS
# ============================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY

# ============================================
# EMAIL
# ============================================
RESEND_API_KEY=re_YOUR_KEY
FROM_EMAIL=onboarding@resend.dev
```
