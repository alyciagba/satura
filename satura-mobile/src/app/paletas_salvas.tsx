import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image } from "lucide-react-native";
import {
  ActivityIndicator,
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
  type SavedPalette,
} from "@/constants/palettes";
import { BarraNavegacao } from "@/components/BarraNavegacao";
import { Colors, Fonts } from "@/constants/theme";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { getSavedPalettes, removeSavedPalette } from "@/services/palettes";
import { getPaletteResultParams } from "@/utils/paletteNavigation";

export default function PaletasSalvasScreen() {
  const router = useRouter();
  const { highContrast } = useAppSettings();
  const [palettes, setPalettes] = useState<SavedPalette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paletteToDelete, setPaletteToDelete] = useState<SavedPalette | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const isFocusedRef = useRef(false);
  const loadVersionRef = useRef(0);

  const loadPalettes = useCallback(async () => {
    const loadVersion = ++loadVersionRef.current;
    setIsLoading(true);
    setLoadError(null);
    setPalettes([]);

    try {
      const result = await getSavedPalettes();
      if (!isFocusedRef.current || loadVersion !== loadVersionRef.current) return;

      if (result.error || !result.data) {
        setLoadError("Não foi possível carregar suas paletas. Verifique sua conexão e tente novamente.");
        return;
      }

      setPalettes(result.data);
    } catch {
      if (isFocusedRef.current && loadVersion === loadVersionRef.current) {
        setLoadError("Não foi possível carregar suas paletas. Verifique sua conexão e tente novamente.");
      }
    } finally {
      if (isFocusedRef.current && loadVersion === loadVersionRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      setPalettes([]);
      void loadPalettes();

      return () => {
        isFocusedRef.current = false;
        loadVersionRef.current += 1;
      };
    }, [loadPalettes])
  );

  async function handleDeletePalette(id: string) {
    if (isDeletingRef.current) return;

    isDeletingRef.current = true;
    setIsDeleting(true);

    try {
      const result = await removeSavedPalette(id);
      if (result.error || result.data === null) {
        Alert.alert(
          "Não foi possível excluir a paleta",
          result.error?.message ?? "Tente novamente mais tarde."
        );
        return;
      }

      setPalettes((current) => current.filter((palette) => palette.id !== id));
      setPaletteToDelete(null);
      Alert.alert("Paleta excluída", "A paleta foi removida das suas paletas salvas.");
    } catch {
      Alert.alert(
        "Não foi possível excluir a paleta",
        "Tente novamente mais tarde."
      );
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  }

  async function copyColor(hex: string) {
    await Clipboard.setStringAsync(hex);
    Alert.alert("Código copiado! ✨", `Hexadecimal ${hex} copiado com sucesso.`);
  }

  const filteredPalettes = palettes.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.purpose.toLowerCase().includes(query) ||
      p.mood.toLowerCase().includes(query)
    );
  });

  return (
    <View style={[styles.container, highContrast && styles.highContrastContainer]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela inicial"
          style={styles.backButton}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.logo} accessibilityRole="header">
          SATURA
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/criar_paleta")}
          accessibilityRole="button"
          accessibilityLabel="Criar nova paleta"
          style={styles.newButton}
        >
          <Text style={styles.newButtonText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>SUAS PALETAS</Text>
        <Text style={styles.title} accessibilityRole="header">
          Minhas paletas
        </Text>
        <Text style={styles.subtitle}>
          Paletas salvas na sua conta, organizadas para seus projetos.
        </Text>

        {/* Campo de busca se houver paletas */}
        {palettes.length > 0 && (
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, objetivo ou clima..."
            placeholderTextColor="#8A8B84"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Buscar nas paletas salvas"
          />
        )}

        {/* Estado vazio */}
        {isLoading ? (
          <View style={styles.statusState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.statusText}>Carregando suas paletas...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.statusState}>
            <Text style={styles.errorTitle}>Não foi possível carregar as paletas</Text>
            <Text style={styles.statusText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => void loadPalettes()}
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar as paletas novamente"
            >
              <Text style={styles.createButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPalettes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptySwatches} accessible={false}>
              <View style={[styles.emptySwatch, { backgroundColor: Colors.primary }]} />
              <View style={[styles.emptySwatch, { backgroundColor: Colors.accentOrange }]} />
              <View style={[styles.emptySwatch, { backgroundColor: Colors.accentPink }]} />
              <View style={[styles.emptySwatch, { backgroundColor: Colors.accentPurple }]} />
            </View>

            <Text style={styles.emptyTitle}>
              {searchQuery ? "Nenhuma paleta encontrada" : "Sua coleção ainda está vazia"}
            </Text>

            <Text style={styles.emptyText}>
              {searchQuery
                ? `Nenhum resultado para "${searchQuery}". Tente outro termo.`
                : "Crie uma paleta personalizada ou extraia cores de uma foto para começar sua coleção."}
            </Text>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/criar_paleta")}
              accessibilityRole="button"
              accessibilityLabel="Criar nova paleta agora"
            >
              <Text style={styles.createButtonText}>Criar nova paleta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPalettes.map((palette) => {
            const isExpanded = expandedId === palette.id;
            return (
              <View key={palette.id} style={styles.paletteCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleArea}>
                    <Text style={styles.paletteName}>{palette.name}</Text>
                    <View style={styles.paletteSourceRow}>
                      {palette.source === "imagem" && (
                        <Image size={16} strokeWidth={2.2} color={Colors.textMuted} />
                      )}
                      <Text style={styles.paletteDate}>
                        {palette.source === "imagem" ? "Fotografia" : palette.purpose} •{" "}
                        {new Date(palette.savedAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setPaletteToDelete(palette)}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir paleta ${palette.name}`}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>Excluir</Text>
                  </TouchableOpacity>
                </View>

                {/* Faixa de cores */}
                <TouchableOpacity
                  style={styles.paletteColors}
                  onPress={() => router.push({ pathname: "/resultado_paleta", params: getPaletteResultParams(palette) })}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir a paleta ${palette.name}. Cores: ${palette.colors.map((c: { hex: string }) => c.hex).join(", ")}`}
                >
                  {palette.colors.map((color: { hex: string }, idx: number) => (
                    <View
                      key={`${color.hex}-${idx}`}
                      style={[styles.paletteColor, { backgroundColor: color.hex }]}
                    />
                  ))}
                </TouchableOpacity>

                {/* Tags de características */}
                <View style={styles.tagRow}>
                  <Text style={styles.tag}>{palette.purpose}</Text>
                  <Text style={styles.tag}>{palette.mood}</Text>
                  <Text style={styles.tag}>{palette.tone}</Text>
                </View>

                {/* Botão de expansão dos detalhes */}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setExpandedId(isExpanded ? null : palette.id)}
                  accessibilityRole="button"
                  accessibilityLabel={isExpanded ? "Ocultar detalhes das cores" : "Ver detalhes de cada cor"}
                >
                  <Text style={styles.detailsText}>
                    {isExpanded ? "▲ Ocultar detalhes" : "▼ Ver detalhes e códigos"}
                  </Text>
                </TouchableOpacity>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <View style={styles.detailsList}>
                    {palette.colors.map((color: { hex: string; name: string }, idx: number) => (
                      <View key={`${color.hex}-${idx}`} style={styles.detailRow}>
                        <View
                          style={[styles.detailSwatch, { backgroundColor: color.hex }]}
                        />
                        <View style={styles.detailInfo}>
                          <Text style={[styles.detailName, highContrast && { color: "#000000" }]}>{color.name}</Text>
                          <Text style={styles.detailCode}>
                            {color.hex}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.copySmallButton}
                          onPress={() => copyColor(color.hex)}
                          accessibilityRole="button"
                          accessibilityLabel={`Copiar código ${color.hex}`}
                        >
                          <Text style={styles.copyText}>Copiar</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={!!paletteToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setPaletteToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalIcon}>🗑️</Text>
              <Text style={styles.modalTitle}>Excluir paleta?</Text>
              <Text style={styles.modalDescription}>
                Deseja realmente remover "{paletteToDelete?.name}" das suas paletas salvas da sua conta?
              </Text>

              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={() => paletteToDelete && handleDeletePalette(paletteToDelete.id)}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel="Confirmar exclusão da paleta"
                accessibilityState={{ busy: isDeleting }}
              >
                <Text style={styles.modalDeleteButtonText}>Sim, excluir paleta</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setPaletteToDelete(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar exclusão"
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
  header: {
    paddingTop: 55,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 8,
  },
  backButton: {
    minWidth: 42,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
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
    flexShrink: 1,
  },
  newButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  newButtonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
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
    color: Colors.accentPinkDark,
    marginBottom: 8,
  },
  title: {
    ...serifText,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    ...serifText,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  searchInput: {
    ...serifText,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  statusState: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    ...serifText,
    fontSize: 14,
    lineHeight: 21,
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
  emptySwatches: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  emptySwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  emptyTitle: {
    ...serifText,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    ...serifText,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 22,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 26,
    minHeight: 48,
    justifyContent: "center",
  },
  createButtonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  paletteCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitleArea: {
    flex: 1,
    minWidth: 0,
  },
  paletteName: {
    ...serifText,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 3,
  },
  paletteDate: {
    ...serifText,
    fontSize: 12,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  paletteSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 4,
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
    height: 68,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  paletteColor: {
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    ...serifText,
    backgroundColor: "#F2F0E6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  detailsButton: {
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  detailsText: {
    ...serifText,
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  detailsList: {
    borderTopWidth: 1,
    borderTopColor: "#EEECDE",
    paddingTop: 12,
    marginTop: 6,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  detailSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  detailInfo: {
    flex: 1,
    minWidth: 0,
  },
  detailName: {
    ...serifText,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  detailCode: {
    ...serifText,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  copySmallButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F2F0E6",
  },
  copyText: {
    ...serifText,
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(22, 100, 95, 0.55)",
    justifyContent: "center",
    padding: 24,
  },
  modalScrollView: {
    maxHeight: "100%",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "100%",
  },
  modalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modalTitle: {
    ...serifText,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    ...serifText,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  modalDeleteButton: {
    width: "100%",
    backgroundColor: Colors.error,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  modalDeleteButtonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalCancelButton: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelButtonText: {
    ...serifText,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
