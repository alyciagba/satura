import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarraNavegacao } from "@/components/BarraNavegacao";
import { Colors, Fonts } from "@/constants/theme";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { extractPaletteFromImage } from "@/utils/colorExtractor";
import { getClosestColorName } from "@/utils/colors";

type PaletteOption = {
  title: string;
  description: string;
  icon: string;
};

const purposes: PaletteOption[] = [
  {
    title: "Projeto de design",
    description: "Para trabalhos, interfaces digitais e apresentações.",
    icon: "✦",
  },
  {
    title: "Meu estilo pessoal",
    description: "Roupas, maquiagem, acessórios e guarda-roupa cápsula.",
    icon: "♡",
  },
  {
    title: "Arte e ilustração",
    description: "Para pinturas, aquarelas e ilustrações visuais.",
    icon: "✎",
  },
  {
    title: "Decoração",
    description: "Para ambientes, arquitetura de interiores e espaços.",
    icon: "⌂",
  },
  {
    title: "Outro",
    description: "Quero usar as cores para outra finalidade criativa.",
    icon: "✧",
  },
];

const moods: PaletteOption[] = [
  {
    title: "Calma e serenidade",
    description: "Paz, relaxamento, equilíbrio e conexão orgânica.",
    icon: "☼",
  },
  {
    title: "Energia e criatividade",
    description: "Vibração, entusiasmo, dinamismo e alto impacto visual.",
    icon: "✦",
  },
  {
    title: "Elegância e sofisticação",
    description: "Refinamento, sobriedade, atemporalidade e nobreza.",
    icon: "◇",
  },
  {
    title: "Acolhimento e afeto",
    description: "Calor humano, ternura, aconchego e proximidade.",
    icon: "☕",
  },
];

const temperatures: PaletteOption[] = [
  {
    title: "Tons Quentes",
    description: "Amarelos solares, terracotas, corais e dourados.",
    icon: "♨",
  },
  {
    title: "Tons Frios",
    description: "Azuis profundos, verdes floresta e turquesas.",
    icon: "❄",
  },
  {
    title: "Equilíbrio Misto",
    description: "Contraste equilibrando tons quentes e frios.",
    icon: "☯",
  },
];

const tones: PaletteOption[] = [
  {
    title: "Tons claros e arejados",
    description: "Luminosos, abertos, leves e com muito respiro visual.",
    icon: "☼",
  },
  {
    title: "Tons escuros e profundos",
    description: "Intensos, densos, misteriosos e envolventes.",
    icon: "◐",
  },
  {
    title: "Alto contraste claro-escuro",
    description: "Mescla dramática entre tons muito claros e muito escuros.",
    icon: "◑",
  },
];

const saturations: PaletteOption[] = [
  {
    title: "Vivas e puras",
    description: "Pigmentos marcantes com alta saturação e presença forte.",
    icon: "⚡",
  },
  {
    title: "Suaves e aveludadas",
    description: "Cores pastéis atenuadas, delicadas, poéticas e serenas.",
    icon: "☁",
  },
  {
    title: "Terrosas e minerais",
    description: "Pigmentos orgânicos inspirados em argila, folhas e pedras.",
    icon: "☘",
  },
];

const neutralsList: PaletteOption[] = [
  {
    title: "Neutros quentes e orgânicos",
    description: "Linho suave, bege creme, areia e marfim acolhedor.",
    icon: "🌾",
  },
  {
    title: "Neutros frios e minerais",
    description: "Cinza ardósia, grafite sofisticado, carvão e gelo.",
    icon: "⛰",
  },
  {
    title: "Neutros ricos e amadeirados",
    description: "Carvalho suave, café expresso e madeira nobre.",
    icon: "🪵",
  },
];

