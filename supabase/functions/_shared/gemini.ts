// Gemini API client for the AI document checker and essay feedback.
// Uses the REST generateContent endpoint with a JSON schema, so every answer
// is structured data the app can render (no free-form text parsing).
//
// Secrets (supabase secrets set ...):
//   GEMINI_API_KEY          required — from Google AI Studio
//   GEMINI_MODEL            optional — default gemini-3.5-flash-lite (free tier)
//   GEMINI_FALLBACK_MODEL   optional — tried when the first model is rate-limited
//                            or unavailable; default gemini-2.5-flash-lite

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const DEFAULT_FALLBACK = 'gemini-2.5-flash-lite';
const TIMEOUT_MS = 60_000;

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export class GeminiError extends Error {
  /** True for rate limits, timeouts and outages: worth retrying later. */
  readonly retryable: boolean;
  /** The next model may still work (rate limit, outage, or this model was retired). */
  readonly tryNextModel: boolean;
  constructor(message: string, retryable: boolean, tryNextModel = retryable) {
    super(message);
    this.retryable = retryable;
    this.tryNextModel = tryNextModel;
  }
}

function models(): string[] {
  const primary = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL;
  const fallback = Deno.env.get('GEMINI_FALLBACK_MODEL') ?? DEFAULT_FALLBACK;
  return fallback && fallback !== primary ? [primary, fallback] : [primary];
}

async function callModel<T>(model: string, key: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw new GeminiError(`Gemini request failed: ${(e as Error).message}`, true);
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    console.error('gemini error', model, res.status, detail);
    let googleMessage = '';
    try {
      googleMessage = JSON.parse(detail)?.error?.message ?? '';
    } catch {
      // not JSON
    }
    const retryable = res.status === 429 || res.status >= 500;
    // 402 = this model needs billing on the key's project; 403/404 = no access or
    // retired model. Another model (e.g. a free-tier one) may still work.
    const tryNext = retryable || [402, 403, 404].includes(res.status);
    throw new GeminiError(
      res.status === 429
        ? 'The AI service is busy. Try again later.'
        : res.status === 402
          ? `AI needs billing for ${model}${googleMessage ? `: ${googleMessage}` : ''}`.slice(0, 300)
          : `AI service error (${res.status})${googleMessage ? `: ${googleMessage}` : ''}`.slice(0, 300),
      retryable,
      tryNext,
    );
  }

  const data = await res.json();
  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError('The AI service declined to read this content.', false);
  }
  const candidate = data?.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .map((p: { text?: string; thought?: boolean }) => (p.thought ? '' : (p.text ?? '')))
    .join('');
  if (!text) {
    throw new GeminiError(`Empty AI response (${candidate?.finishReason ?? 'unknown'})`, true);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiError('The AI response was not valid JSON.', true);
  }
}

/**
 * One structured request. `schema` is a JSON Schema the response must follow.
 * Falls back to the second model on rate limits/outages. Returns the model used.
 */
export async function generateJson<T>(input: {
  system: string;
  parts: GeminiPart[];
  schema: Record<string, unknown>;
  temperature?: number;
}): Promise<{ data: T; model: string }> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new GeminiError('AI is not configured (GEMINI_API_KEY is missing).', false);

  const body = {
    systemInstruction: { parts: [{ text: input.system }] },
    contents: [{ role: 'user', parts: input.parts }],
    generationConfig: {
      temperature: input.temperature ?? 0.2,
      responseMimeType: 'application/json',
      responseJsonSchema: input.schema,
    },
  };

  let lastError: GeminiError | null = null;
  for (const model of models()) {
    try {
      return { data: await callModel<T>(model, key, body), model };
    } catch (e) {
      lastError = e instanceof GeminiError ? e : new GeminiError(String(e), true);
      if (!lastError.tryNextModel) break;
    }
  }
  throw lastError ?? new GeminiError('AI request failed', true);
}

/** Keep model text inside the database column limits. */
export function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t ? t.slice(0, max) : null;
}

export function clipList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => clip(v, maxLength))
    .filter((v): v is string => v !== null)
    .slice(0, maxItems);
}

export async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}
