import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { checkSession, login } from "@/services/storage";

export default function LoginScreen() {
  const router = useRouter();
  const { highContrast } = useAppSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verifica se já existe sessão salva
  useEffect(() => {
    checkSession().then((session: { email: string; name: string } | null) => {
      if (session) {
        router.replace("/home");
      }
    });
  }, [router]);

  async function handleLogin() {
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

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        router.replace("/home");
      } else {
        setErrorMessage(res.message || "E-mail ou senha incorretos.");
      }
    } catch {
      setErrorMessage("Ocorreu um erro ao tentar entrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
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
            accessibilityLabel="Criar uma nova conta local"
          >
            <Text style={styles.register}>
              Ainda não tem uma conta?{" "}
              <Text style={styles.registerHighlight}>Criar conta</Text>
            </Text>
          </TouchableOpacity>

          {/* Aviso sobre persistência local */}
          <Text style={styles.academicNotice}>
            Atividade acadêmica: dados e sessão persistidos localmente no dispositivo (sem envio remoto).
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
  },
  logo: {
    ...serifText,
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: 6,
    color: Colors.primary,
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
