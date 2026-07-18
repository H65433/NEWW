const { getSupabaseClient, applyCors } = require("../_lib/utils");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { username, password } = req.query || {};
  const adminUsername = process.env.ADMIN_USERNAME || "Admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin$5656";

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({
      ok: false,
      message:
        "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env vars",
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
};
