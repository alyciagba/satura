import AsyncStorage from "@react-native-async-storage/async-storage";
import { USER_PROFILE_STORAGE_KEY, SESSION_STORAGE_KEY, type UserProfile } from "@/constants/palettes";

export interface StoredUser {
  name: string;
  email: string;
  passwordHash: string; // Simulação de hash local
  createdAt: string;
}

const DEFAULT_DEMO_USER: StoredUser = {
  name: "Gabriela",
  email: "gabriela@satura.com",
  passwordHash: "123456",
  createdAt: new Date().toISOString(),
};

export async function getStoredUser(): Promise<StoredUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) {
      // Inicia com usuário de exemplo para testes imediatos
      await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_USER));
      return DEFAULT_DEMO_USER;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveNewUser(name: string, email: string, password: string): Promise<StoredUser> {
  const newUser: StoredUser = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: password,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(newUser));
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: newUser.email, name: newUser.name }));
  return newUser;
}

export async function checkSession(): Promise<{ email: string; name: string } | null> {
  try {
    const session = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!session) return null;
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: { name: string; email: string } }> {
  const stored = await getStoredUser();
  if (!stored) {
    return { success: false, message: "Nenhum usuário cadastrado neste dispositivo." };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (stored.email.toLowerCase() !== cleanEmail) {
    return { success: false, message: "E-mail não cadastrado neste dispositivo." };
  }

  if (stored.passwordHash !== password) {
    return { success: false, message: "Senha incorreta. Tente novamente." };
  }

  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: stored.email, name: stored.name }));
  return { success: true, user: { name: stored.name, email: stored.email } };
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

export interface AppSettings {
  highContrast: boolean;
  showRgbAlways?: boolean;
}

export const SETTINGS_STORAGE_KEY = "satura:app-settings";

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { highContrast: true };
    return JSON.parse(raw);
  } catch {
    return { highContrast: true };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
  }
}
