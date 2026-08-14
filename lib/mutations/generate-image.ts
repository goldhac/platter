"use server";

import sharp from "sharp";
import { requireManager } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { StaffContext } from "@/lib/rbac";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GenImageResult = { ok: true; url: string } | { ok: false; error: string };

// The locked "dark fine-dining" style, so one-off generations match the bulk backfill.
const STYLE =
  "Professional overhead food photography, served in dark matte ceramic dishware on a dark slate table, soft moody directional lighting, faint wisps of steam, shallow depth of field, rich saturated appetizing colors, ultra photorealistic, high detail, fine-dining restaurant menu quality, no text, no words, no lettering, no watermark, no hands, no utensils in frame.";

const TOUCHUP =
  "Enhance this food photograph: professional restaurant lighting, richer natural colors, sharper focus, tidy up the background and remove clutter, make it look appetizing and professionally shot. Keep the same dish and composition. No text, no watermark.";

const MUAPI = "https://api.muapi.ai/api/v1";

/** Submit a MuAPI job (async) and poll its result. Returns the first output URL. */
async function submitAndPoll(endpoint: string, payload: object, key: string): Promise<string> {
  const submit = await fetch(`${MUAPI}/${endpoint}`, {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!submit.ok) throw new Error(`Generator error (${submit.status})`);
  const requestId = (await submit.json())?.request_id as string | undefined;
  if (!requestId) throw new Error("The generator didn't accept the request.");

  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch(`${MUAPI}/predictions/${requestId}/result`, { headers: { "x-api-key": key } });
    const data = await res.json();
    if (data?.status === "completed" && data?.outputs?.[0]) return data.outputs[0] as string;
    if (data?.status === "failed" || data?.error) throw new Error("Generation failed — try again.");
  }
  throw new Error("Generation timed out — give it another go.");
}

/** Download → resize to a menu-sized JPEG → upload under {tenantId}/… → public URL. */
async function finalize(outUrl: string, staff: StaffContext, supabase: SupabaseClient): Promise<string> {
  const raw = Buffer.from(await (await fetch(outUrl)).arrayBuffer());
  const jpg = await sharp(raw).resize(1000, 1000, { fit: "cover" }).jpeg({ quality: 72 }).toBuffer();
  const path = `${staff.tenantId}/gen-${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("menu-images").upload(path, jpg, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
}

/**
 * Generate a dish photo from its name + description (seedream-v4). Manager+ (gates the paid
 * ~$0.04 call); needs MUAPI_API_KEY. Runs on the caller's session so storage RLS permits it.
 */
export async function generateItemImage(name: string, description: string): Promise<GenImageResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const key = process.env.MUAPI_API_KEY;
  if (!key) return { ok: false, error: "AI photo generation isn't set up yet (missing MUAPI_API_KEY)." };
  const dish = (name || "").trim();
  if (!dish) return { ok: false, error: "Give the item a name first, then Generate." };

  const prompt = `${dish}. ${(description || "").replace(/\s+/g, " ").slice(0, 180)} ${STYLE}`;
  try {
    const outUrl = await submitAndPoll("bytedance-seedream-v4", { prompt, width: 1024, height: 1024 }, key);
    return { ok: true, url: await finalize(outUrl, staff, await createClient()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation error" };
  }
}

/**
 * Touch up an already-uploaded photo — a light AI enhance (better lighting/colour, cleaner
 * background) that keeps the dish, via an instruction-edit model. Same guards as generate.
 */
export async function touchUpItemImage(imageUrl: string): Promise<GenImageResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };
  const key = process.env.MUAPI_API_KEY;
  if (!key) return { ok: false, error: "AI touch-up isn't set up yet (missing MUAPI_API_KEY)." };
  if (!imageUrl) return { ok: false, error: "Upload or add a photo first, then Touch up." };

  try {
    const outUrl = await submitAndPoll("nano-banana-pro", { image_url: imageUrl, prompt: TOUCHUP }, key);
    return { ok: true, url: await finalize(outUrl, staff, await createClient()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Touch-up error" };
  }
}
