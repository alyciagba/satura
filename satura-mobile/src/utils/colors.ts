/**
 * Utilitários de cores para o aplicativo Satura
 * Inclui conversão, cálculos de contraste WCAG 2.2 e extração de cores locais.
 */

export interface ColorData {
  hex: string;
  name: string;
  rgb: string;
  contrastText: string;
  percentage?: number;
}

export function hexToRgb(hex: string): string {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length < 6) return "0, 0, 0";
  const red = parseInt(cleanHex.slice(0, 2), 16) || 0;
  const green = parseInt(cleanHex.slice(2, 4), 16) || 0;
  const blue = parseInt(cleanHex.slice(4, 6), 16) || 0;
  return `${red}, ${green}, ${blue}`;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Calcula luminância relativa conforme especificação WCAG 2.2
 */
export function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "").trim();
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calcula taxa de contraste entre duas cores hexadecimais (ex: 4.5:1)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Retorna texto branco (#FFFFFF) ou preto (#1C1D1A) para melhor contraste WCAG sobre a cor
 */
export function getBestContrastTextColor(backgroundHex: string): "#FFFFFF" | "#1C1D1A" {
  const contrastWithWhite = getContrastRatio(backgroundHex, "#FFFFFF");
  const contrastWithBlack = getContrastRatio(backgroundHex, "#1C1D1A");
  return contrastWithWhite >= contrastWithBlack ? "#FFFFFF" : "#1C1D1A";
}

/**
 * Dicionário em português de nomes de cores harmônicas
 */
const COLOR_NAMES_MAP: Array<{ hex: string; name: string }> = [
  { hex: "#16645F", name: "Verde Satura" },
  { hex: "#72D6B0", name: "Menta Fresca" },
  { hex: "#EEECDE", name: "Linho Suave" },
  { hex: "#B8D8BA", name: "Sálvia Serena" },
  { hex: "#FFB35C", name: "Dourado Pôr do Sol" },
  { hex: "#FF6B9A", name: "Rosa Orquídea" },
  { hex: "#7B61FF", name: "Violeta Elétrico" },
  { hex: "#FFE29A", name: "Baunilha Solar" },
  { hex: "#123C3A", name: "Verde Floresta" },
  { hex: "#2E6B62", name: "Eucalipto" },
  { hex: "#5C8D79", name: "Oliva Pálida" },
  { hex: "#B7795B", name: "Terracota Quente" },
  { hex: "#E5C59A", name: "Areia Dourada" },
  { hex: "#7B1E4A", name: "Bordô Nobre" },
  { hex: "#C44569", name: "Framboesa" },
  { hex: "#D88A36", name: "Cobre Intenso" },
  { hex: "#246A73", name: "Azul Oceânico" },
  { hex: "#3D348B", name: "Índigo Profundo" },
  { hex: "#C6A15B", name: "Ouro Velho" },
  { hex: "#F4E9D8", name: "Marfim Nobre" },
  { hex: "#8AA6A3", name: "Bruma Acinzentada" },
  { hex: "#343832", name: "Cinza Carvão" },
  { hex: "#1D3557", name: "Azul Petróleo" },
  { hex: "#457B9D", name: "Azul Céu Suave" },
  { hex: "#A8DADC", name: "Geleira Menta" },
  { hex: "#F1FAEE", name: "Espuma Branca" },
  { hex: "#E63946", name: "Coral Vivo" },
  { hex: "#DDA15E", name: "Mostarda Amêndoa" },
  { hex: "#BC6C25", name: "Canela Queimada" },
  { hex: "#283618", name: "Musgo Escuro" },
  { hex: "#606C38", name: "Oliva Seca" },
  { hex: "#FEFAE0", name: "Creme Suave" },
];

/**
 * Encontra o nome em português mais próximo para uma cor arbitrária
 */
export function getClosestColorName(hex: string): string {
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length < 6) return "Cor Personalizada";

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  let closestName = "Tom Harmônico";
  let minDistance = Infinity;

  for (const item of COLOR_NAMES_MAP) {
    const ir = parseInt(item.hex.slice(1, 3), 16);
    const ig = parseInt(item.hex.slice(3, 5), 16);
    const ib = parseInt(item.hex.slice(5, 7), 16);

    // Distância euclidiana ponderada pela percepção humana
    const dist = Math.sqrt(
      2 * Math.pow(r - ir, 2) +
      4 * Math.pow(g - ig, 2) +
      3 * Math.pow(b - ib, 2)
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }

  return closestName;
}

/**
 * Explicação estética da harmonia gerada
 */
export function getHarmonyExplanation(purpose: string, mood: string, tone: string): string {
  const moodDesc: Record<string, string> = {
    "Calma e natural": "uma composição equilibrada inspirada em elementos orgânicos, proporcionando serenidade e conforto visual.",
    "Vibrante e criativa": "contrastes estimulantes e energia expressiva, ideais para despertar curiosidade e dinamismo.",
    "Elegante e sofisticada": "uma cadência refinada de tons nobres com equilíbrio entre luz e sombra, transmitindo exclusividade.",
    "Minimalista e neutra": "uma transição suave de tonalidades atemporais, priorizando clareza, espaço e foco no essencial."
  };

  const selectedMood = moodDesc[mood] || "uma combinação harmônica que valoriza a proporção e o equilíbrio visual.";
  return `Paleta orientada para ${purpose.toLowerCase()}, construída com ${tone.toLowerCase()} em ${selectedMood}`;
}
