import { Ticker } from "./_components/ticker";
import { Skyline } from "./_components/skyline";
import { Spark, MicroBars } from "./_components/spark";

/* ------------------------------------------------------------------ */
/* Tiny presentational helpers (server, no state)                     */
/* ------------------------------------------------------------------ */

function Bracketed({
  children,
  tone = "paper",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "paper" | "amber" | "crimson" | "teal";
  className?: string;
}) {
  const map = {
    paper: "border-rule",
    amber: "border-amber/50",
    crimson: "border-crimson/60",
    teal: "border-teal/60",
  } as const;
  return (
    <div className={`relative ${className}`}>
      {/* corner ticks */}
      <span className={`pointer-events-none absolute -left-px -top-px h-2 w-2 border-l border-t ${map[tone]}`} />
      <span className={`pointer-events-none absolute -right-px -top-px h-2 w-2 border-r border-t ${map[tone]}`} />
      <span className={`pointer-events-none absolute -left-px -bottom-px h-2 w-2 border-l border-b ${map[tone]}`} />
      <span className={`pointer-events-none absolute -right-px -bottom-px h-2 w-2 border-r border-b ${map[tone]}`} />
      {children}
    </div>
  );
}

function Tag({ children, tone = "paper" }: { children: React.ReactNode; tone?: "paper" | "amber" | "crimson" | "teal" }) {
  const map = {
    paper: "text-paper-dim border-rule",
    amber: "text-amber border-amber/40",
    crimson: "text-crimson border-crimson/50",
    teal: "text-teal border-teal/50",
  } as const;
  return (
    <span className={`mono inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-[10px] uppercase ${map[tone]}`}>
      <span
        className={`inline-block h-1 w-1 rounded-full animate-pulse-dot ${
          tone === "amber" ? "bg-amber" : tone === "crimson" ? "bg-crimson" : tone === "teal" ? "bg-teal" : "bg-paper-dim"
        }`}
      />
      {children}
    </span>
  );
}

function Readout({
  label,
  value,
  delta,
  trend = "up",
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  const color = trend === "up" ? "text-teal" : trend === "down" ? "text-crimson" : "text-paper-dim";
  return (
    <Bracketed className={`bg-ink-2/70 backdrop-blur-sm px-3 py-2 ${className}`}>
      <div className="mono text-[10px] uppercase text-paper-dim tracking-[0.18em]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-paper text-lg tabular-nums leading-none">{value}</div>
        {delta && (
          <span className={`mono text-[10px] ${color}`}>
            {arrow} {delta}
          </span>
        )}
      </div>
    </Bracketed>
  );
}

function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-paper-dim">
      <span className="h-px flex-1 bg-rule" />
      {label && <span className="mono text-[10px] uppercase tracking-[0.2em]">{label}</span>}
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sample data — feels live, fully deterministic                       */
/* ------------------------------------------------------------------ */

const GDP_SERIES = [12, 14, 13, 15, 16, 15, 17, 18, 17, 19, 22, 21, 24, 26, 28, 27, 30, 32, 31, 34, 36, 38, 41];
const INFLATION_SERIES = [2.1, 2.3, 2.6, 2.4, 2.7, 3.0, 3.2, 3.1, 2.9, 2.7, 2.5, 2.4, 2.6, 2.8, 2.7, 2.5, 2.4, 2.3];
const HAPPINESS_SERIES = [62, 64, 63, 65, 67, 66, 68, 70, 71, 69, 68, 71, 73, 72, 74, 76, 75, 77];
const SUPPLY_BARS = [38, 42, 46, 52, 58, 62, 68, 72, 70, 66, 60, 58, 62, 70, 78, 82];
const DEMAND_BARS = [28, 34, 40, 48, 56, 64, 70, 76, 78, 74, 68, 62, 58, 60, 66, 70];

/* ------------------------------------------------------------------ */
/* Icons (inline SVG)                                                  */
/* ------------------------------------------------------------------ */

const I = {
  road: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 3l-2 18M19 3l2 18M12 3v4M12 11v4M12 18v3" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  drop: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13z" />
    </svg>
  ),
  cross: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
    </svg>
  ),
  cap: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 9l10-5 10 5-10 5L2 9zM6 12v5c2 2 10 2 12 0v-5" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z" />
    </svg>
  ),
  mil: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 8l8-5 8 5M4 14l8-5 8 5M4 20l8-5 8 5" />
    </svg>
  ),
  trade: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h5a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4h5" />
    </svg>
  ),
};

