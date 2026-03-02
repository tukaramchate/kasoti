import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { FiEdit3, FiCheckCircle, FiBarChart2, FiUserPlus, FiBookOpen, FiAward, FiMoon, FiSun, FiArrowRight, FiCode, FiHeart, FiZap } from "react-icons/fi";
import { motion, useScroll, useTransform } from "framer-motion";

/* ---------- Reusable animation variants ---------- */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = (delay = 0.12) => ({
  visible: { transition: { staggerChildren: delay } },
});

/* ─── Floating particle dots ─────────────────────── */
const particles = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 5,
  duration: Math.random() * 6 + 6,
}));

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 60], ["rgba(var(--bg-card-rgb), 0)", "var(--bg-card)"]);
  const navBorder = useTransform(scrollY, [0, 60], ["rgba(var(--border-rgb),0)", "var(--border)"]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  useEffect(() => {
    if (user) navigate("/home");
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] relative overflow-hidden">

      {/* ── Background Layer ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className={`absolute inset-0 ${darkMode ? "bg-grid-pattern-dark" : "bg-grid-pattern"} opacity-40`} />

        {/* Gradient orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-gradient-radial from-indigo-500 to-transparent rounded-full filter blur-[120px] opacity-25 animate-blob" />
        <div className="absolute top-[15%] right-[-12%] w-[45%] h-[45%] bg-gradient-radial from-violet-600 to-transparent rounded-full filter blur-[110px] opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-15%] left-[20%] w-[50%] h-[50%] bg-gradient-radial from-fuchsia-600 to-transparent rounded-full filter blur-[130px] opacity-20 animate-blob animation-delay-4000" />
        <div className="absolute top-[50%] left-[40%] w-[30%] h-[30%] bg-gradient-radial from-cyan-500 to-transparent rounded-full filter blur-[100px] opacity-15 animate-blob animation-delay-3000" />

        {/* Floating particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 opacity-40"
            style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── Navbar ── */}
      <motion.nav
        style={{ backgroundColor: navBg, borderColor: navBorder }}
        className="fixed w-full top-0 z-50 border-b backdrop-blur-2xl transition-all duration-300"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-9 rounded-sm object-contain" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2.5">
            <button
              className="w-9 h-9 bg-transparent border border-[color:var(--border)] rounded-xl cursor-pointer text-[color:var(--text-secondary)] text-base flex items-center justify-center transition-all hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:rotate-12"
              onClick={toggleTheme} title="Toggle theme"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <Link to="/login" className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-[13px] font-semibold no-underline transition-all text-[color:var(--text-secondary)] border border-[color:var(--border)] bg-transparent hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-light)]">
              Login
            </Link>
            <Link to="/register" className="group relative inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold no-underline overflow-hidden bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white shadow-md hover:shadow-glow hover:-translate-y-0.5 transition-all">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative">Get Started</span>
              <FiArrowRight className="relative group-hover:translate-x-0.5 transition-transform" size={13} />
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-[70px]">

        {/* ── Hero ── */}
        <section className="py-24 md:py-36 px-6 overflow-hidden">
          <motion.div style={{ y: heroY }} className="max-w-5xl mx-auto flex items-center gap-12 flex-col md:flex-row text-center md:text-left">
            <motion.div initial="hidden" animate="visible" variants={stagger(0.1)} className="flex-1 min-w-0">

              {/* Badge */}
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-indigo-400/30 bg-indigo-500/10 backdrop-blur-sm text-indigo-400 text-sm font-semibold">
                <FiZap className="text-amber-400 animate-pulse" />
                Welcome to the new standard in learning
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-[72px] font-extrabold leading-[1.08] tracking-tight mb-6">
                Prove What<br />
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 animate-gradient-x">
                    You Know.
                  </span>
                  {/* Underline shimmer */}
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 rounded-full origin-left"
                  />
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p variants={fadeUp} className="text-lg md:text-xl leading-relaxed text-[color:var(--text-secondary)] mb-10 max-w-[480px] mx-auto md:mx-0 font-medium">
                The interactive quiz platform for students and teachers.
                Create, share, and take quizzes with instant results and global leaderboards.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex gap-4 flex-wrap justify-center md:justify-start">
                <Link to="/register" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold no-underline transition-all duration-300 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] hover:-translate-y-1.5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                  <span className="relative flex items-center gap-2">
                    Get Started Free
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold no-underline transition-all duration-300 backdrop-blur-md text-[color:var(--text-primary)] border border-[color:var(--border)] hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-500/10 hover:-translate-y-1.5">
                  Sign In
                </Link>
              </motion.div>

              {/* Social proof chips */}
              <motion.div variants={fadeUp} className="flex items-center gap-4 mt-8 justify-center md:justify-start flex-wrap">
                {[{ text: "Free to start" }, { text: "No credit card" }, { text: "Instant results" }].map((chip) => (
                  <span key={chip.text} className="flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--text-muted)]">
                    <FiCheckCircle className="text-emerald-400" size={14} /> {chip.text}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 flex items-center justify-center relative w-full md:w-[44%]"
            >
              {/* Glow ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-violet-500/20 to-fuchsia-500/30 rounded-[2rem] filter blur-3xl transform rotate-6 scale-110" />
              {/* Rotating gradient border */}
              <div className="absolute inset-[-4px] rounded-[2rem] bg-gradient-to-tr from-indigo-400 via-violet-500 to-fuchsia-400 opacity-20 blur-sm animate-spin-slow" />
              <img
                src="/assets/1.png"
                alt="Student using Kasoti"
                className="relative w-64 md:w-full max-w-[420px] h-auto drop-shadow-2xl animate-float"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats strip ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger(0.1)}
          className="py-8 border-y border-[color:var(--border)] bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5 backdrop-blur-md"
        >
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
            {[
              { value: "4+", label: "Question Types" },
              { value: "100%", label: "Free to Use" },
              { value: "∞", label: "Quizzes to Create" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col gap-1">
                <span className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{stat.value}</span>
                <span className="text-[13px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Features ── */}
        <section className="py-16 md:py-24 bg-[color:var(--bg-secondary)] border-b border-[color:var(--border)]">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger(0.08)}>
              <motion.p variants={fadeUp} className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-3">Platform</motion.p>
              <motion.h2 variants={fadeUp} className="text-[28px] md:text-[36px] font-extrabold text-[color:var(--text-primary)] mb-3 tracking-tight">
                Everything you need
              </motion.h2>
              <motion.p variants={fadeUp} className="text-[16px] text-[color:var(--text-secondary)] mb-12 font-medium">
                Built for classrooms, study groups, and self-learners
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
              variants={stagger(0.15)}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[440px] md:max-w-none mx-auto"
            >
              {[
                {
                  icon: <FiEdit3 />,
                  title: "Create Quizzes",
                  desc: "Build quizzes with MCQ, True/False, Descriptive, and multi-select questions. Set time limits and publish in one click.",
                  gradient: "from-indigo-500 to-blue-500",
                  glow: "from-indigo-500/20 to-blue-500/10",
                },
                {
                  icon: <FiCheckCircle />,
                  title: "Take Quizzes",
                  desc: "Attempt quizzes and get instant results with score breakdowns, time tracking, and answer review.",
                  gradient: "from-violet-500 to-purple-600",
                  glow: "from-violet-500/20 to-purple-600/10",
                },
                {
                  icon: <FiBarChart2 />,
                  title: "Track Progress",
                  desc: "Leaderboards, analytics dashboards, and quiz history help you measure growth over time.",
                  gradient: "from-fuchsia-500 to-pink-500",
                  glow: "from-fuchsia-500/20 to-pink-500/10",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  whileHover={{ y: -10, transition: { duration: 0.25 } }}
                  className="group relative bg-[color:var(--bg-card)]/70 backdrop-blur-xl border border-[color:var(--border)] rounded-2xl p-8 text-left overflow-hidden hover:border-indigo-400/40 transition-colors"
                >
                  {/* Corner glow on hover */}
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${feature.glow} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  {/* Icon */}
                  <div className={`w-14 h-14 mb-6 bg-gradient-to-br ${feature.gradient} text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[color:var(--text-primary)] mb-3 relative z-10">{feature.title}</h3>
                  <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)] relative z-10">{feature.desc}</p>
                  {/* Bottom shimmer line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger(0.08)}>
              <motion.p variants={fadeUp} className="text-violet-400 text-sm font-bold tracking-widest uppercase mb-3">Process</motion.p>
              <motion.h2 variants={fadeUp} className="text-[28px] md:text-[36px] font-extrabold text-[color:var(--text-primary)] mb-3 tracking-tight">How it works</motion.h2>
              <motion.p variants={fadeUp} className="text-[16px] text-[color:var(--text-secondary)] mb-14 font-medium">Get started in three simple steps</motion.p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
              variants={stagger(0.2)}
              className="flex flex-col md:flex-row items-center justify-center gap-6 relative"
            >
              {[
                { icon: <FiUserPlus />, title: "Sign Up", desc: "Create a free account as a student or teacher in seconds.", color: "from-indigo-500 to-blue-500", num: "01" },
                { icon: <FiBookOpen />, title: "Create or Browse", desc: "Teachers build quizzes. Students browse and pick a quiz to attempt.", color: "from-violet-500 to-purple-600", num: "02" },
                { icon: <FiAward />, title: "Score & Compete", desc: "Get instant results, climb the leaderboard, and track your progress.", color: "from-fuchsia-500 to-pink-500", num: "03" },
              ].map((step, idx, arr) => (
                <React.Fragment key={idx}>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.85 },
                      visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120, damping: 14 } },
                    }}
                    whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
                    className="flex-1 max-w-[260px] text-center px-4 relative z-10 group"
                  >
                    {/* Step number */}
                    <div className={`relative w-[72px] h-[72px] mx-auto mb-5 bg-gradient-to-br ${step.color} text-white rounded-2xl flex items-center justify-center text-3xl shadow-xl`}>
                      {step.icon}
                      <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-extrabold bg-gradient-to-br ${step.color} border-2 border-[color:var(--bg-primary)] flex items-center justify-center shadow`}>
                        {step.num}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-2">{step.title}</h3>
                    <p className="text-[15px] leading-relaxed text-[color:var(--text-secondary)]">{step.desc}</p>
                  </motion.div>

                  {idx < arr.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      whileInView={{ scaleX: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + idx * 0.2, duration: 0.6 }}
                      className="hidden md:block w-[80px] h-0.5 bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 mt-[36px] flex-shrink-0 origin-left"
                    />
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 bg-[color:var(--bg-card)]/80 backdrop-blur-lg border-t border-[color:var(--border)] px-6 overflow-hidden">
        {/* subtle footer gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between gap-8 py-12 pb-8">
            <div className="max-w-full md:max-w-[300px]">
              <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-10 rounded-sm object-contain mb-4" />
              <p className="text-[14px] leading-relaxed text-[color:var(--text-muted)]">
                The interactive quiz platform built for classrooms and self-learners.
              </p>
            </div>
            <div className="flex gap-12 md:gap-16">
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold tracking-wide text-[color:var(--text-primary)] mb-1">Platform</h4>
                <Link to="/register" className="text-[14px] font-medium text-[color:var(--text-secondary)] no-underline transition-all hover:text-indigo-400 hover:translate-x-1 block">Create Account</Link>
                <Link to="/login" className="text-[14px] font-medium text-[color:var(--text-secondary)] no-underline transition-all hover:text-indigo-400 hover:translate-x-1 block">Sign In</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold tracking-wide text-[color:var(--text-primary)] mb-1">Features</h4>
                <span className="text-[14px] font-medium text-[color:var(--text-secondary)]">Quiz Builder</span>
                <span className="text-[14px] font-medium text-[color:var(--text-secondary)]">Leaderboards</span>
                <span className="text-[14px] font-medium text-[color:var(--text-secondary)]">Analytics</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between py-6 border-t border-[color:var(--border-light)] gap-3 text-center">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--text-muted)]">
              <FiCode className="text-indigo-400" />
              Built with <FiHeart className="text-pink-500 animate-pulse" /> by{" "}
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Tukaram Chate</span>
            </p>
            <p className="text-[13px] font-medium text-[color:var(--text-muted)]">&copy; {new Date().getFullYear()} Kasoti. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
