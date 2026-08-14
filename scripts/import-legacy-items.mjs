// One-off: insert the real scraped Jīn Cāntīng items into the flagship.
// Groups + categories are created separately (SQL part 1); this fills items only.
// Reads service-role key from .env.local, uses it in-memory, never prints it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// --- load only the two env vars we need, without echoing secrets ---
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("missing SUPABASE url/service-role key"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

// --- CSV parser (RFC4180) ---
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else { if (c === '"') q = true; else if (c === ",") { row.push(field); field=""; } else if (c === "\n") { row.push(field); rows.push(row); row=[]; field=""; } else if (c !== "\r") field += c; }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60) || "x";

const csvPath = process.argv[2] || path.join(root, "scripts/legacy-menu.csv");
const rows = parseCsv(fs.readFileSync(csvPath, "utf8")).slice(1).filter(r => r.length >= 5 && r[1]?.trim());

// --- resolve flagship + its live categories (slug -> id) ---
const { data: rest, error: e1 } = await db.from("restaurants").select("id,tenant_id").eq("slug","jin-canting").single();
if (e1) throw e1;
const { data: cats, error: e2 } = await db.from("categories").select("id,slug").eq("restaurant_id", rest.id).is("deleted_at", null);
if (e2) throw e2;
const catId = new Map(cats.map(c => [c.slug, c.id]));

// --- build item rows, unique slug per category ---
const used = {}; const sortByCat = {}; const items = []; const missing = new Set();
for (const r of rows) {
  const cslug = slug(r[0].trim());
  const cid = catId.get(cslug);
  if (!cid) { missing.add(r[0].trim()); continue; }
  used[cslug] ||= new Set();
  let s = slug(r[1]), base = s, k = 2;
  while (used[cslug].has(s)) s = `${base}-${k++}`;
  used[cslug].add(s);
  sortByCat[cslug] = (sortByCat[cslug] || 0) + 1000;
  const desc = (r[3] || "").trim();
  items.push({
    tenant_id: rest.tenant_id, restaurant_id: rest.id, category_id: cid,
    name: r[1].trim(), description: desc || null, slug: s,
    base_price: Math.max(0, Math.round(Number(r[4]) || 0)),
    spice_level: 0, dietary_tags: [], allergens: [], is_featured: false,
    status: "published", sort_order: sortByCat[cslug],
  });
}
if (missing.size) { console.error("NO CATEGORY for:", [...missing].join(", ")); process.exit(1); }

// --- insert in batches ---
let n = 0;
for (let i = 0; i < items.length; i += 100) {
  const batch = items.slice(i, i + 100);
  const { error } = await db.from("items").insert(batch);
  if (error) { console.error("insert failed at batch", i, error.message); process.exit(1); }
  n += batch.length;
}
console.log(`inserted ${n} items across ${catId.size} categories`);