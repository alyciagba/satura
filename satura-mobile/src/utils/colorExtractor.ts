import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import jpeg from "jpeg-js";

const SAMPLE_SIZE = 120;
const DEFAULT_COLOR_COUNT = 5;
const FALLBACK_PALETTE = ["#16645F", "#72D6B0", "#EEECDE", "#B8D8BA", "#FFB35C"];

type ColorBucket = {
  r: number;
  g: number;
  b: number;
  count: number;
};

function decodeBase64(value: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const cleanValue = value.replace(/[^A-Za-z0-9+/=]/g, "");
  const bytes = new Uint8Array(Math.floor((cleanValue.length * 3) / 4));
  let byteIndex = 0;
  let buffer = 0;
  let bits = 0;

  for (const character of cleanValue) {
    if (character === "=") break;
    const digit = alphabet.indexOf(character);
    if (digit < 0) continue;

    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[byteIndex] = (buffer >> bits) & 0xff;
      byteIndex += 1;
    }
  }

  return bytes.slice(0, byteIndex);
}

function rgbToHex(red: number, green: number, blue: number): string {
  const toHex = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();
}

function fallbackPalette(colorCount: number): string[] {
  return Array.from({ length: colorCount }, (_, index) => FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]);
}

/**
 * Redimensiona a imagem no Expo, lê os pixels JPEG e agrupa tons dominantes localmente.
 * Não depende de Canvas, DOM, rede ou APIs exclusivas do navegador.
 */
export async function extractPaletteFromImage(
  imageUri: string,
  colorCount: number = DEFAULT_COLOR_COUNT
): Promise<string[]> {
  try {
    const manipulated = await manipulateAsync(
      imageUri,
      [{ resize: { width: SAMPLE_SIZE, height: SAMPLE_SIZE } }],
      { compress: 1, format: SaveFormat.JPEG, base64: true }
    );

    if (!manipulated.base64) return fallbackPalette(colorCount);

    const decoded = jpeg.decode(decodeBase64(manipulated.base64), { useTArray: true });
    const buckets: Record<string, ColorBucket> = {};

    for (let index = 0; index < decoded.data.length; index += 16) {
      const red = decoded.data[index];
      const green = decoded.data[index + 1];
      const blue = decoded.data[index + 2];
      const alpha = decoded.data[index + 3];

      if (alpha < 128) continue;

      const quantizedRed = Math.round(red / 32) * 32;
      const quantizedGreen = Math.round(green / 32) * 32;
      const quantizedBlue = Math.round(blue / 32) * 32;
      const key = `${quantizedRed}-${quantizedGreen}-${quantizedBlue}`;
      const bucket = buckets[key];

      if (bucket) {
        bucket.r += red;
        bucket.g += green;
        bucket.b += blue;
        bucket.count += 1;
      } else {
        buckets[key] = { r: red, g: green, b: blue, count: 1 };
      }
    }

    const pickedColors: string[] = [];
    const sortedBuckets = Object.values(buckets).sort((first, second) => second.count - first.count);

    for (const bucket of sortedBuckets) {
      const red = Math.round(bucket.r / bucket.count);
      const green = Math.round(bucket.g / bucket.count);
      const blue = Math.round(bucket.b / bucket.count);
      const hex = rgbToHex(red, green, blue);
      const isTooSimilar = pickedColors.some((existing) => {
        const existingRed = parseInt(existing.slice(1, 3), 16);
        const existingGreen = parseInt(existing.slice(3, 5), 16);
        const existingBlue = parseInt(existing.slice(5, 7), 16);
        return Math.abs(existingRed - red) + Math.abs(existingGreen - green) + Math.abs(existingBlue - blue) < 60;
      });

      if (!isTooSimilar) pickedColors.push(hex);
      if (pickedColors.length >= colorCount) break;
    }

    const fallback = fallbackPalette(colorCount);
    while (pickedColors.length < colorCount) {
      pickedColors.push(fallback[pickedColors.length]);
    }

    return pickedColors;
  } catch {
    return fallbackPalette(colorCount);
  }
}
