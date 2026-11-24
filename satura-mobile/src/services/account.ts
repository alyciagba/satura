import { FunctionsHttpError } from "@supabase/supabase-js";
import type { AuthResult, AuthServiceError } from "@/services/auth";
import { supabase } from "@/services/supabase";

type DeleteAccountResponse = {
  success: true;
};

export async function deleteCurrentAccount(
  currentPassword: string,
  expectedUserId: string
): Promise<AuthResult<undefined>> {
  try {
    const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(
      "delete-account",
      {
        method: "POST",
        body: { password: currentPassword, expectedUserId },
      }
    );

    if (error) {
      return { data: null, error: toAccountError(error) };
    }

    if (data?.success !== true) {
      return {
        data: null,
        error: {
          message: "O serviço não confirmou a exclusão da conta. Tente novamente.",
        },
      };
    }

    return { data: undefined, error: null };
  } catch {
    return {
      data: null,
      error: {
        message: "Não foi possível excluir a conta. Verifique sua conexão e tente novamente.",
      },
    };
  }
}

function toAccountError(error: unknown): AuthServiceError {
  if (error instanceof FunctionsHttpError) {
    const status = getHttpStatus(error.context);
    if (status === 401) {
      return {
        message: "A senha atual está incorreta ou sua sessão expirou. Confira os dados e tente novamente.",
        code: String(status),
      };
    }
    if (status === 403) {
      return {
        message: "A senha informada não corresponde à conta autenticada.",
        code: String(status),
      };
    }
    if (status === 409) {
      return {
        message: "A conta autenticada mudou. Entre novamente antes de continuar.",
        code: String(status),
      };
    }
  }

  return {
    message: "Não foi possível excluir a conta. Verifique sua conexão e tente novamente.",
  };
}

function getHttpStatus(context: unknown): number | undefined {
  if (
    typeof context === "object" &&
    context !== null &&
    "status" in context &&
    typeof context.status === "number"
  ) {
    return context.status;
  }

  return undefined;
}
