// Dev-X · Edge Function: sends the "order confirmed" e-mail through Resend.
// Only a logged-in ADMIN can call it. Secrets (never in the repo):  supabase secrets set RESEND_API_KEY=... MAIL_FROM="Dev-X <orders@yourdomain.com>"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY"), from = Deno.env.get("MAIL_FROM");
    if (!resendKey || !from) return json({ error: "email_not_configured" }, 500);

    // act AS the caller: RLS + is_admin() decide what they may see
    const authHeader = req.headers.get("Authorization") ?? "";
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await caller.auth.getUser();
    if (!u?.user) return json({ error: "unauthenticated" }, 401);
    const { data: isAdmin } = await caller.rpc("is_admin");
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const { order_id } = await req.json();
    if (typeof order_id !== "string") return json({ error: "bad_request" }, 400);
    const { data: o, error } = await caller.from("orders").select("*, order_items(*)").eq("id", order_id).single();
    if (error || !o) return json({ error: "order_not_found" }, 404);
    if (!o.customer_email) return json({ error: "customer_has_no_email" }, 422);

    const rows = (o.order_items ?? []).map((i: any) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #e5eaf3">${esc(i.product_name)}${i.color || i.size ? ` <small>(${esc([i.color, i.size].filter(Boolean).join(" / "))})</small>` : ""}</td><td style="padding:8px;border-bottom:1px solid #e5eaf3">×${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #e5eaf3">${Number(i.unit_price * i.quantity).toLocaleString("en-US")} ج.م</td></tr>`).join("");
    // brand: white background, navy text, navy header band, white text on it
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#ffffff;color:#041F60;max-width:560px;margin:auto;border:1px solid #e5eaf3;border-radius:16px;overflow:hidden">
      <div style="background:#041F60;color:#ffffff;padding:20px;text-align:center;font-size:22px;font-weight:700">Dev-X</div>
      <div style="padding:22px"><h2 style="margin:0 0 8px">تم تأكيد طلبك ✓</h2>
      <p>أهلًا ${esc(o.customer_name)}، تم تأكيد طلبك رقم <b>#${o.order_no}</b> من فرع <b>${esc(o.branch)}</b>.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <p style="font-size:18px"><b>الإجمالي: ${Number(o.total).toLocaleString("en-US")} ج.م</b> · الدفع: ${esc(o.payment_method)}</p>
      <p style="color:#145DA0">شكرًا لاختيارك Dev-X — للاستفسار تواصل معنا على واتساب.</p></div></div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [o.customer_email], subject: `تأكيد طلبك #${o.order_no} — Dev-X`, html }),
    });
    if (!r.ok) return json({ error: "resend_failed", detail: (await r.text()).slice(0, 200) }, 502);
    await caller.from("order_messages").insert({ order_id: o.id, channel: "email", body: "order-confirm-email", sent_by: u.user.id });
    return json({ ok: true });
  } catch (e) { return json({ error: "server_error", detail: String(e).slice(0, 200) }, 500); }
});
