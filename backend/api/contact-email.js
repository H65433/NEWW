const { getTransporter, parseBody, applyCors } = require("./_lib/utils");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const body = parseBody(req);
  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      ok: false,
      message: "Required fields: name, email, subject, message",
    });
  }

  try {
    const transporter = getTransporter();
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
};
