require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin$5656";

const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/adminpanel", (_req, res) => {
  res.sendFile(path.join(__dirname, "adminpanel.html"));
});

app.get("/api/referral/current", async (_req, res) => {
  if (!supabase) {
    return res.status(500).json({
      ok: false,
      message:
        "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    });
  }

  const { data, error } = await supabase
    .from("referral_links")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }

  return res.status(200).json({
    ok: true,
    referralUrl: data?.referral_url || "",
    updatedAt: data?.updated_at || data?.created_at || data?.changed_at || null,
  });
});

app.get("/api/admin/history", async (req, res) => {
  const { username, password } = req.query || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  if (!supabase) {
    return res.status(500).json({
      ok: false,
      message:
        "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    });
  }

  const { data, error } = await supabase
    .from("referral_link_history")
    .select("*")
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }

  return res.status(200).json({ ok: true, items: data || [] });
});

app.post("/api/admin/update-link", async (req, res) => {
  const { username, password, adminName, newLink } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  if (!adminName || !newLink) {
    return res.status(400).json({
      ok: false,
      message: "Required fields: adminName and newLink",
    });
  }

  if (!supabase) {
    return res.status(500).json({
      ok: false,
      message:
        "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    });
  }

  const { error: deactivateError } = await supabase
    .from("referral_links")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) {
    return res.status(500).json({ ok: false, message: deactivateError.message });
  }

  const { error: insertCurrentError } = await supabase
    .from("referral_links")
    .insert([{ referral_url: newLink, is_active: true, note: `Updated by ${adminName}` }]);
  if (insertCurrentError) {
    return res.status(500).json({ ok: false, message: insertCurrentError.message });
  }

  const { error: insertHistoryError } = await supabase
    .from("referral_link_history")
    .insert([{ admin_name: adminName, referral_url: newLink }]);
  if (insertHistoryError) {
    return res.status(500).json({ ok: false, message: insertHistoryError.message });
  }

  return res.status(200).json({
    ok: true,
    message: "Referral link updated successfully",
  });
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.get("/health", async (_req, res) => {
  try {
    await transporter.verify();
    return res.status(200).json({ ok: true, message: "SMTP ready" });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "SMTP verification failed",
      error: error.message,
    });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await transporter.verify();
    return res.status(200).json({ ok: true, message: "SMTP ready" });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "SMTP verification failed",
      error: error.message,
    });
  }
});

app.post("/send-email", async (req, res) => {
  const { to, subject, text, html } = req.body || {};

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({
      ok: false,
      message: "Required fields: to, subject, and text or html",
    });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      ok: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
});

app.post("/contact-email", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      ok: false,
      message: "Required fields: name, email, subject, message",
    });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO || process.env.SMTP_USER,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${String(message).replace(/\n/g, "<br>")}</p>
      `,
    });

    return res.status(200).json({
      ok: true,
      message: "Message sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
});

app.post("/api/contact-email", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      ok: false,
      message: "Required fields: name, email, subject, message",
    });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO || process.env.SMTP_USER,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${String(message).replace(/\n/g, "<br>")}</p>
      `,
    });

    return res.status(200).json({
      ok: true,
      message: "Message sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`SMTP server running on http://localhost:${port}`);
});
