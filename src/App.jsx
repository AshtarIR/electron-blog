import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Menu, X, Clock, Calendar, Share2, Link2, ChevronLeft, ChevronRight,
  Send, Instagram, Plus, Pencil, Trash2, Image as ImageIcon, Save,
  LayoutDashboard, FileText, Tags, Eye, EyeOff, Atom, Mail, MapPin, Phone,
  ArrowUpLeft, Quote as QuoteIcon, Twitter, LogOut, Lock,
  Bold, Italic, Underline, List, ListOrdered, Heading2, Undo2, Redo2, Star,
  AlertTriangle, RefreshCw, Check
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const COLORS = {
  primary: "#C1121F",
  primaryDark: "#8f0d17",
  ink: "#212224",
  bg: "#F8F9FA",
};

/* ------------------------------------------------------------------ */
/*  Content model                                                      */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  { id: "politics", fa: "سیاست", en: "Politics", note: "قدرت، نهاد، تصمیم" },
  { id: "geopolitics", fa: "ژئوپلیتیک", en: "Geopolitics", note: "جغرافیا و منافع" },
  { id: "governance", fa: "حکمرانی", en: "Governance", note: "دولت و اداره" },
  { id: "economics", fa: "اقتصاد سیاسی", en: "Economics", note: "منابع و توزیع" },
  { id: "history", fa: "تاریخ", en: "History", note: "الگوهای تکرارشونده" },
  { id: "ir", fa: "روابط بین‌الملل", en: "Int'l Relations", note: "نظم جهانی" },
];

const catById = (id) => CATEGORIES.find((c) => c.id === id);

const QUOTE = {
  fa: "قدرتِ واقعیِ یک تحلیل، نه در هیجانِ لحظه که در دقتِ نگاهِ آن به آینده نهفته است.",
  by: "الکترون",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function readingTime(html) {
  const text = (html || "").replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
}
function uid() {
  return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Turns a title into a URL-safe slug when possible; falls back to a short
// random code for titles that are entirely non-Latin (e.g. Persian) since
// those wouldn't produce a readable slug anyway.
function slugify(title) {
  const base = (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || shortCode();
}
function shortCode() {
  return Math.random().toString(36).slice(2, 8);
}

// Maps a Supabase `articles` row (snake_case) to the shape the UI expects.
function fromDbRow(row) {
  return {
    id: row.id,
    slug: row.slug || null,
    title: row.title,
    excerpt: row.excerpt || "",
    categories: row.categories && row.categories.length ? row.categories : [row.category].filter(Boolean),
    date: row.date_label || new Date(row.created_at).toLocaleDateString("fa-IR"),
    tags: row.tags || [],
    content: row.content || "",
    draft: row.draft,
    featured: row.featured,
    coverUrl: row.cover_url || null,
    seo: { metaTitle: row.seo_title || "", metaDescription: row.seo_description || "" },
  };
}

// Maps the UI's article shape back to Supabase columns for insert/update.
function toDbRow(article) {
  return {
    title: article.title,
    slug: article.slug || null,
    excerpt: article.excerpt,
    categories: article.categories,
    date_label: article.date,
    tags: article.tags,
    content: article.content,
    draft: article.draft,
    featured: article.featured || false,
    cover_url: article.coverUrl || null,
    seo_title: article.seo?.metaTitle || "",
    seo_description: article.seo?.metaDescription || "",
  };
}

/* ------------------------------------------------------------------ */
/*  Font + reveal-on-scroll hook                                       */
/* ------------------------------------------------------------------ */
function useVazirFont() {
  useEffect(() => {
    if (document.getElementById("vazir-font-link")) return;
    const link = document.createElement("link");
    link.id = "vazir-font-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap";
    document.head.appendChild(link);
  }, []);
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error handling — catches crashes + shows friendly empty/error states*/
/* ------------------------------------------------------------------ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Electron blog crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" lang="fa" style={{ fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bg, minHeight: "100vh" }} className="flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <AlertTriangle size={36} color={COLORS.primary} className="mx-auto mb-5" />
            <h1 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>یک خطای غیرمنتظره پیش آمد</h1>
            <p className="text-[14px] text-neutral-500 leading-7 mb-6">
              متأسفانه در نمایش این صفحه مشکلی پیش آمد. می‌توانید صفحه را دوباره بارگذاری کنید.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-white"
              style={{ background: COLORS.primary }}
            >
              <RefreshCw size={15} /> بارگذاری مجدد
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function EmptyState({ title, note, actionLabel, onAction, tone = "neutral" }) {
  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <AlertTriangle size={30} className="mx-auto mb-4" color={tone === "error" ? COLORS.primary : "#c9c9cc"} />
      <h2 className="text-lg font-bold mb-2" style={{ color: COLORS.ink }}>{title}</h2>
      {note && <p className="text-[13.5px] text-neutral-500 leading-7 mb-6">{note}</p>}
      {actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-semibold text-white"
          style={{ background: COLORS.primary }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Signature mark — electron orbit                                    */
/* ------------------------------------------------------------------ */
function OrbitMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r="3.2" fill={COLORS.primary} />
      <ellipse
        cx="20" cy="20" rx="17" ry="7"
        stroke={COLORS.primary} strokeWidth="1.1" opacity="0.55"
      />
      <ellipse
        cx="20" cy="20" rx="17" ry="7"
        stroke={COLORS.ink} strokeWidth="1.1" opacity="0.35"
        transform="rotate(60 20 20)"
      />
      <ellipse
        cx="20" cy="20" rx="17" ry="7"
        stroke={COLORS.ink} strokeWidth="1.1" opacity="0.2"
        transform="rotate(120 20 20)"
      />
      <g style={{ transformOrigin: "20px 20px", animation: "orbit-spin 7s linear infinite" }}>
        <circle cx="37" cy="20" r="1.9" fill={COLORS.primary} />
      </g>
    </svg>
  );
}

function OrbitField({ opacity = 1 }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
      preserveAspectRatio="xMidYMid slice"
    >
      <g transform="translate(300,300)">
        <circle r="5" fill={COLORS.primary} />
        <ellipse rx="230" ry="90" stroke={COLORS.primary} strokeWidth="1" fill="none" opacity="0.18" />
        <ellipse rx="230" ry="90" stroke={COLORS.ink} strokeWidth="1" fill="none" opacity="0.10" transform="rotate(60)" />
        <ellipse rx="230" ry="90" stroke={COLORS.ink} strokeWidth="1" fill="none" opacity="0.10" transform="rotate(120)" />
        <g style={{ transformOrigin: "0px 0px", animation: "orbit-spin 26s linear infinite" }}>
          <circle cx="230" cy="0" r="4" fill={COLORS.primary} opacity="0.7" />
        </g>
        <g style={{ transformOrigin: "0px 0px", animation: "orbit-spin-rev 34s linear infinite" }}>
          <circle cx="0" cy="90" r="3" fill={COLORS.ink} opacity="0.35" transform="rotate(60)" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Article cover placeholder                                          */
/* ------------------------------------------------------------------ */
function Cover({ className = "", url = null }) {
  if (url) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-neutral-100 ${className}`}>
        <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(150deg, ${COLORS.ink} 0%, #3a3a3d 55%, ${COLORS.primary} 130%)`,
      }}
    >
      <OrbitField opacity={0.5} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,.08), transparent 60%)" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                              */
