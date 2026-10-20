import type { SavedPalette } from "@/constants/palettes";

export function getPaletteResultParams(palette: SavedPalette): Record<string, string> {
  return {
    purpose: palette.purpose,
    mood: palette.mood,
    tone: palette.tone,
    source: palette.source ?? "questionario",
    fromSaved: "true",
    name: palette.name,
    explanation: palette.explanation ?? "",
    paletteColors: JSON.stringify(palette.colors),
    customColors: JSON.stringify(palette.colors.map((color) => color.hex)),
  };
}
