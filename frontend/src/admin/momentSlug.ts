import { createId } from "@paralleldrive/cuid2";

export function createMomentSlug(): string {
  return `moment-${createId().slice(0, 8)}`;
}