/* ------------------------------------------------------------------ */
function Header({ page, go, searchOpen, setSearchOpen, articles = [], openArticle }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { if (!searchOpen) setQuery(""); }, [searchOpen]);

  const q = query.trim();
  const results = q
    ? articles.filter((a) => {
        const hay = [a.title, a.excerpt, ...(a.tags || [])].join(" ").toLowerCase();
        return hay.includes(q.toLowerCase());
      }).slice(0, 6)
    : [];

  const items = [
    { id: "home", label: "خانه" },
    { id: "articles", label: "مقالات" },
    { id: "categories", label: "دسته‌بندی‌ها" },
    { id: "about", label: "درباره" },
    { id: "contact", label: "تماس" },
  ];

  return (
    <header
      className="sticky top-0 z-40 transition-all duration-300"
      style={{
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        background: scrolled ? "rgba(248,249,250,0.82)" : "rgba(248,249,250,0.4)",
        borderBottom: scrolled ? "1px solid rgba(33,34,36,0.08)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-[70px]">
          <button onClick={() => go("home")} className="flex items-center gap-2.5 group">
            <OrbitMark size={30} />
            <div className="flex flex-col items-start leading-none">
              <span className="font-bold text-[17px] tracking-tight" style={{ color: COLORS.ink }}>الکترون</span>
              <span className="text-[10px] tracking-[0.25em] text-neutral-400 uppercase">Electron</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => go(it.id)}
                className="relative px-4 py-2 text-[14.5px] rounded-full transition-colors duration-200"
                style={{
                  color: page === it.id ? COLORS.primary : COLORS.ink,
                  fontWeight: page === it.id ? 600 : 500,
                }}
              >
                {it.label}
                {page === it.id && (
                  <span
                    className="absolute left-1/2 -bottom-[1px] w-1 h-1 rounded-full"
                    style={{ background: COLORS.primary, transform: "translateX(50%)" }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
              aria-label="جستجو"
            >
              <Search size={18} color={COLORS.ink} />
            </button>
            <button
              onClick={() => go("admin")}
              className="hidden md:flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-full transition-transform hover:-translate-y-0.5"
              style={{ background: COLORS.ink, color: "#fff" }}
            >
              پنل مدیریت
            </button>
            <button
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center"
              onClick={() => setMenuOpen((m) => !m)}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 animate-[fadeSlide_.25s_ease]">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-[0_2px_18px_rgba(0,0,0,0.06)]">
              <Search size={16} className="text-neutral-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در مقالات…"
                className="flex-1 bg-transparent outline-none text-[14px]"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="پاک‌کردن">
                  <X size={14} className="text-neutral-400" />
                </button>
              )}
            </div>
            {q && (
              <div className="mt-2 bg-white rounded-xl overflow-hidden shadow-[0_2px_18px_rgba(0,0,0,0.06)]">
                {results.length === 0 ? (
                  <div className="px-4 py-3.5 text-[13px] text-neutral-400">نتیجه‌ای یافت نشد.</div>
                ) : (
                  results.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { openArticle?.(a.id); setSearchOpen(false); }}
                      className="w-full text-right px-4 py-3 hover:bg-black/5 border-b last:border-0 border-black/5 transition-colors"
                    >
                      <div className="text-[13.5px] font-medium truncate" style={{ color: COLORS.ink }}>{a.title}</div>
                      <div className="text-[11.5px] text-neutral-400 mt-0.5">
                        {(a.categories || []).map((cid) => catById(cid)?.fa).filter(Boolean).join("، ")}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {menuOpen && (
          <div className="md:hidden pb-5 flex flex-col gap-1">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => { go(it.id); setMenuOpen(false); }}
                className="text-right px-3 py-2.5 rounded-lg text-[15px]"
                style={{ color: page === it.id ? COLORS.primary : COLORS.ink, fontWeight: page === it.id ? 600 : 500, background: page === it.id ? "rgba(193,18,31,0.06)" : "transparent" }}
              >
                {it.label}
              </button>
            ))}
            <button
              onClick={() => { go("admin"); setMenuOpen(false); }}
              className="mt-2 text-right px-3 py-2.5 rounded-lg text-[14px] font-medium text-white"
              style={{ background: COLORS.ink }}
            >
              پنل مدیریت
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                              */
/* ------------------------------------------------------------------ */
function Footer({ go }) {
  return (
    <footer className="mt-28" style={{ background: COLORS.ink, color: "#ececeb" }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16">
        <div className="grid md:grid-cols-[1.3fr_1fr_1fr] gap-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <OrbitMark size={28} />
              <span className="font-bold text-lg">الکترون</span>
            </div>
            <p className="text-[14px] leading-8 text-white/55 max-w-sm">
              پلتفرمی شخصی برای تحلیل‌های عمیق سیاسی و راهبردی؛ نوشته‌شده برای خوانندگانی که به جای هیجان لحظه، دقتِ نگاه را می‌جویند.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[Twitter, Send, Instagram].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-full flex items-center justify-center border border-white/15 hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200">
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[13px] tracking-widest text-white/40 uppercase mb-4">مسیرها</h4>
            <div className="flex flex-col gap-3 text-[14px] text-white/70">
              <button onClick={() => go("about")} className="text-right hover:text-white transition-colors w-fit">درباره الکترون</button>
              <button onClick={() => go("contact")} className="text-right hover:text-white transition-colors w-fit">تماس با من</button>
              <button onClick={() => go("categories")} className="text-right hover:text-white transition-colors w-fit">دسته‌بندی‌ها</button>
              <button onClick={() => go("articles")} className="text-right hover:text-white transition-colors w-fit">همه مقالات</button>
            </div>
          </div>

          <div>
            <h4 className="text-[13px] tracking-widest text-white/40 uppercase mb-4">دسته‌های محبوب</h4>
            <div className="flex flex-col gap-3 text-[14px] text-white/70">
              {CATEGORIES.slice(0, 4).map((c) => (
                <span key={c.id}>{c.fa}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-white/40">
          <span>© {1404} الکترون — تمام حقوق محفوظ است.</span>
          <span>ساخته‌شده با دقت، برای خوانندگانی که فکر می‌کنند.</span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Article card                                                       */
/* ------------------------------------------------------------------ */
function ArticleCard({ article, onOpen, big = false }) {
  const cats = (article.categories || []).map(catById).filter(Boolean);
  return (
    <button
      onClick={() => onOpen(article.id)}
      className={`group text-right w-full ${big ? "" : ""}`}
    >
      <Cover url={article.coverUrl} className={big ? "h-64 md:h-80 w-full" : "h-44 w-full"} />
      <div className={big ? "pt-2" : "pt-0"} />
      <div className="mt-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cats.map((cat) => (
            <span
              key={cat.id}
              className="inline-block text-[11.5px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: "rgba(193,18,31,0.08)", color: COLORS.primary }}
            >
              {cat.fa}
            </span>
          ))}
        </div>
        <h3
          className={`font-bold leading-relaxed transition-colors duration-200 group-hover:text-[color:var(--p)] ${big ? "text-2xl md:text-[28px]" : "text-lg"}`}
          style={{ color: COLORS.ink, "--p": COLORS.primary }}
        >
          {article.title}
        </h3>
        {big && (
          <p className="mt-3 text-[15px] leading-8 text-neutral-500 max-w-xl">{article.excerpt}</p>
        )}
        <div className="mt-3 flex items-center gap-4 text-[12.5px] text-neutral-400">
          <span className="flex items-center gap-1"><Calendar size={13} />{article.date}</span>
          <span className="flex items-center gap-1"><Clock size={13} />{readingTime(article.content)} دقیقه مطالعه</span>
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  HOME                                                                */
/* ------------------------------------------------------------------ */
function Home({ articles, openArticle, go, loadStatus }) {
  const featured = articles.find((a) => a.featured) || articles[0] || null;
  const latest = featured ? articles.filter((a) => a.id !== featured.id).slice(0, 4) : [];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <OrbitField opacity={0.35} />
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 pt-20 md:pt-32 pb-24 md:pb-32 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-[12.5px] font-medium px-3.5 py-1.5 rounded-full mb-8" style={{ background: "rgba(193,18,31,0.07)", color: COLORS.primary }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.primary }} />
              یادداشت‌های تحلیلیِ مستقل
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-extrabold tracking-tight" style={{ color: COLORS.ink }}>
              <span className="block text-[15vw] leading-[0.95] sm:text-7xl md:text-8xl">الکترون</span>
              <span className="mt-4 flex items-center justify-center gap-2.5">
                <span className="text-lg sm:text-2xl md:text-3xl font-medium tracking-[0.08em]" style={{ color: COLORS.ink }}>Electron</span>
                <OrbitMark size={30} />
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-8 text-[17px] md:text-xl leading-9 text-neutral-500 max-w-xl mx-auto">
              نوشته‌های شخصی سیاسی و تحلیل راهبردی؛ جایی برای فکرکردنِ آرام درباره‌ی قدرت، جامعه و آینده.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                onClick={() => go("articles")}
                className="px-6 py-3.5 rounded-full text-[14.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(193,18,31,0.25)]"
                style={{ background: COLORS.primary }}
              >
                خواندن مقالات
              </button>
              <button
                onClick={() => go("about")}
                className="px-6 py-3.5 rounded-full text-[14.5px] font-semibold transition-transform hover:-translate-y-0.5 border"
                style={{ borderColor: "rgba(33,34,36,0.15)", color: COLORS.ink }}
              >
                درباره‌ی من
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="max-w-6xl mx-auto px-5 md:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: COLORS.ink }}>مقاله ویژه</h2>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center bg-white rounded-3xl p-5 md:p-8" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.05)" }}>
              <ArticleCard article={featured} onOpen={openArticle} big />
              <div className="hidden md:flex flex-col gap-5">
                <p className="text-[15px] leading-8 text-neutral-500">{featured.excerpt}</p>
                <button
                  onClick={() => openArticle(featured.id)}
                  className="w-fit flex items-center gap-2 text-[14px] font-semibold transition-transform hover:-translate-x-1"
                  style={{ color: COLORS.primary }}
                >
                  ادامه مطلب <ArrowUpLeft size={15} />
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {!featured && (
        <section className="max-w-3xl mx-auto px-5 md:px-8 text-center py-10">
          <p className="text-[14.5px] text-neutral-400 leading-8">
            {loadStatus === "loading" && "در حال بارگذاری مقالات…"}
            {loadStatus === "ready" && "هنوز مقاله‌ای منتشر نشده. از پنل مدیریت (/admin) اولین مقاله را بسازید."}
            {loadStatus === "error" && "بارگذاری مقالات با مشکل مواجه شد. لطفاً بعداً دوباره امتحان کنید."}
            {loadStatus === "unconfigured" && "سایت هنوز به دیتابیس وصل نیست."}
          </p>
        </section>
      )}

      {/* Latest */}
      {latest.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 md:px-8 mt-24">
          <Reveal>
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: COLORS.ink }}>آخرین مقالات</h2>
              <button onClick={() => go("articles")} className="text-[13.5px] font-medium flex items-center gap-1" style={{ color: COLORS.primary }}>
                مشاهده همه <ArrowUpLeft size={13} />
              </button>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-7">
            {latest.map((a, i) => (
              <Reveal key={a.id} delay={i * 70}>
                <ArticleCard article={a} onOpen={openArticle} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 mt-24">
        <Reveal>
          <h2 className="text-xl md:text-2xl font-bold mb-8" style={{ color: COLORS.ink }}>دسته‌بندی‌های محبوب</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.id} delay={i * 60}>
              <button
                onClick={() => go("categories")}
                className="w-full text-right p-6 rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 group"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 10px 28px rgba(0,0,0,0.045)" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors" style={{ background: "rgba(193,18,31,0.07)" }}>
                    <Atom size={19} color={COLORS.primary} />
                  </div>
                  <span className="text-[12px] text-neutral-300 font-medium">{c.en}</span>
                </div>
                <h3 className="text-[16.5px] font-bold mb-1.5" style={{ color: COLORS.ink }}>{c.fa}</h3>
                <p className="text-[13px] text-neutral-400">{c.note}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="max-w-4xl mx-auto px-5 md:px-8 mt-28">
        <Reveal>
          <div className="relative text-center py-16 px-6">
            <QuoteIcon size={44} color={COLORS.primary} className="mx-auto mb-6 opacity-20" />
            <p className="text-2xl md:text-[32px] leading-[1.7] font-bold" style={{ color: COLORS.ink }}>
              «{QUOTE.fa}»
            </p>
            <p className="mt-6 text-[13.5px] tracking-widest uppercase text-neutral-400">{QUOTE.by}</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  ARTICLES LIST                                                       */
/* ------------------------------------------------------------------ */
function ArticlesList({ articles, openArticle }) {
  const [active, setActive] = useState("all");
  const filtered = active === "all" ? articles : articles.filter((a) => (a.categories || []).includes(active));

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 pt-16 pb-10">
      <Reveal>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: COLORS.ink }}>مقالات</h1>
        <p className="text-[15px] text-neutral-500 mb-10">مجموعه‌ی کامل یادداشت‌ها و تحلیل‌های منتشرشده.</p>
      </Reveal>
      <Reveal delay={60}>
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActive("all")}
            className="px-4 py-2 rounded-full text-[13.5px] font-medium transition-colors"
            style={active === "all" ? { background: COLORS.ink, color: "#fff" } : { background: "#fff", color: COLORS.ink, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          >
            همه
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className="px-4 py-2 rounded-full text-[13.5px] font-medium transition-colors"
              style={active === c.id ? { background: COLORS.primary, color: "#fff" } : { background: "#fff", color: COLORS.ink, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              {c.fa}
            </button>
          ))}
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <p className="text-neutral-400 text-[14px]">مقاله‌ای در این دسته یافت نشد.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filtered.map((a, i) => (
            <Reveal key={a.id} delay={(i % 6) * 60}>
              <ArticleCard article={a} onOpen={openArticle} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ARTICLE DETAIL                                                      */
/* ------------------------------------------------------------------ */
function ArticleDetail({ article, all, openArticle, go }) {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?${article.slug ? `p=${article.slug}` : `a=${article.id}`}`
    : "";

  const share = (type) => {
    if (type === "copy") {
      navigator.clipboard?.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
      return;
    }
    if (type === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`, "_blank", "noopener");
      return;
    }
    if (type === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`, "_blank", "noopener");
      return;
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [article.id]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
      setProgress(scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!article) return null;
  const cats = (article.categories || []).map(catById).filter(Boolean);
  const idx = all.findIndex((a) => a.id === article.id);
  const prev = all[idx + 1];
  const next = all[idx - 1];
  const related = all
    .filter((a) => a.id !== article.id && (a.categories || []).some((c) => (article.categories || []).includes(c)))
    .slice(0, 3);

  return (
    <div>
      <div className="fixed top-0 inset-x-0 h-[3px] z-50 bg-transparent">
        <div className="h-full transition-[width] duration-150" style={{ width: `${progress}%`, background: COLORS.primary }} />
      </div>

      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-14">
        <button onClick={() => go("articles")} className="flex items-center gap-1.5 text-[13.5px] text-neutral-400 hover:text-neutral-600 mb-8">
          <ChevronRight size={15} /> بازگشت به مقالات
        </button>

        <div className="flex flex-wrap gap-2 mb-5">
          {cats.map((cat) => (
            <span key={cat.id} className="inline-block text-[12px] font-medium px-3 py-1 rounded-full" style={{ background: "rgba(193,18,31,0.08)", color: COLORS.primary }}>
              {cat.fa}
            </span>
          ))}
        </div>
        <h1 className="text-3xl md:text-[44px] font-extrabold leading-[1.35] mb-6" style={{ color: COLORS.ink }}>
          {article.title}
        </h1>
        <div className="flex items-center gap-5 text-[13px] text-neutral-400 mb-10">
          <span className="flex items-center gap-1.5"><Calendar size={14} />{article.date}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} />{readingTime(article.content)} دقیقه مطالعه</span>
        </div>

        <Cover url={article.coverUrl} className="w-full h-56 md:h-96 mb-12" />

        <article
          ref={contentRef}
          className="article-body text-[18px] leading-[2.15] text-[#333]"
          style={{ textAlign: "justify" }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12">
            {article.tags.map((t) => (
              <span key={t} className="text-[12px] px-3 py-1.5 rounded-full bg-white text-neutral-500" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-10 pt-8 border-t border-black/5">
          <span className="text-[13px] text-neutral-400 flex items-center gap-1.5 ml-1"><Share2 size={14} /> اشتراک‌گذاری:</span>
          <button onClick={() => share("twitter")} title="اشتراک در ایکس" className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:-translate-y-0.5 transition-transform" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <Twitter size={15} color={COLORS.ink} />
          </button>
          <button onClick={() => share("telegram")} title="اشتراک در تلگرام" className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:-translate-y-0.5 transition-transform" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <Send size={15} color={COLORS.ink} />
          </button>
          <button onClick={() => share("copy")} title="کپی لینک" className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:-translate-y-0.5 transition-transform" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {copied ? <Check size={15} color="#16a34a" /> : <Link2 size={15} color={COLORS.ink} />}
          </button>
          {copied && <span className="text-[12px] text-emerald-600">لینک کپی شد</span>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          {prev && (
            <button onClick={() => openArticle(prev.id)} className="text-right p-5 rounded-2xl bg-white hover:-translate-y-0.5 transition-transform" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <span className="text-[11.5px] text-neutral-400 flex items-center gap-1 mb-2"><ChevronRight size={13} /> مقاله بعدی</span>
              <span className="text-[14.5px] font-bold" style={{ color: COLORS.ink }}>{prev.title}</span>
            </button>
          )}
          {next && (
            <button onClick={() => openArticle(next.id)} className="text-right p-5 rounded-2xl bg-white hover:-translate-y-0.5 transition-transform sm:text-left" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <span className="text-[11.5px] text-neutral-400 flex items-center gap-1 mb-2 justify-end">مقاله قبلی <ChevronLeft size={13} /></span>
              <span className="text-[14.5px] font-bold" style={{ color: COLORS.ink }}>{next.title}</span>
            </button>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="max-w-6xl mx-auto px-5 md:px-8 mt-24">
          <h2 className="text-xl font-bold mb-8" style={{ color: COLORS.ink }}>مقالات مرتبط</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-7">
            {related.map((a) => <ArticleCard key={a.id} article={a} onOpen={openArticle} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CATEGORIES PAGE                                                     */
/* ------------------------------------------------------------------ */
function CategoriesPage({ articles, go, setFilterCat }) {
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 pt-16 pb-10">
      <Reveal>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: COLORS.ink }}>دسته‌بندی‌ها</h1>
        <p className="text-[15px] text-neutral-500 mb-12">شش محور اصلی تحلیل‌های الکترون.</p>
      </Reveal>
      <div className="grid sm:grid-cols-2 gap-6">
        {CATEGORIES.map((c, i) => {
          const count = articles.filter((a) => (a.categories || []).includes(c.id)).length;
          return (
            <Reveal key={c.id} delay={i * 70}>
              <button
                onClick={() => { setFilterCat(c.id); go("articles"); }}
                className="w-full text-right p-8 rounded-3xl bg-white hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 14px 34px rgba(0,0,0,0.045)" }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(193,18,31,0.07)" }}>
                    <Atom size={21} color={COLORS.primary} />
                  </div>
                  <span className="text-[13px] font-medium text-neutral-300">{count} مقاله</span>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>{c.fa}</h3>
                <p className="text-[13.5px] text-neutral-400">{c.note} · {c.en}</p>
              </button>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ABOUT                                                               */
/* ------------------------------------------------------------------ */
function About() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pt-16 pb-16">
      <Reveal>
        <OrbitMark size={44} />
        <h1 className="text-3xl md:text-4xl font-extrabold mt-6 mb-6" style={{ color: COLORS.ink }}>درباره‌ی الکترون</h1>
      </Reveal>
      <Reveal delay={80}>
        <div className="space-y-6 text-[17px] leading-[2.1] text-[#3a3a3d]">
          <p>الکترون یک رسانه‌ی خبری نیست؛ یک دفترچه‌ی شخصی تحلیل است. اینجا جایی است که رویدادهای سیاسی و راهبردی، نه در قالب خبر لحظه‌ای، بلکه در بستر روندهای بلندمدت و الگوهای تکرارشونده‌ی تاریخی بررسی می‌شوند.</p>
          <p>مخاطب این نوشته‌ها، جوانانی هستند که هم به دین پایبندند و هم به سیاست علاقه‌مند؛ کسانی که به‌جای مصرف سریع اخبار، به دنبال درک عمیق‌تری از چرایی رویدادها هستند.</p>
          <p>هدف من ساده است: نوشتنِ صادقانه، مستقل و دقیق؛ بدون شعار و بدون شتاب‌زدگی. هر مقاله، حاصل ساعت‌ها مطالعه و بازاندیشی است، نه واکنشی آنی به عناوین روز.</p>
        </div>
      </Reveal>
      <Reveal delay={160}>
        <div className="grid sm:grid-cols-3 gap-5 mt-14">
          {[
            { n: "۶+", l: "محور تحلیلی" },
            { n: "هفتگی", l: "دوره انتشار" },
            { n: "مستقل", l: "بدون وابستگی" },
          ].map((s) => (
            <div key={s.l} className="p-6 rounded-2xl bg-white text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="text-2xl font-extrabold mb-1" style={{ color: COLORS.primary }}>{s.n}</div>
              <div className="text-[13px] text-neutral-400">{s.l}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CONTACT                                                             */
/* ------------------------------------------------------------------ */
function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pt-16 pb-16">
      <Reveal>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: COLORS.ink }}>تماس با من</h1>
        <p className="text-[15px] text-neutral-500 mb-12">برای گفت‌وگو، نقد یا پیشنهاد موضوع، پیام بگذارید.</p>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {[
            { Icon: Mail, l: "ایمیل", v: "contact@electron.blog" },
            { Icon: MapPin, l: "موقعیت", v: "تهران، ایران" },
            { Icon: Phone, l: "شبکه‌های اجتماعی", v: "@electron" },
          ].map((it) => (
            <div key={it.l} className="p-5 rounded-2xl bg-white flex items-start gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(193,18,31,0.08)" }}>
                <it.Icon size={16} color={COLORS.primary} />
              </div>
              <div>
                <div className="text-[12px] text-neutral-400">{it.l}</div>
                <div className="text-[14px] font-medium" style={{ color: COLORS.ink }}>{it.v}</div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={140}>
        {sent ? (
          <div className="p-8 rounded-2xl text-center bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <p className="font-bold text-[16px]" style={{ color: COLORS.ink }}>پیام شما ارسال شد ✦</p>
            <p className="text-[13.5px] text-neutral-400 mt-1">در اسرع وقت پاسخ داده خواهد شد.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="p-6 md:p-8 rounded-3xl bg-white space-y-4"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 14px 34px rgba(0,0,0,0.045)" }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <input required placeholder="نام شما" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px] focus:ring-2" style={{ "--tw-ring-color": COLORS.primary }} />
              <input required type="email" placeholder="ایمیل" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]" />
            </div>
            <input placeholder="موضوع" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]" />
            <textarea required rows={5} placeholder="پیام شما…" className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px] resize-none" />
            <button type="submit" className="px-6 py-3 rounded-full text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ background: COLORS.primary }}>
              ارسال پیام
            </button>
          </form>
        )}
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ADMIN LOGIN                                                         */
/* ------------------------------------------------------------------ */
function AdminLogin({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-md mx-auto px-5 pt-24 pb-20 text-center">
        <Lock size={30} className="mx-auto mb-4" color={COLORS.primary} />
        <h1 className="text-xl font-bold mb-2" style={{ color: COLORS.ink }}>پنل مدیریت هنوز متصل نیست</h1>
        <p className="text-[13.5px] text-neutral-500 leading-7">
          برای فعال‌شدن ورود امن، مقادیر <code dir="ltr">VITE_SUPABASE_URL</code> و{" "}
          <code dir="ltr">VITE_SUPABASE_ANON_KEY</code> را در فایل <code dir="ltr">.env</code> (یا env
          سایت روی Cloudflare) تنظیم کنید. راهنمای کامل در README پروژه است.
        </p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(`خطا: ${error.message}`);
    else onSignedIn();
  };

  return (
    <div className="max-w-sm mx-auto px-5 pt-24 pb-20">
      <div className="text-center mb-8">
        <Lock size={26} className="mx-auto mb-3" color={COLORS.primary} />
        <h1 className="text-xl font-bold" style={{ color: COLORS.ink }}>ورود به پنل مدیریت</h1>
        <p className="text-[13px] text-neutral-400 mt-1">فقط برای نویسنده‌ی سایت</p>
      </div>
      <form onSubmit={submit} className="bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <input required type="email" placeholder="ایمیل" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]" dir="ltr" />
        <input required type="password" placeholder="رمز عبور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]" dir="ltr" />
        {error && <p className="text-[12.5px] text-red-600">{error}</p>}
        <button disabled={busy} type="submit" className="w-full py-3 rounded-full text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50" style={{ background: COLORS.primary }}>
          {busy ? "در حال ورود…" : "ورود"}
        </button>
      </form>
      <p className="text-[12px] text-neutral-400 text-center mt-5 leading-6">
        حساب ادمین از داشبورد Supabase (Authentication → Users) ساخته می‌شود، نه از این فرم.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ADMIN CMS                                                           */
/* ------------------------------------------------------------------ */
function AdminPanel() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [tab, setTab] = useState("dashboard");
  const [editing, setEditing] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setArticles(data.map(fromDbRow));
    setLoading(false);
  };

  useEffect(() => {
    if (session) loadArticles();
  }, [session]);

  if (session === undefined) {
    return <div className="max-w-6xl mx-auto px-5 pt-24 pb-20 text-center text-neutral-400 text-[14px]">در حال بررسی نشست…</div>;
  }
  if (!session) {
    return <AdminLogin onSignedIn={() => {}} />;
  }

  const startNew = () => {
    setEditing({
      id: null,
      slug: shortCode(),
      title: "",
      excerpt: "",
      categories: [CATEGORIES[0].id],
      date: "1404/04/01",
      tags: [],
      content: "",
      draft: true,
      featured: false,
      coverUrl: null,
      seo: { metaTitle: "", metaDescription: "" },
    });
    setTab("editor");
  };

  const saveArticle = async (art) => {
    setLoading(true);
    setError("");
    const row = toDbRow(art);
    const { error } = art.id
      ? await supabase.from("articles").update(row).eq("id", art.id)
      : await supabase.from("articles").insert(row);
    if (error) {
      setError(
        error.code === "23505"
          ? "این نامک (لینک اختصاصی) قبلاً برای مقاله‌ی دیگری استفاده شده؛ یک نامک دیگر انتخاب کنید."
          : error.message
      );
    } else {
      await loadArticles();
      setEditing(null);
      setTab("articles");
    }
    setLoading(false);
  };

  const deleteArticle = async (id) => {
    if (!window.confirm("این مقاله برای همیشه حذف شود؟")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) setError(error.message);
    else setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const togglePublish = async (a) => {
    const { error } = await supabase.from("articles").update({ draft: !a.draft }).eq("id", a.id);
    if (error) setError(error.message);
    else setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, draft: !x.draft } : x)));
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const nav = [
    { id: "dashboard", label: "داشبورد", Icon: LayoutDashboard },
    { id: "articles", label: "مقالات", Icon: FileText },
    { id: "categories", label: "دسته‌ها و برچسب‌ها", Icon: Tags },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 pt-10 pb-20">
      <Reveal>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <OrbitMark size={26} />
            <h1 className="text-2xl font-extrabold" style={{ color: COLORS.ink }}>پنل مدیریت الکترون</h1>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 text-[13px] text-neutral-400 hover:text-neutral-700">
            <LogOut size={14} /> خروج ({session.user.email})
          </button>
        </div>
        <p className="text-[13.5px] text-neutral-400 mb-8">
          {loading ? "در حال بارگذاری…" : "مقالات مستقیماً در دیتابیس Supabase ذخیره می‌شوند و برای همه‌ی بازدیدکنندگان (روی هر دستگاهی) قابل مشاهده‌اند."}
        </p>
        {error && <p className="text-[13px] text-red-600 mb-6">خطا: {error}</p>}
      </Reveal>

      <div className="grid md:grid-cols-[220px_1fr] gap-8">
        <div className="flex md:flex-col gap-2 overflow-x-auto">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => { setTab(n.id); setEditing(null); }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[14px] font-medium whitespace-nowrap transition-colors"
              style={tab === n.id ? { background: COLORS.ink, color: "#fff" } : { background: "#fff", color: COLORS.ink, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            >
              <n.Icon size={16} /> {n.label}
            </button>
          ))}
          <button
            onClick={startNew}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white whitespace-nowrap transition-transform hover:-translate-y-0.5"
            style={{ background: COLORS.primary }}
          >
            <Plus size={16} /> مقاله جدید
          </button>
        </div>

        <div>
          {tab === "dashboard" && (
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { l: "کل مقالات", v: articles.length },
                { l: "پیش‌نویس‌ها", v: articles.filter((a) => a.draft).length },
                { l: "دسته‌بندی‌ها", v: CATEGORIES.length },
              ].map((s) => (
                <div key={s.l} className="p-6 rounded-2xl bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div className="text-3xl font-extrabold" style={{ color: COLORS.primary }}>{s.v}</div>
                  <div className="text-[13px] text-neutral-400 mt-1">{s.l}</div>
                </div>
              ))}
              <div className="sm:col-span-3 p-6 rounded-2xl bg-white text-[13.5px] text-neutral-500 leading-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                این پنل به دیتابیس واقعی (Supabase Postgres) وصل است: مقالاتی که اینجا می‌سازید یا ویرایش می‌کنید، برای همه‌ی بازدیدکنندگان سایت — از هر دستگاهی — قابل مشاهده‌اند (مگر آن‌که «پیش‌نویس» باشند). هیچ مقاله‌ی نمونه‌ای در کد سایت وجود ندارد؛ هر چه ببینید از همین جدول `articles` می‌آید.
              </div>
            </div>
          )}

          {tab === "articles" && !editing && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3 text-[12px] text-neutral-400 border-b border-black/5">
                <span>عنوان</span><span>دسته‌بندی‌ها</span><span>وضعیت</span><span></span>
              </div>
              {articles.length === 0 && !loading && (
                <div className="px-5 py-10 text-center text-[13.5px] text-neutral-400">
                  هنوز مقاله‌ای در دیتابیس نیست. با دکمه «مقاله جدید» شروع کنید.
                </div>
              )}
              {articles.map((a) => (
                <div key={a.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3.5 items-center border-b border-black/5 last:border-0 text-[13.5px]">
                  <span className="font-medium truncate" style={{ color: COLORS.ink }}>{a.title || "(بدون عنوان)"}</span>
                  <span className="text-neutral-400 whitespace-nowrap text-[12px] max-w-[180px] truncate">
                    {(a.categories || []).map((cid) => catById(cid)?.fa).filter(Boolean).join("، ") || "—"}
                  </span>
                  <button
                    onClick={() => togglePublish(a)}
                    className="whitespace-nowrap"
                    title="برای تغییر وضعیت انتشار کلیک کنید"
                  >
                    {a.draft ? (
                      <span className="flex items-center gap-1 text-amber-600 text-[12px] hover:underline"><EyeOff size={12}/> پیش‌نویس</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 text-[12px] hover:underline"><Eye size={12}/> منتشرشده</span>
                    )}
                  </button>
                  <span className="flex items-center gap-1">
                    <button onClick={() => { setEditing(a); setTab("editor"); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5"><Pencil size={14} /></button>
                    <button onClick={() => deleteArticle(a.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50"><Trash2 size={14} color={COLORS.primary} /></button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "editor" && editing && (
            <ArticleEditor article={editing} onCancel={() => { setEditing(null); setTab("articles"); }} onSave={saveArticle} />
          )}

          {tab === "categories" && (
            <div className="grid sm:grid-cols-2 gap-4">
              {CATEGORIES.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-white flex items-center justify-between" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div>
                    <div className="font-bold text-[14.5px]" style={{ color: COLORS.ink }}>{c.fa}</div>
                    <div className="text-[12px] text-neutral-400 mt-0.5">{c.en} · شناسه: {c.id}</div>
                  </div>
                  <span className="text-[12px] px-2.5 py-1 rounded-full" style={{ background: "rgba(193,18,31,0.08)", color: COLORS.primary }}>ثابت</span>
                </div>
              ))}
              <p className="sm:col-span-2 text-[12.5px] text-neutral-400">دسته‌بندی‌ها در این نسخه ثابت تعریف شده‌اند؛ در آینده می‌توان یک جدول categories جدا در Supabase اضافه کرد. هر مقاله می‌تواند هم‌زمان چند دسته‌بندی داشته باشد (از فرم ویرایش مقاله).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RICH TEXT EDITOR (no external deps — contentEditable + execCommand) */
/* ------------------------------------------------------------------ */
function RichTextEditor({ initialHtml, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = initialHtml || "<p></p>";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd, arg = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current.innerHTML);
  };

  const insertLink = () => {
    const url = window.prompt("آدرس لینک را وارد کنید:", "https://");
    if (url) exec("createLink", url);
  };

  const btn = (icon, title, onClick) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
      style={{ color: COLORS.ink }}
    >
      {icon}
    </button>
  );

  return (
    <div className="rounded-xl overflow-hidden border border-black/10">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-[#F8F9FA] border-b border-black/10">
        {btn(<Bold size={16} />, "پررنگ", () => exec("bold"))}
        {btn(<Italic size={16} />, "مورب", () => exec("italic"))}
        {btn(<Underline size={16} />, "زیرخط", () => exec("underline"))}
        <span className="w-px h-5 bg-black/10 mx-1" />
        {btn(<Heading2 size={16} />, "تیتر", () => exec("formatBlock", "H2"))}
        {btn(<QuoteIcon size={16} />, "نقل‌قول", () => exec("formatBlock", "BLOCKQUOTE"))}
        {btn(<span className="text-[13px] font-medium px-0.5">پاراگراف</span>, "پاراگراف عادی", () => exec("formatBlock", "P"))}
        <span className="w-px h-5 bg-black/10 mx-1" />
        {btn(<List size={16} />, "لیست نقطه‌ای", () => exec("insertUnorderedList"))}
        {btn(<ListOrdered size={16} />, "لیست شماره‌دار", () => exec("insertOrderedList"))}
        {btn(<Link2 size={16} />, "درج لینک", insertLink)}
        <span className="w-px h-5 bg-black/10 mx-1" />
        {btn(<Undo2 size={16} />, "واگرد", () => exec("undo"))}
        {btn(<Redo2 size={16} />, "ازنو", () => exec("redo"))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="article-body px-5 py-4 min-h-[320px] max-h-[600px] overflow-y-auto text-[16px] leading-8 outline-none"
        style={{ textAlign: "justify" }}
      />
    </div>
  );
}

function CoverUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("فقط فایل تصویری مجاز است."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("حجم تصویر باید کمتر از ۵ مگابایت باشد."); return; }
    setError("");
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const path = `${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { upsert: false });
    if (upErr) {
      setError(
        upErr.message?.includes("Bucket not found")
          ? "باکت «covers» هنوز در Supabase ساخته نشده — راهنمای README را ببینید."
          : upErr.message
      );
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  return (
    <div>
      <label className="text-[12.5px] text-neutral-500 mb-1.5 block">تصویر کاور</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden h-40 mb-3">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="h-40 rounded-xl mb-3 flex items-center justify-center border border-dashed border-black/10 text-neutral-300">
          <ImageIcon size={26} />
        </div>
      )}
      <label className="flex items-center gap-2 w-fit px-4 py-2.5 rounded-xl border border-black/10 text-[13px] cursor-pointer hover:bg-black/5 transition-colors">
        <ImageIcon size={15} />
        {uploading ? "در حال آپلود…" : "انتخاب تصویر"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
      {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}
      <p className="text-[11.5px] text-neutral-400 mt-2">اگر تصویری انتخاب نشود، کاور به‌صورت خودکار طراحی می‌شود.</p>
    </div>
  );
}

function ArticleEditor({ article, onCancel, onSave }) {
  const [form, setForm] = useState(article);
  const [slugCopied, setSlugCopied] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCategory = (id) => {
    setForm((f) => {
      const has = f.categories.includes(id);
      const next = has ? f.categories.filter((c) => c !== id) : [...f.categories, id];
      return { ...f, categories: next.length ? next : f.categories }; // keep at least one
    });
  };

  const shareLink = form.slug
    ? `${window.location.origin}${window.location.pathname}?p=${form.slug}`
    : "";
  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard?.writeText(shareLink).then(() => {
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 1800);
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 space-y-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">عنوان مقاله</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="عنوان را وارد کنید…"
          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[15px] font-medium"
        />
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">نامک (لینک اختصاصی)</label>
        <div className="flex items-center gap-2">
          <input
            value={form.slug || ""}
            onChange={(e) => set("slug", slugify(e.target.value))}
            placeholder="مثلاً: eghtesad-tahrim"
            dir="ltr"
            className="flex-1 px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[13.5px]"
          />
          <button
            type="button"
            onClick={() => set("slug", slugify(form.title) === "" ? shortCode() : slugify(form.title))}
            className="px-3.5 py-3 rounded-xl text-[12.5px] font-medium whitespace-nowrap hover:bg-black/5 border border-black/10"
            style={{ color: COLORS.ink }}
          >
            ساخت از عنوان
          </button>
        </div>
        {shareLink && (
          <div className="flex items-center gap-2 mt-2">
            <span dir="ltr" className="text-[11.5px] text-neutral-400 truncate flex-1">{shareLink}</span>
            <button type="button" onClick={copyShareLink} className="flex items-center gap-1 text-[11.5px] font-medium hover:underline flex-shrink-0" style={{ color: COLORS.primary }}>
              {slugCopied ? <><Check size={12} /> کپی شد</> : <><Link2 size={12} /> کپی لینک</>}
            </button>
          </div>
        )}
        <p className="text-[11.5px] text-neutral-400 mt-1.5">
          فقط حروف انگلیسی، عدد و خط‌تیره مجاز است. همین لینک کوتاه را برای دیگران بفرستید.
        </p>
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-2 block">دسته‌بندی‌ها (می‌توانید چند مورد انتخاب کنید)</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = form.categories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors"
                style={active ? { background: COLORS.primary, color: "#fff" } : { background: "#F8F9FA", color: COLORS.ink }}
              >
                {c.fa}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[12.5px] text-neutral-500 mb-1.5 block">تاریخ انتشار</label>
          <input value={form.date} onChange={(e) => set("date", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
            <input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4" />
            <Star size={14} color={COLORS.primary} /> نمایش به‌عنوان مقاله ویژه
          </label>
        </div>
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">خلاصه</label>
        <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px] resize-none" />
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">متن مقاله</label>
        <RichTextEditor initialHtml={form.content} onChange={(html) => set("content", html)} />
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">برچسب‌ها (با کاما جدا کنید)</label>
        <input
          value={form.tags.join("، ")}
          onChange={(e) => set("tags", e.target.value.split(/[,،]/).map((t) => t.trim()).filter(Boolean))}
          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]"
        />
      </div>

      <CoverUploader value={form.coverUrl} onChange={(url) => set("coverUrl", url)} />

      <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-black/5">
        <div>
          <label className="text-[12.5px] text-neutral-500 mb-1.5 block">عنوان سئو</label>
          <input value={form.seo?.metaTitle || ""} onChange={(e) => set("seo", { ...form.seo, metaTitle: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[13.5px]" />
        </div>
        <div>
          <label className="text-[12.5px] text-neutral-500 mb-1.5 block">توضیحات سئو</label>
          <input value={form.seo?.metaDescription || ""} onChange={(e) => set("seo", { ...form.seo, metaDescription: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[13.5px]" />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-[13.5px] cursor-pointer w-fit">
        <input type="checkbox" checked={form.draft} onChange={(e) => set("draft", e.target.checked)} className="w-4 h-4" />
        ذخیره به‌عنوان پیش‌نویس (منتشر نشود)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
          style={{ background: COLORS.primary }}
        >
          <Save size={15} /> ذخیره مقاله
        </button>
        <button onClick={onCancel} className="px-6 py-3 rounded-full text-[14px] font-medium" style={{ color: COLORS.ink }}>
          انصراف
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ROOT APP                                                            */
/* ------------------------------------------------------------------ */
function ElectronBlog() {
  useVazirFont();
  const [page, setPage] = useState("home");
  const [activeId, setActiveId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dbArticles, setDbArticles] = useState(null); // null = not loaded yet
  const [loadStatus, setLoadStatus] = useState(isSupabaseConfigured ? "loading" : "unconfigured");
  const [, setFilterCat] = useState("all");

  const loadPublicArticles = () => {
    if (!isSupabaseConfigured) { setLoadStatus("unconfigured"); return; }
    setLoadStatus("loading");
    supabase
      .from("articles")
      .select("*")
      .eq("draft", false)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { setLoadStatus("error"); return; }
        setDbArticles(data.map(fromDbRow));
        setLoadStatus("ready");
      });
  };

  useEffect(() => { loadPublicArticles(); }, []);

  const allArticles = useMemo(() => dbArticles || [], [dbArticles]);

  // Deep-link support: once articles are loaded, open whichever one the URL
  // points to — prefers the short slug (?p=my-article) and falls back to
  // the raw id (?a=<uuid>) for older links, so shared links land correctly.
  const appliedInitialRoute = useRef(false);
  useEffect(() => {
    if (appliedInitialRoute.current) return;
    if (loadStatus !== "ready") return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("p");
    const aid = params.get("a");
    const match = (slug && allArticles.find((a) => a.slug === slug)) ||
      (aid && allArticles.find((a) => a.id === aid));
    if (match) {
      setActiveId(match.id);
      setPage("article");
    }
    appliedInitialRoute.current = true;
  }, [loadStatus, allArticles]);

  const go = (p) => {
    setPage(p);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.pushState({}, "", window.location.pathname);
  };
  const openArticle = (id) => {
    setActiveId(id);
    setPage("article");
    window.scrollTo({ top: 0 });
    const article = allArticles.find((a) => a.id === id);
    const param = article?.slug ? `p=${article.slug}` : `a=${id}`;
    window.history.pushState({}, "", `${window.location.pathname}?${param}`);
  };

  const activeArticle = allArticles.find((a) => a.id === activeId);

  return (
    <div dir="rtl" lang="fa" style={{ fontFamily: "'Vazirmatn', sans-serif", background: COLORS.bg, color: COLORS.ink, minHeight: "100vh" }}>
      <style>{`
        @keyframes orbit-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-6px);} to { opacity: 1; transform: translateY(0);} }
        * { box-sizing: border-box; }
        ::selection { background: rgba(193,18,31,0.18); }
        input:focus, textarea:focus, select:focus { outline: none; box-shadow: 0 0 0 2px rgba(193,18,31,0.25); }
        button { cursor: pointer; }
      `}</style>

      <Header page={page} go={go} searchOpen={searchOpen} setSearchOpen={setSearchOpen} articles={allArticles} openArticle={openArticle} />

      {loadStatus === "error" && (
        <div className="max-w-6xl mx-auto px-5 md:px-8 mt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap bg-red-50 border border-red-100 rounded-2xl px-5 py-3.5 text-[13.5px]" style={{ color: COLORS.primary }}>
            <span className="flex items-center gap-2"><AlertTriangle size={16} /> ارتباط با پایگاه‌داده برقرار نشد. اینترنت یا تنظیمات Supabase را بررسی کنید.</span>
            <button onClick={loadPublicArticles} className="flex items-center gap-1.5 font-semibold hover:underline">
              <RefreshCw size={13} /> تلاش دوباره
            </button>
          </div>
        </div>
      )}

      {page === "home" && <Home articles={allArticles} openArticle={openArticle} go={go} loadStatus={loadStatus} />}
      {page === "articles" && <ArticlesList articles={allArticles} openArticle={openArticle} />}
      {page === "article" && (
        activeArticle ? (
          <ArticleDetail article={activeArticle} all={allArticles} openArticle={openArticle} go={go} />
        ) : (
          <EmptyState
            title={loadStatus === "loading" ? "در حال بارگذاری…" : "این مقاله پیدا نشد"}
            note={loadStatus === "loading" ? null : "ممکن است حذف شده یا آدرس اشتباه باشد."}
            actionLabel={loadStatus === "loading" ? null : "بازگشت به مقالات"}
            onAction={() => go("articles")}
          />
        )
      )}
      {page === "categories" && <CategoriesPage articles={allArticles} go={go} setFilterCat={setFilterCat} />}
      {page === "about" && <About />}
      {page === "contact" && <Contact />}
      {page === "admin" && <AdminPanel />}

      {page !== "admin" && <Footer go={go} />}
    </div>
  );
}

export default function ElectronBlogWithBoundary() {
  return (
    <ErrorBoundary>
      <ElectronBlog />
    </ErrorBoundary>
  );
}
