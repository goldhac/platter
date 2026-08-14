// Generate + wire AI food photos for Jīn Cāntīng's Dinner (food) items.
//   pipeline per item: seedream-v4 (muapi CLI) → sips resize 900px → upload to the
//   menu-images bucket (service-role) → set items.image_url.
// Resumable: only touches items whose image_url is null, so a re-run never re-spends.
//   usage: node scripts/generate-item-images.mjs [LIMIT]   (LIMIT for a test batch)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- env (supabase url + service-role key from .env.local; never printed) ---
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL, SVC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SVC) { console.error("missing supabase url / service-role key in .env.local"); process.exit(1); }
const db = createClient(SUPA_URL, SVC, { auth: { persistSession: false } });

const LIMIT = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity;
const CONCURRENCY = 4;
const BUCKET = "menu-images";
const STYLE = "Professional overhead food photography, served in dark matte ceramic dishware on a dark slate table, soft moody directional lighting, faint wisps of steam, shallow depth of field, rich saturated appetizing colors, ultra photorealistic, high detail, fine-dining restaurant menu quality, no text, no watermark, no hands, no utensils in frame.";

// --- resolve the Dinner ('menu') food items that still lack an image ---
const { data: rest, error: e0 } = await db.from("restaurants").select("id").eq("slug", "jin-canting").single();
if (e0) throw e0;
const { data: menu } = await db.from("menus").select("id").eq("restaurant_id", rest.id).eq("slug", "menu").single();
const { data: groups } = await db.from("menu_groups").select("id").eq("menu_id", menu.id).like("slug", "%").not("slug", "like", "%-arch-%");
const { data: cats } = await db.from("categories").select("id,name").in("group_id", groups.map(g => g.id)).is("deleted_at", null);
const cat = new Map(cats.map(c => [c.id, c.name]));
const { data: items, error: e1 } = await db.from("items")
  .select("id,name,description,slug,category_id")
  .in("category_id", cats.map(c => c.id))
  .eq("status", "published").is("deleted_at", null).is("image_url", null)
  .order("sort_order");
if (e1) throw e1;

const todo = items.slice(0, LIMIT);
console.log(`Dinner food items missing an image: ${items.length} · processing ${todo.length} (concurrency ${CONCURRENCY})`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "platter-img-"));
let ok = 0, fail = 0, spent = 0;

async function one(item) {
  const raw = path.join(tmp, `${item.slug}.raw.jpg`);
  const out = path.join(tmp, `${item.slug}.jpg`);
  const desc = (item.description || "").replace(/\s+/g, " ").slice(0, 180);
  const prompt = `${item.name}${cat.get(item.category_id) ? ` (${cat.get(item.category_id)})` : ""}. ${desc} ${STYLE}`;
  try {
    const { stdout } = await exec("muapi", ["run", "seedream-v4", "-p", prompt, "-j"], { timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
    const res = JSON.parse(stdout.slice(stdout.indexOf("{"), stdout.lastIndexOf("}") + 1));
    const imgUrl = res.outputs?.[0];
    if (!imgUrl) throw new Error("no output url from muapi");
    spent += res.cost?.amount_usd || 0;
    fs.writeFileSync(raw, Buffer.from(await (await fetch(imgUrl)).arrayBuffer()));
    await exec("sips", ["-Z", "900", "-s", "format", "jpeg", "-s", "formatOptions", "70", raw, "--out", out], { timeout: 60000 });
    const objKey = `jin-canting/${item.slug}.jpg`;
    const { error: upErr } = await db.storage.from(BUCKET).upload(objKey, fs.readFileSync(out), { contentType: "image/jpeg", upsert: true });
    if (upErr) throw upErr;
    const pub = db.storage.from(BUCKET).getPublicUrl(objKey).data.publicUrl;
    const { error: updErr } = await db.from("items").update({ image_url: pub }).eq("id", item.id);
    if (updErr) throw updErr;
    ok++;
    console.log(`✓ [${ok + fail}/${todo.length}] ${item.name}  $${(res.cost?.amount_usd || 0).toFixed(3)}`);
  } catch (e) {
    fail++;
    console.error(`✗ [${ok + fail}/${todo.length}] ${item.name}: ${(e.message || e).toString().slice(0, 160)}`);
  } finally {
    for (const f of [raw, out]) { try { fs.unlinkSync(f); } catch {} }
  }
}

const q = [...todo];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length || 1) }, async () => { while (q.length) await one(q.shift()); }));
console.log(`\nDONE · ok=${ok} fail=${fail} · spent≈$${spent.toFixed(2)} · bucket=${BUCKET}/jin-canting/`);