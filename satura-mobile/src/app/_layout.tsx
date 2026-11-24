import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { Colors } from "@/constants/theme";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";

export default function RootLayout() {
  return (
    <AppSettingsProvider>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" options={{ title: "Entrar" }} />
          <Stack.Screen name="cadastro" options={{ title: "Criar Conta" }} />
          <Stack.Screen
            name="home"
            options={{ title: "Início", animation: "none" }}
          />
          <Stack.Screen
            name="criar_paleta"
            options={{ title: "Criar Paleta", animation: "none" }}
          />
          <Stack.Screen name="resultado_paleta" options={{ title: "Resultado da Paleta" }} />
          <Stack.Screen
            name="paletas_salvas"
            options={{ title: "Paletas Salvas", animation: "none" }}
          />
          <Stack.Screen
            name="perfil"
            options={{ title: "Meu Perfil", animation: "none" }}
          />
        </Stack>
      </View>
    </AppSettingsProvider>
  );
}
