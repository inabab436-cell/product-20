import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Phone, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderTimeline } from "@/components/customer/order-timeline";
import { trackOrder, type TrackedOrder } from "@/lib/order-tracking.functions";

export const Route = createFileRoute("/c/$slug/track")({
  head: ({ params }) => ({
    meta: [
      { title: `تتبع طلبك — ${params.slug}` },
      { name: "description", content: "تابع حالة طلبك باستخدام رقم الأوردر." },
      { property: "og:title", content: `تتبع طلبك — ${params.slug}` },
      { property: "og:description", content: "تابع حالة طلبك باستخدام رقم الأوردر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(trackOrder);
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(withPhone: boolean) {
    if (!orderNumber.trim()) return;
    setLoading(true);
    try {
      setRes(await fn({ data: { slug, orderNumber, phone: withPhone ? phone : null } }));
    } catch {
      setRes({ found: false, full: false, order: null, itemCount: 0 });
    } finally {
      setLoading(false);
    }
  }

  const o = res?.order;
  return (
    <div dir="rtl" className="mx-auto min-h-screen max-w-xl space-y-5 px-4 py-8">
      <Link to="/c/$slug" params={{ slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowRight className="h-4 w-4" /> العودة للمتجر
      </Link>
      <h1 className="text-2xl font-bold">تتبع طلبك</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); void run(false); }}
        className="flex gap-2"
      >
        <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="اكتب رقم الأوردر" />
        <Button type="submit" disabled={loading}><Search className="h-4 w-4" /> بحث</Button>
      </form>

      {res && !res.found && <p className="text-sm text-destructive">لم نجد طلبًا بهذا الرقم.</p>}

      {o && (
        <div className="space-y-4 rounded-2xl border p-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">طلب #{o.order_number}</span>
            <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
          </div>
          <p className="text-sm text-muted-foreground">عدد القطع: {res!.itemCount}</p>
          <OrderTimeline order={o} />

          {res!.full ? (
            <div className="space-y-2 border-t pt-3 text-sm">
              {res!.customerName && <p>الاسم: {res!.customerName}</p>}
              {res!.customerAddress && <p>العنوان: {res!.customerAddress}</p>}
              <ul className="space-y-1">
                {o.items.map((it, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{it.product_name} {[it.color, it.size].filter(Boolean).join(" / ")} × {it.quantity}</span>
                    {it.price != null && <span>{it.price} {it.currency ?? ""}</span>}
                  </li>
                ))}
              </ul>
              {o.total_price != null && <p className="font-semibold">الإجمالي: {o.total_price} {o.currency ?? ""}</p>}
              {o.payment_method && <p>طريقة الدفع: {o.payment_method}</p>}
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); void run(true); }}
              className="space-y-2 border-t pt-3"
            >
              <p className="text-sm">لرؤية كل التفاصيل، اكتب رقم الهاتف الذي سجّلت به الطلب:</p>
              <div className="flex gap-2">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="رقم الهاتف" />
                <Button type="submit" variant="secondary" disabled={loading}><Phone className="h-4 w-4" /> عرض</Button>
              </div>
              {res!.phoneMismatch && <p className="text-sm text-destructive">رقم الهاتف غير مطابق لهذا الطلب.</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
