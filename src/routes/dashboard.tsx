import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package, ScrollText, Truck, PhoneCall, Globe, ArrowLeft,
  Bell, CreditCard, AlertTriangle, ShoppingBag, Check, HelpCircle,
  MessagesSquare, Clock4, BadgePercent, ChevronDown, LifeBuoy,
  ShieldAlert, MailCheck, TrendingUp, Bot, Settings2, Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HubTabBar } from "@/components/hub/hub-shell";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logo from "@/assets/cupai-logo.png.asset.json";
import {
  listNotifications, markNotificationRead, type NotificationRow, type NotificationType,
} from "@/lib/notifications.functions";
import {
  listConversations, setConversationAgent,
  getMerchantAgentSettings, setMerchantAgentGloballyDisabled,
  listInterventions,
  type ConversationRow,
} from "@/lib/conversations.functions";

import { getEarningsSummary } from "@/lib/orders.functions";
import { getCurrentActor } from "@/lib/staff.functions";
import { hasPermission, type StaffPermission } from "@/lib/staff-types";




export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم · cupai" },
      { name: "description", content: "أدر منتجاتك، سياساتك، شحنك، وبيانات تواصلك." },
      { property: "og:title", content: "لوحة التحكم · cupai" },
      { property: "og:description", content: "ملخص الطلبات والعملاء والأرباح وإدارة المتجر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

type Tile = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
  /** Permission required to open this tile. */
  perm: StaffPermission;
};

const TILES: Tile[] = [
  { to: "/orders", label: "الطلبات", description: "متابعة وتجهيز", icon: <ShoppingBag className="h-6 w-6" />, tone: "bg-hub-coral-soft text-hub-coral", perm: "orders" },
  { to: "/products", label: "المخزون", description: "المنتجات والكميات", icon: <Package className="h-6 w-6" />, tone: "bg-hub-mint-soft text-hub-mint", perm: "brand_data" },
  { to: "/published", label: "الموقع", description: "واجهة متجرك", icon: <Globe className="h-6 w-6" />, tone: "bg-hub-sky-soft text-hub-sky", perm: "settings" },
  { to: "/offers", label: "العروض", description: "الخصومات الحالية", icon: <BadgePercent className="h-6 w-6" />, tone: "bg-hub-gold-soft text-hub-gold", perm: "brand_data" },
  { to: "/earnings", label: "الأرباح", description: "ملخص التحصيل", icon: <TrendingUp className="h-6 w-6" />, tone: "bg-hub-mint-soft text-hub-mint", perm: "earnings" },
  { to: "/shipping", label: "الشحن", description: "المناطق والتكلفة", icon: <Truck className="h-6 w-6" />, tone: "bg-hub-sky-soft text-hub-sky", perm: "brand_data" },
  { to: "/settings/payment-methods", label: "الدفع", description: "طرق استلام المال", icon: <CreditCard className="h-6 w-6" />, tone: "bg-hub-coral-soft text-hub-coral", perm: "settings" },
  { to: "/contacts", label: "التواصل", description: "بيانات الاتصال", icon: <PhoneCall className="h-6 w-6" />, tone: "bg-hub-sky-soft text-hub-sky", perm: "brand_data" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value);
}

