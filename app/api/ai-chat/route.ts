import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { messages = [] } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reply: "مساعد الذكاء الاصطناعي قيد التجهيز. حالياً فيك تسألنا مباشرة عبر واتساب أو تيليغرام." });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: "أنت مساعد متجر Bkkari Tech. أجب بالعربية الشامية باختصار ووضوح. ساعد في اختيار اللابتوبات، شرح الخدمات الرقمية، تصميم وبرمجة المواقع، ومعلومات المتجر العامة. لا تخترع أسعاراً أو مخزوناً أو مواعيد غير موجودة. إذا احتاج السؤال بيانات مباشرة من المتجر فقل إن المستخدم يمكنه التواصل مع المتجر.",
      input: messages.slice(-10).map((m: { role: string; text: string }) => ({ role: m.role === "assistant" ? "assistant" : "user", content: [{ type: "input_text", text: m.text }] })),
      max_output_tokens: 350,
    }),
  });

  if (!response.ok) return NextResponse.json({ reply: "تعذر تشغيل المساعد حالياً. جرّب بعد شوي." }, { status: 200 });
  const data = await response.json();
  return NextResponse.json({ reply: data.output_text || "ما قدرت أطلع جواب هلق." });
}
