import type { AuthResponse, Session } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";

export interface AuthServiceError {
  message: string;
  code?: string;
}

export interface AuthResult<T> {
  data: T | null;
  error: AuthServiceError | null;
}

const errorMessages: Record<string, string> = {
  email_address_invalid: "O endereço de e-mail é inválido.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  invalid_credentials: "E-mail ou senha incorretos.",
  over_email_send_rate_limit:
    "Muitas tentativas de envio. Aguarde antes de tentar novamente.",
  signup_disabled: "O cadastro de novas contas está indisponível no momento.",
  user_already_exists: "Já existe uma conta cadastrada com este e-mail.",
  weak_password: "A senha não atende aos requisitos de segurança.",
};

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResult<AuthResponse["data"]>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    return error
      ? { data: null, error: toAuthServiceError(error) }
      : { data, error: null };
  } catch (error) {
    return { data: null, error: toAuthServiceError(error) };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult<AuthResponse["data"]>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    return error
      ? { data: null, error: toAuthServiceError(error) }
      : { data, error: null };
  } catch (error) {
    return { data: null, error: toAuthServiceError(error) };
  }
}

export async function signOut(): Promise<AuthResult<undefined>> {
  try {
    const { error } = await supabase.auth.signOut();

    return error
      ? { data: null, error: toAuthServiceError(error) }
      : { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: toAuthServiceError(error) };
  }
}

export async function clearLocalSession(): Promise<AuthResult<undefined>> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    const { data, error: sessionError } = await supabase.auth.getSession();

    if (!sessionError && !data.session) {
      return { data: undefined, error: null };
    }

    return {
      data: null,
      error: toAuthServiceError(
        error ?? sessionError ?? new Error("A sessão local ainda está ativa.")
      ),
    };
  } catch (error) {
    return { data: null, error: toAuthServiceError(error) };
  }
}

export async function getCurrentSession(): Promise<AuthResult<Session | null>> {
  try {
    const { data, error } = await supabase.auth.getSession();

    return error
      ? { data: null, error: toAuthServiceError(error) }
      : { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: toAuthServiceError(error) };
  }
}

function toAuthServiceError(error: unknown): AuthServiceError {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? error.name
      : undefined;

  if (name === "AuthRetryableFetchError") {
    return {
      message:
        "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.",
      ...(code ? { code } : {}),
    };
  }

  return {
    message:
      (code && errorMessages[code]) ||
      "Não foi possível concluir a autenticação. Tente novamente.",
    ...(code ? { code } : {}),
  };
}
