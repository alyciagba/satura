import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { getCurrentSession, signIn } from "@/services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { highContrast } = useAppSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const isSubmitting = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const result = await getCurrentSession();
        if (!isMounted) return;

        if (result.error) {
          setErrorMessage(result.error.message);
        } else if (result.data) {
          router.replace("/home");
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível verificar sua sessão. Tente novamente.");
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLogin() {
    if (isSubmitting.current) return;

    setErrorMessage(null);

    // Validações
    if (!email.trim()) {
      setErrorMessage("Por favor, digite seu endereço de e-mail.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Por favor, insira um e-mail válido (ex.: seu@email.com).");
      return;
    }

    if (!password) {
      setErrorMessage("Por favor, digite sua senha de acesso.");
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setErrorMessage(
          result.error.code === "email_not_confirmed"
            ? "Seu e-mail ainda não foi confirmado. Confirme-o antes de entrar."
            : result.error.message
        );
        return;
      }

      if (!result.data?.session) {
        setErrorMessage(
          "Não foi possível iniciar sua sessão. Confirme seu e-mail antes de entrar."
        );
        return;
      }

      router.replace("/home");
    } catch {
      setErrorMessage("Ocorreu um erro ao tentar entrar. Tente novamente.");
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <View
        style={[
          styles.container,
          highContrast && styles.highContrastContainer,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, highContrast && styles.highContrastContainer]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decoração superior de círculos coloridos */}
        <View style={styles.colorDecoration} accessible={false}>
          <View style={[styles.circle, styles.purple]} />
          <View style={[styles.circle, styles.pink]} />
          <View style={[styles.circle, styles.orange]} />
          <View style={[styles.circle, styles.green]} />
        </View>

        {/* Logo e cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.logo} accessibilityRole="header">
            SATURA
          </Text>
          <Text style={styles.subtitle}>
            Encontre as cores que combinam com você.
          </Text>
        </View>

        {/* Mensagem de erro acessível */}
        {errorMessage && (
          <View
            style={styles.errorBox}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={`Erro: ${errorMessage}`}
          >
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        )}

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.label} nativeID="label-email">
            E-mail
          </Text>
          <TextInput
            style={[styles.input, errorMessage && !email && styles.inputError]}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8A8B84"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(txt: string) => {
              setEmail(txt);
              if (errorMessage) setErrorMessage(null);
            }}
            accessibilityLabel="Campo de e-mail"
            accessibilityHint="Insira o e-mail cadastrado"
            aria-labelledby="label-email"
          />

          <Text style={styles.label} nativeID="label-senha">
            Senha
          </Text>
          <TextInput
            style={[styles.input, errorMessage && !password && styles.inputError]}
            placeholder="Digite sua senha"
            placeholderTextColor="#8A8B84"
            secureTextEntry
            value={password}
            onChangeText={(txt: string) => {
              setPassword(txt);
              if (errorMessage) setErrorMessage(null);
            }}
            accessibilityLabel="Campo de senha"
            accessibilityHint="Insira sua senha de acesso"
            aria-labelledby="label-senha"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Entrar no aplicativo"
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/cadastro")}
            accessibilityRole="button"
            accessibilityLabel="Criar uma nova conta no Satura"
          >
            <Text style={styles.register}>
              Ainda não tem uma conta?{" "}
              <Text style={styles.registerHighlight}>Criar conta</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.academicNotice}>
            Confirme seu e-mail antes do primeiro acesso. Sua sessão é gerenciada pelo Satura.
          </Text>
        </View>

        {/* Decoração inferior */}
        <View style={styles.bottomDecoration} accessible={false}>
          <View style={[styles.line, styles.linePurple]} />
          <View style={[styles.line, styles.linePink]} />
          <View style={[styles.line, styles.lineOrange]} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  colorDecoration: {
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 7,
    marginBottom: 20,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 20,
  },
  purple: { backgroundColor: Colors.accentPurple },
  pink: { backgroundColor: Colors.accentPink },
  orange: { backgroundColor: Colors.accentOrange },
  green: { backgroundColor: Colors.accentGreen },
  header: {
    alignItems: "center",
    marginBottom: 35,
    width: "100%",
  },
  logo: {
    ...serifText,
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: 6,
    color: Colors.primary,
    maxWidth: "100%",
    flexShrink: 1,
  },
  subtitle: {
    ...serifText,
    fontSize: 15,
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 12,
    maxWidth: 280,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: "#FCE8EC",
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    ...serifText,
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  form: {
    width: "100%",
  },
  label: {
    ...serifText,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    ...serifText,
    backgroundColor: Colors.card,
    borderRadius: 15,
    paddingHorizontal: 17,
    paddingVertical: 16,
    fontSize: 15,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    minHeight: 52,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "#FFF8F9",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 6,
    minHeight: 52,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  registerLink: {
    minHeight: 44,
    justifyContent: "center",
  },
  register: {
    ...serifText,
    textAlign: "center",
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  registerHighlight: {
    ...serifText,
    color: Colors.primary,
    fontWeight: "700",
  },
  academicNotice: {
    ...serifText,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 16,
  },
  bottomDecoration: {
    marginTop: 35,
    flexDirection: "row",
    gap: 6,
    alignSelf: "flex-start",
  },
  line: {
    height: 5,
    borderRadius: 5,
  },
  linePurple: {
    width: 35,
    backgroundColor: Colors.accentPurple,
  },
  linePink: {
    width: 20,
    backgroundColor: Colors.accentPink,
  },
  lineOrange: {
    width: 12,
    backgroundColor: Colors.accentOrange,
  },
});
