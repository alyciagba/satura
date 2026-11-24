import type { AuthResult, AuthServiceError } from "@/services/auth";
import { supabase } from "@/services/supabase";

export interface UserProfile {
  id: string;
  name: string;
}

export async function getCurrentProfile(): Promise<AuthResult<UserProfile>> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      if (authError.name === "AuthSessionMissingError") {
        return { data: null, error: null };
      }

      return {
        data: null,
        error: toProfileError("Não foi possível verificar a sessão autenticada.", authError.code),
      };
    }

    const user = authData.user;
    if (!user) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: toProfileError("Não foi possível carregar o perfil do usuário.", error.code),
      };
    }

    if (!data) {
      return { data: null, error: null };
    }

    if (typeof data.id !== "string" || typeof data.name !== "string") {
      return {
        data: null,
        error: toProfileError("O perfil retornado possui dados inválidos."),
      };
    }

    return {
      data: { id: data.id, name: data.name },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: toProfileError("Não foi possível carregar o perfil do usuário."),
    };
  }
}

function toProfileError(message: string, code?: string): AuthServiceError {
  return {
    message,
    ...(code ? { code } : {}),
  };
}
