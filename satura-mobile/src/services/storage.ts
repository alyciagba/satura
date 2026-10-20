import AsyncStorage from "@react-native-async-storage/async-storage";
import { USER_PROFILE_STORAGE_KEY, SESSION_STORAGE_KEY } from "@/constants/palettes";

export interface StoredUser {
  name: string;
  email: string;
  passwordHash: string; // Simulação de hash local
  createdAt: string;
}

type StoredSession = {
  email: string;
  name: string;
};

export async function getStoredUser(): Promise<StoredUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isStoredUser(parsed)) return null;

    return {
      ...parsed,
      name: parsed.name.trim(),
      email: normalizeEmail(parsed.email),
    };
  } catch {
    return null;
  }
}

export async function saveNewUser(name: string, email: string, password: string): Promise<StoredUser> {
  const newUser: StoredUser = {
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash: password,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(newUser));
  await saveSession(newUser);
  return newUser;
}

export async function checkSession(): Promise<StoredSession | null> {
  try {
    const session = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!session) return null;

    const parsed: unknown = JSON.parse(session);
    if (!isStoredSession(parsed)) return null;

    return {
      email: normalizeEmail(parsed.email),
      name: parsed.name.trim(),
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: { name: string; email: string } }> {
  const stored = await getStoredUser();
  if (!stored) {
    return { success: false, message: "Nenhum usuário cadastrado neste dispositivo." };
  }

  const cleanEmail = normalizeEmail(email);
  if (stored.email !== cleanEmail) {
    return { success: false, message: "E-mail não cadastrado neste dispositivo." };
  }

  if (stored.passwordHash !== password) {
    return { success: false, message: "Senha incorreta. Tente novamente." };
  }

  await saveSession(stored);
  return { success: true, user: { name: stored.name, email: stored.email } };
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isStoredUser(value: unknown): value is StoredUser {
  if (!value || typeof value !== "object") return false;

  const user = value as Record<string, unknown>;
  return (
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.passwordHash === "string" &&
    typeof user.createdAt === "string"
  );
}

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object") return false;

  const session = value as Record<string, unknown>;
  return typeof session.email === "string" && typeof session.name === "string";
}

async function saveSession(user: Pick<StoredUser, "email" | "name">): Promise<void> {
  const session: StoredSession = {
    email: normalizeEmail(user.email),
    name: user.name.trim(),
  };
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
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
