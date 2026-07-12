CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS app_private;

CREATE TYPE auth_provider AS ENUM ('phone', 'google');
CREATE TYPE subscription_status AS ENUM ('inactive', 'active', 'past_due', 'cancelled', 'expired');
CREATE TYPE subscription_plan_type AS ENUM ('free', 'monthly', 'annual', 'coach');
CREATE TYPE activity_level AS ENUM ('sedentary', 'light', 'moderate', 'very_active', 'athlete');

CREATE OR REPLACE FUNCTION app_private.encryption_key()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  key text;
BEGIN
  key := current_setting('app.field_encryption_key', true);
  IF key IS NULL OR length(key) < 32 THEN
    RAISE EXCEPTION 'app.field_encryption_key must be set to a strong key before encrypted writes';
  END IF;
  RETURN key;
END;
$$;

CREATE OR REPLACE FUNCTION app_private.encrypt_text(value text)
RETURNS bytea
LANGUAGE sql
VOLATILE
AS $$
  SELECT CASE
    WHEN value IS NULL THEN NULL
    ELSE pgp_sym_encrypt(value, app_private.encryption_key(), 'cipher-algo=aes256, compress-algo=1')
  END;
$$;

CREATE OR REPLACE FUNCTION app_private.decrypt_text(value bytea)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN value IS NULL THEN NULL
    ELSE pgp_sym_decrypt(value, app_private.encryption_key())
  END;
$$;

CREATE OR REPLACE FUNCTION app_private.sha256_lookup(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN value IS NULL THEN NULL
    ELSE encode(digest(lower(trim(value)), 'sha256'), 'hex')
  END;
$$;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_encrypted bytea,
  phone_hash text UNIQUE,
  email citext,
  google_sub text UNIQUE,
  auth_provider auth_provider NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_phone_or_google CHECK (
    phone_encrypted IS NOT NULL OR google_sub IS NOT NULL OR email IS NOT NULL
  )
);

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age_encrypted bytea NOT NULL,
  height_cm_encrypted bytea NOT NULL,
  weight_kg_encrypted bytea NOT NULL,
  activity_level activity_level NOT NULL,
  goal_weight_kg_encrypted bytea NOT NULL,
  target_calories_encrypted bytea NOT NULL,
  medical_conditions_encrypted bytea NOT NULL,
  allergies_encrypted bytea NOT NULL,
  sex_encrypted bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE food_data (
  id bigserial PRIMARY KEY,
  source_code text UNIQUE,
  food_name text NOT NULL,
  food_name_amharic text,
  food_group text NOT NULL,
  edible_portion numeric(8,3),
  energy_kj numeric(10,2),
  energy_kcal numeric(10,2),
  protein numeric(10,3),
  fat numeric(10,3),
  carbs numeric(10,3),
  fiber numeric(10,3),
  ash numeric(10,3),
  vitamins_minerals_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'Ethiopian Food Composition Table 2025',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meal_plans (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  plan_json jsonb NOT NULL,
  streak_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);

CREATE TABLE streaks (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  followed_plan boolean NOT NULL,
  current_weight_kg_encrypted bytea,
  streak_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_in_date)
);

CREATE TABLE subscriptions (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'inactive',
  expiry timestamptz,
  plan_type subscription_plan_type NOT NULL DEFAULT 'free',
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_users_phone_hash ON users(phone_hash);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_food_data_group ON food_data(food_group);
CREATE INDEX idx_food_data_energy ON food_data(energy_kcal);
CREATE INDEX idx_food_data_name_trgm ON food_data USING gin (to_tsvector('english', food_name));
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, plan_date DESC);
CREATE INDEX idx_streaks_user_date ON streaks(user_id, check_in_date DESC);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_profiles_set_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER food_data_set_updated_at BEFORE UPDATE ON food_data
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER meal_plans_set_updated_at BEFORE UPDATE ON meal_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
