import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image, Pipette } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { SavedPalette } from "@/constants/palettes";
import { Colors, Fonts } from "@/constants/theme";
import { BarraNavegacao } from "@/components/BarraNavegacao";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { getCurrentSession } from "@/services/auth";
import { getSavedPalettes, removeSavedPalette } from "@/services/palettes";
import { getCurrentProfile } from "@/services/profile";
import { getPaletteResultParams } from "@/utils/paletteNavigation";

export default function HomeScreen() {
  const router = useRouter();
  const { highContrast } = useAppSettings();
  const [userName, setUserName] = useState<string | null>(null);
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [isPalettesLoading, setIsPalettesLoading] = useState(true);
  const [palettesError, setPalettesError] = useState<string | null>(null);
  const isFocusedRef = useRef(false);
  const isDeletingRef = useRef(false);
  const paletteLoadVersionRef = useRef(0);

  const loadPalettes = useCallback(async () => {
    const loadVersion = ++paletteLoadVersionRef.current;
    setIsPalettesLoading(true);
    setPalettesError(null);
    setPalettes([]);

    try {
      const result = await getSavedPalettes();
      if (!isFocusedRef.current || loadVersion !== paletteLoadVersionRef.current) return;

      if (result.error || !result.data) {
        setPalettesError("Não foi possível carregar suas paletas. Verifique sua conexão e tente novamente.");
        return;
      }

      setPalettes(result.data);
    } catch {
      if (isFocusedRef.current && loadVersion === paletteLoadVersionRef.current) {
        setPalettesError("Não foi possível carregar suas paletas. Verifique sua conexão e tente novamente.");
      }
    } finally {
      if (isFocusedRef.current && loadVersion === paletteLoadVersionRef.current) {
        setIsPalettesLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      isFocusedRef.current = true;
      setUserName(null);
      void loadPalettes();

      async function loadHomeData() {
        try {
          const sessionResult = await getCurrentSession();
          if (!isActive) return;

          if (sessionResult.error) {
            Alert.alert("Não foi possível verificar a sessão", sessionResult.error.message);
            return;
          }

          if (!sessionResult.data) {
            router.replace("/");
            return;
          }

          const profileResult = await getCurrentProfile();
          if (!isActive) return;

          if (profileResult.error) {
            Alert.alert("Não foi possível carregar o perfil", profileResult.error.message);
          } else {
            const name = profileResult.data?.name.trim();
            if (name) {
              setUserName(name);
            } else {
              Alert.alert(
                "Perfil indisponível",
                "Sua sessão está ativa, mas o perfil não foi encontrado."
              );
            }
          }

        } catch {
          if (isActive) {
            Alert.alert("Não foi possível carregar a Home", "Tente novamente mais tarde.");
          }
        }
      }

      void loadHomeData();

      return () => {
        isActive = false;
        isFocusedRef.current = false;
        paletteLoadVersionRef.current += 1;
      };
    }, [loadPalettes, router])
  );

  function confirmDelete(palette: SavedPalette) {
    Alert.alert(
      "Excluir paleta?",
      `"${palette.name}" será removida das suas paletas salvas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void handleDeletePalette(palette.id);
          },
        },
      ]
    );
  }

  async function handleDeletePalette(id: string) {
    if (isDeletingRef.current) return;

    isDeletingRef.current = true;
    const operationVersion = ++paletteLoadVersionRef.current;

    try {
      const result = await removeSavedPalette(id);
      if (
        !isFocusedRef.current ||
        operationVersion !== paletteLoadVersionRef.current
      ) {
        return;
      }

      if (result.error || result.data === null) {
        Alert.alert(
          "Não foi possível excluir a paleta",
          result.error?.message ?? "Tente novamente mais tarde."
        );
        return;
      }

      setPalettes((current) => current.filter((palette) => palette.id !== id));
    } catch {
      if (isFocusedRef.current) {
        Alert.alert("Não foi possível excluir a paleta", "Tente novamente mais tarde.");
      }
    } finally {
      isDeletingRef.current = false;
    }
  }

  const initialLetter = userName?.trim().charAt(0).toUpperCase() || "S";

  return (
    <View style={{ flex: 1, backgroundColor: highContrast ? "#FFFFFF" : Colors.background }}>
      <ScrollView
        style={[styles.container, highContrast && styles.highContrastContainer]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.logo} accessibilityRole="header">
            SATURA
          </Text>
          <Text style={styles.greeting}>
            Olá{userName ? `, ${userName}` : ""}! ✨
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/perfil")}
          accessibilityRole="button"
          accessibilityLabel={`Abrir perfil${userName ? ` de ${userName}` : ""}`}
        >
          <Text style={styles.profileText}>{initialLetter}</Text>
        </TouchableOpacity>
      </View>

      {/* Destaque principal — Criar Paleta por Preferências */}
      <View style={styles.hero}>
        <View style={styles.colorCircles} accessible={false}>
          <View style={[styles.circle, styles.green]} />
          <View style={[styles.circle, styles.purple]} />
          <View style={[styles.circle, styles.orange]} />
          <View style={[styles.circle, styles.pink]} />
        </View>

        <Text style={styles.heroTitle}>Que cores combinam{"\n"}com você?</Text>
        <Text style={styles.heroText}>
          Crie uma paleta personalizada de acordo com seu estilo, objetivo e a
          sensação que deseja transmitir.
        </Text>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/criar_paleta?mode=preferences")}
          accessibilityRole="button"
          accessibilityLabel="Criar nova paleta personalizada por questionário"
        >
          <Text style={styles.plus}>+</Text>
          <Text style={styles.createButtonText}>Criar por preferências</Text>
        </TouchableOpacity>
      </View>

      {/* Cartão de Ação Secundária — Criar a partir de Imagem */}
      <TouchableOpacity
        style={styles.imageCard}
        onPress={() => router.push("/criar_paleta?mode=image")}
        accessibilityRole="button"
        accessibilityLabel="Extrair paleta a partir de uma foto ou imagem da galeria"
      >
        <View style={styles.imageCardIcon}>
          <Pipette size={22} strokeWidth={2.2} color={Colors.primary} />
        </View>
        <View style={styles.imageCardContent}>
          <Text style={styles.imageCardTitle}>Extrair cores de imagem</Text>
          <Text style={styles.imageCardSubtitle}>
            Fotografe ou escolha uma imagem da sua galeria para gerar uma paleta local real.
          </Text>
        </View>
        <View style={styles.imageCardArrowContainer}>
          <Text style={styles.imageCardArrow}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Seção de Paletas Salvas */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Suas paletas
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/paletas_salvas")}
          accessibilityRole="button"
          accessibilityLabel="Ver todas as paletas salvas"
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAll}>
            {palettes.length > 0 ? `Ver todas (${palettes.length})` : "Ver todas"}
          </Text>
        </TouchableOpacity>
      </View>

      {palettes.length === 0 ? (
        isPalettesLoading ? (
          <View style={styles.statusCard}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.statusText}>Carregando suas paletas...</Text>
          </View>
        ) : palettesError ? (
          <View style={styles.statusCard}>
            <Text style={styles.errorTitle}>Não foi possível carregar as paletas</Text>
            <Text style={styles.statusText}>{palettesError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadPalettes()}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar as paletas novamente"
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma paleta salva ainda</Text>
            <Text style={styles.emptyText}>
              Toque nos botões acima para criar sua primeira combinação harmônica!
            </Text>
          </View>
        )
      ) : (
        palettes.slice(0, 3).map((palette) => (
          <View key={palette.id} style={styles.paletteCard}>
            <View style={styles.paletteCardHeader}>
              <View style={styles.paletteCardTitle}>
                <Text style={styles.paletteName}>{palette.name}</Text>
                <View style={styles.paletteDescriptionRow}>
                  {palette.source === "imagem" && (
                    <Image size={14} strokeWidth={2.2} color={Colors.textMuted} />
                  )}
                  <Text style={styles.paletteDescription}>
                    {palette.source === "imagem" ? "Extraída de imagem" : palette.mood} • Salva em{" "}
                    {new Date(palette.savedAt).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => confirmDelete(palette)}
                accessibilityRole="button"
                accessibilityLabel={`Excluir paleta ${palette.name}`}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>Excluir</Text>
              </TouchableOpacity>
            </View>

            {/* Faixa visual contínua das cores */}
            <TouchableOpacity
              style={styles.paletteColors}
              onPress={() => router.push({ pathname: "/resultado_paleta", params: getPaletteResultParams(palette) })}
              accessibilityRole="button"
              accessibilityLabel={`Abrir a paleta ${palette.name}. Cores: ${palette.colors.map((c: { name: string; hex: string }) => c.name).join(", ")}`}
            >
              {palette.colors.map((color: { name: string; hex: string }, index: number) => (
                <View
                  key={`${color.hex}-${index}`}
                  style={[styles.paletteColor, { backgroundColor: color.hex }]}
                />
              ))}
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
    <BarraNavegacao savedCount={palettes.length} />
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
  content: {
    paddingHorizontal: 25,
    paddingTop: 55,
    paddingBottom: 45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 8,
    marginBottom: 30,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  logo: {
    ...serifText,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 4,
    color: Colors.primary,
    flexShrink: 1,
  },
  greeting: {
    ...serifText,
    marginTop: 6,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  profileButton: {
    minWidth: 46,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileText: {
    ...serifText,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    flexShrink: 1,
  },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: 26,
    padding: 26,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  colorCircles: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 20,
  },
  circle: {
    width: 15,
    height: 15,
    borderRadius: 10,
  },
  green: { backgroundColor: Colors.primary },
  purple: { backgroundColor: Colors.accentPurple },
  orange: { backgroundColor: Colors.accentOrange },
  pink: { backgroundColor: Colors.accentPink },
  heroTitle: {
    ...serifText,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 12,
  },
  heroText: {
    ...serifText,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 22,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  plus: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 22,
    marginRight: 8,
    marginTop: -2,
  },
  createButtonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "center",
  },
  imageCard: {
    backgroundColor: "#F9F8F2",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#DCD8C8",
  },
  imageCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  imageCardContent: {
    flex: 1,
    minWidth: 0,
  },
  imageCardTitle: {
    ...serifText,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 3,
  },
  imageCardSubtitle: {
    ...serifText,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  imageCardArrowContainer: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: "rgba(22, 100, 95, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  imageCardArrow: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.primary,
    marginTop: -2,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 4,
    marginBottom: 15,
  },
  sectionTitle: {
    ...serifText,
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  seeAllButton: {
    minHeight: 44,
    justifyContent: "center",
    flexShrink: 1,
  },
  seeAll: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    ...serifText,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  errorTitle: {
    ...serifText,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.error,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  retryButtonText: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyTitle: {
    ...serifText,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    ...serifText,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  paletteCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  paletteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deleteButton: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  deleteText: {
    ...serifText,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.error,
  },
  paletteColors: {
    flexDirection: "row",
    height: 64,
    borderRadius: 14,
    overflow: "hidden",
  },
  paletteColor: {
    flex: 1,
  },
  paletteName: {
    ...serifText,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    flexShrink: 1,
  },
  paletteCardTitle: {
    flex: 1,
    minWidth: 0,
  },
  paletteDescription: {
    ...serifText,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
    flexShrink: 1,
  },
  paletteDescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
