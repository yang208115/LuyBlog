import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db";
import { mediaAssets } from "../db/schema";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export function isAllowedImageMime(value: string): value is AllowedImageMime {
  return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(value);
}

export function detectImageMagicBytes(bytes: Uint8Array): AllowedImageMime | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: GIF87a / GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  // AVIF: ISO BMFF ftyp box with avif / avis brand
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0);
    if (brand === "avif" || brand === "avis") {
      return "image/avif";
    }
    if (brand === "mif1" || brand === "msf1") {
      const boxSize = Math.min(
        bytes.length,
        ((bytes[0] ?? 0) << 24) | ((bytes[1] ?? 0) << 16) | ((bytes[2] ?? 0) << 8) | (bytes[3] ?? 0),
      );
      for (let offset = 16; offset + 4 <= boxSize; offset += 4) {
        const compat = String.fromCharCode(
          bytes[offset] ?? 0,
          bytes[offset + 1] ?? 0,
          bytes[offset + 2] ?? 0,
          bytes[offset + 3] ?? 0,
        );
        if (compat === "avif" || compat === "avis") {
          return "image/avif";
        }
      }
    }
  }

  return null;
}

export function extensionForMime(mime: AllowedImageMime): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
  }
}

export type UploadedMedia = {
  id: string;
  objectKey: string;
  url: string;
  filename: string;
  mimeType: AllowedImageMime;
  sizeBytes: number;
};

export async function uploadImageToR2(options: {
  bucket: R2Bucket;
  db: AppDatabase;
  file: File;
  userId: string;
}): Promise<UploadedMedia> {
  const { bucket, db, file, userId } = options;

  if (!file || file.size <= 0) {
    throw new Error("上传文件不能为空");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("图片大小不能超过 5 MB");
  }
  if (!isAllowedImageMime(file.type)) {
    throw new Error("仅支持 JPEG、PNG、GIF、WebP 和 AVIF 格式图片");
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const detected = detectImageMagicBytes(bytes);

  if (!detected || detected !== file.type) {
    throw new Error("文件内容与声明的图片类型不匹配");
  }

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = extensionForMime(detected);
  const objectKey = `uploads/${yyyy}/${mm}/${crypto.randomUUID()}.${ext}`;
  const cleanName = (file.name || `image.${ext}`).replace(/[^\w.\-\u4e00-\u9fa5]/g, "_").slice(0, 120);

  await bucket.put(objectKey, bytes, {
    httpMetadata: {
      contentType: detected,
    },
  });

  const [created] = await db
    .insert(mediaAssets)
    .values({
      objectKey,
      filename: cleanName,
      mimeType: detected,
      sizeBytes: bytes.byteLength,
      uploadedBy: userId,
      createdAt: now,
    })
    .returning();

  if (!created) {
    await bucket.delete(objectKey);
    throw new Error("保存媒体元数据失败");
  }

  return {
    id: created.id,
    objectKey: created.objectKey,
    url: `/api/media/${created.objectKey}`,
    filename: created.filename,
    mimeType: detected,
    sizeBytes: created.sizeBytes,
  };
}

export async function deleteImageFromR2(options: {
  bucket: R2Bucket;
  db: AppDatabase;
  id: string;
}): Promise<void> {
  const { bucket, db, id } = options;
  const existing = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).get();
  if (!existing) {
    throw new Error("媒体资源不存在");
  }
  await bucket.delete(existing.objectKey);
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
}
