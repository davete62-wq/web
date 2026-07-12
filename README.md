# TenaFit

TenaFit is a production-oriented diet planning app for the Ethiopian market. It uses PostgreSQL, Node.js/Express, and Expo React Native.

Food data is not mocked. The backend seed is generated from the attached `The Ethiopian Food Composition Table 2025` PDF through `backend/src/scripts/parse_ethiopian_fct.py`.

## Structure

- `backend/migrations/001_initial_schema.sql` - PostgreSQL schema, indexes, pgcrypto helpers, encrypted profile storage.
- `backend/src/routes` - REST endpoints for OTP/Google auth, profiles, check-ins, and meal plans.
- `backend/src/services` - BMR/calorie logic and EFCT-only meal generation.
- `backend/src/scripts/parse_ethiopian_fct.py` - PDF-to-JSON/CSV parser.
- `backend/src/scripts/seedFoodData.js` - idempotent `food_data` seeder.
- `mobile/src/screens` - Expo onboarding, dashboard, weekly check-in, and subscription screens.

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run parse:pdf
npm run seed:food
npm run dev
```

Set `TENAFIT_FIELD_ENCRYPTION_KEY` from a secret manager in production. Use at least 32 random characters; 64+ is recommended. Do not commit real OTP, Google, database, or LLM keys.

## Updating Food Data

1. Put the latest Ethiopian Food Composition Table PDF on disk.
2. Set `ETHIOPIAN_FCT_PDF_PATH` in `backend/.env`, or pass the path directly:

```bash
python backend/src/scripts/parse_ethiopian_fct.py "C:\path\to\EFCT.pdf"
```

3. Review generated files:

- `backend/data/ethiopian-fct-food-data.json`
- `backend/data/ethiopian-fct-food-data.csv`

4. Seed PostgreSQL:

```bash
cd backend
npm run seed:food
```

The parser extracts condensed table section `1/5` for energy and macronutrients and merges section `2/5` minerals into `vitamins_minerals_json` when codes match.

## Meal Planning Logic

Tune `backend/src/services/mealPlanService.js` for meal calorie ratios and group preferences. Tune `backend/src/services/foodRepository.js` for restriction filters, for example sodium limits for hypertension.

The meal planner must continue to query `food_data`; do not add hard-coded food rows in code or UI.

## Security Notes

- PostgreSQL uses `pgcrypto` with AES-256 PGP symmetric encryption helpers.
- Sensitive profile fields and check-in weights are stored as encrypted `bytea`.
- Phone numbers are encrypted and also hashed for lookup.
- Express uses Helmet, rate limiting, JWT auth, and pooled PostgreSQL connections.
- OTP is wired to Twilio Verify; Google sign-in verifies ID tokens server-side.

## Mobile Setup

```bash
cd mobile
npm install
set EXPO_PUBLIC_API_URL=http://localhost:4000
npm run start
```

The current mobile shell renders the requested onboarding, dashboard, check-in, and subscription flows with number displays and progress bars only. Meals are shown only when an EFCT-generated meal plan is supplied by the backend.
