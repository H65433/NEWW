const { getSupabaseClient, parseBody, applyCors } = require("../_lib/utils");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const body = parseBody(req);
  const { username, password, adminName, newLink } = body;
  const adminUsername = process.env.ADMIN_USERNAME || "Admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin$5656";

  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  if (!adminName || !newLink) {
    return res
      .status(400)
      .json({ ok: false, message: "Required fields: adminName and newLink" });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({
      ok: false,
      message:
        "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env vars",
    });
  }

  const { error: deactivateError } = await supabase
    .from("referral_links")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) {
    return res.status(500).json({ ok: false, message: deactivateError.message });
  }

  const { error: insertCurrentError } = await supabase.from("referral_links").insert([
    {
      referral_url: newLink,
      is_active: true,
      note: `Updated by ${adminName}`,
    },
  ]);
  if (insertCurrentError) {
    return res.status(500).json({ ok: false, message: insertCurrentError.message });
  }

  const { error: insertHistoryError } = await supabase
    .from("referral_link_history")
    .insert([{ admin_name: adminName, referral_url: newLink }]);
  if (insertHistoryError) {
    return res.status(500).json({ ok: false, message: insertHistoryError.message });
  }

  return res
    .status(200)
    .json({ ok: true, message: "Referral link updated successfully" });
};
