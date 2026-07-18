const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

function getSupabaseClient() {
  const rawUrl = process.env.SUPABASE_URL || "";
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }
  return req.body;
}

function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

module.exports = {
  getSupabaseClient,
  getTransporter,
  parseBody,
  applyCors,
};
