import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bed,
  BookOpen,
  ChevronDown,
  Cpu,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Heart,
  HelpCircle,
  Mail,
  Search,
  Send,
  Siren,
  Thermometer,
} from "lucide-react";
import GlassLayout from "./components/GlassLayout";

export type SupportCategory =
  | "faq"
  | "user-guide"
  | "how-it-works"
  | "bed-operation"
  | "monitoring"
  | "emergency"
  | "related-websites"
  | "documentation"
  | "contact";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How does patient transfer work?",
    a: "Transfers are coordinated from the Tab 3 flow: authenticate as staff, confirm ward and bed, then hand off monitoring. MediVerse logs responsibility and optional assistance flags for audit.",
  },
  {
    q: "What sensors are used?",
    a: "Typical deployments pair pulse oximetry, ECG leads, non-invasive blood pressure, and temperature probes. Exact sensor packs depend on your ward profile and device integration.",
  },
  {
    q: "Is the system automatic?",
    a: "Alerts and escalations can be rule-based (e.g. SpO₂ thresholds). Clinical decisions remain with licensed staff; the system assists with visibility, routing, and documentation.",
  },
];

const glass =
  "rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150";
const navBtn =
  "flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-cyan-100/90 transition-all duration-200 hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white";
const navBtnActive =
  "border-cyan-400/45 bg-cyan-500/20 text-white shadow-[0_0_20px_rgba(34,211,238,0.18)]";

