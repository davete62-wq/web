ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferences_encrypted bytea;

