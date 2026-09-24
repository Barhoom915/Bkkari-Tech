import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { getSiteSetting } from "@/app/lib/site-settings";

const fallback = [
  { q: "كيف بطلب لابتوب؟", a: "اختار الجهاز، افتح التفاصيل، أضفه للسلة وكمل بيانات الطلب. الإدارة بتتواصل معك لتأكيد الطلب." },
  { q: "كيف بيصير التوصيل؟", a: "مننسق معك عنوان التسليم، والتوصيل متاح داخل المحافظات بحسب تكلفة ومدة الشحن الظاهرة بالموقع." },
  { q: "كيف بتتبع طلبي؟", a: "من صفحة تتبع الطلب أدخل رقم الطلب ورقم الهاتف المستخدم وقت الطلب." },
  { q: "كيف بشحن رصيد المحفظة؟", a: "من صفحة المحفظة حوّل المبلغ بالطريقة المتاحة، ارفع الإيصال وأرسل رقم العملية." },
  { q: "هل في استبدال واسترجاع؟", a: "نعم، حسب سياسة الاستبدال والاسترجاع المنشورة بالموقع وحالة المنتج." },
];

export default async function FAQPage() {
  const setting = await getSiteSetting<{ items?: typeof fallback }>("faq", { items: fallback });
  const items = setting.items?.length ? setting.items : fallback;
  return <><Header/><main className="info-page" dir="rtl"><div className="info-wrap"><div className="info-hero"><span>SUPPORT / FAQ</span><h1>الأسئلة الشائعة</h1><p>أجوبة سريعة على أكثر الأسئلة اللي ممكن تحتاجها قبل وبعد الطلب.</p></div><section className="info-grid">{items.map((item, i) => <details key={i} className="faq-item"><summary>{item.q}<b>+</b></summary><p>{item.a}</p></details>)}</section></div></main><Footer/></>;
}
