"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Review = {
  id: number;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export default function Reviews({ laptopId }: { laptopId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("id, customer_name, rating, comment, created_at")
      .eq("laptop_id", laptopId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data ?? []));
  }, [laptopId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { data: newReview, error } = await supabase.from("reviews").insert({
      laptop_id: laptopId,
      customer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
      is_approved: true,
    }).select("id, customer_name, rating, comment, created_at").single();
    if (error) {
      setSubmitted(false);
      return;
    }
    if (newReview) setReviews(prev => [newReview as Review, ...prev]);
    setSubmitted(true);
    setName("");
    setComment("");
    setRating(5);
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-ink">آراء الزبائن</h2>

      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">لسا ما في تقييمات لهاد الجهاز، كون أول واحد يقيّم!</p>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{r.customer_name}</span>
                <span className="text-orange">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {submitted ? (
        <p className="mt-6 rounded-xl border border-line bg-card p-4 text-sm text-ink-soft">
          شكراً إلك! تقييمك ظهر مباشرة ضمن آراء الزبائن ❤️
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border border-line bg-card p-4">
          <p className="text-sm font-medium text-ink">شارك رأيك بهاد الجهاز</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="اسمك"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-soft">التقييم:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className={n <= rating ? "text-orange" : "text-ink-soft/40"}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="تعليقك (اختياري)"
            rows={3}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue"
          />
          <button className="rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white">
            إرسال التقييم
          </button>
        </form>
      )}
    </section>
  );
}
