const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export async function apiRequest(path, init) {
    const { accessToken, headers, ...requestInit } = init ?? {};
    const requestUrl = `${apiBaseUrl}${path}`;
    let response;
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
    }
    catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`Unable to reach the Nuyu server at ${apiBaseUrl}. Please start the backend and try again.`);
        }
        throw error;
    }
    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
        const message = typeof responseBody?.message === "string"
            ? responseBody.message
            : `API request failed with status ${response.status}`;
        throw new Error(message);
    }
    return responseBody;
}
