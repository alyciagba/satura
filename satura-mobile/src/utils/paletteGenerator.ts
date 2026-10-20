import { PaletteColor } from "@/constants/palettes";
import { getClosestColorName } from "./colors";

export interface QuestionnaireAnswers {
  purpose: string;
  mood: string;
  temperature: string;
  tone: string;
  saturation: string;
  neutrals: string;
  harmony: string;
  count: number;
}

interface PaletteBlueprint {
  primary: string;
  secondary: string;
  support: string;
  neutral: string;
  accent: string;
  extra: string;
}

/**
 * Mapeamento e combinação cromática inteligente baseada nas 8 preferências do usuário.
 */
export function generateHarmonicPalette(answers: QuestionnaireAnswers): {
  colors: PaletteColor[];
  explanation: string;
} {
  const {
    purpose,
    mood,
    temperature,
    tone,
    saturation,
    neutrals,
    harmony,
    count,
  } = answers;

  let base: PaletteBlueprint;

  const isWarm = (temperature || "").includes("Quente");
  const isCool = (temperature || "").includes("Fria");

  if (isWarm) {
    if ((mood || "").includes("Energia")) {
      base = {
        primary: "#E85D04",
        secondary: "#FFB35C",
        support: "#DC2F02",
        neutral: "#FDF0D5",
        accent: "#7209B7",
        extra: "#FF6B9A",
      };
    } else if ((mood || "").includes("Elegância")) {
      base = {
        primary: "#8B4513",
        secondary: "#C6A15B",
        support: "#582F0E",
        neutral: "#F4E9D8",
        accent: "#16645F",
        extra: "#A68A56",
      };
    } else if ((mood || "").includes("Acolhimento")) {
      base = {
        primary: "#C86D51",
        secondary: "#E09F67",
        support: "#9C4130",
        neutral: "#FAF0CA",
        accent: "#2A9D8F",
        extra: "#E76F51",
      };
    } else {
      base = {
        primary: "#DDA15E",
        secondary: "#BC6C25",
        support: "#D4A373",
        neutral: "#FEFAE0",
        accent: "#606C38",
        extra: "#FAEDCD",
      };
    }
  } else if (isCool) {
    if ((mood || "").includes("Energia")) {
      base = {
        primary: "#0077B6",
        secondary: "#00B4D8",
        support: "#7B61FF",
        neutral: "#EDF2F4",
        accent: "#FFB35C",
        extra: "#90E0EF",
      };
    } else if ((mood || "").includes("Elegância")) {
      base = {
        primary: "#16645F",
        secondary: "#1B263B",
        support: "#0F4643",
        neutral: "#E0E1DD",
        accent: "#D4AF37",
        extra: "#415A77",
      };
    } else if ((mood || "").includes("Acolhimento")) {
      base = {
        primary: "#457B9D",
        secondary: "#588157",
        support: "#344E41",
        neutral: "#E9ECEF",
        accent: "#E07A5F",
        extra: "#A3B18A",
      };
    } else {
      base = {
        primary: "#2A9D8F",
        secondary: "#72D6B0",
        support: "#1D3557",
        neutral: "#EEECDE",
        accent: "#E76F51",
        extra: "#A8DADC",
      };
    }
  } else {
    // Equilíbrio Misto
    if ((mood || "").includes("Energia")) {
      base = {
        primary: "#16645F",
        secondary: "#FF6B9A",
        support: "#FFB35C",
        neutral: "#EEECDE",
        accent: "#7B61FF",
        extra: "#2EC4B6",
      };
    } else if ((mood || "").includes("Elegância")) {
      base = {
        primary: "#16645F",
        secondary: "#C6A15B",
        support: "#343832",
        neutral: "#F4E9D8",
        accent: "#B7795B",
        extra: "#8AA6A3",
      };
    } else if ((mood || "").includes("Acolhimento")) {
      base = {
        primary: "#B7795B",
        secondary: "#2E6B62",
        support: "#E5C59A",
        neutral: "#FAF0CA",
        accent: "#16645F",
        extra: "#D88A36",
      };
    } else {
      base = {
        primary: "#16645F",
        secondary: "#72D6B0",
        support: "#B8D8BA",
        neutral: "#EEECDE",
        accent: "#FFB35C",
        extra: "#99D98C",
      };
    }
  }

  // 2. Ajuste de saturação
  if ((saturation || "").includes("Suaves")) {
    base = {
      primary: isWarm ? "#E8A598" : "#83C5BE",
      secondary: isWarm ? "#F4A261" : "#A8DADC",
      support: isWarm ? "#DDA15E" : "#B8D8BA",
      neutral: "#F8F9FA",
      accent: isWarm ? "#B5838D" : "#E29578",
      extra: "#E9D8A6",
    };
  } else if ((saturation || "").includes("Terrosas")) {
    base = {
      primary: isCool ? "#386641" : "#8B4513",
      secondary: isCool ? "#6A994E" : "#BC6C25",
      support: isCool ? "#283618" : "#9C6644",
      neutral: "#EDE0D4",
      accent: isCool ? "#DDA15E" : "#606C38",
      extra: "#7F4F24",
    };
  }

  // 3. Ajuste de luminosidade
  if ((tone || "").includes("Escuros")) {
    base = {
      primary: isWarm ? "#7B1E4A" : "#123C3A",
      secondary: isWarm ? "#9A3412" : "#1B263B",
      support: isWarm ? "#4A0404" : "#0D2825",
      neutral: "#2C3531",
      accent: "#FFB35C",
      extra: isWarm ? "#A31621" : "#283618",
    };
  } else if ((tone || "").includes("Alto contraste")) {
    base = {
      primary: isWarm ? "#6B0F1A" : "#0A192F",
      secondary: isWarm ? "#FF9E00" : "#64DFDF",
      support: isWarm ? "#B91C1C" : "#1E3A8A",
      neutral: "#FAF9F6",
      accent: isWarm ? "#FFE6A7" : "#FF5964",
      extra: "#333333",
    };
  }

  // 4. Ajuste de neutros
  if ((neutrals || "").includes("frios")) {
    base.neutral = "#E2E5E8";
  } else if ((neutrals || "").includes("amadeirados")) {
    base.neutral = "#DDB892";
  } else {
    base.neutral = "#EEECDE";
  }

  // 5. Ajuste de harmonia
  if ((harmony || "").includes("Análoga")) {
    base.accent = base.secondary;
  } else if ((harmony || "").includes("Monocromática")) {
    base.secondary = base.primary;
  }

  // 6. Rótulos de papéis
  let roleLabels: string[];
  if ((purpose || "").includes("Moda") || (purpose || "").includes("pessoal")) {
    roleLabels = [
      "Peça Chave / Principal",
      "Segunda Peça / Apoio",
      "Nuance de Transição",
      "Base do Guarda-Roupa",
      "Acessório / Ponto de Luz",
      "Detalhe Complementar",
    ];
  } else if ((purpose || "").includes("Decoração") || (purpose || "").includes("Ambientes")) {
    roleLabels = [
      "Paredes & Superfícies",
      "Móvel / Peça de Destaque",
      "Têxteis & Almofadas",
      "Base Neutra & Piso",
      "Iluminação & Metais",
      "Textura Natural",
    ];
  } else if ((purpose || "").includes("Arte") || (purpose || "").includes("Ilustração")) {
    roleLabels = [
      "Matiz Dominante",
      "Tom de Suporte",
      "Profundidade & Sombra",
      "Espaço Negativo / Luz",
      "Ponto Focal / Brilho",
      "Meio-Tom de Equilíbrio",
    ];
  } else {
    roleLabels = [
      "Cor Principal da Marca",
      "Tom Secundário",
      "Cor de Apoio",
      "Superfície / Base Neutra",
      "Tom de Ação / Destaque",
      "Nuance Complementar",
    ];
  }

  let hexList: string[];
  if (count === 3) {
    hexList = [base.primary, base.accent, base.neutral];
  } else if (count === 6) {
    hexList = [base.primary, base.secondary, base.support, base.neutral, base.accent, base.extra];
  } else {
    hexList = [base.primary, base.secondary, base.support, base.neutral, base.accent];
  }

  const colors: PaletteColor[] = hexList.map((hex, idx) => {
    const role = roleLabels[idx % roleLabels.length];
    const descriptive = getClosestColorName(hex);
    return {
      name: `${role} (${descriptive})`,
      hex,
    };
  });

  const explanation = `Combinação formulada exclusivamente para ${(purpose || "projeto").toLowerCase()}, transmitindo ${(mood || "harmonia").toLowerCase()} com ${(temperature || "equilíbrio").toLowerCase()} e ${(tone || "tons suaves").toLowerCase()}. A estrutura adota ${(harmony || "harmonia clássica").toLowerCase()}, com saturação em ${(saturation || "equilibrada").toLowerCase()} e base em ${(neutrals || "neutros suaves").toLowerCase()}.`;

  return { colors, explanation };
}
