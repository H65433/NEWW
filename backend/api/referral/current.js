const { getSupabaseClient, applyCors } = require("../_lib/utils");

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
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
};
