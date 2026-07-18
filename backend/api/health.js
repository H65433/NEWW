const { getTransporter, applyCors } = require("./_lib/utils");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return res.status(200).json({ ok: true, message: "SMTP ready" });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "SMTP verification failed",
      error: error.message,
    });
  }
};
