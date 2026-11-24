import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarraNavegacao } from "@/components/BarraNavegacao";
import { Colors, Fonts } from "@/constants/theme";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  clearLocalSession,
  getCurrentSession,
  signOut,
} from "@/services/auth";
import { deleteCurrentAccount } from "@/services/account";
import { getSavedPalettes } from "@/services/palettes";
import { getCurrentProfile } from "@/services/profile";

export default function PerfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string | null; email: string | null } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [palettesCount, setPalettesCount] = useState<number | null>(null);
  const [isPalettesCountLoading, setIsPalettesCountLoading] = useState(true);
  const { highContrast, setHighContrast } = useAppSettings();
  const isLoggingOutRef = useRef(false);
  const isDeletingAccountRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setPalettesCount(null);
      setIsPalettesCountLoading(true);

      async function loadPalettesCount() {
        try {
          const result = await getSavedPalettes();
          if (!isActive) return;

          if (result.error || !result.data) {
            setPalettesCount(null);
            Alert.alert(
              "Não foi possível carregar as paletas",
              result.error?.message ?? "Tente novamente mais tarde."
            );
            return;
          }

          setPalettesCount(result.data.length);
        } catch {
          if (isActive) {
            setPalettesCount(null);
            Alert.alert("Não foi possível carregar as paletas", "Tente novamente mais tarde.");
          }
        } finally {
          if (isActive) {
            setIsPalettesCountLoading(false);
          }
        }
      }

      void loadPalettesCount();

      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const sessionResult = await getCurrentSession();
        if (!isMounted) return;

        if (sessionResult.error) {
          Alert.alert("Não foi possível verificar a sessão", sessionResult.error.message);
          return;
        }

        if (!sessionResult.data) {
          router.replace("/");
          return;
        }

        const sessionEmail = sessionResult.data.user.email ?? null;
        const profileResult = await getCurrentProfile();
        if (!isMounted) return;

        if (profileResult.error) {
          setUser({ name: null, email: sessionEmail });
          Alert.alert("Não foi possível carregar o perfil", profileResult.error.message);
          return;
        }

        const name = profileResult.data?.name.trim() || null;
        setUser({ name, email: sessionEmail });
      } catch {
        if (isMounted) {
          Alert.alert("Não foi possível carregar o perfil", "Tente novamente mais tarde.");
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleToggleContrast(val: boolean) {
    setHighContrast(val);
  }

  async function performLogout() {
    if (isLoggingOutRef.current || isDeletingAccountRef.current) return;

    isLoggingOutRef.current = true;
    setIsLoggingOut(true);

    try {
      const result = await signOut();
      if (result.error) {
        Alert.alert("Não foi possível encerrar a sessão", result.error.message);
        return;
      }

      router.replace("/");
    } catch {
      Alert.alert("Não foi possível encerrar a sessão", "Tente novamente mais tarde.");
    } finally {
      isLoggingOutRef.current = false;
      setIsLoggingOut(false);
    }
  }

  function handleLogout() {
    if (isLoggingOutRef.current || isDeletingAccountRef.current) return;

    Alert.alert(
      "Sair do aplicativo?",
      "Sua sessão será encerrada. Você poderá entrar novamente a qualquer momento com sua conta Satura.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            void performLogout();
          },
        },
      ]
    );
  }

  function openDeleteAccountConfirmation() {
    if (isLoggingOutRef.current || isDeletingAccountRef.current) return;
    setDeleteAccountPassword("");
    setDeleteAccountError(null);
    setIsDeleteAccountModalVisible(true);
  }

  function closeDeleteAccountConfirmation() {
    if (isDeletingAccountRef.current) return;
    setIsDeleteAccountModalVisible(false);
    setDeleteAccountPassword("");
    setDeleteAccountError(null);
  }

  async function performAccountDeletion() {
    if (isDeletingAccountRef.current || !deleteAccountPassword) return;

    isDeletingAccountRef.current = true;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);

    try {
      const sessionResult = await getCurrentSession();
      if (sessionResult.error || !sessionResult.data) {
        setDeleteAccountError("Sua sessão expirou. Entre novamente antes de excluir a conta.");
        return;
      }

      const currentUser = sessionResult.data.user;
      if (!currentUser.email) {
        setDeleteAccountError("Não foi possível verificar o e-mail da conta autenticada.");
        return;
      }

      const deletionResult = await deleteCurrentAccount(
        deleteAccountPassword,
        currentUser.id
      );
      if (deletionResult.error) {
        setDeleteAccountError(deletionResult.error.message);
        return;
      }

      setIsDeleteAccountModalVisible(false);
      setDeleteAccountError(null);
      const localSessionResult = await clearLocalSession();
      router.replace("/");

      if (localSessionResult.error) {
        Alert.alert(
          "Conta excluída",
          "A conta foi apagada, mas não foi possível confirmar a limpeza da sessão neste dispositivo."
        );
      }
    } catch {
      setDeleteAccountError(
        "Não foi possível excluir a conta. Verifique sua conexão e tente novamente."
      );
    } finally {
      isDeletingAccountRef.current = false;
      setIsDeletingAccount(false);
      setDeleteAccountPassword("");
    }
  }

  const initialLetter = user?.name?.trim().charAt(0).toUpperCase() || "S";

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

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>CONTA & PREFERÊNCIAS</Text>
        <Text style={styles.title} accessibilityRole="header">
          Meu Perfil
        </Text>

        {/* Card do Usuário */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{initialLetter}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.name ?? (isProfileLoading ? "Carregando perfil..." : "Perfil indisponível")}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email ?? (isProfileLoading ? "" : "E-mail indisponível")}
            </Text>
            <View style={styles.badgeLocal}>
              <Text style={styles.badgeLocalText}>
                {isProfileLoading ? "Carregando..." : user?.name ? "Conta autenticada" : "Perfil indisponível"}
              </Text>
            </View>
          </View>
        </View>

        {/* Estatísticas de Criação */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/paletas_salvas")}
            accessibilityRole="button"
            accessibilityLabel={
              palettesCount === null
                ? "Contagem de paletas salvas indisponível"
                : `Ver ${palettesCount} paletas salvas`
            }
          >
            <Text style={styles.statNumber}>
              {palettesCount ?? (isPalettesCountLoading ? "…" : "—")}
            </Text>
            <Text style={styles.statLabel}>Paletas salvas</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>Nuvem</Text>
            <Text style={styles.statLabel}>Paletas na sua conta</Text>
          </View>
        </View>

        {/* Seção de Preferências Funcionais */}
        <Text style={styles.sectionTitle}>Preferências de Acessibilidade</Text>

        <View style={styles.preferenceCard}>
          <View style={styles.preferenceRow}>
            <View style={styles.prefTextContainer}>
              <Text style={styles.prefTitle}>Alto contraste WCAG 2.2 AA</Text>
              <Text style={styles.prefSubtitle}>
                Garante proporção mínima de 4.5:1 em todos os textos sobre cores.
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={handleToggleContrast}
              trackColor={{ false: "#D9D7C9", true: Colors.primary }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Alternar modo de alto contraste"
            />
          </View>
        </View>

        {/* Demonstração visual em tempo real */}
        <View style={styles.demoPreviewBox}>
          <Text style={styles.demoPreviewTitle}>EFEITO EM TEMPO REAL:</Text>
          <View style={styles.demoPreviewRow}>
            <View style={[styles.demoSwatch, { backgroundColor: "#16645F" }]} />
            <View style={styles.demoInfo}>
              <Text style={[styles.demoSwatchName, highContrast && styles.textHighContrast]}>
                Verde Satura
              </Text>
              <Text style={styles.demoSwatchCode}>
                HEX #16645F
              </Text>
            </View>
            <View style={[styles.demoBadge, highContrast ? styles.badgeHighContrast : styles.badgeNormal]}>
              <Text style={highContrast ? styles.badgeTextHighContrast : styles.badgeTextNormal}>
                {highContrast ? "WCAG AAA ✓" : "Padrão"}
              </Text>
            </View>
          </View>
        </View>

        {/* Acesso rápido às paletas */}
        <TouchableOpacity
          style={styles.navigationLink}
          onPress={() => router.push("/paletas_salvas")}
          accessibilityRole="button"
          accessibilityLabel="Acessar todas as paletas salvas"
        >
          <View style={styles.linkLeft}>
            <Palette size={20} strokeWidth={2.2} color={Colors.primary} />
            <Text style={styles.linkTitle}>Acessar minhas paletas salvas</Text>
          </View>
          <View style={styles.linkArrowContainer}>
            <Text style={styles.linkArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Informações sobre o projeto acadêmico */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Sobre o Satura</Text>
          <Text style={styles.aboutText}>
            Projeto desenvolvido para a disciplina de Tecnologia Web para Negócios.
            Implementado com React Native, Expo e TypeScript, com autenticação pelo
            Supabase e paletas gerenciadas pela sua conta. As preferências de acessibilidade são mantidas neste dispositivo.
          </Text>
          <Text style={styles.aboutVersion}>Versão 1.0.0 — Expo Go Compatível</Text>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut || isDeletingAccount}
          accessibilityRole="button"
          accessibilityLabel="Encerrar sessão no aplicativo"
          accessibilityState={{
            busy: isLoggingOut || isDeletingAccount,
            disabled: isLoggingOut || isDeletingAccount,
          }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={Colors.error} />
          ) : (
            <Text style={styles.logoutText}>Encerrar Sessão</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={openDeleteAccountConfirmation}
          disabled={isLoggingOut || isDeletingAccount}
          accessibilityRole="button"
          accessibilityLabel="Excluir minha conta permanentemente"
          accessibilityState={{
            busy: isDeletingAccount,
            disabled: isLoggingOut || isDeletingAccount,
          }}
        >
          <Text style={styles.deleteAccountButtonText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isDeleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteAccountConfirmation}
      >
        <KeyboardAvoidingView
          style={styles.deleteAccountModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.deleteAccountModalScrollView}
            contentContainerStyle={styles.deleteAccountModalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.deleteAccountModalCard}>
              <Text style={styles.deleteAccountModalTitle}>Excluir minha conta?</Text>
              <Text style={styles.deleteAccountModalDescription}>
                Esta exclusão é permanente. Seu perfil, suas paletas e os consentimentos
                associados serão apagados e não poderão ser recuperados.
              </Text>
              <Text style={styles.deleteAccountPasswordLabel}>
                Digite sua senha atual para confirmar:
              </Text>
              <TextInput
                style={styles.deleteAccountPasswordInput}
                value={deleteAccountPassword}
                onChangeText={setDeleteAccountPassword}
                placeholder="Senha atual"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDeletingAccount}
                accessibilityLabel="Senha atual da conta"
                textContentType="password"
              />
              {deleteAccountError && (
                <Text style={styles.deleteAccountError} accessibilityRole="alert">
                  {deleteAccountError}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.deleteAccountConfirmButton,
                  (!deleteAccountPassword || isDeletingAccount) &&
                    styles.deleteAccountConfirmButtonDisabled,
                ]}
                onPress={() => void performAccountDeletion()}
                disabled={!deleteAccountPassword || isDeletingAccount}
                accessibilityRole="button"
                accessibilityLabel="Confirmar exclusão permanente da conta"
                accessibilityState={{
                  busy: isDeletingAccount,
                  disabled: !deleteAccountPassword || isDeletingAccount,
                }}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteAccountConfirmButtonText}>
                    Excluir permanentemente
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteAccountCancelButton}
                onPress={closeDeleteAccountConfirmation}
                disabled={isDeletingAccount}
                accessibilityRole="button"
                accessibilityLabel="Cancelar exclusão da conta"
              >
                <Text style={styles.deleteAccountCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <BarraNavegacao savedCount={palettesCount ?? 0} />
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
  placeholder: {
    width: 44,
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
    marginBottom: 20,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  avatarCircle: {
    minWidth: 58,
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginRight: 16,
  },
  avatarLetter: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    ...serifText,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  userEmail: {
    ...serifText,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  badgeLocal: {
    alignSelf: "flex-start",
    backgroundColor: "#F2F0E6",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeLocalText: {
    ...serifText,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  statNumber: {
    ...serifText,
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...serifText,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    ...serifText,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 12,
  },
  preferenceCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  preferenceRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0EFE6",
    marginTop: 10,
    paddingTop: 14,
  },
  prefTextContainer: {
    flex: 1,
    paddingRight: 14,
  },
  prefTitle: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  prefSubtitle: {
    ...serifText,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  navigationLink: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E3D5",
    minHeight: 52,
  },
  linkLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkTitle: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    flexShrink: 1,
  },
  linkArrowContainer: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: "rgba(22, 100, 95, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  linkArrow: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.primary,
    marginTop: -2,
    textAlign: "center",
  },
  aboutCard: {
    backgroundColor: "#F7F6EE",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  aboutTitle: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 6,
  },
  aboutText: {
    ...serifText,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  aboutVersion: {
    ...serifText,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  logoutButton: {
    backgroundColor: "#FBECEE",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F2CDD4",
    minHeight: 50,
    justifyContent: "center",
  },
  logoutText: {
    ...serifText,
    color: Colors.error,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteAccountButton: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.error,
    minHeight: 50,
    justifyContent: "center",
    marginTop: 12,
  },
  deleteAccountButtonText: {
    ...serifText,
    color: Colors.error,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteAccountModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  deleteAccountModalScrollView: {
    maxHeight: "100%",
  },
  deleteAccountModalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  deleteAccountModalCard: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  deleteAccountModalTitle: {
    ...serifText,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: 10,
  },
  deleteAccountModalDescription: {
    ...serifText,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    marginBottom: 18,
  },
  deleteAccountPasswordLabel: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  deleteAccountPasswordInput: {
    ...serifText,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
    marginBottom: 12,
  },
  deleteAccountError: {
    ...serifText,
    color: Colors.error,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  deleteAccountConfirmButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  deleteAccountConfirmButtonDisabled: {
    opacity: 0.55,
  },
  deleteAccountConfirmButtonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  deleteAccountCancelButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  deleteAccountCancelButtonText: {
    ...serifText,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  demoPreviewBox: {
    backgroundColor: "#F7F6EE",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E3D5",
  },
  demoPreviewTitle: {
    ...serifText,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  demoPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 8,
  },
  demoInfo: {
    flex: 1,
    minWidth: 0,
  },
  demoSwatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  demoSwatchName: {
    ...serifText,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  textHighContrast: {
    color: "#000000",
  },
  demoSwatchCode: {
    ...serifText,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  demoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 1,
  },
  badgeHighContrast: {
    backgroundColor: Colors.success,
  },
  badgeNormal: {
    backgroundColor: "#EEECDE",
  },
  badgeTextHighContrast: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  badgeTextNormal: {
    ...serifText,
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
});
