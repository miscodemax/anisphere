import pako from "pako";

// Décompression Base64 → UTF-8
export function decompressBase64(data: string | null | undefined): string {
  if (!data) return "";
  try {
    // Base64 → Uint8Array
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    // Décompression zlib (pako)
    const decompressed = pako.inflate(bytes, { to: "string" });
    return decompressed;
  } catch (err) {
    console.error("Erreur décompression:", err);
    return data; // retourne brut si ça échoue
  }
}

// Compression texte → Base64 compatible Python
export function compressToBase64(text: string): string {
  try {
    const compressed = pako.deflate(text, { level: 9 });
    let binary = "";
    const len = compressed.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(compressed[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error("Erreur compression:", err);
    return text;
  }
}
