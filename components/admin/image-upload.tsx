"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { toast } from "sonner";
import { generateItemImage, touchUpItemImage } from "@/lib/mutations/generate-image";
import { cropToWebp, type CropArea } from "@/lib/image";
import { createClient } from "@/lib/supabase/browser";

/**
 * Camera/gallery → square crop → WebP (≤200KB) → tenant-scoped Storage upload (A7).
 * Uploads under {tenantId}/… so storage RLS permits it; returns the public URL.
 */
export function ImageUpload({
  tenantId,
  value,
  onChange,
  promptName,
  promptDesc,
}: {
  tenantId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** When provided, shows a "Generate" button that AI-creates a photo from name + description. */
  promptName?: string;
  promptDesc?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [touchingUp, setTouchingUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = "";
  }

  async function confirmCrop() {
    if (!src || !area) return;
    setUploading(true);
    try {
      const blob = await cropToWebp(src, area);
      const supabase = createClient();
      const path = `${tenantId}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from("menu-images")
        .upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        return;
      }
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      onChange(data.publicUrl);
      setSrc(null);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    if (generating) return;
    setGenerating(true);
    const p = generateItemImage(promptName ?? "", promptDesc ?? "").then((r) => {
      if (!r.ok) throw new Error(r.error);
      onChange(r.url);
    });
    toast.promise(p, {
      loading: "Generating photo… (~25s)",
      success: "Photo generated",
      error: (e: Error) => e.message,
    });
    try {
      await p;
    } catch {
      /* surfaced by the toast */
    } finally {
      setGenerating(false);
    }
  }

  async function touchUp() {
    if (touchingUp || !value) return;
    setTouchingUp(true);
    const p = touchUpItemImage(value).then((r) => {
      if (!r.ok) throw new Error(r.error);
      onChange(r.url);
    });
    toast.promise(p, {
      loading: "Touching up… (~25s)",
      success: "Photo touched up",
      error: (e: Error) => e.message,
    });
    try {
      await p;
    } catch {
      /* surfaced by the toast */
    } finally {
      setTouchingUp(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-card border border-hairline/30 bg-black/20">
          {value ? (
            <Image src={value} alt="Dish photo" fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-cjk text-accent/60">餐</div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-card border border-hairline/30 px-3 py-1.5 text-xs text-muted hover:text-porcelain"
          >
            {value ? "Change photo" : "Add photo"}
          </button>
          {promptName !== undefined && (
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="rounded-card border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {generating ? "Generating…" : "✨ Generate with AI"}
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={touchUp}
              disabled={touchingUp}
              className="rounded-card border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {touchingUp ? "Touching up…" : "✨ Touch up"}
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-muted hover:text-accent"
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pick}
          className="hidden"
        />
      </div>

      <Dialog.Root
        open={src !== null}
        onOpenChange={(o) => {
          if (!o) setSrc(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-hairline/25 bg-ink p-4 outline-none">
            <Dialog.Title className="mb-3 font-display text-lg text-porcelain">Crop photo</Dialog.Title>
            <div className="relative h-72 w-full overflow-hidden rounded-card bg-black">
              {src && (
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, px) => setArea(px)}
                />
              )}
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--color-lacquer)]"
              aria-label="Zoom"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Dialog.Close className="rounded-card border border-hairline/30 px-3 py-2 text-sm text-muted hover:text-porcelain">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                onClick={confirmCrop}
                disabled={uploading}
                className="rounded-card bg-accent px-4 py-2 text-sm text-porcelain disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Use photo"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
