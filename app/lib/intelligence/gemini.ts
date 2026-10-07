export async function askGemini(input: string, history: Array<{ role: string; text: string }> = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const contents = history.slice(-10).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));
  contents.push({ role: "user", parts: [{ text: input }] });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: "أنت مساعد NOVATEK. أجب بالعربية الشامية بشكل واضح ومختصر. لا تخترع أسعاراً أو مخزوناً أو مواصفات. إذا أُعطيت لك مصادر خارجية، اعتمد عليها واذكر عند الحاجة أن المعلومة من المصادر." }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim() || null;
}
