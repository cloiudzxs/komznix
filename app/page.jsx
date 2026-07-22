'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Asterisk,
  ArrowRight,
  Rocket,
  Heart,
  Eye,
  Users,
  TrendingUp,
  RefreshCw,
  Mail,
  UserPlus,
  ShoppingCart,
  X,
  ShieldCheck,
  BadgeCheck,
  ChevronDown,
  Code2,
  Gift
} from 'lucide-react';

// --- Helper Components ---

const Button = ({ children, variant = 'primary', className = '', onClick, ...props }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#B9FF66] text-black hover:bg-[#a0e655]",
    outline: "border border-white text-white hover:bg-white hover:text-black",
    dark: "bg-[#191A19] text-white hover:bg-black border border-white/20"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Animasi fade-in + geser dikit ke atas pas elemen kescroll masuk viewport.
// Pakai IntersectionObserver murni (gak nambah dependency baru). unobserve
// abis sekali muncul, jadi animasinya cuma jalan sekali per elemen, gak
// ngulang tiap di-scroll bolak-balik.
const FadeIn = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const SectionHeading = ({ title, description }) => (
  <div className="flex flex-col md:flex-row gap-6 md:items-center mb-12">
    <h2 className="bg-[#B9FF66] text-black px-4 py-2 rounded-lg text-3xl md:text-4xl font-bold w-fit">
      {title}
    </h2>
    <p className="text-gray-300 md:w-1/2 md:text-lg">
      {description}
    </p>
  </div>
);

const ServiceCard = ({ title1, title2, theme = 'dark', icon: Icon, href }) => {
  const isDark = theme === 'dark';
  const isAnchor = href?.startsWith('#');
  const Wrapper = href ? (isAnchor ? 'a' : Link) : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper {...wrapperProps} className={`p-8 md:p-12 rounded-[40px] border ${isDark ? 'bg-[#191A19] border-white/10' : 'bg-[#F3F3F3] border-[#191A19]'} flex flex-col justify-between h-[300px] md:h-[350px] relative overflow-hidden group`}>
      <div className="z-10">
        <div className="flex flex-col items-start gap-1">
          <span className={`text-xl md:text-2xl font-bold px-3 py-1 rounded-md ${isDark ? 'bg-[#B9FF66] text-black' : 'bg-white text-black'}`}>
            {title1}
          </span>
          <span className={`text-xl md:text-2xl font-bold px-3 py-1 rounded-md ${isDark ? 'bg-[#B9FF66] text-black' : 'bg-white text-black'}`}>
            {title2}
          </span>
        </div>
      </div>

      {href && (
        <div className="z-10 mt-auto flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white' : 'bg-[#191A19]'}`}>
            <ArrowRight className={`w-5 h-5 ${isDark ? 'text-black' : 'text-[#B9FF66]'}`} />
          </div>
          <span className={`font-medium ${isDark ? 'text-white' : 'text-black'} group-hover:underline underline-offset-4`}>
            Selengkapnya
          </span>
        </div>
      )}

      {/* Decorative illustration */}
      <div className={`absolute bottom-8 right-8 w-32 h-32 md:w-40 md:h-40 ${isDark ? 'text-white/20' : 'text-black/10'} transform group-hover:scale-110 transition-transform duration-500`}>
        <Icon className="w-full h-full" strokeWidth={1} />
      </div>
    </Wrapper>
  );
};

