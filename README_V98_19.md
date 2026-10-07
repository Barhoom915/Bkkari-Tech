# NOVATEK V98.19 — Smart Laptop Comparison + AI Intelligence

## الجديد
- مقارنة جهازين فقط.
- زر «مقارنة» داخل كرت كل لابتوب.
- أسئلة متعددة قبل المقارنة، مع Multi-select للأسئلة المناسبة.
- نتيجة مخصصة حسب استخدام العميل وأولوياته.
- Gemini للتحليل النهائي وAI Chat.
- Router للمصادر: Cache → SerpApi/Tavily → PricesAPI عند الحاجة.
- Cache مشترك في Supabase حتى لا تتكرر طلبات البحث لنفس البيانات.
- endpoint لمعلومات SerpApi لاستهلاك الخطة.
- بنية مستقبلية لحصص المستخدمين والاشتراكات بدون تفعيل الدفع حالياً.
- فحص المقارنة يعرض المصادر المستخدمة.

## Environment Variables
في Vercel أضف:
- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash`
- `SERPAPI_KEY`
- `TAVILY_API_KEY`
- `PRICESAPI_KEY`
- `PRICESAPI_MARKET=us`

ولا تستخدم `NEXT_PUBLIC_` لأي مفتاح من هذه المفاتيح.

## Supabase
شغّل مرة واحدة:
`supabase/v98_19_intelligence.sql`

هذا ينشئ Cache مشترك، سجل استخدام المزودين، وجدول جاهز لحصص المقارنات المستقبلية.

## ملاحظة
لا يتم استدعاء كل المزودين مع كل مقارنة. الكاش أولاً، ثم مزود البحث الأساسي، ثم fallback عند الحاجة، وPricesAPI لبيانات الأسعار عند توفر المفتاح.
