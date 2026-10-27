import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/app/lib/supabase-server";
import { askGeminiWithMetadata } from "@/app/lib/intelligence/gemini";
import { beginAiUsage, recordAiUsage } from "@/app/lib/intelligence/usage-ledger";
import { researchLaptop } from "@/app/lib/intelligence/providers";
import { readCache, writeCache } from "@/app/lib/intelligence/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const usageStartedAt = Date.now();
  let usageUserId: string | null = null;
  let usageProvider = "fallback_chain";
  let usageModel: string | null = null;
  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const lastMessage = messages[messages.length - 1];
    const last = getMessageText(lastMessage);

    if (!last) {
      return NextResponse.json({
        reply: "اكتب سؤالك أولاً."
      });
    }

    let usage: Awaited<ReturnType<typeof beginAiUsage>> | null = null;
    try {
      usage = await beginAiUsage(request);
      usageUserId = usage.user?.id ?? null;
    } catch (error) {
      console.error("NOVATEK AI quota check failed:", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ reply: "المساعد الذكي غير متاح مؤقتاً بسبب تعذر التحقق من حدود الاستخدام. جرّب لاحقاً." }, { status: 503 });
    }

    if (!usage.quota.allowed) {
      const reason = usage.quota.reason || "rate_limited";
      await recordAiUsage({ userId: usageUserId, provider: "quota_guard", status: "failed", latencyMs: Date.now() - usageStartedAt, errorCode: reason });
      const message = reason === "daily_limit"
        ? "وصلت للحد اليومي المجاني للمساعد الذكي. جرّب بكرا."
        : reason === "monthly_limit"
          ? "وصلت للحد الشهري المجاني للمساعد الذكي."
          : "عم تبعت طلبات بسرعة كبيرة. انتظر شوي وجرب مرة ثانية.";
      return NextResponse.json({ reply: message, usage: usage.quota }, {
        status: 429,
        headers: { "Retry-After": reason === "rate_limited" ? "60" : "3600", "Cache-Control": "no-store" }
      });
    }

    let context = "";

    /*
     * V98.24:
     * لا نستخدم SerpApi/Tavily/PricesAPI مع كل سؤال.
     * البحث الخارجي يحصل فقط عندما المستخدم يطلب معلومة حديثة
     * أو بحثاً أو سعراً/عرضاً.
     */
    const recentConversationText = messages.slice(-8).map(getMessageText).join("\n");
    const laptopTopicPattern = /(لابتوب|لابتوبات|حاسوب|كمبيوتر|جهاز|مواصفات|معالج|كرت|بطارية|رام|تخزين|شاشة|ssd|nvme|gpu|cpu)/i;
    const wantsToSeeProduct = /(وين\s*(بلاقي|بلاقيه|بشوف|شوف|بشوفه|بقدر شوف|موجود)|كيف\s*(بدي\s*)?(شوف|شوفه|بشوف|بلاقي)|فرجيني|ورجيني|عرض\s*(الجهاز|المنتج)|شوف\s*(الجهاز|هالجهاز)|وين\s*(الجهاز|المنتج))/i.test(last);
    const previousLaptopRequest = [...messages.slice(0, -1)]
      .reverse()
      .find((message: any) => message?.role === "user" && laptopTopicPattern.test(getMessageText(message)));
    const laptopQuestion =
      laptopTopicPattern.test(last) ||
      (Boolean(previousLaptopRequest) && wantsToSeeProduct && laptopTopicPattern.test(recentConversationText));
    const catalogQuery = laptopQuestion && !laptopTopicPattern.test(last) && previousLaptopRequest
      ? getMessageText(previousLaptopRequest)
      : last;
    const productDisplayRequest = laptopQuestion && (wantsToSeeProduct || /(رشح|اقترح|فرجيني|اعرض|قارن|اختار|أنسب|مناسب|لابتوب|لابتوبات|جهاز|حاسوب|كمبيوتر)/i.test(last));

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

    // Ground recommendations in real, currently available NOVATEK stock.
    let catalogProducts: Array<{
      id: number; name: string; brand: string | null; model: string | null;
      category: string | null; price: number; cpu: string | null; ram: string | null;
      storage: string | null; gpu: string | null; screen_size: string | null;
      condition: string | null; description: string | null; features: string[] | null;
      images: string[] | null; stock_quantity: number; is_featured: boolean;
    }> = [];
    if (laptopQuestion) {
      try {
        const supabase = await createServerClient();
        const { data, error } = await supabase
          .from("laptops")
          .select("id,name,brand,model,category,price,cpu,ram,storage,gpu,screen_size,condition,description,features,images,stock_quantity,is_featured")
          .eq("is_available", true)
          .gt("stock_quantity", 0)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        catalogProducts = (data ?? []) as typeof catalogProducts;
      } catch (error) {
        console.error("NOVATEK AI catalog grounding failed:", error instanceof Error ? error.message : "unknown");
      }
    }

    const budgetMatch = catalogQuery.match(/(?:ميزانيتي|بحدود|حدود|أقل من|تحت|budget)[^0-9]{0,16}(\d{2,4})|(?:\$|usd)?\s*(\d{2,4})\s*(?:\$|دولار|usd)/i);
    const budget = budgetMatch ? Number(budgetMatch[1] || budgetMatch[2]) : null;
    const gamingQuestion = /(جيمنج|gaming|ألعاب|العاب|للعب|كرت شاشة قوي)/i.test(catalogQuery);
    const requestedTwoGb = /(2\s?gb|2\s?جيجا|2\s?غ\.?ب)/i.test(last);
    const queryWords = last.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 2);
    const rankedCatalogProducts = [...catalogProducts].sort((a, b) => {
      const score = (p: typeof catalogProducts[number]) => {
        const haystack = `${p.name} ${p.brand || ""} ${p.model || ""} ${p.category || ""} ${p.cpu || ""} ${p.ram || ""} ${p.storage || ""} ${p.gpu || ""} ${p.description || ""}`.toLowerCase();
        let value = queryWords.reduce((total, word) => total + (haystack.includes(word) ? 2 : 0), 0);
        if (gamingQuestion && /(gaming|جيمنج|rtx|gtx|rx\s?\d|quadro|p\d{3,4}|radeon|geforce)/i.test(haystack)) value += 5;
        if (requestedTwoGb && /2\s?gb|2\s?جيجا|2\s?غ\.?ب/i.test(p.gpu || "")) value += 8;
        if (budget !== null && budget > 0) value += p.price <= budget ? 4 : -Math.min(6, (p.price - budget) / budget * 6);
        if (p.is_featured) value += 1;
        return value;
      };
      return score(b) - score(a);
    });
    const groundedProducts = rankedCatalogProducts.slice(0, 12);

    const catalogContext = catalogProducts.length
      ? `\n\nبيانات كتالوج NOVATEK الفعلية (المرجع الأساسي، لا تقترح أجهزة غير موجودة هنا):\n${groundedProducts.map((p, index) =>
          `${index + 1}. ${p.name} | الشركة: ${p.brand || "غير محدد"} | الموديل: ${p.model || "غير محدد"} | التصنيف: ${p.category || "غير محدد"} | السعر: ${p.price} | CPU: ${p.cpu || "غير مسجل"} | RAM: ${p.ram || "غير مسجل"} | التخزين: ${p.storage || "غير مسجل"} | GPU: ${p.gpu || "غير مسجل"} | الشاشة: ${p.screen_size || "غير مسجل"} | الحالة: ${p.condition || "غير مسجلة"} | الوصف: ${p.description || "لا يوجد"} | الميزات: ${Array.isArray(p.features) ? p.features.join(", ") : "لا توجد"}`
        ).join("\n")}\nإذا لم يوجد جهاز مناسب تماماً، وضّح ذلك ولا تخترع موديلات أو مواصفات. لا تصف كرت 2GB بأنه مناسب للألعاب الحديثة المتوسطة من دون توضيح حدوده، ولا تغيّر أي مواصفة مسجلة.`
      : laptopQuestion
        ? "\n\nتعذر تحميل كتالوج الأجهزة الفعلي حالياً. لا تذكر موديلات أو أسعاراً أو مواصفات محددة من عندك؛ أخبر الزبون أنك لا تستطيع تأكيد الأجهزة المتوفرة الآن."
        : "";

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
    const result = await askGeminiWithMetadata(last + context + catalogContext, history);

    if (result?.reply) {
      usageProvider = result.provider;
      usageModel = result.model;
      await recordAiUsage({ userId: usageUserId, provider: usageProvider, model: usageModel, status: "success", latencyMs: Date.now() - usageStartedAt });
      const products = productDisplayRequest
        ? (gamingQuestion
            ? groundedProducts.filter((p) => /(gaming|جيمنج|rtx|gtx|rx\s?\d|quadro|p\d{3,4}|radeon|geforce)/i.test(`${p.name} ${p.category || ""} ${p.gpu || ""}`)).slice(0, 3)
            : groundedProducts.slice(0, 3))
        : [];
      return NextResponse.json(
        { reply: result.reply, usage: usage?.quota, products },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    await recordAiUsage({ userId: usageUserId, provider: "fallback_chain", status: "failed", latencyMs: Date.now() - usageStartedAt, errorCode: "all_providers_unavailable" });

    return NextResponse.json(
      {
        reply:
          "المساعد الذكي غير متاح حالياً. جرّب بعد شوي 🤖"
      },
      { status: 503 }
    );
  } catch (error) {
    await recordAiUsage({ userId: usageUserId, provider: usageProvider, model: usageModel, status: "failed", latencyMs: Date.now() - usageStartedAt, errorCode: "route_error" });
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
