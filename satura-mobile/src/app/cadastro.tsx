import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { saveNewUser } from "@/services/storage";

export default function CadastroScreen() {
  const router = useRouter();
  const { highContrast } = useAppSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    setErrorMessage(null);

    // Validações
    if (!name.trim()) {
      setErrorMessage("Por favor, informe seu nome completo ou como prefere ser chamado(a).");
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Por favor, digite seu endereço de e-mail.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Por favor, digite um e-mail válido (ex.: seu@email.com).");
      return;
    }

    if (!password) {
      setErrorMessage("Por favor, crie uma senha.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("A senha deve possuir ao menos 4 dígitos para esta demonstração.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas digitadas não coincidem. Verifique a confirmação.");
      return;
    }

    setIsLoading(true);
    try {
      await saveNewUser(name, email, password);
      Alert.alert(
        "Conta criada com sucesso! ✨",
        `Bem-vindo(a) ao Satura, ${name.trim()}! Seus dados foram salvos localmente neste aparelho.`,
        [
          {
            text: "Começar a usar",
            onPress: () => router.replace("/home"),
          },
        ]
      );
    } catch {
      setErrorMessage("Não foi possível salvar o cadastro localmente. Tente novamente.");
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
        {/* Cabeçalho de retorno */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela de login"
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.topLogo}>SATURA</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>NOVA CONTA</Text>
          <Text style={styles.title} accessibilityRole="header">
            Crie seu perfil no Satura.
          </Text>
          <Text style={styles.subtitle}>
            Salve paletas e personalize combinações de acordo com seu estilo visual.
          </Text>
        </View>

        {/* Mensagem de erro */}
        {errorMessage && (
          <View
            style={styles.errorBox}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={`Erro no formulário: ${errorMessage}`}
          >
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        )}

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.label} nativeID="lbl-nome">
            Como podemos te chamar? *
          </Text>
          <TextInput
            style={[styles.input, errorMessage && !name && styles.inputError]}
            placeholder="Ex.: Gabriela Souza"
            placeholderTextColor="#8A8B84"
            autoCapitalize="words"
            value={name}
            onChangeText={(txt: string) => {
              setName(txt);
              if (errorMessage) setErrorMessage(null);
            }}
            accessibilityLabel="Seu nome"
            aria-labelledby="lbl-nome"
          />

          <Text style={styles.label} nativeID="lbl-email">
            Seu melhor e-mail *
          </Text>
          <TextInput
            style={[styles.input, errorMessage && !email && styles.inputError]}
            placeholder="Ex.: seu@email.com"
            placeholderTextColor="#8A8B84"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(txt: string) => {
              setEmail(txt);
              if (errorMessage) setErrorMessage(null);
            }}
            accessibilityLabel="Seu e-mail"
            aria-labelledby="lbl-email"
          />

          <Text style={styles.label} nativeID="lbl-senha">
            Crie uma senha *
          </Text>
          <TextInput
            style={[styles.input, errorMessage && !password && styles.inputError]}
            placeholder="Mínimo 4 caracteres"
            placeholderTextColor="#8A8B84"
            secureTextEntry
            value={password}
            onChangeText={(txt: string) => {
              setPassword(txt);
              if (errorMessage) setErrorMessage(null);
            }}
            accessibilityLabel="Senha de acesso"
            aria-labelledby="lbl-senha"
          />

          <Text style={styles.label} nativeID="lbl-confirma">
            Confirme sua senha *
          </Text>
          <TextInput
            style={[styles.input, errorMessage && !confirmPassword && styles.inputError]}
            placeholder="Repita sua senha"
            placeholderTextColor="#8A8B84"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(txt: string) => {
              setConfirmPassword(txt);
              if (errorMessage) setErrorMessage(null);
            }}
            accessibilityLabel="Confirmação da senha"
            aria-labelledby="lbl-confirma"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Criar conta local no dispositivo"
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar e entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Já possuo uma conta, voltar ao login"
          >
            <Text style={styles.loginText}>
              Já tem uma conta? <Text style={styles.loginHighlight}>Fazer login</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.privacyNotice}>
            Cadastro demonstrativo offline para a disciplina de Tecnologia Web para Negócios.
            Nenhum dado é transmitido para a internet.
          </Text>
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
    paddingHorizontal: 28,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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
  backText: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.primary,
    marginTop: -2,
    textAlign: "center",
  },
  topLogo: {
    ...serifText,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 4,
    color: Colors.primary,
  },
  placeholder: {
    width: 44,
  },
  header: {
    marginBottom: 26,
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
    fontWeight: "700",
    lineHeight: 36,
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    ...serifText,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  errorBox: {
    backgroundColor: "#FCE8EC",
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
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
    paddingVertical: 15,
    fontSize: 15,
    marginBottom: 16,
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
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
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
  loginLink: {
    minHeight: 44,
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    ...serifText,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginHighlight: {
    ...serifText,
    color: Colors.primary,
    fontWeight: "700",
  },
  privacyNotice: {
    ...serifText,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 22,
    lineHeight: 16,
  },
});
