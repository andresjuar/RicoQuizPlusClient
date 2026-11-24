export const MAX_IMAGE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.';
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es ${MAX_IMAGE_MB} MB.`;
  }
  return null;
}