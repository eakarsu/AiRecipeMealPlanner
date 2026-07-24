'use strict';
const express = require('express');
const crypto = require('node:crypto');
const auth = require('../middleware/auth');
const { sequelize } = require('../models');

const router = express.Router();
const REQUIRED_BASE_URL = 'https://openrouter.ai/api/v1';

router.use(auth);

router.post('/meal-advice', async (req, res, next) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (prompt.length < 10 || prompt.length > 5000) return res.status(400).json({ error: 'PROMPT_LENGTH_INVALID' });
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required');
    if (!process.env.OPENROUTER_MODEL) throw new Error('OPENROUTER_MODEL is required');
    if (process.env.OPENROUTER_BASE_URL !== REQUIRED_BASE_URL) throw new Error('OPENROUTER_BASE_URL must use the configured OpenRouter API');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(process.env.OPENROUTER_TIMEOUT_MS || 120000));
    let providerResponse;
    try {
      providerResponse = await fetch(`${REQUIRED_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.CLIENT_URL,
          'X-Title': 'AI Recipe Meal Planner',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: 'You are a practical meal-planning assistant. Respect stated allergies and dietary constraints, identify uncertainty, avoid medical advice, reduce waste, and offer budget-aware steps.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 700,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const payload = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok) throw new Error(`OpenRouter request failed with status ${providerResponse.status}`);
    const advice = payload?.choices?.[0]?.message?.content?.trim();
    if (!advice) throw new Error('OpenRouter returned no meal advice');
    const id = crypto.randomUUID();
    await sequelize.query(
      `INSERT INTO meal_planner_ai_results(id,user_id,prompt,model,provider_receipt_id,result,usage)
       VALUES(:id,:userId,:prompt,:model,:receiptId,:result,CAST(:usage AS jsonb))`,
      { replacements: { id, userId: req.user.id, prompt, model: process.env.OPENROUTER_MODEL, receiptId: payload.id || null, result: advice, usage: JSON.stringify(payload.usage || {}) } },
    );
    return res.json({ id, advice, model: process.env.OPENROUTER_MODEL });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