const harmonies: PaletteOption[] = [
  {
    title: "Harmonia Análoga",
    description: "Cores vizinhas no círculo cromático, gerando fluidez serena.",
    icon: "〰",
  },
  {
    title: "Harmonia Complementar",
    description: "Cores opostas no círculo com contraste dinâmico marcante.",
    icon: "⮀",
  },
  {
    title: "Harmonia Monocromática com Destaque",
    description: "Variações elegantes de um tom com uma cor de surpresa.",
    icon: "🎯",
  },
];

const counts: PaletteOption[] = [
  {
    title: "5 cores (Harmonia Clássica)",
    description: "Principal, complementar, apoio, neutro e destaque.",
    icon: "5",
  },
  {
    title: "3 cores (Minimalista)",
    description: "Principal, base e contraste direto.",
    icon: "3",
  },
  {
    title: "6 cores (Expandida)",
    description: "Mais versatilidade para projetos completos.",
    icon: "6",
  },
];

// Imagens de teste locais com cores extraíveis reais
const DEMO_IMAGE_PRESETS = [
  {
    id: "sunset",
    title: "Pôr do Sol Dourado",
    uri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    colors: ["#E27D60", "#E8A87C", "#C38D9E", "#41B3A3", "#F8E9A1"],
  },
  {
    id: "nature",
    title: "Floresta Tropical",
    uri: "https://images.unsplash.com/photo-1511497584788-87676104235f?w=600&q=80",
    colors: ["#16645F", "#2A9D8F", "#E9C46A", "#F4A261", "#264653"],
  },
  {
    id: "architecture",
    title: "Arquitetura Urbana",
    uri: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    colors: ["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429"],
  },
  {
    id: "floral",
    title: "Jardim Floral",
    uri: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&q=80",
    colors: ["#FF6B9A", "#FFB35C", "#72D6B0", "#7B61FF", "#FDF0D5"],
  },
];