const SYSTEMS = [
  { icon: I.road, name: "Infrastructure", sub: "Transit · Logistics", data: [4, 6, 5, 8, 12, 14, 17, 19, 22, 26], unit: "km/cap" },
  { icon: I.bolt, name: "Energy", sub: "Grid · Generation", data: [22, 24, 28, 30, 34, 38, 41, 45, 49, 52], unit: "TWh" },
  { icon: I.drop, name: "Utilities", sub: "Water · Waste", data: [60, 62, 64, 66, 68, 70, 71, 73, 74, 76], unit: "% coverage" },
  { icon: I.cross, name: "Healthcare", sub: "Hospitals · Beds", data: [3.2, 3.4, 3.7, 4.0, 4.2, 4.5, 4.6, 4.8, 5.1, 5.3], unit: "per 1k" },
  { icon: I.cap, name: "Education", sub: "Schools · R&D", data: [62, 64, 66, 68, 70, 71, 73, 74, 76, 78], unit: "literacy" },
  { icon: I.shield, name: "Public Safety", sub: "Police · Courts", data: [88, 86, 84, 86, 88, 90, 91, 92, 92, 93], unit: "index" },
  { icon: I.mil, name: "Military", sub: "Doctrine · Defense", data: [2.0, 2.1, 2.2, 2.4, 2.5, 2.7, 2.8, 3.0, 3.1, 3.2], unit: "% GDP" },
  { icon: I.trade, name: "Trade Routes", sub: "Ports · Tariffs", data: [12, 14, 16, 18, 20, 23, 26, 28, 31, 34], unit: "Bn exp." },
  { icon: I.coin, name: "Fiscal & Monetary", sub: "Tax · Rates · Debt", data: [4.5, 4.4, 4.6, 4.8, 4.9, 5.1, 5.0, 4.9, 4.8, 4.7], unit: "rate %" },
];

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <main className="relative isolate">
      {/* ============================== NAV ============================== */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-rule bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="mono text-[11px] uppercase tracking-[0.3em] text-paper-dim">
              Meridian · <span className="text-paper">build 0.1.0-rc</span>
            </span>
          </div>
          <nav className="hidden gap-6 md:flex">
            {["Systems", "Economy", "Roadmap", "Devlog", "Press Kit"].map((n) => (
              <a key={n} href="#" className="mono text-[11px] uppercase tracking-[0.22em] text-paper-dim hover:text-paper">
                {n}
              </a>
            ))}
          </nav>
          <a
            href="#wishlist"
            className="group relative inline-flex items-center gap-2 border border-amber/60 bg-amber/10 px-3 py-1.5 text-paper hover:bg-amber/20"
          >
            <span className="mono text-[11px] uppercase tracking-[0.22em] text-amber-bright">Wishlist · 2027</span>
            <span className="text-amber-bright">→</span>
          </a>
        </div>
      </header>

      {/* ============================== HERO ============================== */}
      <section className="relative min-h-[100svh] overflow-hidden pt-[64px]">
        {/* Skyline background */}
        <div className="absolute inset-0">
          <Skyline density={2} alive className="absolute inset-x-0 bottom-0 h-[78vh] w-full" />
          {/* dark wash at top for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink/40" />
          {/* scan sweep across the hero */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-amber/5 to-transparent animate-sweep" />
        </div>

        {/* Top HUD bar */}
        <div className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between px-6 pt-5">
          <div className="flex items-center gap-3">
            <Tag tone="amber">Live · Sim Tick 0.0413s</Tag>
            <span className="mono text-[10px] uppercase tracking-[0.2em] text-paper-dim">
              Region · Northern Plateau · 47.3°N
            </span>
          </div>
          <div className="flex items-center gap-3">
            <DayNight />
            <span className="mono text-[10px] uppercase tracking-[0.2em] text-paper-dim">
              T+<Ticker to={147} from={120} suffix="y" /> · Gold Era
            </span>
          </div>
        </div>

        {/* Centered headline */}
        <div className="relative z-10 mx-auto grid max-w-[1400px] gap-12 px-6 pt-24 md:pt-32">
          <div className="grid gap-6 md:max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-amber" />
              <span className="mono text-[11px] uppercase tracking-[0.32em] text-amber-bright">
                Economic City-State Simulation
              </span>
            </div>
            <h1
              className="font-display text-paper leading-[0.92] tracking-[-0.02em]"
              style={{ fontSize: "clamp(3.5rem, 8.6vw, 8.5rem)", fontVariationSettings: '"opsz" 144' }}
            >
              An economy
              <br />
              <span className="italic text-amber" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
                you can touch.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-paper-dim md:text-xl">
              Build a nation from a single plot of land. Set the tax rate. Draw a trade route. Pull a
              monetary lever — and watch a fully simulated economy answer back, citizen by citizen.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href="#trailer"
                className="group inline-flex items-center gap-3 bg-amber px-5 py-3 text-ink hover:bg-amber-bright"
              >
                <PlayIcon />
                <span className="mono text-[11px] uppercase tracking-[0.24em]">Watch the trailer · 1:58</span>
              </a>
              <a
                href="#systems"
                className="inline-flex items-center gap-3 border border-rule px-5 py-3 text-paper hover:border-paper/40"
              >
                <span className="mono text-[11px] uppercase tracking-[0.24em]">Explore the systems</span>
                <span className="text-paper-dim">↓</span>
              </a>
            </div>
          </div>
        </div>

        {/* Floating HUD widgets — corners */}
        <div className="absolute right-6 top-28 z-10 hidden w-[260px] flex-col gap-2 lg:flex">
          <Readout
            label="Gross Domestic Product"
            value={<><Ticker to={412.6} from={380} decimals={1} drift={0.3} />B</>}
            delta="+3.4% QoQ"
            trend="up"
          />
          <Readout
            label="Population"
            value={<Ticker to={8472310} from={8400000} drift={120} />}
            delta="+0.9% YoY"
            trend="up"
          />
          <Readout
            label="National Happiness"
            value={<><Ticker to={76.4} from={70} decimals={1} drift={0.2} />/100</>}
            delta="+2.1"
            trend="up"
          />
          <Readout
            label="Inflation (CPI)"
            value={<><Ticker to={2.4} from={3.1} decimals={2} drift={0.05} />%</>}
            delta="−0.3 MoM"
            trend="down"
          />
        </div>

        {/* Bottom marquee */}
        <div className="absolute inset-x-0 bottom-0 z-10 border-y border-rule bg-ink/80 backdrop-blur">
          <div className="overflow-hidden">
            <div className="flex w-max gap-12 py-2 animate-marquee mono text-[11px] uppercase tracking-[0.22em] text-paper-dim">
              {Array.from({ length: 2 }).map((_, dup) => (
                <div key={dup} className="flex items-center gap-12 pr-12">
                  <span><span className="text-teal">▲</span> Steel futures +4.2%</span>
                  <span><span className="text-crimson">▼</span> Approval in Riverside −1.4</span>
                  <span><span className="text-amber">●</span> Port of Astra · Tier III opened</span>
                  <span><span className="text-teal">▲</span> School enrollment +812</span>
                  <span><span className="text-paper-dim">○</span> Central Bank rate held at 4.75%</span>
                  <span><span className="text-crimson">▼</span> Drought watch · Southern Belt</span>
                  <span><span className="text-teal">▲</span> Trade pact signed · Republic of Vael</span>
                  <span><span className="text-amber">●</span> Defense review scheduled · Q3</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== BEAT 1 ============================== */}
      <section id="timelapse" className="relative border-t border-rule bg-ink-2/40">
        <div className="mx-auto max-w-[1400px] px-6 py-28">
          <SectionHead
            kicker="01 · The Sweeping Camera"
            title={<>From a single plot,<br /><span className="italic text-amber">a metropolis rises.</span></>}
            sub="Begin on an empty plot of land. Time-lapse forward and watch roads stretch, grids energize, ports thicken with cargo, and skyscrapers find the skyline."
          />

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { era: "T+0y", title: "Founding", sub: "One plot. One charter.", density: 0 as const },
              { era: "T+24y", title: "Industrial Age", sub: "Roads. Rail. Smokestacks.", density: 1 as const },
              { era: "T+147y", title: "Gold Era", sub: "Capital · Trade · Skyline", density: 2 as const },
            ].map((f) => (
              <Bracketed key={f.era} tone="paper" className="overflow-hidden bg-ink-2">
                <div className="relative h-56 md:h-72">
                  <Skyline density={f.density} alive={f.density === 2} className="absolute inset-0 h-full w-full" />
                  {/* HUD overlay */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2">
                    <span className="mono text-[10px] uppercase tracking-[0.22em] text-paper-dim">{f.era}</span>
                    <span className="mono text-[10px] uppercase tracking-[0.22em] text-amber">FRAME {f.density + 1}/3</span>
                  </div>
                  {/* Frame brackets inside */}
                  <span className="pointer-events-none absolute left-2 top-7 h-2 w-2 border-l border-t border-amber/50" />
                  <span className="pointer-events-none absolute right-2 top-7 h-2 w-2 border-r border-t border-amber/50" />
                  <span className="pointer-events-none absolute left-2 bottom-2 h-2 w-2 border-l border-b border-amber/50" />
                  <span className="pointer-events-none absolute right-2 bottom-2 h-2 w-2 border-r border-b border-amber/50" />
                </div>
                <div className="border-t border-rule px-4 py-3">
                  <div className="font-display text-2xl text-paper">{f.title}</div>
                  <div className="mono mt-1 text-[11px] uppercase tracking-[0.2em] text-paper-dim">{f.sub}</div>
                </div>
              </Bracketed>
            ))}
          </div>

          {/* Era timeline strip */}
          <div className="mt-10">
            <Divider label="Sim Timeline" />
            <div className="mt-4 grid grid-cols-12 gap-px">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-10 ${i < 3 ? "bg-ink-3" : i < 7 ? "bg-amber-deep/60" : "bg-amber"} relative`}
                >
                  {i === 11 && (
                    <span className="mono absolute -top-5 right-0 text-[10px] text-amber">NOW</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mono mt-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-paper-dim">
              <span>Founding · T+0</span>
              <span>Industrial · T+24</span>
              <span>Modern · T+96</span>
              <span>Gold Era · T+147</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== BEAT 2 — SYSTEMS ============================== */}
      <section id="systems" className="relative border-t border-rule">
        <div className="mx-auto max-w-[1400px] px-6 py-28">
          <SectionHead
            kicker="02 · The Levers"
            title={<>Every lever.<br /><span className="italic text-amber">Every dial.</span></>}
            sub="Infrastructure, public services, military, trade, fiscal, monetary, citizen sentiment — nine interlocking systems, each visible, each accountable."
          />

          <div className="mt-14 grid gap-px bg-rule md:grid-cols-3">
            {SYSTEMS.map((s, i) => (
              <div
                key={s.name}
                className="group relative bg-ink-2 p-5 transition-colors hover:bg-ink-3"
              >
                {/* index ribbon */}
                <span className="mono absolute right-3 top-3 text-[10px] uppercase tracking-[0.2em] text-paper-dim">
                  {String(i + 1).padStart(2, "0")} / 09
                </span>
                <div className="flex items-start gap-3 text-amber">
                  {s.icon}
                  <div>
                    <div className="font-display text-2xl text-paper leading-none">{s.name}</div>
                    <div className="mono mt-1 text-[10px] uppercase tracking-[0.22em] text-paper-dim">
                      {s.sub}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.2em] text-paper-dim">
                      {s.unit}
                    </div>
                    <div className="mono mt-0.5 text-paper text-lg tabular-nums">
                      {s.data[s.data.length - 1]}
                    </div>
                  </div>
                  <Spark
                    data={s.data}
                    width={120}
                    height={36}
                    stroke="#e8a33d"
                    fill="#e8a33d"
                  />
                </div>
                {/* hover sweep */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-amber/0 transition-colors group-hover:bg-amber/60" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== BEAT 3 — CAUSE & EFFECT ============================== */}
      <section className="relative border-t border-rule bg-ink-2/40">
        <div className="mx-auto max-w-[1400px] px-6 py-28">
          <SectionHead
            kicker="03 · The Consequences"
            title={<>Decisions<br /><span className="italic text-amber">cascade.</span></>}
            sub="Every slider has a second-order effect. Every law writes a story across the map. Watch your choices ripple through the simulation in real time."
          />

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {/* Scenario A — tax hike */}
            <Bracketed tone="crimson" className="bg-ink-2 p-6">
              <div className="flex items-center justify-between">
                <Tag tone="crimson">Scenario A · Fiscal</Tag>
                <span className="mono text-[10px] uppercase tracking-[0.2em] text-paper-dim">Day 124</span>
              </div>
              <div className="mt-4 font-display text-3xl text-paper md:text-4xl">
                Raise income tax by{" "}
                <span className="italic text-crimson">+4 pts</span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-px bg-rule">
                <Effect label="Treasury" value="+8.2 Bn" trend="up" tone="teal" />
                <Effect label="Happiness" value="−6.4" trend="down" tone="crimson" />
                <Effect label="Approval" value="−11.0" trend="down" tone="crimson" />
              </div>

              <div className="mt-6">
                <div className="mono mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-paper-dim">
                  <span>Unrest signal · Riverside &amp; Dock Wards</span>
                  <span className="text-crimson">3 protests forming</span>
                </div>
                <UnrestMap active />
              </div>
            </Bracketed>

            {/* Scenario B — infrastructure invest */}
            <Bracketed tone="teal" className="bg-ink-2 p-6">
              <div className="flex items-center justify-between">
                <Tag tone="teal">Scenario B · Capex</Tag>
                <span className="mono text-[10px] uppercase tracking-[0.2em] text-paper-dim">Day 124</span>
              </div>
              <div className="mt-4 font-display text-3xl text-paper md:text-4xl">
                Build the{" "}
                <span className="italic text-teal">Coastal Transit</span> spine
              </div>

              <div className="mt-6 grid grid-cols-3 gap-px bg-rule">
                <Effect label="Productivity" value="+12%" trend="up" tone="teal" />
                <Effect label="Commute (avg)" value="−18m" trend="up" tone="teal" />
                <Effect label="Approval" value="+8.0" trend="up" tone="teal" />
              </div>

              <div className="mt-6">
                <div className="mono mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-paper-dim">
                  <span>Growth signal · Coastal &amp; Industrial Wards</span>
                  <span className="text-teal">+4 districts active</span>
                </div>
                <UnrestMap active={false} />
              </div>
            </Bracketed>
          </div>
        </div>
      </section>

      {/* ============================== BEAT 4 — DASHBOARD ============================== */}
      <section className="relative border-t border-rule">
        <div className="mx-auto max-w-[1400px] px-6 py-28">
          <SectionHead
            kicker="04 · The Numbers"
            title={<>An economy<br /><span className="italic text-amber">you can read.</span></>}
            sub="Open the ministry. Inspect a household. Trace a single coin from the central bank to the breadbasket of a coastal village. The whole simulation is legible."
          />

          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            {/* GDP big chart */}
            <Bracketed className="bg-ink-2 p-6 lg:col-span-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mono text-[10px] uppercase tracking-[0.22em] text-paper-dim">
                    Real GDP · 24Q rolling
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="font-display text-5xl text-paper tabular-nums">$412.6B</span>
                    <span className="mono text-teal text-sm">▲ +3.4%</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {["1Y", "5Y", "ALL"].map((b, i) => (
                    <button
                      key={b}
                      className={`mono border px-2 py-1 text-[10px] uppercase tracking-[0.22em] ${
                        i === 2 ? "border-amber/60 bg-amber/10 text-amber" : "border-rule text-paper-dim hover:text-paper"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <Spark
                  data={GDP_SERIES}
                  width={780}
                  height={180}
                  stroke="#e8a33d"
                  fill="#e8a33d"
                  baseline
                  className="w-full"
                />
              </div>
              <div className="mono mt-2 flex justify-between text-[10px] uppercase tracking-[0.22em] text-paper-dim">
                <span>2003</span><span>2008</span><span>2013</span><span>2018</span><span>2023</span><span className="text-amber">NOW</span>
              </div>
            </Bracketed>

            {/* Inflation */}
            <Bracketed className="bg-ink-2 p-6 lg:col-span-4">
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-paper-dim">CPI Inflation</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl text-paper tabular-nums">2.4<span className="text-xl text-paper-dim">%</span></span>
                <span className="mono text-sm text-teal">▼ −0.3</span>
              </div>
              <div className="mt-3">
                <Spark data={INFLATION_SERIES} width={300} height={80} stroke="#46bfa8" fill="#46bfa8" className="w-full" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-px bg-rule text-paper-dim">
                <div className="bg-ink-2 p-2">
                  <div className="mono text-[10px] uppercase">Target</div>
                  <div className="mono text-paper">2.0%</div>
                </div>
                <div className="bg-ink-2 p-2">
                  <div className="mono text-[10px] uppercase">Rate</div>
                  <div className="mono text-paper">4.75%</div>
                </div>
                <div className="bg-ink-2 p-2">
                  <div className="mono text-[10px] uppercase">M2 Δ</div>
                  <div className="mono text-paper">+1.8%</div>
                </div>
              </div>
            </Bracketed>

            {/* Tax sliders */}
            <Bracketed className="bg-ink-2 p-6 lg:col-span-5">
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-paper-dim">Tax Policy · Quartile Sliders</div>
              <div className="mt-5 space-y-5">
                {[
                  { name: "Quartile 1", v: 12, c: "amber" },
                  { name: "Quartile 2", v: 22, c: "amber" },
                  { name: "Quartile 3", v: 34, c: "amber" },
                  { name: "Quartile 4", v: 47, c: "amber" },
                  { name: "Corporate", v: 28, c: "teal" },
                  { name: "Tariff (avg)", v: 9, c: "teal" },
                ].map((s) => (
                  <div key={s.name}>
                    <div className="mono mb-1 flex justify-between text-[10px] uppercase tracking-[0.22em] text-paper-dim">
                      <span>{s.name}</span>
                      <span className={s.c === "teal" ? "text-teal" : "text-amber"}>{s.v}%</span>
                    </div>
                    <div className="relative h-1 w-full bg-ink-3">
                      <div
                        className={`absolute inset-y-0 left-0 ${s.c === "teal" ? "bg-teal" : "bg-amber"}`}
                        style={{ width: `${s.v}%` }}
                      />
                      <div
                        className={`absolute -top-1 h-3 w-1 ${s.c === "teal" ? "bg-teal" : "bg-amber-bright"}`}
                        style={{ left: `calc(${s.v}% - 2px)` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Bracketed>

            {/* Supply / demand */}
            <Bracketed className="bg-ink-2 p-6 lg:col-span-4">
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-paper-dim">Steel · Supply vs Demand</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="mono mb-1 text-[10px] uppercase text-teal">Supply</div>
                  <MicroBars data={SUPPLY_BARS} width={200} height={80} color="#46bfa8" className="w-full" />
                </div>
                <div>
                  <div className="mono mb-1 text-[10px] uppercase text-amber">Demand</div>
                  <MicroBars data={DEMAND_BARS} width={200} height={80} color="#e8a33d" className="w-full" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-px bg-rule">
                <div className="bg-ink-2 p-2">
                  <div className="mono text-[10px] uppercase text-paper-dim">Spot</div>
                  <div className="mono text-paper">$724/t</div>
                </div>
                <div className="bg-ink-2 p-2">
                  <div className="mono text-[10px] uppercase text-paper-dim">7d</div>
                  <div className="mono text-teal">+4.2%</div>
                </div>
                <div className="bg-ink-2 p-2">
                  <div className="mono text-[10px] uppercase text-paper-dim">Stock</div>
                  <div className="mono text-paper">11.4M t</div>
                </div>
              </div>
            </Bracketed>

            {/* Happiness gauge */}
            <Bracketed className="bg-ink-2 p-6 lg:col-span-3">
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-paper-dim">Citizen Happiness</div>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-display text-5xl text-paper tabular-nums">76</span>
                <span className="mono pb-2 text-paper-dim">/100</span>
              </div>
              <div className="mt-2">
                <Spark data={HAPPINESS_SERIES} width={240} height={48} stroke="#e8a33d" fill="#e8a33d" className="w-full" />
              </div>
              <div className="mono mt-4 grid grid-cols-2 gap-1 text-[10px] uppercase tracking-[0.2em]">
                <div className="text-teal">▲ Coastal +4</div>
                <div className="text-teal">▲ Foothills +2</div>
                <div className="text-crimson">▼ Riverside −6</div>
                <div className="text-crimson">▼ Docks −3</div>
              </div>
            </Bracketed>
          </div>
        </div>
      </section>

      {/* ============================== CLOSING HERO ============================== */}
      <section id="wishlist" className="relative overflow-hidden border-t border-rule">
        <div className="absolute inset-0">
          <Skyline density={2} alive className="absolute inset-x-0 bottom-0 h-[90vh] w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink/30" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-center px-6 pt-32 pb-44 text-center">
          <Tag tone="amber">Closing Shot · Golden Hour</Tag>
          <div className="mt-10">
            <LogoMark large />
          </div>
          <h2
            className="mt-10 font-display text-paper leading-[0.95] tracking-[-0.02em]"
            style={{ fontSize: "clamp(2.5rem, 6.4vw, 6rem)", fontVariationSettings: '"opsz" 144' }}
          >
            Your nation.<br />
            Your economy.<br />
            <span className="italic text-amber" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
              Your rules.
            </span>
          </h2>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-3 bg-amber px-6 py-3.5 text-ink hover:bg-amber-bright"
            >
              <span className="mono text-[11px] uppercase tracking-[0.24em]">Wishlist on Steam</span>
              <span>→</span>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-3 border border-paper/40 px-6 py-3.5 text-paper hover:border-paper"
            >
              <span className="mono text-[11px] uppercase tracking-[0.24em]">Join the Devlog</span>
            </a>
          </div>
          <div className="mono mt-10 text-[10px] uppercase tracking-[0.3em] text-paper-dim">
            Target · Q4 2027 · PC · Console
          </div>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="border-t border-rule bg-ink">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="mono text-[10px] uppercase tracking-[0.24em] text-paper-dim">
              © Meridian Interactive · A working title
            </span>
          </div>
          <div className="mono flex flex-wrap gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.24em] text-paper-dim">
            <a href="#" className="hover:text-paper">Press kit</a>
            <a href="#" className="hover:text-paper">Devlog</a>
            <a href="#" className="hover:text-paper">Discord</a>
            <a href="#" className="hover:text-paper">Privacy</a>
            <a href="#" className="hover:text-paper">Imprint</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Internal small pieces                                               */
/* ------------------------------------------------------------------ */

function SectionHead({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: React.ReactNode;
  sub: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-amber" />
          <span className="mono text-[11px] uppercase tracking-[0.3em] text-amber">{kicker}</span>
        </div>
        <h2
          className="mt-4 font-display text-paper leading-[0.95] tracking-[-0.02em]"
          style={{ fontSize: "clamp(2.2rem, 5vw, 4.5rem)", fontVariationSettings: '"opsz" 144' }}
        >
          {title}
        </h2>
      </div>
      <p className="text-paper-dim md:col-span-5 md:max-w-md md:text-right md:text-base">
        {sub}
      </p>
    </div>
  );
}

function Effect({
  label,
  value,
  trend,
  tone,
}: {
  label: string;
  value: string;
  trend: "up" | "down";
  tone: "teal" | "crimson";
}) {
  const c = tone === "teal" ? "text-teal" : "text-crimson";
  const arrow = trend === "up" ? "▲" : "▼";
  return (
    <div className="bg-ink-2 p-4">
      <div className="mono text-[10px] uppercase tracking-[0.22em] text-paper-dim">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-2xl text-paper tabular-nums">{value}</span>
        <span className={`mono text-[11px] ${c}`}>{arrow}</span>
      </div>
    </div>
  );
}

/** Schematic district map. Active = unrest, inactive = growth. */
function UnrestMap({ active }: { active: boolean }) {
  const cells = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="grid grid-cols-12 gap-px bg-rule p-px">
      {cells.map((i) => {
        const isHot =
          active && [5, 6, 17, 18, 19, 29, 30, 31, 42, 43].includes(i);
        const isGrow =
          !active && [10, 11, 22, 23, 33, 34, 44, 45].includes(i);
        return (
          <div
            key={i}
            className={`aspect-square ${
              isHot
                ? "bg-crimson animate-pulse-dot"
                : isGrow
                ? "bg-teal"
                : "bg-ink-3"
            }`}
          />
        );
      })}
    </div>
  );
}

function DayNight() {
  return (
    <div className="flex items-center gap-2">
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-paper-dim">Cycle</span>
      <div className="relative h-1.5 w-28 overflow-hidden bg-ink-3">
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-steel via-amber to-amber-bright" />
        <div className="absolute -top-1 h-3.5 w-0.5 bg-paper" style={{ left: "66%" }} />
      </div>
      <span className="mono text-[10px] uppercase tracking-[0.2em] text-amber">17:42</span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  );
}

function LogoMark({ large = false }: { large?: boolean }) {
  const size = large ? "h-12" : "h-6";
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className={`${size} aspect-square text-amber`}>
        <g fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="16" cy="16" r="14" />
          <path d="M2 16 L 30 16" />
          <path d="M16 2 C 8 8 8 24 16 30 C 24 24 24 8 16 2 Z" />
          <path d="M6 10 L 26 10" opacity="0.5" />
          <path d="M6 22 L 26 22" opacity="0.5" />
        </g>
      </svg>
      <span
        className={`font-display tracking-[0.18em] text-paper ${large ? "text-3xl" : "text-base"}`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        MERIDIAN
      </span>
    </div>
  );
}