const StepCard = ({ number, title, description, icon: Icon }) => (
  <div className="flex flex-col gap-6 p-8 rounded-[32px] bg-[#191A19] border border-white/10 relative">
    <div className="flex items-center justify-between">
      <div className="w-12 h-12 rounded-full bg-[#B9FF66] text-black flex items-center justify-center">
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <span className="text-6xl font-black text-white/10 leading-none">{number}</span>
    </div>
    <div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

const TestimonialCard = ({ quote, stat, statLabel, name, role, company }) => (
  <div className="flex flex-col justify-between gap-8 p-8 rounded-[32px] bg-[#191A19] border border-white/10 h-full">
    <div className="flex flex-col gap-4">
      <span className="text-4xl md:text-5xl font-black text-[#B9FF66] leading-none">{stat}</span>
      <p className="text-sm text-gray-500 -mt-2">{statLabel}</p>
      <p className="text-gray-300 leading-relaxed">&ldquo;{quote}&rdquo;</p>
    </div>

    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
      <div className="w-11 h-11 rounded-full bg-[#B9FF66] text-black flex items-center justify-center font-bold shrink-0">
        {name.charAt(0)}
      </div>
      <div>
        <p className="font-bold text-sm">{name}</p>
        <p className="text-gray-500 text-xs">{role}, {company}</p>
      </div>
    </div>
  </div>
);

const TrustBadge = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 text-gray-300">
    <Icon className="w-4 h-4 text-[#B9FF66]" strokeWidth={2} />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const FaqItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-white/10 py-6">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 text-left"
    >
      <span className="text-lg md:text-xl font-bold">{question}</span>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-[#B9FF66] text-black' : 'bg-white/5 text-white'}`}>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>
    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">
        <p className="text-gray-400 leading-relaxed md:w-3/4">{answer}</p>
      </div>
    </div>
  </div>
);

// --- Main Component ---

export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Check login status, lalu redirect ke halaman yang sesuai.
  // Ganti pengecekan localStorage('token') ini dengan sumber auth asli project (context/session/cookie dari Supabase, dsb).
  const handleOrder = () => {
    const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token');
    router.push(isLoggedIn ? '/order' : '/login');
  };

  const faqs = [
    {
      question: 'Apakah followers/likes bisa berkurang setelah dipesan?',
      answer: 'Kemungkinan drop kecil bisa terjadi karena kebijakan platform, tapi setiap pesanan sudah otomatis dilindungi garansi refill. Kalau jumlahnya turun di bawah target, sistem akan mengisi ulang tanpa kamu perlu request manual.'
    },
    {
      question: 'Berapa lama pesanan diproses sampai selesai?',
      answer: 'Kebanyakan layanan mulai berjalan dalam hitungan menit setelah pembayaran terverifikasi. Waktu penyelesaian penuh tergantung jenis layanan dan jumlah yang dipesan, dan bisa kamu pantau progressnya langsung dari dashboard.'
    },
    {
      question: 'Apakah aman untuk akun media sosial saya?',
      answer: 'Aman. Kami tidak pernah meminta password akun kamu — cukup username atau link publik. Semua layanan diproses secara bertahap agar terlihat natural dan tidak melanggar kebijakan platform.'
    },
    {
      question: 'Metode pembayaran apa saja yang didukung?',
      answer: 'Saat ini pembayaran dilakukan lewat QRIS, mendukung semua e-wallet dan m-banking utama di Indonesia. Saldo otomatis masuk ke akun kamu begitu pembayaran terverifikasi.'
    },
    {
      question: 'Bagaimana kalau pesanan gagal atau tidak selesai?',
      answer: 'Kalau pesanan gagal diproses oleh provider, sistem otomatis membatalkan dan mengembalikan saldo secara penuh ke akun kamu tanpa perlu klaim manual.'
    }
  ];

  return (
    <div className="bg-[#111111] min-h-screen text-white font-sans selection:bg-[#B9FF66] selection:text-black">
      {/* Navbar */}
      <nav className="container mx-auto px-4 md:px-8 py-6 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Asterisk className="w-8 h-8 text-white" />
          <span className="text-2xl font-bold tracking-tight">SuntikSosmed<span className="text-[#B9FF66]">.</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-medium">
          <a href="#services" className="hover:text-[#B9FF66] transition-colors">Layanan</a>
          <a href="#how-it-works" className="hover:text-[#B9FF66] transition-colors">Cara Kerja</a>
          <a href="#api" className="hover:text-[#B9FF66] transition-colors">API</a>
          <a href="#referral" className="hover:text-[#B9FF66] transition-colors">Referral</a>
          <a href="#case-studies" className="hover:text-[#B9FF66] transition-colors">Studi Kasus</a>
          <Link href="/login" className="hover:text-[#B9FF66] transition-colors">Masuk</Link>
          <Link href="/register">
            <Button variant="primary" className="ml-2 px-5 py-2.5">Daftar</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-8 h-8 text-white" /> : <Menu className="w-8 h-8 text-white" />}
        </button>

        {menuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 font-medium z-50 md:hidden">
            <a href="#services" onClick={() => setMenuOpen(false)} className="hover:text-[#B9FF66]">Layanan</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="hover:text-[#B9FF66]">Cara Kerja</a>
            <a href="#api" onClick={() => setMenuOpen(false)} className="hover:text-[#B9FF66]">API</a>
            <a href="#referral" onClick={() => setMenuOpen(false)} className="hover:text-[#B9FF66]">Referral</a>
            <a href="#case-studies" onClick={() => setMenuOpen(false)} className="hover:text-[#B9FF66]">Studi Kasus</a>
            <Link href="/login" className="hover:text-[#B9FF66]">Masuk</Link>
            <Link href="/register">
              <Button variant="primary" className="w-full">Daftar</Button>
            </Link>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-4 md:px-8">
        {/* Hero Section */}
        <section className="py-12 md:py-24 flex flex-col-reverse md:flex-row items-center gap-12">
          <FadeIn className="md:w-1/2 flex flex-col items-start gap-6">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Naikkan performa <br className="hidden md:block" /> social media <br className="hidden md:block" /> kamu, instan.
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-lg leading-relaxed">
              Panel SMM terpercaya untuk followers, likes, views, dan engagement di Instagram, TikTok, YouTube, dan platform lainnya — proses cepat, harga bersaing.
            </p>
            <Button variant="primary" className="mt-4 text-lg px-8 py-4" onClick={handleOrder}>
              Pesan Sekarang
            </Button>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-2">
              <TrustBadge icon={ShieldCheck} label="Pembayaran QRIS aman" />
              <TrustBadge icon={RefreshCw} label="Garansi refill" />
              <TrustBadge icon={BadgeCheck} label="Proses instan" />
            </div>
          </FadeIn>

          <FadeIn delay={150} className="md:w-1/2 relative flex justify-center items-center">
            {/* Abstract hero illustration */}
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              <div className="absolute inset-0 border-[3px] border-dashed border-gray-600 rounded-full animate-[spin_60s_linear_infinite]" />
              <div className="absolute inset-4 border-[1px] border-gray-500 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
              <TrendingUp className="w-48 h-48 text-white z-10 -rotate-12 drop-shadow-2xl" strokeWidth={1} />

              {/* Floating elements */}
              <div className="absolute top-10 right-10 bg-[#B9FF66] p-4 rounded-2xl rotate-12">
                <Heart className="w-8 h-8 text-black" fill="black" />
              </div>
              <div className="absolute bottom-20 left-10 bg-white p-4 rounded-full -rotate-12">
                <Users className="w-8 h-8 text-black" />
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Supported Platforms */}
        <FadeIn className="py-12 border-t border-white/10">
          <p className="text-center md:text-left text-sm text-gray-500 mb-6">
            Siap dipakai untuk platform-platform berikut
          </p>
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-12 transition-all duration-500 [@media(hover:hover)]:opacity-70 [@media(hover:hover)]:grayscale [@media(hover:hover)]:hover:grayscale-0 [@media(hover:hover)]:hover:opacity-100">
            <h3 className="text-2xl font-bold text-[#E1306C]">Instagram</h3>
            <h3 className="text-2xl font-bold">TikTok</h3>
            <h3 className="text-2xl font-bold text-[#FF0000]">YouTube</h3>
            <h3 className="text-2xl font-bold text-[#1877F2]">Facebook</h3>
            <h3 className="text-2xl font-bold">X / Twitter</h3>
            <h3 className="text-2xl font-bold text-[#26A5E4]">Telegram</h3>
            <h3 className="text-2xl font-bold text-[#1DB954]">Spotify</h3>
            <h3 className="text-2xl font-bold text-[#EE4D2D]">Shopee</h3>
          </div>
        </FadeIn>

        {/* Services Section */}
        <section id="services" className="py-20 md:py-32">
          <FadeIn>
            <SectionHeading
              title="Layanan"
              description="SuntikSosmed menyediakan berbagai layanan SMM untuk bantu akun media sosial kamu tumbuh lebih cepat dan lebih efektif."
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FadeIn delay={0}>
              <ServiceCard
                title1="Followers"
                title2="Instagram & TikTok"
                theme="light"
                icon={UserPlus}
                href="/layanan?q=followers"
              />
            </FadeIn>
            <FadeIn delay={80}>
              <ServiceCard
                title1="Likes &"
                title2="Reactions"
                theme="dark"
                icon={Heart}
                href="/layanan?q=likes"
              />
            </FadeIn>
            <FadeIn delay={160}>
              <ServiceCard
                title1="Views &"
                title2="Watch Time"
                theme="dark"
                icon={Eye}
                href="/layanan?q=views"
              />
            </FadeIn>
            <FadeIn delay={0}>
              <ServiceCard
                title1="Auto"
                title2="Refill Garansi"
                theme="light"
                icon={RefreshCw}
              />
            </FadeIn>
            <FadeIn delay={80}>
              <ServiceCard
                title1="API"
                title2="Integration"
                theme="dark"
                icon={Code2}
                href="#api"
              />
            </FadeIn>
          </div>
        </section>

        {/* API / Developers Section */}
        <section id="api" className="py-10">
          <div className="bg-[#191A19] border border-white/10 rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <FadeIn className="md:w-1/2 flex flex-col items-start gap-5">
              <span className="bg-[#B9FF66] text-black px-3 py-1 rounded-md text-sm font-bold w-fit">
                Untuk Developer
              </span>
              <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                Integrasikan layanan SMM ke sistem kamu sendiri lewat API kami
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Pesan layanan, cek status order, dan pantau progress otomatis langsung dari aplikasi atau bot kamu &mdash; tanpa perlu buka dashboard manual. Setiap akun dapat API key sendiri.
              </p>
              <Link href="/register">
                <Button variant="primary" className="mt-2">
                  Dapatkan API Key <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </FadeIn>

            <FadeIn delay={150} className="md:w-1/2 w-full">
              <pre className="bg-[#111111] border border-white/10 rounded-2xl p-6 text-xs md:text-sm text-gray-300 overflow-x-auto">
                {`curl https://suntiksosmed.store/api/v1/order \\
  -H "Authorization: Bearer API_KEY_KAMU" \\
  -H "Content-Type: application/json" \\
  -d '{"layanan": 123, "target": "https://instagram.com/username", "jumlah": 1000}'`}
              </pre>
            </FadeIn>
          </div>
        </section>

        {/* Referral Section */}
        <section id="referral" className="py-10">
          <div className="bg-[#191A19] border border-white/10 rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <FadeIn className="md:w-1/2 flex flex-col items-start gap-5">
              <span className="bg-[#B9FF66] text-black px-3 py-1 rounded-md text-sm font-bold w-fit">
                Program Referral
              </span>
              <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                Ajak teman, kalian sama-sama untung
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Bagikan kode referral kamu ke teman atau komunitas. Setiap mereka order lewat kode kamu, komisi otomatis masuk ke saldo kamu — gak ada batas berapa kali kamu bisa ajak orang.
              </p>
              <Link href="/register">
                <Button variant="primary" className="mt-2">
                  Mulai Ajak Teman <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </FadeIn>

            <FadeIn delay={150} className="md:w-1/2 w-full flex justify-center">
              <div className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#B9FF66] flex items-center justify-center">
                  <Gift className="w-8 h-8 text-black" />
                </div>
                <p className="text-gray-400 text-sm">Kode referral kamu sendiri</p>
                <p className="font-mono text-xl font-bold text-[#B9FF66] bg-[#B9FF66]/10 px-4 py-2 rounded-xl">
                  SUNTIK-XXXXX
                </p>
                <p className="text-gray-500 text-xs">Komisi otomatis masuk saldo tiap ada yang order pakai kode ini.</p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-32">
          <FadeIn>
            <SectionHeading
              title="Cara Kerja"
              description="Mulai kembangkan media sosial kamu hanya dalam tiga langkah simpel."
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={0}>
              <StepCard
                number="01"
                title="Buat akun"
                description="Daftar akun SuntikSosmed dalam hitungan detik, cukup dengan email dan verifikasi singkat."
                icon={UserPlus}
              />
            </FadeIn>
            <FadeIn delay={80}>
              <StepCard
                number="02"
                title="Pilih & top up"
                description="Pilih platform dan jenis layanan yang kamu butuhkan, lalu isi saldo lewat QRIS."
                icon={ShoppingCart}
              />
            </FadeIn>
            <FadeIn delay={160}>
              <StepCard
                number="03"
                title="Pantau progress"
                description="Pesanan langsung diproses dan bisa kamu pantau real-time dari dashboard."
                icon={TrendingUp}
              />
            </FadeIn>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10">
          <FadeIn className="bg-[#F3F3F3] rounded-[40px] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
            <div className="md:w-[55%] z-10 flex flex-col items-start gap-6">
              <h3 className="text-3xl md:text-5xl font-bold text-black leading-tight">
                Yuk kembangkan social media kamu bareng kami
              </h3>
              <p className="text-gray-700 text-lg">
                Daftar akun SuntikSosmed sekarang dan mulai pesan followers, likes, views, dan engagement untuk semua platform favoritmu dalam hitungan detik.
              </p>
              <Link href="/register">
                <Button variant="dark" className="mt-4">
                  Daftar Gratis
                </Button>
              </Link>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 -mt-2">
                <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Pembayaran aman
                </div>
                <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                  <RefreshCw className="w-3.5 h-3.5" /> Garansi refill
                </div>
              </div>
            </div>

            <div className="hidden md:flex md:w-[40%] justify-end z-10 relative mt-10 md:mt-0">
              {/* Abstract CTA illustration */}
              <div className="relative">
                <div className="w-48 h-48 bg-[#191A19] rounded-full flex items-center justify-center z-20 relative">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white animate-pulse"></div>
                    <div className="w-8 h-8 rounded-full bg-white animate-pulse delay-75"></div>
                  </div>
                </div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#B9FF66] clip-path-star z-10 rotate-12">
                  {/* Abstract star polygon */}
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                    <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" />
                  </svg>
                </div>
                {/* Orbit/spiral lines */}
                <svg className="absolute -top-10 -right-10 w-64 h-64 text-gray-300 z-0" viewBox="0 0 100 100">
                  <path d="M10,50 a40,20 0 1,0 80,0 a40,20 0 1,0 -80,0" fill="none" stroke="currentColor" strokeWidth="2" className="animate-[spin_10s_linear_infinite]" />
                </svg>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Case Study Section */}
        <section id="case-studies" className="py-20 md:py-32">
          <FadeIn>
            <SectionHeading
              title="Studi Kasus"
              description="Lihat contoh nyata hasil dari klien yang sudah pakai layanan SMM kami."
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={0}>
              <TestimonialCard
                stat="+300%"
                statLabel="Followers Instagram"
                quote="Followers dan engagement Instagram toko online kami naik drastis dalam beberapa hari, prosesnya juga cepat dan aman."
                name="Dinda Pratiwi"
                role="Owner"
                company="Online Shop"
              />
            </FadeIn>
            <FadeIn delay={80}>
              <TestimonialCard
                stat="-70%"
                statLabel="Biaya promosi"
                quote="Dibanding pakai jasa promosi manual, SuntikSosmed jauh lebih murah dan hasilnya lebih terukur untuk kampanye TikTok kami."
                name="Aditya Nugroho"
                role="Marketing Lead"
                company="UMKM Fashion"
              />
            </FadeIn>
            <FadeIn delay={160}>
              <TestimonialCard
                stat="+150%"
                statLabel="Engagement TikTok"
                quote="View dan like konten TikTok kami naik signifikan, bantu banget buat naikin reach organik ke FYP."
                name="Rahmat Hidayat"
                role="Content Creator"
                company="Digital Agency"
              />
            </FadeIn>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 md:py-32">
          <FadeIn>
            <SectionHeading
              title="FAQ"
              description="Pertanyaan yang paling sering ditanyakan soal layanan, keamanan, dan pembayaran."
            />
          </FadeIn>

          <FadeIn delay={100} className="bg-[#191A19] border border-white/10 rounded-[40px] px-8 md:px-16 py-4">
            {faqs.map((faq, i) => (
              <FaqItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </FadeIn>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="container mx-auto px-4 md:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-10 md:gap-8">

            {/* Brand */}
            <div className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2 w-fit">
                <Asterisk className="w-8 h-8 text-white" />
                <span className="text-2xl font-bold tracking-tight">SuntikSosmed<span className="text-[#B9FF66]">.</span></span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Panel SMM terpercaya untuk followers, likes, views, dan engagement di semua platform media sosial favoritmu.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-1">Menu</h4>
              <a href="#services" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">Layanan</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">Cara Kerja</a>
              <a href="#api" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">API</a>
              <a href="#referral" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">Referral</a>
              <a href="#case-studies" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">Studi Kasus</a>
              <a href="#faq" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">FAQ</a>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-1">Legal</h4>
              <Link href="/privacy-policy" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">Kebijakan Privasi</Link>
              <Link href="/terms-of-service" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">Syarat & Ketentuan</Link>
              <Link href="/refund-policy" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm w-fit">Kebijakan Refund</Link>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-1">Kontak</h4>
              <a href="mailto:suntiksosmed@proton.me" className="text-gray-300 hover:text-[#B9FF66] transition-colors text-sm flex items-center gap-2 w-fit">
                <Mail className="w-4 h-4 shrink-0" /> suntiksosmed@proton.me
              </a>
              <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#B9FF66]" />
                Pembayaran aman & data terenkripsi
              </div>
            </div>

          </div>

          <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <p>&copy; 2026 SuntikSosmed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}