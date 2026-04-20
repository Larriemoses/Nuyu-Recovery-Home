const configuredApiUrl = import.meta.env.VITE_API_URL;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const derivedSupabaseFunctionUrl = supabaseUrl
  ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/app-api`
  : undefined;
const apiBaseUrl =
  configuredApiUrl ?? derivedSupabaseFunctionUrl ?? "http://localhost:4000/api";

type ApiRequestOptions = RequestInit & {
  accessToken?: string;
};

export async function apiRequest<T>(
  path: string,
  init?: ApiRequestOptions,
): Promise<T> {
  const { accessToken, headers, ...requestInit } = init ?? {};
  const requestUrl = `${apiBaseUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(requestUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
        ...(headers ?? {}),
      },
      ...requestInit,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to reach the Nuyu backend at ${apiBaseUrl}.`,
      );
    }

    throw error;
  }

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof responseBody?.message === "string"
        ? responseBody.message
        : `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return responseBody as T;
}
