import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Menu, X, Clock, Calendar, Share2, Link2, ChevronLeft, ChevronRight,
  Send, Instagram, Plus, Pencil, Trash2, Image as ImageIcon, Save,
  LayoutDashboard, FileText, Tags, Eye, EyeOff, Atom, Mail, MapPin, Phone,
  ArrowUpLeft, Quote as QuoteIcon, Twitter, LogOut, Lock
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

const SEED_ARTICLES = [
  {
    id: "a1",
    title: "معمای مشروعیت در دولت‌های پساتحول",
    excerpt:
      "چرا برخی نظام‌های سیاسی پس از تحولات بزرگ، سال‌ها با بحران مشروعیت دست‌وپنجه نرم می‌کنند؟ نگاهی تحلیلی به سازوکارهای بازتولید مشروعیت.",
    category: "governance",
    date: "1404/03/12",
    tags: ["مشروعیت", "دولت", "نظریه سیاسی"],
    featured: true,
    content: [
      "مشروعیت سیاسی، برخلاف تصور رایج، یک‌بار برای همیشه کسب نمی‌شود؛ بلکه فرآیندی مستمر از اقناع، عملکرد و روایت‌سازی است که هر نظام سیاسی موظف است روزانه آن را بازتولید کند.",
      "در دوره‌های گذار، شکاف میان مشروعیت رویه‌ای و مشروعیت کارکردی بیش از هر زمان دیگری خود را نشان می‌دهد. نظامی که از مسیر انتخابات یا انقلاب به قدرت می‌رسد، اگر نتواند در کوتاه‌مدت عملکرد قابل قبولی از خود نشان دهد، به‌تدریج سرمایه نمادین آغازین خود را از دست می‌دهد.",
      "تجربه بسیاری از کشورها نشان می‌دهد که ترکیب سه عنصر روایت مؤسس، کارآمدی اقتصادی، و مشارکت نهادینه‌شده، تعیین‌کننده پایداری مشروعیت در بلندمدت است. غیبت هر یک از این ارکان، فضا را برای بحران‌های تدریجی مشروعیت باز می‌کند.",
      "پرسش نهایی این است: آیا مشروعیت را می‌توان مهندسی کرد، یا صرفاً می‌توان بستر رشد طبیعی آن را فراهم آورد؟ پاسخ به این پرسش، مسیر بسیاری از تصمیمات راهبردی حکمرانان را روشن می‌کند.",
    ],
  },
  {
    id: "a2",
    title: "ژئوپلیتیک انرژی و بازآرایی قدرت در غرب آسیا",
    excerpt:
      "مسیرهای انتقال انرژی همچنان یکی از متغیرهای تعیین‌کننده در معماری قدرت منطقه‌ای است. بررسی روندهای تازه در نقشه انرژی خاورمیانه.",
    category: "geopolitics",
    date: "1404/03/05",
    tags: ["انرژی", "خاورمیانه", "قدرت منطقه‌ای"],
    featured: false,
    content: [
      "کریدورهای انرژی هیچ‌گاه صرفاً پروژه‌های اقتصادی نبوده‌اند؛ آن‌ها نقشه‌ای هستند از منافع، اتحادها و رقابت‌های پنهان میان بازیگران منطقه‌ای و فرامنطقه‌ای.",
      "تنوع‌بخشی به مسیرهای صادراتی، در سال‌های اخیر به یک اولویت راهبردی برای بسیاری از تولیدکنندگان انرژی تبدیل شده است؛ نه صرفاً به دلایل اقتصادی، بلکه برای کاهش آسیب‌پذیری ژئوپلیتیک.",
      "در این میان، بازیگرانی که بتوانند خود را به‌عنوان گره‌های ضروری در این شبکه معرفی کنند، از اهرم چانه‌زنی بیشتری در معادلات سیاسی منطقه برخوردار خواهند شد.",
    ],
  },
  {
    id: "a3",
    title: "حکمرانی دیجیتال: وقتی الگوریتم‌ها سیاست می‌سازند",
    excerpt:
      "از تصمیم‌گیری خودکار در بوروکراسی تا مهندسی افکار عمومی در فضای مجازی؛ الگوریتم‌ها دیگر ابزار صرف نیستند، بازیگرند.",
    category: "governance",
    date: "1404/02/28",
    tags: ["فناوری", "حکمرانی دیجیتال", "افکار عمومی"],
    featured: false,
    content: [
      "دولت‌ها به‌طور فزاینده‌ای از سامانه‌های الگوریتمی برای تخصیص منابع، ارزیابی ریسک و حتی پیش‌بینی رفتار شهروندان استفاده می‌کنند؛ روندی که پرسش‌های جدی درباره پاسخگویی و شفافیت را برجسته می‌سازد.",
      "وقتی تصمیمی که سرنوشت یک شهروند را تغییر می‌دهد، از دل یک مدل محاسباتی بیرون می‌آید، مسئولیت سیاسی کجا قرار می‌گیرد؟ این پرسش هسته اصلی مناقشات آینده حکمرانی خواهد بود.",
      "از سوی دیگر، پلتفرم‌های اجتماعی با طراحی الگوریتم‌های توصیه‌گر خود، عملاً در حال شکل‌دادن به دستور کار عمومی هستند؛ نقشی که پیش‌تر صرفاً بر عهده رسانه‌های سنتی بود.",
    ],
  },
  {
    id: "a4",
    title: "اقتصاد سیاسی تحریم: ابزار یا استراتژی؟",
    excerpt:
      "تحریم‌ها اغلب به‌عنوان ابزاری کوتاه‌مدت معرفی می‌شوند، اما در عمل به بخشی از معماری بلندمدت روابط قدرت بدل شده‌اند.",
    category: "economics",
    date: "1404/02/19",
    tags: ["تحریم", "اقتصاد سیاسی", "دیپلماسی اقتصادی"],
    featured: true,
    content: [
      "تحریم اقتصادی، در ادبیات سیاست خارجی، معمولاً به‌عنوان جایگزینی برای اقدام نظامی معرفی می‌شود؛ اما تجربه چند دهه اخیر نشان می‌دهد کارکرد آن بسیار پیچیده‌تر از یک ابزار فشار ساده است.",
      "اثربخشی تحریم به سه عامل بستگی دارد: میزان وابستگی اقتصاد هدف به شبکه جهانی، ظرفیت دولت هدف برای بازتوزیع هزینه‌ها در داخل، و انسجام ائتلاف تحریم‌کننده در بلندمدت.",
      "در بسیاری از موارد، تحریم‌ها به‌جای تغییر رفتار سیاسی، صرفاً ساختار اقتصادی داخلی کشور هدف را بازآرایی می‌کنند و بازیگران اقتصادی جدیدی را در کانون قدرت قرار می‌دهند.",
    ],
  },
  {
    id: "a5",
    title: "درس‌های تاریخ برای دیپلماسی امروز",
    excerpt:
      "الگوهای مذاکراتی که یک قرن پیش شکل گرفتند، هنوز هم در پس بسیاری از تصمیمات دیپلماتیک امروز قابل ردیابی‌اند.",
    category: "history",
    date: "1404/02/10",
    tags: ["تاریخ دیپلماسی", "مذاکره", "نظم بین‌الملل"],
    featured: false,
    content: [
      "بازخوانی مذاکرات بزرگ تاریخی نشان می‌دهد که موفقیت دیپلماتیک کمتر محصول لحظه امضای توافق است و بیشتر نتیجه سال‌ها زمینه‌سازی، اعتمادسازی تدریجی و مدیریت دقیق افکار عمومی داخلی طرف‌های مذاکره بوده است.",
      "یکی از الگوهای تکرارشونده در تاریخ دیپلماسی، نقش «واسطه‌های قابل‌اعتماد» است؛ بازیگرانی که با وجود نداشتن منافع مستقیم در نتیجه مذاکره، به دلیل اعتبار انباشته‌شده، امکان نزدیک‌کردن مواضع را فراهم می‌آورند.",
      "درک این الگوها به ما کمک می‌کند تا رفتار دیپلماتیک امروز را نه به‌عنوان رویدادهای مجزا، بلکه در امتداد یک سنت طولانی از آزمون و خطا بخوانیم.",
    ],
  },
  {
    id: "a6",
    title: "روابط بین‌الملل در جهان چندقطبی نوظهور",
    excerpt:
      "نظم تک‌قطبی پس از جنگ سرد به‌آرامی جای خود را به معماری‌ای چندلایه و کمتر قابل‌پیش‌بینی می‌دهد.",
    category: "ir",
    date: "1404/01/30",
    tags: ["نظم جهانی", "چندجانبه‌گرایی", "توازن قوا"],
    featured: false,
    content: [
      "برخلاف گذار از نظم دوقطبی به تک‌قطبی که با فروپاشی نسبتاً سریع یک قطب همراه بود، گذار کنونی به‌مراتب تدریجی‌تر و پیچیده‌تر است و بازیگران متعددی به‌طور هم‌زمان در حال بازتعریف جایگاه خود هستند.",
      "در چنین محیطی، اتحادهای موضوعی و موقت جای ائتلاف‌های ایدئولوژیک بلندمدت را می‌گیرند؛ کشورها بر اساس منافع مشخص در هر پرونده، ائتلاف‌های متفاوتی می‌سازند.",
      "این وضعیت، اگرچه فضای مانور بیشتری برای قدرت‌های میانی فراهم می‌کند، اما پیش‌بینی‌پذیری نظم جهانی را نیز به شدت کاهش می‌دهد.",
    ],
  },
];

