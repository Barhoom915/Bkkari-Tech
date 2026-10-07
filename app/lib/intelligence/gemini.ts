type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `
أنت NOVATEK AI، المساعد الذكي الرسمي لمتجر NOVATEK.
جاوب باللهجة السورية بشكل طبيعي وواضح ومختصر.
إذا كان السؤال عن منتج أو لابتوب، اذكر المواصفات المهمة فقط.
لا تخترع أسعار أو معلومات غير مؤكدة.
إذا تم إعطاؤك معلومات من بحث خارجي، استخدمها بحذر واذكر المصادر عند الحاجة.
`;

const TIMEOUT_MS = 12000;

function buildMessages(
  input: string,
  history: ChatMessage[] = []
): ProviderMessage[] {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...history.slice(-12).map((message) => ({
      role: message.role,
      content: message.text,
    })),
    {
      role: "user",
      content: input,
    },
  ];
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function getErrorBody(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  return String(value);
}

async function askAshna(
  input: string,
  history: ChatMessage[]
): Promise<string | null> {
  const apiKey = process.env.ASHNA_API_KEY;

  if (!apiKey) {
    console.warn("NOVATEK Ashna: ASHNA_API_KEY is missing");
    return null;
  }

  const model = process.env.ASHNA_MODEL || "gpt-4o-mini";

  try {
    const messages = buildMessages(input, history);

    const res = await fetchWithTimeout(
      "https://api.ashna.ai/v1/api/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 700,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");

      console.error(
        "NOVATEK Ashna API error:",
        JSON.stringify({
          status: res.status,
          model,
          body: body.slice(0, 500),
        })
      );

      return null;
    }

    const data = await res.json();

    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "";

    return typeof content === "string" && content.trim()
      ? content.trim()
      : null;
  } catch (error) {
    console.error(
      "NOVATEK Ashna request failed:",
      getErrorBody(error)
    );

    return null;
  }
}

async function askGroq(
  input: string,
  history: ChatMessage[]
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn("NOVATEK Groq: GROQ_API_KEY is missing");
    return null;
  }

  const model =
    process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  try {
    const messages = buildMessages(input, history);

    const res = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          reasoning_effort: "low",
          temperature: 0.3,
          max_tokens: 700,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");

      console.error(
        "NOVATEK Groq API error:",
        JSON.stringify({
          status: res.status,
          model,
          body: body.slice(0, 500),
        })
      );

      return null;
    }

    const data = await res.json();

    const content = data?.choices?.[0]?.message?.content;

    return typeof content === "string" && content.trim()
      ? content.trim()
      : null;
  } catch (error) {
    console.error(
      "NOVATEK Groq request failed:",
      getErrorBody(error)
    );

    return null;
  }
}

async function askOpenRouter(
  input: string,
  history: ChatMessage[]
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn(
      "NOVATEK OpenRouter: OPENROUTER_API_KEY is missing"
    );
    return null;
  }

  const model =
    process.env.OPENROUTER_MODEL || "openrouter/free";

  try {
    const messages = buildMessages(input, history);

    const res = await fetchWithTimeout(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://novatek-store.vercel.app",
          "X-Title": "NOVATEK",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 700,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");

      console.error(
        "NOVATEK OpenRouter API error:",
        JSON.stringify({
          status: res.status,
          model,
          body: body.slice(0, 500),
        })
      );

      return null;
    }

    const data = await res.json();

    const content = data?.choices?.[0]?.message?.content;

    return typeof content === "string" && content.trim()
      ? content.trim()
      : null;
  } catch (error) {
    console.error(
      "NOVATEK OpenRouter request failed:",
      getErrorBody(error)
    );

    return null;
  }
}

async function askGeminiProvider(
  input: string,
  history: ChatMessage[]
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("NOVATEK Gemini: GEMINI_API_KEY is missing");
    return null;
  }

  const model =
    process.env.GEMINI_MODEL || "gemini-3.8-flash";

  try {
    const contents = history
      .slice(-12)
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.text }],
      }));

    contents.push({
      role: "user",
      parts: [{ text: input }],
    });

    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 700,
            thinkingConfig: {
              thinkingLevel: "low",
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");

      console.error(
        "NOVATEK Gemini API error:",
        JSON.stringify({
          status: res.status,
          model,
          body: body.slice(0, 500),
        })
      );

      return null;
    }

    const data = await res.json();

    const parts = data?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
      return null;
    }

    const content = parts
      .map((part: any) =>
        typeof part?.text === "string" ? part.text : ""
      )
      .join("")
      .trim();

    return content || null;
  } catch (error) {
    console.error(
      "NOVATEK Gemini request failed:",
      getErrorBody(error)
    );

    return null;
  }
}

export async function askGemini(
  input: string,
  history: ChatMessage[] = []
): Promise<string | null> {
  const providers = [
    {
      name: "Ashna",
      fn: () => askAshna(input, history),
    },
    {
      name: "Groq",
      fn: () => askGroq(input, history),
    },
    {
      name: "OpenRouter",
      fn: () => askOpenRouter(input, history),
    },
    {
      name: "Gemini",
      fn: () => askGeminiProvider(input, history),
    },
  ];

  for (const provider of providers) {
    try {
      const reply = await provider.fn();

      if (reply) {
        console.log(
          `NOVATEK AI provider: ${provider.name}`
        );

        return reply;
      }
    } catch (error) {
      console.error(
        `NOVATEK ${provider.name} provider failed:`,
        getErrorBody(error)
      );
    }
  }

  return null;
}
