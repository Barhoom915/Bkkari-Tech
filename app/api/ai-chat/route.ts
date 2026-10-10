import { NextResponse } from "next/server";
import { askGemini } from "@/app/lib/intelligence/gemini";
import { researchLaptop } from "@/app/lib/intelligence/providers";
import { readCache, writeCache } from "@/app/lib/intelligence/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getMessageText(message: any): string {
  if (!message) return "";

  if (typeof message.text === "string") {
    return message.text.trim();
  }

  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((item: any) =>
        typeof item === "string"
          ? item
          : typeof item?.text === "string"
            ? item.text
            : ""
      )
      .join(" ")
      .trim();
  }

  return "";
}

function wantsWebResearch(text: string): boolean {
  return /(ابحث|بحث|مصادر|المصادر|معلومة حديثة|آخر سعر|السعر الحالي|سعر اليوم|أسعار اليوم|عرض|عروض|متوفر|متوفر حاليا|موجود بالسوق|السوق|شراء|وين بقدر اشتري)/i.test(
    text
  );
}

function wantsPriceSearch(text: string): boolean {
  return /(سعر|أسعار|عرض|عروض|شراء|بكم|كم سعر|السوق)/i.test(text);
}

export async function POST(request: Request) {
  try {
    // V98.33: bound request size and conversation history before calling any AI provider.
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 64 * 1024) {
      return NextResponse.json({ reply: "الرسالة طويلة كتير. اختصرها وجرب مرة تانية." }, { status: 413 });
    }

    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-13) : [];
    const incomingChars = messages.reduce((sum: number, message: any) => sum + getMessageText(message).length, 0);
    if (incomingChars > 24000) {
      return NextResponse.json({ reply: "المحادثة طويلة كتير. افتح محادثة جديدة أو اختصر الرسائل." }, { status: 413 });
    }

    const lastMessage = messages[messages.length - 1];
    const last = getMessageText(lastMessage).slice(0, 6000);

    if (!last) {
      return NextResponse.json({
        reply: "اكتب سؤالك أولاً."
      });
    }

    let context = "";

    /*
     * V98.24:
     * لا نستخدم SerpApi/Tavily/PricesAPI مع كل سؤال.
     * البحث الخارجي يحصل فقط عندما المستخدم يطلب معلومة حديثة
     * أو بحثاً أو سعراً/عرضاً.
     */
    const laptopQuestion =
      /(لابتوب|لابتوبات|حاسوب|كمبيوتر|جهاز|مواصفات|معالج|كرت|بطارية|رام|تخزين|شاشة|ssd|nvme|gpu|cpu)/i.test(
        last
      );

    if (laptopQuestion && wantsWebResearch(last)) {
      try {
        const normalized = last
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);

        const key = `chat-research-v98-24:${normalized}`;

        const cached = await readCache(key, 21600);

        if (cached) {
          context = `

معلومات خارجية محفوظة من بحث سابق:
${cached.summary || ""}

المصادر:
${Array.isArray(cached.sources)
  ? cached.sources
      .map((s: any) => `${s.title || ""}${s.url ? ` — ${s.url}` : ""}`)
      .join("\n")
  : ""}`;
        } else {
          /*
           * البحث الخارجي اختياري.
           * إذا فشل، لا نوقف المحادثة ولا نرمي Error.
           */
          const data = await researchLaptop(
            wantsPriceSearch(last)
              ? last
              : `${last} laptop specifications`
          ).catch((error) => {
            console.error(
              "NOVATEK V98.24 research failed:",
              error instanceof Error ? error.message : "unknown error"
            );
            return [];
          });

          if (data.length) {
            const summary = data
              .map((x) => x.summary)
              .filter(Boolean)
              .join("\n\n");

            const sources = data.flatMap((x) => x.sources || []);

            context = `

معلومات خارجية حديثة:
${summary}

المصادر:
${sources
  .map((s) => `${s.title || ""}${s.url ? ` — ${s.url}` : ""}`)
  .join("\n")}`;

            await writeCache(
              key,
              {
                query: last,
                summary,
                facts: {},
                sources,
                fetchedAt: new Date().toISOString()
              },
              21600
            ).catch((error) => {
              console.error(
                "NOVATEK V98.24 cache write failed:",
                error instanceof Error ? error.message : "unknown error"
              );
            });
          }
        }
      } catch (error) {
        /*
         * مهم جداً:
         * أي مشكلة بالـCache أو البحث الخارجي لا تمنع Gemini من الرد.
         */
        console.error(
          "NOVATEK V98.24 external context error:",
          error instanceof Error ? error.message : "unknown error"
        );
      }
    }

    const history = messages
      .slice(0, -1)
      .map((message: any) => {
        const text = getMessageText(message);

        return {
          role:
            message?.role === "assistant" || message?.role === "model"
              ? "assistant"
              : "user",
          text
        };
      })
      .filter((message: any) => message.text);

    /*
     * محرك الذكاء الاصطناعي متعدد المزودين.
     * البحث الخارجي مجرد Context إضافي.
     */
    const reply = await askGemini(
      last + context,
      history
    );

    if (reply) {
      return NextResponse.json({ reply });
    }

    return NextResponse.json(
      {
        reply:
          "المساعد الذكي غير متاح حالياً. جرّب بعد شوي 🤖"
      },
      { status: 503 }
    );
  } catch (error) {
    console.error(
      "NOVATEK V98.24 AI chat error:",
      error instanceof Error ? error.message : "unknown error"
    );

    return NextResponse.json(
      {
        reply:
          "صار خطأ مؤقت بالمساعد الذكي. جرّب مرة ثانية بعد شوي 🤖"
      },
      { status: 500 }
    );
  }
}
