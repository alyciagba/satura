import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addSavedPalette,
  buildPaletteColors,
  PALETTE_SETS,
  type PaletteColor,
  type SavedPalette,
} from "@/constants/palettes";
import { BarraNavegacao } from "@/components/BarraNavegacao";
import { Colors, Fonts } from "@/constants/theme";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  getBestContrastTextColor,
  getClosestColorName,
  getContrastRatio,
  getHarmonyExplanation,
  hexToRgb,
} from "@/utils/colors";
import { generateHarmonicPalette } from "@/utils/paletteGenerator";

export default function ResultadoPaletaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    purpose?: string;
    mood?: string;
    temperature?: string;
    tone?: string;
    saturation?: string;
    neutrals?: string;
    harmony?: string;
    count?: string;
    source?: string;
    fromSaved?: string;
    name?: string;
    explanation?: string;
    paletteColors?: string;
    customColors?: string;
  }>();

  const purpose = params.purpose ?? "Projeto de design";
  const mood = params.mood ?? "Calma e natural";
  const tone = params.tone ?? "Tons claros";
  const source = (params.source as "questionario" | "imagem") ?? "questionario";
  const count = params.count === "3" ? 3 : params.count === "6" ? 6 : 5;

  // Montagem da paleta e explicação produzida pela mesma lógica do questionário.
  const generatedPalette = useMemo(() => {
    if (params.paletteColors || params.customColors) {
      try {
        const parsedColors = params.paletteColors
          ? JSON.parse(params.paletteColors)
          : JSON.parse(params.customColors ?? "[]");
        if (Array.isArray(parsedColors) && parsedColors.length > 0) {
          const colors: PaletteColor[] = parsedColors.map(
            (color: string | PaletteColor, index: number) =>
              typeof color === "string"
                ? { name: `Tom ${index + 1} (${getClosestColorName(color)})`, hex: color }
                : color
          );

          return {
            colors,
            explanation:
              params.explanation ||
              "Paleta extraída diretamente da análise de imagem, reunindo as nuances mais representativas e harmônicas da fotografia.",
          };
        }
      } catch {
        // Fallback
      }
    }

    if (params.temperature || params.saturation || params.neutrals || params.harmony) {
      const result = generateHarmonicPalette({
        purpose,
        mood,
        temperature: params.temperature ?? "Equilíbrio Misto",
        tone,
        saturation: params.saturation ?? "Vivas e puras",
        neutrals: params.neutrals ?? "Neutros quentes e orgânicos",
        harmony: params.harmony ?? "Harmonia Complementar",
        count,
      });
      return result;
    }

    const key = `${mood}|${tone}`;
    const baseColors =
      PALETTE_SETS[key] ??
      PALETTE_SETS["Calma e natural|Tons claros"];

    let selectedList = [...baseColors];
    if (count === 3) {
      selectedList = [baseColors[0], baseColors[1], baseColors[3]];
    } else if (count === 6) {
      selectedList = [...baseColors, "#7B61FF"];
    }

    return {
      colors: buildPaletteColors(selectedList, purpose),
      explanation: getHarmonyExplanation(purpose, mood, tone),
    };
  }, [
    params.paletteColors,
    params.customColors,
    params.temperature,
    params.saturation,
    params.neutrals,
    params.harmony,
    mood,
    tone,
    count,
    purpose,
  ]);

  const palette = generatedPalette.colors;

  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [paletteName, setPaletteName] = useState(
    params.name ?? (source === "imagem" ? "Paleta Fotográfica" : `${mood} — ${purpose}`)
  );
  const [saved, setSaved] = useState(false);
  const { highContrast } = useAppSettings();

  async function copyColor(hex: string) {
    await Clipboard.setStringAsync(hex);
    setCopiedHex(hex);
    Alert.alert(
      "Código copiado! ✨",
      `O código hexadecimal ${hex} foi copiado para sua área de transferência.`
    );
    setTimeout(() => setCopiedHex(null), 2500);
  }

  async function handleSavePalette() {
    const trimmed = paletteName.trim();
    if (!trimmed) {
      Alert.alert("Nome obrigatório", "Por favor, digite um nome para a sua paleta.");
      return;
    }

    const newSaved: SavedPalette = {
      id: `${Date.now()}`,
      name: trimmed,
      purpose,
      mood,
      tone,
      colors: palette,
      savedAt: new Date().toISOString(),
      source,
      explanation: generatedPalette.explanation,
    };

    await addSavedPalette(newSaved);
    setSaved(true);
    setNameModalVisible(false);

    Alert.alert(
      "Paleta salva com sucesso! 🎨",
      `"${trimmed}" está disponível na aba "Paletas Salvas" do seu dispositivo.`,
      [
        {
          text: "Ver minhas paletas",
          onPress: () => router.push("/paletas_salvas"),
        },
        { text: "Continuar aqui", style: "cancel" },
      ]
    );
  }

  const harmonyExplanation = generatedPalette.explanation;

  return (
    <View style={[styles.container, highContrast && styles.highContrastContainer]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          style={styles.backButton}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.logo} accessibilityRole="header">
          SATURA
        </Text>

        <Text style={styles.stepBadge}>RESULTADO</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>SUA PALETA ESTÁ PRONTA</Text>
        <Text style={styles.title} accessibilityRole="header">
          Cores que combinam com você.
        </Text>

        <Text style={styles.subtitle}>{harmonyExplanation}</Text>

        {/* Faixa visual contínua das cores */}
        <View
          style={styles.swatchPreview}
          accessibilityLabel="Faixa contínua com todas as cores da paleta gerada"
        >
          {palette.map((color, index) => {
            const textColor = getBestContrastTextColor(color.hex);
            return (
              <TouchableOpacity
                key={`${color.hex}-${index}`}
                style={[styles.previewColor, { backgroundColor: color.hex }]}
                onPress={() => copyColor(color.hex)}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${color.name}, toque para copiar ${color.hex}`}
              >
                <Text style={[styles.previewHex, { color: textColor }]}>
                  {color.hex}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Cores detalhadas da sua paleta</Text>

        {/* Lista detalhada com swatch, nome, hex, rgb e botão de cópia */}
        <View style={styles.colorList}>
          {palette.map((color, index) => {
            const isCopied = copiedHex === color.hex;
            const contrastWithBackground = getContrastRatio(color.hex, Colors.background);
            return (
              <View
                key={`${color.hex}-${index}`}
                style={styles.colorRow}
                accessible={true}
                accessibilityLabel={`${color.name}. Hexadecimal ${color.hex}. RGB ${hexToRgb(color.hex)}`}
              >
                <View
                  style={[styles.colorSample, { backgroundColor: color.hex }]}
                />

                <View style={styles.colorInfo}>
                  <Text style={[styles.colorName, highContrast && { color: "#000000" }]}>{color.name}</Text>
                  <Text style={styles.colorCode}>
                    HEX {color.hex}
                  </Text>
                  {highContrast && (
                    <Text style={styles.contrastRatio}>
                      WCAG AA {contrastWithBackground.toFixed(1)}:1
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.copyButton, isCopied && styles.copyButtonActive]}
                  onPress={() => copyColor(color.hex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Copiar código ${color.hex}`}
                >
                  <Text
                    style={[styles.copyText, isCopied && styles.copyTextActive]}
                  >
                    {isCopied ? "✓ Copiado" : "Copiar"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Botão de Salvar Paleta */}
        <TouchableOpacity
          style={[styles.saveButton, saved && styles.savedButton]}
          onPress={() => setNameModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Paleta já salva, toque para renomear" : "Salvar paleta no dispositivo"}
        >
          <Text style={styles.saveButtonText}>
            {saved ? "✓ Paleta Salva no Aparelho" : "Salvar esta paleta"}
          </Text>
        </TouchableOpacity>

        {/* Ações secundárias */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => params.fromSaved === "true" ? router.push("/criar_paleta") : router.back()}
          accessibilityRole="button"
          accessibilityLabel="Ajustar preferências ou escolher outra foto"
        >
          <Text style={styles.editButtonText}>
            {source === "imagem" ? "← Escolher outra imagem" : "← Ajustar respostas"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/home")}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela inicial"
        >
          <Text style={styles.homeButtonText}>Ir para a tela inicial</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para nomear a paleta ao salvar */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dê um nome à sua paleta</Text>
            <Text style={styles.modalDescription}>
              Escolha um nome fácil de lembrar para identificar esta combinação nas suas paletas salvas.
            </Text>

            <TextInput
              autoFocus
              value={paletteName}
              onChangeText={setPaletteName}
              placeholder="Ex.: Identidade da Marca, Look de Verão..."
              placeholderTextColor="#8A8B84"
              style={styles.nameInput}
              maxLength={45}
              returnKeyType="done"
              onSubmitEditing={handleSavePalette}
              accessibilityLabel="Nome da paleta"
            />

            <TouchableOpacity
              style={[styles.saveButton, !paletteName.trim() && styles.disabledButton]}
              onPress={handleSavePalette}
              disabled={!paletteName.trim()}
              accessibilityRole="button"
              accessibilityLabel="Confirmar e salvar paleta"
            >
              <Text style={styles.saveButtonText}>Confirmar e Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setNameModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancelar salvamento"
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BarraNavegacao />
    </View>
  );
}

const serifText = { fontFamily: Fonts.serif } as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  highContrastContainer: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8D5C7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  back: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.primary,
    marginTop: -2,
    textAlign: "center",
  },
  logo: {
    ...serifText,
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: 4,
    color: Colors.primary,
  },
  stepBadge: {
    ...serifText,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 25,
    paddingTop: 35,
    paddingBottom: 45,
  },
  eyebrow: {
    ...serifText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.accentPink,
    marginBottom: 8,
  },
  title: {
    ...serifText,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    ...serifText,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  swatchPreview: {
    height: 120,
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  previewColor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
  },
  previewHex: {
    ...serifText,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...serifText,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 14,
  },
  colorList: {
    gap: 10,
    marginBottom: 22,
  },
  colorRow: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  colorSample: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  colorInfo: {
    flex: 1,
  },
  colorName: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  colorCode: {
    ...serifText,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  contrastRatio: {
    ...serifText,
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.success,
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#F2F0E6",
    minHeight: 40,
    justifyContent: "center",
  },
  copyButtonActive: {
    backgroundColor: "#E2F4EC",
  },
  copyText: {
    ...serifText,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  copyTextActive: {
    color: Colors.success,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  savedButton: {
    backgroundColor: Colors.success,
  },
  disabledButton: {
    backgroundColor: "#B8B9B0",
  },
  saveButtonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  editButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 6,
    minHeight: 44,
    justifyContent: "center",
  },
  editButtonText: {
    ...serifText,
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  homeButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  homeButtonText: {
    ...serifText,
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(22, 100, 95, 0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 24,
  },
  modalTitle: {
    ...serifText,
    fontSize: 21,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
  },
  modalDescription: {
    ...serifText,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  nameInput: {
    ...serifText,
    backgroundColor: "#F5F4EC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 16,
    minHeight: 48,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  cancelButtonText: {
    ...serifText,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
