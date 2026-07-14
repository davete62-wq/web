import express from 'express';
import Joi from 'joi';
import twilio from 'twilio';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../db/pool.js';
import { env } from '../config/env.js';
import { signUserToken } from '../middleware/auth.js';

export const authRoutes = express.Router();

const googleClient = env.googleClientIds.length ? new OAuth2Client(env.googleClientIds[0]) : null;

function twilioClient() {
  if (!env.twilio.accountSid || !env.twilio.authToken || !env.twilio.verifyServiceSid) {
    throw new Error('Twilio Verify is not configured');
  }
  return twilio(env.twilio.accountSid, env.twilio.authToken);
}

function handleTwilioError(error, res) {
  if (error?.code === 60200 || error?.code === 21211) {
    return res.status(400).json({ error: 'Invalid phone number. Use a real Ethiopian number in +251 format.' });
  }

  if (error?.code === 60203 || error?.code === 60205) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please wait and try again.' });
  }

  if (error?.status === 403 || error?.code === 21608) {
    return res.status(403).json({ error: 'Twilio cannot send OTP to this number. If this is a trial account, add the number in Twilio verified caller IDs or upgrade Twilio.' });
  }

  return null;
}

authRoutes.post('/phone/start', async (req, res, next) => {
  try {
    const { phone } = Joi.object({ phone: Joi.string().min(8).max(32).required() }).validate(req.body).value;
    await twilioClient().verify.v2.services(env.twilio.verifyServiceSid).verifications.create({
      to: phone,
      channel: 'sms'
    });
    res.status(202).json({ status: 'otp_sent' });
  } catch (error) {
    const handled = handleTwilioError(error, res);
    if (handled) return;
    next(error);
  }
});

authRoutes.post('/phone/verify', async (req, res, next) => {
  try {
    const { phone, code } = Joi.object({
      phone: Joi.string().min(8).max(32).required(),
      code: Joi.string().min(4).max(10).required()
    }).validate(req.body).value;

    const verification = await twilioClient().verify.v2
      .services(env.twilio.verifyServiceSid)
      .verificationChecks.create({ to: phone, code });

    if (verification.status !== 'approved') {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const { rows } = await query(
      `INSERT INTO users (phone_encrypted, phone_hash, auth_provider)
       VALUES (app_private.encrypt_text($1), app_private.sha256_lookup($1), 'phone')
       ON CONFLICT (phone_hash)
       DO UPDATE SET auth_provider = 'phone'
       RETURNING id, auth_provider`,
      [phone]
    );

    res.json({ token: signUserToken(rows[0]), user: rows[0] });
  } catch (error) {
    const handled = handleTwilioError(error, res);
    if (handled) return;
    next(error);
  }
});

authRoutes.post('/google', async (req, res, next) => {
  try {
    if (!googleClient) return res.status(503).json({ error: 'Google OAuth is not configured' });
    const { idToken } = Joi.object({ idToken: Joi.string().required() }).validate(req.body).value;
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientIds });
    const payload = ticket.getPayload();

    const { rows } = await query(
      `INSERT INTO users (email, google_sub, auth_provider)
       VALUES ($1, $2, 'google')
       ON CONFLICT (google_sub)
       DO UPDATE SET email = EXCLUDED.email, auth_provider = 'google'
       RETURNING id, email, auth_provider`,
      [payload.email, payload.sub]
    );

    res.json({ token: signUserToken(rows[0]), user: rows[0] });
  } catch (error) {
    next(error);
  }
});
