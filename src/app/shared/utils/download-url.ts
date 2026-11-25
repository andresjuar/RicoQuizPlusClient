export function downloadUrl(url: string): string {
  return url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
}