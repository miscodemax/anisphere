// utils/decompress.ts
import { strFromU8, unzipSync } from "fflate";

/**
 * Décompresse une chaîne Base64 compressée (gzip/deflate) en texte lisible.
 */
export function decompressBase64(compressed: string | null): string {
  if (!compressed) return "";

  // Convertir Base64 en Uint8Array
  const bytes = Uint8Array.from(atob(compressed), (c) => c.charCodeAt(0));

  // Décompresser avec fflate
  const decompressed = unzipSync(bytes);

  // Retourner le texte final
  return strFromU8(decompressed);
}
