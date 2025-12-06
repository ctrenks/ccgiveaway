/**
 * Device fingerprinting for multi-account detection
 * Creates a hash based on browser/device characteristics
 */

export async function generateFingerprint(): Promise<string> {
  const components = [
    // Screen characteristics
    `${window.screen.width}x${window.screen.height}`,
    window.screen.colorDepth,
    window.screen.pixelDepth,
    
    // Timezone
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
    
    // Language
    navigator.language,
    navigator.languages?.join(",") || "",
    
    // Platform
    navigator.platform,
    navigator.hardwareConcurrency || 0,
    (navigator as any).deviceMemory || 0,
    
    // User agent
    navigator.userAgent,
    
    // Canvas fingerprint (basic version)
    await getCanvasFingerprint(),
  ];

  // Create hash from components
  const text = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    canvas.width = 200;
    canvas.height = 50;

    // Draw some text with various properties
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Device Fingerprint", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Device Fingerprint", 4, 17);

    return canvas.toDataURL();
  } catch {
    return "";
  }
}

export function getIPAddress(): string | null {
  // IP address will be captured server-side from request headers
  return null;
}

