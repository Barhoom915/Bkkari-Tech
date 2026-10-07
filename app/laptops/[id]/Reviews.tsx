"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase-browser";

type Review = {
  id: number;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function getAccountName(user: User | null) {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return String(meta.full_name ?? meta.name ?? meta.user_name ?? meta.preferred_username ?? user.email?.split("@")[0] ?? "").trim();
}

export default function Reviews({ laptopId }: { laptopId: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [accountName, setAccountName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let alive = true;
    void Promise.all([
      supabase
        .from("reviews")
        .select("id, customer_name, rating, comment, created_at")
        .eq("laptop_id", laptopId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]).then(([reviewsResult, userResult]) => {
      if (!alive) return;
      setReviews((reviewsResult.data ?? []) as Review[]);
      const current = userResult.data.user ?? null;
      setUser(current);
      setAccountName(getAccountName(current));
      setLoadingUser(false);
    });
    return () => { alive = false; };
  }, [laptopId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const { data: auth } = await supabase.auth.getUser();
    const current = auth.user ?? user;
    const displayName = getAccountName(current);

    if (!current) {
      window.location.href = `/login?next=/laptops/${laptopId}`;
      return;
    }
    if (!displayName) {
      setErrorMessage("أضف اسمك من صفحة الحساب أولاً، وبعدها فيك تضيف تقييم.");
      return;
    }

    setSaving(true);
    const { data: newReview, error } = await supabase
      .from("reviews")
      .insert({
        laptop_id: laptopId,
        customer_name: displayName,
        rating,
        comment: comment.trim() || null,
        is_approved: true,
      })
      .select("id, customer_name, rating, comment, created_at")
      .single();

    setSaving(false);
    if (error) {
      setErrorMessage("تعذر حفظ التقييم حالياً. جرّب مرة ثانية.");
      return;
    }

    if (newReview) setReviews(prev => [newReview as Review, ...prev]);
    setSubmitted(true);
    setComment("");
    setRating(5);
  }

  return (
    <section className="reviews-section mt-10">
      <div className="reviews-heading">
        <div>
          <span>REVIEWS</span>
          <h2 className="text-lg font-bold text-ink">آراء الزبائن</h2>
        </div>
        {reviews.length > 0 && <b>{reviews.length} تقييم</b>}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">لسا ما في تقييمات لهاد الجهاز، كون أول واحد يقيّم!</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="review-item rounded-xl border border-line bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-ink">{r.customer_name}</span>
                <span className="review-stars-display" aria-label={`${r.rating} من 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {submitted ? (
        <p className="mt-6 rounded-xl border border-line bg-card p-4 text-sm text-ink-soft">
          شكراً إلك! تقييمك انضاف باسم حسابك ❤️
        </p>
      ) : loadingUser ? (
        <div className="mt-6 rounded-xl border border-line bg-card p-4 text-sm text-ink-soft">جاري التحقق من الحساب...</div>
      ) : !user ? (
        <div className="mt-6 rounded-xl border border-line bg-card p-4 text-sm text-ink-soft">
          لازم تسجّل دخول حتى تضيف تقييم. <a className="font-bold text-orange" href={`/login?next=/laptops/${laptopId}`}>تسجيل الدخول ←</a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border border-line bg-card p-4">
          <div className="review-account-note">
            <span className="review-account-avatar">{accountName.charAt(0).toUpperCase() || "N"}</span>
            <div><small>رح يظهر التقييم باسم حسابك</small><b>{accountName || "مستخدم NOVATEK"}</b></div>
          </div>

          <div className="review-rating-picker flex items-center gap-2" aria-label="اختيار التقييم">
            <span className="text-sm text-ink-soft">التقييم:</span>
            <div className="review-stars-input" role="radiogroup" aria-label="التقييم من نجمة إلى خمس نجوم">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className={`review-star ${n <= rating ? "is-selected" : ""}`}
                  aria-label={`${n} نجوم`}
                  aria-pressed={n === rating}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="تعليقك (اختياري)"
            rows={3}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue"
          />

          {errorMessage && <p className="review-error">{errorMessage}</p>}

          <button disabled={saving} className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "جاري الإرسال..." : "إرسال التقييم"}
          </button>
        </form>
      )}
    </section>
  );
}
