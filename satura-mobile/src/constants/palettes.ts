import AsyncStorage from "@react-native-async-storage/async-storage";
import { getClosestColorName } from "@/utils/colors";

export type PaletteColor = {
  name: string;
  hex: string;
};

export type SavedPalette = {
  id: string;
  name: string;
  purpose: string;
  mood: string;
  tone: string;
  colors: PaletteColor[];
  savedAt: string;
  source?: "questionario" | "imagem";
  imageUrl?: string;
  explanation?: string;
};

export type UserProfile = {
  name: string;
  email: string;
  createdAt: string;
};

export const SAVED_PALETTES_STORAGE_KEY = "satura:saved-palettes";
export const USER_PROFILE_STORAGE_KEY = "satura:user-profile";
export const SESSION_STORAGE_KEY = "satura:user-session";

// Conjuntos harmônicos baseados nas preferências do usuário
export const PALETTE_SETS: Record<string, string[]> = {
  "Calma e natural|Tons claros": [
    "#16645F",
    "#72D6B0",
    "#EEECDE",
    "#B8D8BA",
    "#FFB35C",
  ],
  "Calma e natural|Tons escuros": [
    "#123C3A",
    "#2E6B62",
    "#5C8D79",
    "#B7795B",
    "#E5C59A",
  ],
  "Vibrante e criativa|Tons claros": [
    "#FF6B9A",
    "#FFB35C",
    "#FFE29A",
    "#72D6B0",
    "#7B61FF",
  ],
  "Vibrante e criativa|Tons escuros": [
    "#7B1E4A",
    "#C44569",
    "#D88A36",
    "#246A73",
    "#3D348B",
  ],
  "Elegante e sofisticada|Tons claros": [
    "#16645F",
    "#C6A15B",
    "#F4E9D8",
    "#8AA6A3",
    "#343832",
  ],
  "Elegante e sofisticada|Tons escuros": [
    "#1C1D1A",
    "#343832",
    "#8A7352",
    "#C6A15B",
    "#F4E9D8",
  ],
  "Minimalista e neutra|Tons claros": [
    "#EEECDE",
    "#D9D7C9",
    "#B5B4A6",
    "#77786F",
    "#343832",
  ],
  "Minimalista e neutra|Tons escuros": [
    "#1A1A1A",
    "#2E2E2E",
    "#4A4A4A",
    "#787878",
    "#C4C4C4",
  ],
};

const DEFAULT_COLOR_ROLES = ["Principal", "Complementar", "Neutro", "Apoio", "Destaque", "Secundário"];

export function buildPaletteColors(hexList: string[], purpose: string): PaletteColor[] {
  const shift = (purpose || "").length % hexList.length;
  return hexList.map((hex, index) => {
    const role = DEFAULT_COLOR_ROLES[(index + shift) % DEFAULT_COLOR_ROLES.length];
    const descriptiveName = getClosestColorName(hex);
    return {
      name: `${role} (${descriptiveName})`,
      hex,
    };
  });
}

// Paletas iniciais pré-carregadas para demonstração acadêmica
export const INITIAL_PALETTES: SavedPalette[] = [
  {
    id: "demo-paleta-1",
    name: "Identidade Satura",
    purpose: "Projeto de design",
    mood: "Elegante e sofisticada",
    tone: "Tons claros",
    savedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    source: "questionario",
    colors: [
      { name: "Principal (Verde Satura)", hex: "#16645F" },
      { name: "Complementar (Rosa Orquídea)", hex: "#FF6B9A" },
      { name: "Apoio (Dourado Pôr do Sol)", hex: "#FFB35C" },
      { name: "Neutro (Linho Suave)", hex: "#EEECDE" },
      { name: "Destaque (Violeta Elétrico)", hex: "#7B61FF" },
    ],
  },
  {
    id: "demo-paleta-2",
    name: "Jardim Botânico",
    purpose: "Meu estilo pessoal",
    mood: "Calma e natural",
    tone: "Tons claros",
    savedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    source: "imagem",
    colors: [
      { name: "Principal (Verde Floresta)", hex: "#123C3A" },
      { name: "Complementar (Menta Fresca)", hex: "#72D6B0" },
      { name: "Apoio (Sálvia Serena)", hex: "#B8D8BA" },
      { name: "Neutro (Creme Suave)", hex: "#FEFAE0" },
      { name: "Destaque (Terracota Quente)", hex: "#B7795B" },
    ],
  },
];

export async function loadSavedPalettes(): Promise<SavedPalette[]> {
  try {
    const stored = await AsyncStorage.getItem(SAVED_PALETTES_STORAGE_KEY);
    if (!stored) {
      // Inicializa com demonstrações para visualização imediata
      await saveSavedPalettes(INITIAL_PALETTES);
      return INITIAL_PALETTES;
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SavedPalette[];
    }

    await saveSavedPalettes(INITIAL_PALETTES);
    return INITIAL_PALETTES;
  } catch (error) {
    console.error("Erro ao carregar paletas:", error);
    return [];
  }
}

export async function saveSavedPalettes(palettes: SavedPalette[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_PALETTES_STORAGE_KEY, JSON.stringify(palettes));
  } catch (error) {
    console.error("Erro ao salvar paletas:", error);
  }
}

export async function addSavedPalette(palette: SavedPalette): Promise<SavedPalette[]> {
  const current = await loadSavedPalettes();
  const updated = [palette, ...current.filter((p) => p.id !== palette.id)];
  await saveSavedPalettes(updated);
  return updated;
}

export async function removeSavedPalette(id: string): Promise<SavedPalette[]> {
  const current = await loadSavedPalettes();
  const remaining = current.filter((palette) => palette.id !== id);
  await saveSavedPalettes(remaining);
  return remaining;
}
