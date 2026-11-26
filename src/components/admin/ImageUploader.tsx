import { ImagePlus, Loader2 } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

export type UploadedMediaPayload = {
  id: string;
  objectKey: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

export async function uploadFileToR2(file: File): Promise<UploadedMediaPayload> {
  const formData = new FormData();
  formData.set("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as
    | UploadedMediaPayload
    | { message?: string }
    | null;
  if (!response.ok || !payload || !("url" in payload)) {
    const msg = payload && "message" in payload && payload.message ? payload.message : "上传图片失败";
    throw new Error(msg);
  }
  return payload;
}

export function ImageUploadButton({
  label = "上传图片",
  onUploaded,
  className = "",
}: {
  label?: string;
  onUploaded: (media: UploadedMediaPayload) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadFileToR2(file);
      onUploaded(uploaded);
      toast("图片已上传到 R2", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "上传失败", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] disabled:opacity-50 ${className}`}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5 text-[var(--accent)]" />
        )}
        {uploading ? "上传中…" : label}
      </button>
    </>
  );
}
