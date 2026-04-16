const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

type ApiRequestOptions = RequestInit & {
  accessToken?: string;
};

export async function apiRequest<T>(
  path: string,
  init?: ApiRequestOptions,
): Promise<T> {
  const { accessToken, headers, ...requestInit } = init ?? {};

  const response = await fetch(`${apiBaseUrl}${path}`, {
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
