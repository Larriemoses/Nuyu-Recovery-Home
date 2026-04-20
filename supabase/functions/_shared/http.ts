import { corsHeaders } from "./cors.ts";
import { HttpError } from "./http-error.ts";

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });
}

export function emptyResponse(status = 204, headers?: HeadersInit) {
  return new Response(null, {
    status,
    headers: {
      ...corsHeaders,
      ...(headers ?? {}),
    },
  });
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return jsonResponse(
      {
        message: error.message,
        details: error.details,
      },
      error.statusCode,
    );
  }

  console.error(error);

  return jsonResponse(
    {
      message: "Internal server error.",
    },
    500,
  );
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "The request body must be valid JSON.");
  }
}