export default function CriarPaletaScreen() {
  const router = useRouter();
  const { highContrast } = useAppSettings();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialTab = params.mode === "image" ? "imagem" : "preferencias";

  const [activeTab, setActiveTab] = useState<"preferencias" | "imagem">(initialTab);

  // Estados do Questionário de 8 Etapas
  const [step, setStep] = useState(1);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>("Projeto de design");
  const [selectedMood, setSelectedMood] = useState<string | null>("Calma e serenidade");
  const [selectedTemperature, setSelectedTemperature] = useState<string | null>("Equilíbrio Misto");
  const [selectedTone, setSelectedTone] = useState<string | null>("Tons claros e arejados");
  const [selectedSaturation, setSelectedSaturation] = useState<string | null>("Vivas e puras");
  const [selectedNeutrals, setSelectedNeutrals] = useState<string | null>("Neutros quentes e orgânicos");
  const [selectedHarmony, setSelectedHarmony] = useState<string | null>("Harmonia Complementar");
  const [selectedCount, setSelectedCount] = useState<string>("5 cores (Harmonia Clássica)");

  // Estados da Imagem (Opção B)
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(DEMO_IMAGE_PRESETS[0].uri);
  const [extractedColors, setExtractedColors] = useState<string[]>(DEMO_IMAGE_PRESETS[0].colors);
  const [isExtracting, setIsExtracting] = useState(false);

  // Questionário helpers
  const options =
    step === 1
      ? purposes
      : step === 2
      ? moods
      : step === 3
      ? temperatures
      : step === 4
      ? tones
      : step === 5
      ? saturations
      : step === 6
      ? neutralsList
      : step === 7
      ? harmonies
      : counts;

  const currentSelected =
    step === 1
      ? selectedPurpose
      : step === 2
      ? selectedMood
      : step === 3
      ? selectedTemperature
      : step === 4
      ? selectedTone
      : step === 5
      ? selectedSaturation
      : step === 6
      ? selectedNeutrals
      : step === 7
      ? selectedHarmony
      : selectedCount;

  function selectOption(title: string) {
    if (step === 1) setSelectedPurpose(title);
    else if (step === 2) setSelectedMood(title);
    else if (step === 3) setSelectedTemperature(title);
    else if (step === 4) setSelectedTone(title);
    else if (step === 5) setSelectedSaturation(title);
    else if (step === 6) setSelectedNeutrals(title);
    else if (step === 7) setSelectedHarmony(title);
    else setSelectedCount(title);
  }

  function handleContinuePreferences() {
    if (!currentSelected) return;

    if (step === 8) {
      router.push({
        pathname: "/resultado_paleta",
        params: {
          purpose: selectedPurpose ?? "Projeto de design",
          mood: selectedMood ?? "Calma e serenidade",
          temperature: selectedTemperature ?? "Equilíbrio Misto",
          tone: selectedTone ?? "Tons claros e arejados",
          saturation: selectedSaturation ?? "Vivas e puras",
          neutrals: selectedNeutrals ?? "Neutros quentes e orgânicos",
          harmony: selectedHarmony ?? "Harmonia Complementar",
          count: selectedCount.startsWith("3") ? "3" : selectedCount.startsWith("6") ? "6" : "5",
          source: "questionario",
        },
      });
      return;
    }

    setStep((prev) => prev + 1);
  }

  function handleBack() {
    if (step > 1) {
      setStep((prev) => prev - 1);
      return;
    }
    router.replace("/home");
  }

  // Extração de imagem com câmera ou galeria
  async function pickImageFromGallery() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permissão necessária",
          "O Satura precisa de acesso à sua galeria de fotos para analisar as cores."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        processSelectedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a imagem da galeria.");
    }
  }

  async function takePhotoWithCamera() {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permissão necessária",
          "O Satura precisa de acesso à câmera para fotografar e extrair cores."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        processSelectedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível abrir a câmera neste dispositivo.");
    }
  }

  async function processSelectedImage(uri: string) {
    setIsExtracting(true);
    setSelectedImageUri(uri);

    try {
      const generatedPalette = await extractPaletteFromImage(uri);
      setExtractedColors(generatedPalette);
    } finally {
      setIsExtracting(false);
    }
  }

  function handleSelectPreset(preset: typeof DEMO_IMAGE_PRESETS[0]) {
    setSelectedImageUri(preset.uri);
    setExtractedColors(preset.colors);
  }

  function handleUseExtractedPalette() {
    router.push({
      pathname: "/resultado_paleta",
      params: {
        purpose: "Extraída de imagem",
        mood: "Harmonia cromática natural",
        tone: "Cores da fotografia",
        source: "imagem",
        customColors: JSON.stringify(extractedColors),
      },
    });
  }

  return (
    <View style={[styles.container, highContrast && styles.highContrastContainer]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={step === 1 ? "Voltar ao início" : "Pergunta anterior"}
          style={styles.backButton}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.logo} accessibilityRole="header">
          SATURA
        </Text>

        <Text style={styles.stepIndicator}>
          {activeTab === "preferencias" ? `${step}/8` : "IMAGEM"}
        </Text>
      </View>

      {/* Seletor de Modo (Abas) */}
      <View style={styles.tabContainer} accessibilityRole="tablist">
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "preferencias" && styles.activeTabButton]}
          onPress={() => setActiveTab("preferencias")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "preferencias" }}
        >
          <Text
            style={[styles.tabText, activeTab === "preferencias" && styles.activeTabText]}
          >
            ✦ Por Preferências
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "imagem" && styles.activeTabButton]}
          onPress={() => setActiveTab("imagem")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "imagem" }}
        >
          <Text style={[styles.tabText, activeTab === "imagem" && styles.activeTabText]}>
            📸 A partir de Imagem
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo: Aba 1 - Questionário de Preferências */}
      {activeTab === "preferencias" ? (
        <>
          {/* Barra de progresso */}
          <View style={styles.progressBackground} accessible={false}>
            <View
              style={[
                styles.progress,
                {
                  width: `${(step / 8) * 100}%`,
                },
              ]}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <Text style={styles.questionNumber}>
              {step === 1
                ? "ETAPA 1 DE 8 — PROPÓSITO"
                : step === 2
                ? "ETAPA 2 DE 8 — SENSAÇÃO"
                : step === 3
                ? "ETAPA 3 DE 8 — TEMPERATURA"
                : step === 4
                ? "ETAPA 4 DE 8 — LUMINOSIDADE"
                : step === 5
                ? "ETAPA 5 DE 8 — SATURAÇÃO"
                : step === 6
                ? "ETAPA 6 DE 8 — BASE DE NEUTROS"
                : step === 7
                ? "ETAPA 7 DE 8 — HARMONIA"
                : "ETAPA 8 DE 8 — EXTENSÃO"}
            </Text>

            <Text style={styles.title} accessibilityRole="header">
              {step === 1
                ? "Para qual objetivo você busca cores?"
                : step === 2
                ? "Qual atmosfera deseja transmitir?"
                : step === 3
                ? "Qual temperatura cromática você prefere?"
                : step === 4
                ? "Qual intensidade de luz você imagina?"
                : step === 5
                ? "Como deve ser a vivacidade das cores?"
                : step === 6
                ? "Que tipo de neutros apoiarão a paleta?"
                : step === 7
                ? "Qual estrutura de harmonia visual você prefere?"
                : "Quantas cores você deseja na paleta final?"}
            </Text>

            <Text style={styles.subtitle}>
              {step === 1
                ? "A finalidade direciona a hierarquia e o papel prático de cada tom."
                : step === 2
                ? "A sensação influencia a expressão e o diálogo das matizes."
                : step === 3
                ? "A temperatura define o calor ou frescor predominante."
                : step === 4
                ? "A luminosidade determina a clareza e o respiro visual."
                : step === 5
                ? "A saturação define se as cores serão puras, pastéis ou minerais terrosas."
                : step === 6
                ? "Os neutros ancoram a harmonia e garantem conforto de leitura."
                : step === 7
                ? "A relação no círculo cromático define como as cores dialogam."
                : "Escolha o tamanho ideal para atender às necessidades do seu projeto."}
            </Text>

            {/* Lista de Opções */}
            {options.map((option) => {
              const isSelected = currentSelected === option.title;
              return (
                <TouchableOpacity
                  key={option.title}
                  style={[styles.option, isSelected && styles.selectedOption]}
                  onPress={() => selectOption(option.title)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${option.title}. ${option.description}`}
                >
                  <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                    <Text style={styles.icon}>{option.icon}</Text>
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.continueButton, !currentSelected && styles.disabledButton]}
              onPress={handleContinuePreferences}
              disabled={!currentSelected}
              accessibilityRole="button"
              accessibilityLabel={step === 8 ? "Gerar paleta personalizada" : "Continuar para próxima pergunta"}
            >
              <Text style={styles.continueButtonText}>
                {step === 8 ? "Gerar minha paleta ✨" : "Continuar"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      ) : (
        /* Conteúdo: Aba 2 - Extração de Imagem */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.questionNumber}>ANÁLISE DE IMAGEM LOCAL</Text>
          <Text style={styles.title} accessibilityRole="header">
            Crie paletas a partir do mundo real.
          </Text>
          <Text style={styles.subtitle}>
            Tire uma foto com a câmera do celular ou escolha uma imagem da galeria.
            O Satura processa as cores localmente no seu dispositivo.
          </Text>

          {/* Botões de Ação de Captura */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.mediaActionButton}
              onPress={takePhotoWithCamera}
              accessibilityRole="button"
              accessibilityLabel="Tirar foto com a câmera do celular"
            >
              <Text style={styles.mediaActionIcon}>📷</Text>
              <Text style={styles.mediaActionText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaActionButton}
              onPress={pickImageFromGallery}
              accessibilityRole="button"
              accessibilityLabel="Escolher imagem da galeria de fotos"
            >
              <Text style={styles.mediaActionIcon}>🖼️</Text>
              <Text style={styles.mediaActionText}>Abrir Galeria</Text>
            </TouchableOpacity>
          </View>

          {/* Presets rápidos para demonstração */}
          <Text style={styles.presetLabel}>Ou teste com fotos de exemplo:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetScroll}
          >
            {DEMO_IMAGE_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetChip,
                  selectedImageUri === preset.uri && styles.presetChipActive,
                ]}
                onPress={() => handleSelectPreset(preset)}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar exemplo ${preset.title}`}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    selectedImageUri === preset.uri && styles.presetChipTextActive,
                  ]}
                >
                  {preset.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pré-visualização da Imagem */}
          {selectedImageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
                accessibilityLabel="Pré-visualização da imagem para extração de cores"
              />
              {isExtracting && (
                <View style={styles.extractingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.extractingText}>Analisando pixels da imagem...</Text>
                </View>
              )}
            </View>
          )}

          {/* Cores Extraídas em Destaque */}
          <Text style={styles.extractedSectionTitle}>Cores extraídas da imagem:</Text>
          <View style={styles.extractedSwatches}>
            {extractedColors.map((hex, index) => (
              <View key={`${hex}-${index}`} style={styles.extractedSwatchItem}>
                <View style={[styles.extractedSwatchColor, { backgroundColor: hex }]} />
                <Text style={styles.extractedSwatchHex}>{hex}</Text>
                <Text style={styles.extractedSwatchName}>{getClosestColorName(hex)}</Text>
              </View>
            ))}
          </View>

          {/* Botão para levar para o resultado */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleUseExtractedPalette}
            accessibilityRole="button"
            accessibilityLabel="Usar estas cores e ir para a tela de resultado da paleta"
          >
            <Text style={styles.continueButtonText}>Usar esta paleta no Satura ✨</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  stepIndicator: {
    ...serifText,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2DFC8",
    marginHorizontal: 25,
    marginTop: 15,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
  },
  activeTabButton: {
    backgroundColor: Colors.card,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...serifText,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: "700",
  },
  progressBackground: {
    height: 5,
    backgroundColor: "#D9D7C9",
    marginHorizontal: 25,
    marginTop: 18,
    borderRadius: 10,
  },
  progress: {
    height: 5,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  content: {
    paddingHorizontal: 25,
    paddingTop: 28,
    paddingBottom: 45,
  },
  questionNumber: {
    ...serifText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.accentPink,
    marginBottom: 8,
  },
  title: {
    ...serifText,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    ...serifText,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  option: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: "#F7F6EE",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconCircleSelected: {
    backgroundColor: Colors.primary,
  },
  icon: {
    ...serifText,
    fontSize: 19,
    color: Colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...serifText,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  optionDescription: {
    ...serifText,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
    minHeight: 52,
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#B8B9B0",
  },
  continueButtonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  mediaActionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mediaActionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  mediaActionText: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  presetLabel: {
    ...serifText,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  presetScroll: {
    marginBottom: 22,
  },
  presetChip: {
    backgroundColor: "#E4E1D0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
  },
  presetChipText: {
    ...serifText,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  presetChipTextActive: {
    color: "#FFFFFF",
  },
  imagePreviewContainer: {
    width: "100%",
    height: 210,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 22,
    backgroundColor: "#E2DFC8",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  extractingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 100, 95, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  extractingText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  extractedSectionTitle: {
    ...serifText,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 12,
  },
  extractedSwatches: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  extractedSwatchItem: {
    flex: 1,
    alignItems: "center",
  },
  extractedSwatchColor: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  extractedSwatchHex: {
    ...serifText,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text,
  },
  extractedSwatchName: {
    ...serifText,
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
});
