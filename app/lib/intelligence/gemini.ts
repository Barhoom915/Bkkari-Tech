type ChatMessage = {
  role: string;
  text: string;
};

export async function askGemini(
  input: string,
  history: ChatMessage[] = []
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("NOVATEK Gemini error: GEMINI_API_KEY is missing");
    return null;
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

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

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 55000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "أنت مساعد NOVATEK. " +
                "أجب بالعربية الشامية بشكل واضح وطبيعي ومفيد. " +
                "لا تخترع أسعاراً أو مخزوناً أو مواصفات. " +
                "إذا لم تكن المعلومة مؤكدة، قل ذلك بوضوح. " +
                "ساعد المستخدم بمنتجات وخدمات NOVATEK.",
            },
          ],
        },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 700,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      let errorBody = "";

      try {
        errorBody = await res.text();
      } catch {
        errorBody = "";
      }

      console.error(
        "NOVATEK Gemini API error:",
        JSON.stringify({
          status: res.status,
          statusText: res.statusText,
          model,
          body: errorBody.slice(0, 1000),
        })
      );

      return null;
    }

    const body = await res.json();

    const reply = body?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error(
        "NOVATEK Gemini empty response:",
        JSON.stringify({
          model,
          finishReason:
            body?.candidates?.[0]?.finishReason || null,
        })
      );

      return null;
    }

    return reply;
  } catch (error) {
    console.error(
      "NOVATEK Gemini request failed:",
      JSON.stringify({
        model,
        error:
          error instanceof Error
            ? error.name === "AbortError"
              ? "Gemini request timed out after 55 seconds"
              : error.message
            : "unknown error",
      })
    );

    return null;
  } finally {
    clearTimeout(timeout);
  }
}
