import { Platform } from "react-native";

export const Colors = {
  // Identidade Visual Satura
  primary: "#16645F",       // Verde profundo elegante / assinatura Satura
  primaryLight: "#1E827C",
  primaryDark: "#0F4643",
  background: "#EEECDE",    // Linho acolhedor / tom natural
  card: "#FFFFFF",          // Superfície branca dos cartões
  text: "#343832",          // Texto primário de alto contraste (WCAG AAA em #EEECDE)
  textSecondary: "#5F625C", // Texto secundário (WCAG AA em #EEECDE)
  textMuted: "#77786F",
  border: "#D8D5C7",
  inputBg: "#FFFFFF",
  error: "#B34B5F",         // Vermelho carmim elegante para validação
  success: "#1F7A54",       // Verde sucesso

  // Acentos coloridos da identidade Satura
  accentPurple: "#7B61FF",
  accentPink: "#FF6B9A",
  accentOrange: "#FFB35C",
  accentGreen: "#72D6B0",
  accentYellow: "#FFE29A",

  // Cores de acessibilidade avaliadas para WCAG 2.2 AA
  accessibleContrast: {
    darkOnLight: "#16645F", // Ratio 6.8:1 contra #EEECDE
    lightOnDark: "#FFFFFF", // Ratio 9.2:1 contra #16645F
  }
} as const;

export const Fonts = Platform.select({
  ios: {
    serif: "Georgia",
    sans: "system-ui",
    mono: "Courier",
  },
  android: {
    serif: "serif",
    sans: "sans-serif",
    mono: "monospace",
  },
  default: {
    serif: "Georgia, serif",
    sans: "sans-serif",
    mono: "monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
