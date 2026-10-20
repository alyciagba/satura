import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { loadSavedPalettes, type SavedPalette } from "@/constants/palettes";
import { BarraNavegacao } from "@/components/BarraNavegacao";
import { Colors, Fonts } from "@/constants/theme";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import {
  checkSession,
  getStoredUser,
  logout,
  type StoredUser,
} from "@/services/storage";

export default function PerfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [palettesCount, setPalettesCount] = useState(0);
  const { highContrast, setHighContrast } = useAppSettings();

  useEffect(() => {
    checkSession().then((session: { email: string; name: string } | null) => {
      getStoredUser().then((stored: StoredUser | null) => {
        if (stored) {
          setUser(stored);
        } else if (session) {
          setUser({
            name: session.name,
            email: session.email,
            passwordHash: "",
            createdAt: new Date().toISOString(),
          });
        }
      });
    });

    loadSavedPalettes().then((list: SavedPalette[]) => {
      setPalettesCount(list.length);
    });
  }, []);

  function handleToggleContrast(val: boolean) {
    setHighContrast(val);
  }

  function handleLogout() {
    Alert.alert(
      "Sair do aplicativo?",
      "Sua sessão será encerrada. Você poderá entrar novamente a qualquer momento com seus dados salvos neste dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  }

  const initialLetter = (user?.name || "G").charAt(0).toUpperCase();

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
            <Text style={styles.userName}>{user?.name ?? "Gabriela"}</Text>
            <Text style={styles.userEmail}>
              {user?.email ?? "gabriela@satura.com"}
            </Text>
            <View style={styles.badgeLocal}>
              <Text style={styles.badgeLocalText}>Dispositivo Local</Text>
            </View>
          </View>
        </View>

        {/* Estatísticas de Criação */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/paletas_salvas")}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${palettesCount} paletas salvas`}
          >
            <Text style={styles.statNumber}>{palettesCount}</Text>
            <Text style={styles.statLabel}>Paletas salvas</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Offline / Privado</Text>
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
            <View style={{ flex: 1 }}>
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
            <Text style={styles.linkIcon}>🎨</Text>
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
            Implementado com React Native, Expo e TypeScript, operando exclusivamente
            no dispositivo através do AsyncStorage.
          </Text>
          <Text style={styles.aboutVersion}>Versão 1.0.0 — Expo Go Compatível</Text>
        </View>

        {/* Botão de Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Encerrar sessão no aplicativo"
        >
          <Text style={styles.logoutText}>Encerrar Sessão</Text>
        </TouchableOpacity>
      </ScrollView>
      <BarraNavegacao savedCount={palettesCount} />
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
    color: Colors.accentPink,
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
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkIcon: {
    fontSize: 20,
  },
  linkTitle: {
    ...serifText,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  linkArrowContainer: {
    width: 32,
    height: 32,
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
    alignItems: "center",
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
