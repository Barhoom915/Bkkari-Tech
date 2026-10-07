type ChatMessage = {
  role: string;
  text: string;
};

const SYSTEM_PROMPT =
  "أنت مساعد NOVATEK. " +
  "أجب بالعربية الشامية بشكل واضح وطبيعي ومفيد. " +
  "لا تخترع أسعاراً أو مخزوناً أو مواصفات. " +
  "إذا لم تكن المعلومة مؤكدة، قل ذلك بوضوح. " +
  "ساعد المستخدم بمنتجات وخدمات NOVATEK.";

const TIMEOUT_MS = 8000;

function buildMessages(input: string, history: ChatMessage[] = []) {
  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...history
      .slice(-10)
      .map((message) => ({
        role:
          message.role === "assistant" || message.role === "model"
            ? "assistant"
            : "user",
        content: message.text,
      }))
      .filter((message) => message.content),
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
) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function askGroq(
  input: string,
  history: ChatMessage[]
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("NOVATEK Groq error: GROQ_API_KEY is missing");
    return null;
  }

  const model =
    process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  try {
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
          messages: buildMessages(input, history),
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

    const body = await res.json();

    const reply =
      body?.choices?.[0]?.message?.content?.trim();

    return reply || null;
  } catch (error) {
    console.error(
      "NOVATEK Groq request failed:",
      JSON.stringify({
        model,
        error:
          error instanceof Error
            ? error.name === "AbortError"
              ? "Groq request timed out"
              : error.message
            : "unknown error",
      })
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
    console.error(
      "NOVATEK OpenRouter error: OPENROUTER_API_KEY is missing"
    );
    return null;
  }

  const model =
    process.env.OPENROUTER_MODEL || "openrouter/free";

  try {
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
          messages: buildMessages(input, history),
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

    const body = await res.json();

    const reply =
      body?.choices?.[0]?.message?.content?.trim();

    return reply || null;
  } catch (error) {
    console.error(
      "NOVATEK OpenRouter request failed:",
      JSON.stringify({
        model,
        error:
          error instanceof Error
            ? error.name === "AbortError"
              ? "OpenRouter request timed out"
              : error.message
            : "unknown error",
      })
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
    console.error(
      "NOVATEK Gemini error: GEMINI_API_KEY is missing"
    );
    return null;
  }

  const model =
    process.env.GEMINI_MODEL || "gemini-3.8-flash";

  const contents = history
    .slice(-10)
    .map((message) => ({
      role:
        message.role === "assistant" || message.role === "model"
          ? "model"
          : "user",
      parts: [{ text: message.text }],
    }))
    .filter((message) => message.parts[0].text);

  contents.push({
    role: "user",
    parts: [{ text: input }],
  });

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            thinkingConfig: {
              thinkingLevel: "low",
            },
            maxOutputTokens: 700,
          },
        }),
      },
      8000
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

    const body = await res.json();

    const reply = body?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("")
      .trim();

    return reply || null;
  } catch (error) {
    console.error(
      "NOVATEK Gemini request failed:",
      JSON.stringify({
        model,
        error:
          error instanceof Error
            ? error.name === "AbortError"
              ? "Gemini request timed out"
              : error.message
            : "unknown error",
      })
    );

    return null;
  }
}

export async function askGemini(
  input: string,
  history: ChatMessage[] = []
) {
  console.log("NOVATEK AI: trying Groq");

  const groqReply = await askGroq(input, history);

  if (groqReply) {
    console.log("NOVATEK AI: Groq succeeded");
    return groqReply;
  }

  console.log("NOVATEK AI: Groq failed, trying OpenRouter");

  const openRouterReply = await askOpenRouter(
    input,
    history
  );

  if (openRouterReply) {
    console.log("NOVATEK AI: OpenRouter succeeded");
    return openRouterReply;
  }

  console.log("NOVATEK AI: OpenRouter failed, trying Gemini");

  const geminiReply = await askGeminiProvider(
    input,
    history
  );

  if (geminiReply) {
    console.log("NOVATEK AI: Gemini succeeded");
    return geminiReply;
  }

  console.error("NOVATEK AI: all providers failed");

  return null;
}