const QUOTE = {
  fa: "قدرتِ واقعیِ یک تحلیل، نه در هیجانِ لحظه که در دقتِ نگاهِ آن به آینده نهفته است.",
  by: "الکترون",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function readingTime(paragraphs) {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
}
function uid() {
  return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Maps a Supabase `articles` row (snake_case) to the shape the UI expects.
function fromDbRow(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt || "",
    category: row.category,
    date: row.date_label || new Date(row.created_at).toLocaleDateString("fa-IR"),
    tags: row.tags || [],
    content: row.content && row.content.length ? row.content : [""],
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
    excerpt: article.excerpt,
    category: article.category,
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
function Cover({ className = "" }) {
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
function Header({ page, go, searchOpen, setSearchOpen }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
                placeholder="جستجو در مقالات…"
                className="flex-1 bg-transparent outline-none text-[14px]"
              />
            </div>
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
             پلتفرم مکمل چنل الکترون ، برای تحلیل های بلند تر، تخصصا برای مخاطبان سطح بالا.
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
          <span>© {1405} الکترون — تمام حقوق محفوظ است.</span>
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
  const cat = catById(article.category);
  return (
    <button
      onClick={() => onOpen(article.id)}
      className={`group text-right w-full ${big ? "" : ""}`}
    >
      <Cover className={big ? "h-64 md:h-80 w-full" : "h-44 w-full"} />
      <div className={big ? "pt-2" : "pt-0"} />
      <div className="mt-4">
        <span
          className="inline-block text-[11.5px] font-medium px-2.5 py-1 rounded-full mb-3"
          style={{ background: "rgba(193,18,31,0.08)", color: COLORS.primary }}
        >
          {cat.fa}
        </span>
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
function Home({ articles, openArticle, go }) {
  const featured = articles.find((a) => a.featured) || articles[0];
  const latest = articles.filter((a) => a.id !== featured.id).slice(0, 4);

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
نوشته های شخصی یه فعال رسانه ای دهه هشتادی            </p>
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

      {/* Latest */}
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
  const filtered = active === "all" ? articles : articles.filter((a) => a.category === active);

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
  const contentRef = useRef(null);

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
  const cat = catById(article.category);
  const idx = all.findIndex((a) => a.id === article.id);
  const prev = all[idx + 1];
  const next = all[idx - 1];
  const related = all.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 3);

  return (
    <div>
      <div className="fixed top-0 inset-x-0 h-[3px] z-50 bg-transparent">
        <div className="h-full transition-[width] duration-150" style={{ width: `${progress}%`, background: COLORS.primary }} />
      </div>

      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-14">
        <button onClick={() => go("articles")} className="flex items-center gap-1.5 text-[13.5px] text-neutral-400 hover:text-neutral-600 mb-8">
          <ChevronRight size={15} /> بازگشت به مقالات
        </button>

        <span className="inline-block text-[12px] font-medium px-3 py-1 rounded-full mb-5" style={{ background: "rgba(193,18,31,0.08)", color: COLORS.primary }}>
          {cat.fa}
        </span>
        <h1 className="text-3xl md:text-[44px] font-extrabold leading-[1.35] mb-6" style={{ color: COLORS.ink }}>
          {article.title}
        </h1>
        <div className="flex items-center gap-5 text-[13px] text-neutral-400 mb-10">
          <span className="flex items-center gap-1.5"><Calendar size={14} />{article.date}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} />{readingTime(article.content)} دقیقه مطالعه</span>
        </div>

        <Cover className="w-full h-56 md:h-96 mb-12" />

        <article ref={contentRef} className="text-[18px] leading-[2.15] text-[#333] space-y-7" style={{ textAlign: "justify" }}>
          {article.content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12">
            {article.tags.map((t) => (
              <span key={t} className="text-[12px] px-3 py-1.5 rounded-full bg-white text-neutral-500" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-10 pt-8 border-t border-black/5">
          <span className="text-[13px] text-neutral-400 flex items-center gap-1.5 ml-1"><Share2 size={14} /> اشتراک‌گذاری:</span>
          {[Twitter, Send, Link2].map((Icon, i) => (
            <button key={i} className="w-9 h-9 rounded-full flex items-center justify-center bg-white hover:-translate-y-0.5 transition-transform" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <Icon size={15} color={COLORS.ink} />
            </button>
          ))}
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
          const count = articles.filter((a) => a.category === c.id).length;
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
          <p>الکترون یک رسانه خبری نیست. درواقع دفترچه‌ای نیمه شخصی از تحلیل ها و روایات یک فعال رسانه ای است که از چپ و راست بیزاره. رویداد های سیاسی رو بررسی و تحلیل میکنیم.</p>
          <p>مخاطب این نوشته‌ها، جوون های هم سن و سال من هستند که از بی عدالتی و ظلم و زد و بند بازی خسته شدن و در جست و جوی عدالتند .</p>
          <p>هدف من ساده است: نوشتنِ صادقانه، مستقل و عدالتطلبانه. بدون پروژه.پشت هر مقاله، حاصل ساعت‌ها مطالعه و بازاندیشی وجود داره سریع ازش نگذرید.</p>
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
            { Icon: Mail, l: "ایمیل", v: "شرمنده(:" },
            { Icon: MapPin, l: "موقعیت", v: "قزوین، ایران" },
            { Icon: Phone, l: " کانال بله", v: "@electron_ir" },
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
              ارسال پیام(بزن روش ولی کار نمیکنه)
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
      title: "",
      excerpt: "",
      category: CATEGORIES[0].id,
      date: "1404/04/01",
      tags: [],
      content: [""],
      draft: true,
      featured: false,
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
    if (error) setError(error.message);
    else { await loadArticles(); setEditing(null); setTab("articles"); }
    setLoading(false);
  };

  const deleteArticle = async (id) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) setError(error.message);
    else setArticles((prev) => prev.filter((a) => a.id !== id));
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
                این پنل حالا به دیتابیس واقعی (Supabase Postgres) وصل است: مقالاتی که اینجا می‌سازید یا ویرایش می‌کنید، برای همه‌ی بازدیدکنندگان سایت — از هر دستگاهی — قابل مشاهده‌اند (مگر آن‌که «پیش‌نویس» باشند).
              </div>
            </div>
          )}

          {tab === "articles" && !editing && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3 text-[12px] text-neutral-400 border-b border-black/5">
                <span>عنوان</span><span>دسته</span><span>وضعیت</span><span></span>
              </div>
              {articles.length === 0 && !loading && (
                <div className="px-5 py-10 text-center text-[13.5px] text-neutral-400">
                  هنوز مقاله‌ای در دیتابیس نیست. با دکمه «مقاله جدید» شروع کنید (یا فایل sql/schema.sql را برای داده‌ی نمونه اجرا کنید).
                </div>
              )}
              {articles.map((a) => (
                <div key={a.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3.5 items-center border-b border-black/5 last:border-0 text-[13.5px]">
                  <span className="font-medium truncate" style={{ color: COLORS.ink }}>{a.title || "(بدون عنوان)"}</span>
                  <span className="text-neutral-400 whitespace-nowrap">{catById(a.category)?.fa}</span>
                  <span className="whitespace-nowrap">
                    {a.draft ? (
                      <span className="flex items-center gap-1 text-amber-600 text-[12px]"><EyeOff size={12}/> پیش‌نویس</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 text-[12px]"><Eye size={12}/> منتشرشده</span>
                    )}
                  </span>
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
              <p className="sm:col-span-2 text-[12.5px] text-neutral-400">دسته‌بندی‌ها در این نسخه ثابت تعریف شده‌اند؛ در آینده می‌توان یک جدول categories جدا در Supabase اضافه کرد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleEditor({ article, onCancel, onSave }) {
  const [form, setForm] = useState(article);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[12.5px] text-neutral-500 mb-1.5 block">دسته‌بندی</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.fa}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[12.5px] text-neutral-500 mb-1.5 block">تاریخ انتشار</label>
          <input value={form.date} onChange={(e) => set("date", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]" />
        </div>
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">خلاصه</label>
        <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px] resize-none" />
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">متن مقاله (هر پاراگراف در یک خط)</label>
        <textarea
          value={form.content.join("\n")}
          onChange={(e) => set("content", e.target.value.split("\n"))}
          rows={7}
          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px] leading-7 resize-none"
        />
      </div>

      <div>
        <label className="text-[12.5px] text-neutral-500 mb-1.5 block">برچسب‌ها (با کاما جدا کنید)</label>
        <input
          value={form.tags.join("، ")}
          onChange={(e) => set("tags", e.target.value.split(/[,،]/).map((t) => t.trim()).filter(Boolean))}
          className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] outline-none text-[14px]"
        />
      </div>

      <div className="p-4 rounded-xl border border-dashed border-black/10 flex items-center gap-3 text-neutral-400">
        <ImageIcon size={18} />
        <span className="text-[13px]">آپلود تصویر کاور (در این پیش‌نمایش، کاور به‌صورت خودکار طراحی می‌شود)</span>
      </div>

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
          onClick={() => onSave({ ...form, featured: false })}
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
export default function ElectronBlog() {
  useVazirFont();
  const [page, setPage] = useState("home");
  const [activeId, setActiveId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dbArticles, setDbArticles] = useState(null); // null = not loaded yet
  const [, setFilterCat] = useState("all");

  useEffect(() => {
    if (!isSupabaseConfigured) return; // stay on seed data
    (async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("draft", false)
        .order("created_at", { ascending: false });
      if (!error && data) setDbArticles(data.map(fromDbRow));
    })();
  }, []);

  // Prefer live database articles once loaded; fall back to the built-in
  // sample set so the site still looks complete before Supabase is wired up.
  const allArticles = useMemo(() => {
    return dbArticles && dbArticles.length ? dbArticles : SEED_ARTICLES;
  }, [dbArticles]);

  const go = (p) => { setPage(p); setSearchOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openArticle = (id) => { setActiveId(id); setPage("article"); window.scrollTo({ top: 0 }); };

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

      <Header page={page} go={go} searchOpen={searchOpen} setSearchOpen={setSearchOpen} />

      {page === "home" && <Home articles={allArticles} openArticle={openArticle} go={go} />}
      {page === "articles" && <ArticlesList articles={allArticles} openArticle={openArticle} />}
      {page === "article" && activeArticle && (
        <ArticleDetail article={activeArticle} all={allArticles} openArticle={openArticle} go={go} />
      )}
      {page === "categories" && <CategoriesPage articles={allArticles} go={go} setFilterCat={setFilterCat} />}
      {page === "about" && <About />}
      {page === "contact" && <Contact />}
      {page === "admin" && <AdminPanel />}

      {page !== "admin" && <Footer go={go} />}
    </div>
  );
}
