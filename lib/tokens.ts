/** High-entropy, unguessable token for a physical NFC card / QR (Web Crypto). */
export function generateCardToken(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `R${hex}`;
}