export default function SupportDashboard() {
  const [activeCategory, setActiveCategory] =
    useState<SupportCategory>("faq");
  const [search, setSearch] = useState("");
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(FAQ_ITEMS[0]?.q ?? null);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    issue: "",
  });

  const filteredFaq = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <GlassLayout>
      <div className="flex h-[100dvh] min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-6 lg:flex-row lg:gap-8 lg:p-8">
        {/* Sidebar */}
        <aside
          className={`scrollbar-modern max-h-[min(46vh,26rem)] w-full shrink-0 overflow-y-auto ${glass} p-4 lg:max-h-none lg:h-full lg:w-64 lg:self-stretch lg:overflow-y-auto xl:w-72`}
        >
          <div className="mb-4 border-b border-white/10 pb-3">
            <Link
              to="/"
              className="text-sm font-medium text-cyan-200/90 transition hover:text-white"
            >
              ← Home
            </Link>
            <h1 className="mt-3 text-lg font-bold tracking-tight text-white">
              Help &amp; FAQ
            </h1>
          </div>

          <nav className="space-y-6" aria-label="Help categories">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                Core Help
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("faq")}
                    className={`${navBtn} ${activeCategory === "faq" ? navBtnActive : ""}`}
                  >
                    <HelpCircle className="h-4 w-4 shrink-0 opacity-80" />
                    FAQ
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("user-guide")}
                    className={`${navBtn} ${activeCategory === "user-guide" ? navBtnActive : ""}`}
                  >
                    <BookOpen className="h-4 w-4 shrink-0 opacity-80" />
                    User Guide
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("how-it-works")}
                    className={`${navBtn} ${activeCategory === "how-it-works" ? navBtnActive : ""}`}
                  >
                    <GitBranch className="h-4 w-4 shrink-0 opacity-80" />
                    How It Works
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">
                <Activity className="h-3.5 w-3.5" aria-hidden />
                System Specific
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("bed-operation")}
                    className={`${navBtn} ${activeCategory === "bed-operation" ? navBtnActive : ""}`}
                  >
                    <Bed className="h-4 w-4 shrink-0 opacity-80" />
                    Bed Operation
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("monitoring")}
                    className={`${navBtn} ${activeCategory === "monitoring" ? navBtnActive : ""}`}
                  >
                    <Activity className="h-4 w-4 shrink-0 opacity-80" />
                    Monitoring System
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("emergency")}
                    className={`${navBtn} ${activeCategory === "emergency" ? navBtnActive : ""}`}
                  >
                    <Siren className="h-4 w-4 shrink-0 opacity-80" />
                    Emergency Features
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">
                <Globe className="h-3.5 w-3.5" aria-hidden />
                External &amp; Support
              </p>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("related-websites")}
                    className={`${navBtn} ${activeCategory === "related-websites" ? navBtnActive : ""}`}
                  >
                    <Globe className="h-4 w-4 shrink-0 opacity-80" />
                    Related Websites
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("documentation")}
                    className={`${navBtn} ${activeCategory === "documentation" ? navBtnActive : ""}`}
                  >
                    <FileText className="h-4 w-4 shrink-0 opacity-80" />
                    Documentation
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("contact")}
                    className={`${navBtn} ${activeCategory === "contact" ? navBtnActive : ""}`}
                  >
                    <Mail className="h-4 w-4 shrink-0 opacity-80" />
                    Contact Support
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${glass}`}
        >
          <div className="scrollbar-modern flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
            <div className="border-b border-white/10 p-4 sm:p-6">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    activeCategory === "faq"
                      ? "Search questions and answers…"
                      : "Search help topics…"
                  }
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-sm text-cyan-50 placeholder:text-cyan-200/35 backdrop-blur-md transition focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>
            </div>

            <div
              key={activeCategory}
              className="flex-1 p-4 transition-opacity duration-200 sm:p-6"
            >
              {activeCategory === "faq" && (
                <div className="space-y-2">
                  <h2 className="mb-4 text-xl font-semibold text-white">
                    Frequently asked questions
                  </h2>
                  {filteredFaq.length === 0 ? (
                    <p className="text-sm text-cyan-200/60">
                      No matches — try a different search.
                    </p>
                  ) : (
                    filteredFaq.map((item) => {
                      const isOpen = openFaqKey === item.q;
                      return (
                        <div
                          key={item.q}
                          className="overflow-hidden rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm transition hover:border-cyan-400/25"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenFaqKey(isOpen ? null : item.q)
                            }
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/5"
                          >
                            <span>{item.q}</span>
                            <ChevronDown
                              className={`h-5 w-5 shrink-0 text-cyan-300/70 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          <div
                            className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                          >
                            <div className="overflow-hidden">
                              <p className="border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-cyan-100/85">
                                {item.a}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeCategory === "user-guide" && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    User guide
                  </h2>
                  <ol className="space-y-5">
                    {[
                      {
                        n: 1,
                        t: "Sign in & select role",
                        d: "Use Patient History or Patient Transfer flows with the correct staff credentials.",
                      },
                      {
                        n: 2,
                        t: "Select transfer mode",
                        d: "Confirm destination ward, bed, and receiving clinician when prompted.",
                      },
                      {
                        n: 3,
                        t: "Monitor vitals",
                        d: "Keep the monitoring dashboard visible until handoff is acknowledged.",
                      },
                    ].map((step) => (
                      <li
                        key={step.n}
                        className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-lg font-bold text-cyan-200">
                          {step.n}
                        </span>
                        <div>
                          <p className="font-medium text-white">{step.t}</p>
                          <p className="mt-1 text-sm text-cyan-100/75">
                            {step.d}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {activeCategory === "how-it-works" && (
                <div>
                  <h2 className="mb-8 text-xl font-semibold text-white">
                    How it works
                  </h2>
                  <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-center">
                    {[
                      { label: "Sensors", icon: Activity },
                      { label: "Data processing", icon: Cpu },
                      { label: "Display", icon: GitBranch },
                      { label: "Alerts", icon: Siren },
                    ].map((step, idx, arr) => (
                      <React.Fragment key={step.label}>
                        <div className="flex flex-1 flex-col items-center rounded-xl border border-white/15 bg-white/5 px-4 py-6 text-center">
                          <step.icon className="mb-2 h-8 w-8 text-cyan-300" />
                          <span className="text-sm font-medium text-white">
                            {step.label}
                          </span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className="flex justify-center lg:flex-col lg:py-0">
                            <ArrowRight className="h-6 w-6 rotate-90 text-cyan-400/60 lg:rotate-0" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="mt-8 text-center text-sm text-cyan-100/70">
                    Streams are encrypted in transit; retention follows your
                    hospital policy.
                  </p>
                </div>
              )}

              {activeCategory === "bed-operation" && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    Bed operation
                  </h2>
                  <p className="mb-6 text-sm text-cyan-100/75">
                    Mock controls — connect to your bed controller for real
                    hardware.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Raise / Lower" },
                      { label: "Tilt" },
                      { label: "Transfer mode" },
                    ].map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        className="rounded-2xl border border-cyan-400/35 bg-gradient-to-b from-white/15 to-white/5 px-4 py-8 text-sm font-semibold text-white shadow-[0_8px_0_rgba(8,145,178,0.25)] backdrop-blur-md transition hover:border-cyan-300/50 active:translate-y-1 active:shadow-none"
                      >
                        <Bed className="mx-auto mb-2 h-6 w-6 text-cyan-200" />
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeCategory === "monitoring" && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    Monitoring metrics
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                    {[
                      {
                        icon: Heart,
                        title: "Heart rate",
                        range: "60–100 bpm",
                        note: "Resting adult; adjust for pediatrics per protocol.",
                      },
                      {
                        icon: Activity,
                        title: "SpO₂",
                        range: "95–100%",
                        note: "On room air; lower may be acceptable on O₂ therapy.",
                      },
                      {
                        icon: Thermometer,
                        title: "Temperature",
                        range: "36.5–37.5°C",
                        note: "Typical oral; site-specific norms apply.",
                      },
                    ].map((m) => (
                      <div
                        key={m.title}
                        className="rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm"
                      >
                        <m.icon className="mb-2 h-6 w-6 text-cyan-300" />
                        <p className="font-semibold text-white">{m.title}</p>
                        <p className="mt-1 text-sm text-cyan-100/80">
                          Normal range: {m.range}
                        </p>
                        <p className="mt-2 text-xs text-cyan-200/55">{m.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeCategory === "emergency" && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    Emergency features
                  </h2>
                  <div className="space-y-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4">
                    <p className="text-sm text-cyan-50/90">
                      Alerts trigger when vitals or device rules breach configured
                      thresholds. Staff receive escalation on the dashboard and
                      optional pager routes.
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-400/35 bg-gradient-to-br from-red-500/15 to-slate-950/40 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-300" />
                      <span className="font-semibold text-red-100">
                        Low oxygen event
                      </span>
                    </div>
                    <p className="text-sm text-cyan-100/85">
                      When SpO₂ drops below policy (e.g. under 90% sustained), the
                      system flags{" "}
                      <span className="text-cyan-200">high priority</span>, pulses
                      the bedside strip, and can notify the rapid response team per
                      your routing rules.
                    </p>
                    <p className="text-xs text-cyan-200/60">
                      Cyan banners indicate informational recovery; red indicates
                      immediate clinical review.
                    </p>
                  </div>
                </div>
              )}

              {activeCategory === "related-websites" && (
                <div>
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    Related websites
                  </h2>
                  <ul className="space-y-3">
                    {[
                      {
                        name: "WHO — Health topics",
                        href: "https://www.who.int/health-topics",
                      },
                      {
                        name: "WHO — Emergency care",
                        href: "https://www.who.int/teams/integrated-health-services/clinical-services-and-systems/emergency-care",
                      },
                      {
                        name: "MedlinePlus — Patient education",
                        href: "https://medlineplus.gov",
                      },
                    ].map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-cyan-50 transition hover:border-cyan-400/40 hover:bg-white/10"
                        >
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-cyan-400" />
                            {link.name}
                          </span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-cyan-300/70" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeCategory === "documentation" && (
                <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
                  <h2 className="text-xl font-semibold text-white">
                    Technical documentation
                  </h2>
                  <div className="max-w-none space-y-3 text-cyan-100/85">
                    <h3 className="text-lg font-medium text-cyan-100">IoT layer</h3>
                    <p className="text-sm leading-relaxed">
                      Bedside gateways aggregate BLE/serial feeds from certified
                      monitors and push signed telemetry to the MediVerse edge
                      service.
                    </p>
                    <h3 className="pt-2 text-lg font-medium text-cyan-100">
                      AI &amp; rules
                    </h3>
                    <p className="text-sm leading-relaxed">
                      Threshold and trend rules run locally for low latency; models
                      for deterioration indices are optional add-ons.
                    </p>
                    <h3 className="pt-2 text-lg font-medium text-cyan-100">
                      Sensor types
                    </h3>
                    <p className="text-sm leading-relaxed">
                      SpO₂, ECG, NIBP, temperature, and optional capnography when
                      supported by the hardware profile.
                    </p>
                  </div>
                </div>
              )}

              {activeCategory === "contact" && (
                <div className="mx-auto max-w-lg">
                  <h2 className="mb-2 text-xl font-semibold text-white">
                    Report an issue
                  </h2>
                  <p className="mb-6 text-sm text-cyan-100/70">
                    We route tickets to MediVerse support. No PHI in this demo
                    form.
                  </p>
                  <form
                    className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
                    onSubmit={(e) => {
                      e.preventDefault();
                      window.alert(
                        `Thanks ${contact.name || "there"} — we received your report (demo).`
                      );
                    }}
                  >
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cyan-200/80">
                        Name
                      </label>
                      <input
                        required
                        value={contact.name}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, name: e.target.value }))
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/35 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cyan-200/80">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={contact.email}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, email: e.target.value }))
                        }
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/35 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                        placeholder="you@hospital.org"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-cyan-200/80">
                        Issue description
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={contact.issue}
                        onChange={(e) =>
                          setContact((c) => ({ ...c, issue: e.target.value }))
                        }
                        className="w-full resize-y rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/35 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                        placeholder="What went wrong?"
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/35 to-sky-500/30 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:border-cyan-200/50 hover:shadow-[0_0_32px_rgba(34,211,238,0.35)]"
                    >
                      <Send className="h-4 w-4" />
                      Submit
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </GlassLayout>
  );
}
