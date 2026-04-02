/** DD/MM/YYYY HH:MM:SS (local) */
export function formatAuditTime(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

/** JPEG data URL from a playing video frame, or null if not drawable */
export function captureVideoFrameBase64(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  try {
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return c.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/jpeg;base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  try {
    const binary = atob(m[1]);
    const len = binary.length;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}