function DashboardPage() {
  const actorQuery = useQuery({
    queryKey: ["current-actor"],
    queryFn: () => getCurrentActor(),
    staleTime: 60_000,
  });
  const actor = actorQuery.data ?? null;
  const can = (perm: StaffPermission) => (actor ? hasPermission(actor, perm) : false);
  const isOwner = actor?.isOwner ?? false;

  const notifs = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    refetchInterval: 15000,
    enabled: !!actor,
  });
  const earnings = useQuery({
    queryKey: ["earnings-summary"],
    queryFn: () => getEarningsSummary(),
    refetchInterval: 30000,
    enabled: can("earnings"),
  });
  const visibleTiles = useMemo(() => TILES.filter((t) => can(t.perm)), [actor]);


  const unread = (notifs.data ?? []).filter((n) => !n.is_read).length;
  const orderCount = earnings.data?.orderCount ?? 0;
  const pendingProfit = earnings.data?.pendingProfit ?? 0;

  return (
    <div dir="rtl" className="hub min-h-screen pb-24">
      <header className="hub-hero px-5 pb-10 pt-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={logo.url} alt="cupai" className="h-11 w-11 shrink-0 rounded-2xl" />
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold">متجرك</span>
              <span className="hub-latin block truncate text-xs opacity-70">cupai</span>
            </span>
          </Link>
          <a href="#notifications" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/10" aria-label="فتح الإشعارات">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            )}
          </a>
        </div>
      </header>

      <div className="hub-sheet-top -mt-6 pt-7">
        <div className="mx-auto w-full max-w-3xl space-y-7 px-5 pb-4">
          <section className="space-y-3">
            <h1 className="px-1 text-lg font-bold">نظرة سريعة</h1>
            <div className="grid grid-cols-2 gap-3">
              {can("orders") && (
              <Link to="/orders" className="hub-card flex min-h-28 flex-col justify-between p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <ShoppingBag className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs text-muted-foreground">الطلبات</span>
                  <span className="block text-2xl font-bold">{earnings.isLoading ? "—" : orderCount}</span>
                </span>
              </Link>
              )}
              {can("earnings") && (
              <Link to="/earnings" className="hub-card col-span-2 flex items-center gap-4 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Clock4 className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted-foreground">أرباح قيد التحصيل</span>
                  <span className="mt-0.5 block text-2xl font-bold">
                    {earnings.isLoading ? "—" : formatMoney(pendingProfit)}
                    {earnings.data?.currency && <small className="me-1 text-xs font-medium text-muted-foreground">{earnings.data.currency}</small>}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">بعد خصم التكاليف المسجلة</span>
                </span>
                <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
              )}
            </div>
          </section>

          {visibleTiles.length > 0 && (
          <section className="space-y-3">
            <h2 className="px-1 text-sm font-bold">إدارة المتجر</h2>
            <div className="grid grid-cols-3 gap-3">
              {visibleTiles.map((t) => (
                <Link key={t.to} to={t.to as never} className="hub-card flex min-h-28 flex-col items-center justify-center gap-2.5 p-2 text-center transition-transform active:scale-[0.97]">
                  <span className={`grid h-13 w-13 shrink-0 place-items-center rounded-2xl shadow-sm ${t.tone}`}>{t.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold">{t.label}</span>
                    <span className="block text-[9px] text-muted-foreground">{t.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
          )}

          <section className="space-y-2.5">
            <h2 className="px-1 text-sm font-bold">روابط مساعدة</h2>
            {can("settings") && (
            <Link to="/settings/notifications" className="hub-card flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
                <MailCheck className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">إشعارات البريد</span>
              <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
            )}
            {isOwner && (
            <Link to="/team" className="hub-card flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
                <Users className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">الفريق والصلاحيات</span>
              <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
            )}
          </section>

           <NotificationsSection rows={notifs.data ?? []} loading={notifs.isLoading} error={notifs.error} />
        </div>
      </div>

      <HubTabBar />
    </div>
  );
}

const NOTIF_META: Record<NotificationType, {

  label: string; Icon: React.ComponentType<{ className?: string }>;
  bg: string; text: string; ring: string;
}> = {
  ai_error: {
    label: "خطأ في الذكاء الاصطناعي",
    Icon: AlertTriangle,
    bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/30",
  },
  new_order: {
    label: "طلب جديد",
    Icon: ShoppingBag,
    bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "ring-emerald-500/30",
  },
  human_needed: {
    label: "استدعاء تدخل",
    Icon: LifeBuoy,
    bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/30",
  },

  missing_information: {
    label: "معلومة ناقصة",
    Icon: HelpCircle,
    bg: "bg-blue-500/10", text: "text-blue-600", ring: "ring-blue-500/30",
  },
  missing_info_followup: {
    label: "تم إبلاغ العملاء المنتظرين",
    Icon: MailCheck,
    bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "ring-emerald-500/30",
  },
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
  } catch { return iso; }
}


function notificationTarget(_row: NotificationRow): { to: "/orders"; params?: undefined } {
  return { to: "/orders" };
}

function NotificationsSection({ rows, loading, error }: { rows: NotificationRow[]; loading: boolean; error: unknown }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: any) => toast.error(e?.message || "تعذر التحديث"),
  });

  const unreadCount = rows.filter((r) => !r.is_read).length;

  return (
    <section id="notifications" className="scroll-mt-20">
      <Collapsible open={open} onOpenChange={setOpen} className="hub-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="h-auto w-full justify-start rounded-none p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-hub-coral-soft text-hub-coral"><Bell className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1 text-right">
              <span className="block text-sm font-bold">الإشعارات</span>
              <span className="block text-xs font-normal text-muted-foreground">{loading ? "جارٍ التحميل…" : unreadCount ? `${unreadCount} غير مقروء` : "لا يوجد جديد"}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border p-3">

      {Boolean(error) && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {(error as Error)?.message || "تعذر تحميل الإشعارات."}
        </div>
      )}

      {!loading && rows.length === 0 && !error && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          لا توجد إشعارات بعد.
        </div>
      )}

      <ul className="space-y-2">
        {rows.slice(0, 8).map((n) => {
          const meta = NOTIF_META[n.type] ?? NOTIF_META.ai_error;
          const Icon = meta.Icon;
          return (
            <li key={n.id} className={`flex items-start gap-2 rounded-xl border p-3 ${
                n.is_read ? "border-border/60 bg-background/70" : "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
              }`}
            >
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-2 ${meta.bg} ${meta.text} ${meta.ring}`}>
                <Icon className="h-4 w-4" />
              </div>
               <Link {...notificationTarget(n)} className="min-w-0 flex-1" onClick={() => !n.is_read && markRead.mutate(n.id)}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${meta.text}`}>{meta.label}</span>
                  {!n.is_read && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      جديد
                    </span>
                  )}
                  <span className="ms-auto text-[11px] text-muted-foreground">{formatTime(n.created_at)}</span>
                </div>
                {n.message && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {n.message}
                  </p>
                )}
               </Link>
              {!n.is_read && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 shrink-0"
                  onClick={() => markRead.mutate(n.id)}
                  disabled={markRead.isPending}
                >
                  <Check className="h-3.5 w-3.5" />
                  تحديد كمقروء
                </Button>
              )}
            </li>
          );
        })}
      </ul>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
