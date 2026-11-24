import type { PaletteColor, SavedPalette } from "@/constants/palettes";
import type { AuthResult, AuthServiceError } from "@/services/auth";
import { supabase } from "@/services/supabase";

type AuthenticatedUser = {
  id: string;
};

const PALETTE_COLUMNS =
  "id, user_id, name, purpose, mood, tone, colors, source, explanation, created_at";

export async function getSavedPalettes(): Promise<AuthResult<SavedPalette[]>> {
  const authResult = await getAuthenticatedUser();
  if (!authResult.data) {
    return { data: null, error: authResult.error };
  }

  try {
    const { data, error } = await supabase
      .from("palettes")
      .select(PALETTE_COLUMNS)
      .eq("user_id", authResult.data.id)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        data: null,
        error: toPaletteError("Não foi possível carregar as paletas.", error.code),
      };
    }

    const palettes: SavedPalette[] = [];
    for (const row of data ?? []) {
      if (row.user_id !== authResult.data.id) {
        return {
          data: null,
          error: toPaletteError("A consulta retornou uma paleta inválida."),
        };
      }

      const palette = toSavedPalette(row);
      if (!palette) {
        return {
          data: null,
          error: toPaletteError("A tabela retornou uma paleta com formato inválido."),
        };
      }

      palettes.push(palette);
    }

    return { data: palettes, error: null };
  } catch (error) {
    return {
      data: null,
      error: toPaletteError("Não foi possível carregar as paletas.", getErrorCode(error)),
    };
  }
}

export async function addSavedPalette(
  palette: SavedPalette
): Promise<AuthResult<SavedPalette>> {
  const authResult = await getAuthenticatedUser();
  if (!authResult.data) {
    return { data: null, error: authResult.error };
  }

  if (palette.source !== "questionario" && palette.source !== "imagem") {
    return {
      data: null,
      error: toPaletteError("A origem da paleta não é válida."),
    };
  }

  const row = {
    id: createUuid(),
    user_id: authResult.data.id,
    name: palette.name,
    purpose: palette.purpose,
    mood: palette.mood,
    tone: palette.tone,
    colors: palette.colors,
    source: palette.source,
    explanation: palette.explanation ?? "",
    created_at: palette.savedAt,
  };

  try {
    const { error } = await supabase.from("palettes").insert(row);

    if (error) {
      return {
        data: null,
        error: toPaletteError("Não foi possível salvar a paleta.", error.code),
      };
    }

    return {
      data: {
        id: row.id,
        name: row.name,
        purpose: row.purpose,
        mood: row.mood,
        tone: row.tone,
        colors: row.colors,
        source: row.source,
        explanation: row.explanation,
        savedAt: row.created_at,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: toPaletteError("Não foi possível salvar a paleta.", getErrorCode(error)),
    };
  }
}

export async function removeSavedPalette(id: string): Promise<AuthResult<undefined>> {
  const authResult = await getAuthenticatedUser();
  if (!authResult.data) {
    return { data: null, error: authResult.error };
  }

  try {
    const { error } = await supabase
      .from("palettes")
      .delete()
      .eq("id", id)
      .eq("user_id", authResult.data.id);

    if (error) {
      return {
        data: null,
        error: toPaletteError("Não foi possível excluir a paleta.", error.code),
      };
    }

    return { data: undefined, error: null };
  } catch (error) {
    return {
      data: null,
      error: toPaletteError("Não foi possível excluir a paleta.", getErrorCode(error)),
    };
  }
}

async function getAuthenticatedUser(): Promise<AuthResult<AuthenticatedUser>> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return {
        data: null,
        error: toPaletteError(
          error.name === "AuthSessionMissingError"
            ? "É necessário entrar para acessar suas paletas."
            : "Não foi possível verificar a sessão autenticada.",
          error.code
        ),
      };
    }

    if (!data.user) {
      return {
        data: null,
        error: toPaletteError("É necessário entrar para acessar suas paletas."),
      };
    }

    return { data: { id: data.user.id }, error: null };
  } catch (error) {
    return {
      data: null,
      error: toPaletteError(
        "Não foi possível verificar a sessão autenticada.",
        getErrorCode(error)
      ),
    };
  }
}

function toSavedPalette(row: unknown): SavedPalette | null {
  if (!isRecord(row)) return null;

  const source = row.source;
  const explanation = row.explanation;

  if (
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.purpose !== "string" ||
    typeof row.mood !== "string" ||
    typeof row.tone !== "string" ||
    typeof row.created_at !== "string" ||
    !Array.isArray(row.colors) ||
    !row.colors.every(isPaletteColor) ||
    (source !== null &&
      source !== undefined &&
      source !== "questionario" &&
      source !== "imagem") ||
    (explanation !== null &&
      explanation !== undefined &&
      typeof explanation !== "string")
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    purpose: row.purpose,
    mood: row.mood,
    tone: row.tone,
    colors: row.colors,
    savedAt: row.created_at,
    ...(source ? { source } : {}),
    ...(typeof explanation === "string" ? { explanation } : {}),
  };
}

function isPaletteColor(value: unknown): value is PaletteColor {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.hex === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getErrorCode(error: unknown): string | undefined {
  return isRecord(error) && typeof error.code === "string" ? error.code : undefined;
}

function toPaletteError(message: string, code?: string): AuthServiceError {
  return {
    message,
    ...(code ? { code } : {}),
  };
}
