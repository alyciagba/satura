import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Método não permitido." });
  }

  const authorization = request.headers.get("Authorization");
  const tokenMatch = authorization?.match(/^Bearer\s+(.+)$/i);
  const accessToken = tokenMatch?.[1];

  if (!accessToken) {
    return jsonResponse(401, { error: "Autenticação obrigatória." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return jsonResponse(500, { error: "A função não está configurada corretamente." });
  }

  try {
    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { data, error: authError } = await authClient.auth.getUser(accessToken);

    if (authError || !data.user) {
      return jsonResponse(401, { error: "A sessão é inválida ou expirou." });
    }

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return jsonResponse(400, { error: "A senha atual é obrigatória." });
    }

    if (
      typeof requestBody !== "object" ||
      requestBody === null ||
      !("password" in requestBody) ||
      typeof requestBody.password !== "string" ||
      requestBody.password.length === 0
    ) {
      return jsonResponse(400, { error: "A senha atual é obrigatória." });
    }

    if (
      !("expectedUserId" in requestBody) ||
      typeof requestBody.expectedUserId !== "string" ||
      requestBody.expectedUserId.length === 0
    ) {
      return jsonResponse(400, { error: "A conta autenticada não foi identificada." });
    }

    if (requestBody.expectedUserId !== data.user.id) {
      return jsonResponse(409, {
        error: "A sessão corresponde a uma conta diferente.",
      });
    }

    if (!data.user.email) {
      return jsonResponse(400, { error: "A conta autenticada não possui e-mail." });
    }

    const { data: reauthenticatedData, error: reauthenticationError } =
      await authClient.auth.signInWithPassword({
        email: data.user.email,
        password: requestBody.password,
      });

    if (reauthenticationError || !reauthenticatedData.user) {
      return jsonResponse(401, { error: "A senha atual está incorreta." });
    }

    if (reauthenticatedData.user.id !== data.user.id) {
      return jsonResponse(403, {
        error: "A senha informada não corresponde à conta autenticada.",
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { error: deletionError } = await adminClient.auth.admin.deleteUser(data.user.id);

    if (deletionError) {
      console.error("delete-account: admin deletion failed", deletionError.message);
      return jsonResponse(500, { error: "Não foi possível excluir a conta." });
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    console.error(
      "delete-account: unexpected failure",
      error instanceof Error ? error.message : "Unknown error"
    );
    return jsonResponse(500, { error: "Não foi possível excluir a conta." });
  }
});

function jsonResponse(status: number, body: Record<string, string | boolean>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
