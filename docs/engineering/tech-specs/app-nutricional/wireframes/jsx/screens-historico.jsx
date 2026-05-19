// Histórico nutricional wireframes. 3 variations × 1 screen.
// Reuses primitives from earlier flows.

// Mock data: 31-day month, current day = 13.
// status: 'done' | 'over' | 'none' | 'future'
const TODAY = 13;
const MONTH_LEN = 31;
// Sample status spread for the first 13 days; rest are "future".
const STATUS_SEED = [
  "done", "done", "over", "done", "none", "done", "done",
  "done", "over", "done", "done", "done", "today",
];
// 1st of May 2026 is a Friday. Pad with 5 leading blanks (D=Sun column).
// D S T Q Q S S → Sunday=0; May 1, 2026 is Friday=5.
const LEAD_BLANKS = 5;

const dayStatus = (n) => {
  if (n === TODAY) return "today";
  if (n > TODAY) return "future";
  return STATUS_SEED[n - 1] || "none";
};

const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

// ---- VARIATION A — Calendário clássico ------------------------------

const HistA = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={null}
        title={<span className="topbar-h1">Histórico</span>}
        right={null}
      />
      <div className="date-picker">
        <span className="chev">‹</span>
        <span className="date-label">Maio 2026</span>
        <span className="chev">›</span>
      </div>
      <div className="spacer-md" />

      <div className="cal-grid">
        {WEEK_LABELS.map((w, i) => (
          <div key={"w" + i} className="cal-weekday">{w}</div>
        ))}
        {Array.from({ length: LEAD_BLANKS }).map((_, i) => (
          <div key={"b" + i} className="cal-cell empty-pad" />
        ))}
        {Array.from({ length: MONTH_LEN }).map((_, i) => {
          const n = i + 1;
          const st = dayStatus(n);
          return <CalCell key={n} day={n} status={st} />;
        })}
      </div>

      <div className="spacer-md" />
      <div className="cal-legend">
        <div className="leg-item">
          <span className="leg-swatch done" />
          <span>na meta</span>
        </div>
        <div className="leg-item">
          <span className="leg-swatch over" />
          <span>fora da meta</span>
        </div>
        <div className="leg-item">
          <span className="leg-swatch none" />
          <span>sem registro</span>
        </div>
      </div>

      <div className="spacer-sm" />
      <div className="cal-stats">
        <div className="cal-stat">
          <div className="cal-stat-val">9</div>
          <div className="cal-stat-lab">dias na meta</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-val">75%</div>
          <div className="cal-stat-lab">no mês</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-val">5</div>
          <div className="cal-stat-lab">sequência</div>
        </div>
      </div>
    </div>
    <BottomNav activeIdx={1} />
  </PhoneP>
);

const CalCell = ({ day, status }) => (
  <div className={`cal-cell status-${status}`}>
    <span className="cal-day">{day}</span>
    {status === "done" && <span className="cal-mark">✓</span>}
    {status === "over" && <span className="cal-mark">!</span>}
    {status === "today" && <span className="cal-mark hoje-tag">hoje</span>}
  </div>
);

// ---- VARIATION B — Heatmap contínuo ---------------------------------

// Mock kcal-vs-meta ratio per day (1.0 = exatamente a meta).
const RATIO_SEED = [
  0.92, 0.98, 1.18, 1.00, null, 0.95, 0.97,
  1.02, 1.22, 0.90, 0.96, 0.99, 0.64,
];

const dayRatio = (n) => {
  if (n > TODAY) return undefined; // future
  if (n === TODAY) return RATIO_SEED[n - 1]; // partial
  return RATIO_SEED[n - 1];
};

// distance from 1.0 → intensity 0-1; cap.
const ratioFill = (r) => {
  if (r == null) return 0;
  const d = Math.min(0.35, Math.abs(r - 1));
  return 0.25 + (1 - d / 0.35) * 0.55; // 0.25 .. 0.8
};

const HistB = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<span className="chev big">‹</span>}
        title={<span className="topbar-h1">Maio 2026</span>}
        right={<span className="chev big">›</span>}
      />
      <div className="spacer-sm" />

      <div className="heatmap-head">
        <div>
          <div className="heatmap-eyebrow">aderência à meta</div>
          <div className="heatmap-big">75%</div>
        </div>
        <div className="heatmap-scale">
          <span className="scale-label">−</span>
          <div className="scale-row">
            {[0.2, 0.4, 0.6, 0.8].map((o) => (
              <div key={o} className="scale-cell" style={{ background: `rgba(42,42,42,${o})` }} />
            ))}
          </div>
          <span className="scale-label">+</span>
        </div>
      </div>

      <div className="spacer-md" />
      <div className="cal-grid heat">
        {WEEK_LABELS.map((w, i) => (
          <div key={"w" + i} className="cal-weekday">{w}</div>
        ))}
        {Array.from({ length: LEAD_BLANKS }).map((_, i) => (
          <div key={"b" + i} className="cal-cell empty-pad" />
        ))}
        {Array.from({ length: MONTH_LEN }).map((_, i) => {
          const n = i + 1;
          const r = dayRatio(n);
          const isToday = n === TODAY;
          const isFuture = n > TODAY;
          const none = !isFuture && r == null;
          const fill = r != null ? ratioFill(r) : 0;
          const over = r != null && r > 1.1;
          return (
            <div key={n}
                 className={`cal-cell heat ${isToday ? "is-today" : ""} ${isFuture ? "is-future" : ""} ${none ? "is-none" : ""} ${over ? "is-over" : ""}`}
                 style={ !isFuture && !none ? { background: `rgba(42,42,42,${fill})`, color: fill > 0.5 ? "#fafaf7" : "var(--ink)" } : undefined }>
              <span className="cal-day">{n}</span>
            </div>
          );
        })}
      </div>

      <div className="spacer-md" />
      <div className="cal-legend">
        <div className="leg-item"><span className="leg-swatch heat-light" /><span>longe da meta</span></div>
        <div className="leg-item"><span className="leg-swatch heat-dark" /><span>na meta</span></div>
        <div className="leg-item"><span className="leg-swatch over" /><span>excedeu</span></div>
        <div className="leg-item"><span className="leg-swatch none" /><span>sem registro</span></div>
      </div>
    </div>
    <BottomNav activeIdx={1} />
  </PhoneP>
);

// ---- VARIATION C — Lista vertical de dias ---------------------------

const HistC = () => {
  const days = [];
  for (let n = TODAY; n >= 1; n--) {
    const st = dayStatus(n);
    const kcal = st === "none" ? null : st === "over" ? 2200 : 1700 + ((n * 37) % 200);
    days.push({ n, st, kcal });
  }
  return (
    <PhoneP>
      <div className="screen pad-md scroll-area">
        <TopBar
          left={null}
          title={<span className="topbar-h1">Histórico</span>}
          right={null}
        />
        <div className="date-picker">
          <span className="chev">‹</span>
          <span className="date-label">Maio 2026</span>
          <span className="chev">›</span>
        </div>
        <div className="spacer-sm" />

        <div className="hist-summary">
          <div className="hist-summary-bar">
            <span><b>9</b> na meta</span>
            <span><b>3</b> fora</span>
            <span><b>1</b> sem registro</span>
          </div>
        </div>

        <div className="spacer-sm" />
        <div className="hist-list">
          {days.map(({ n, st, kcal }) => (
            <div key={n} className={`hist-row status-${st}`}>
              <div className="hist-row-day">
                <div className="hist-row-num">{n}</div>
                <div className="hist-row-wk">qua</div>
              </div>
              <div className="hist-row-bar">
                {kcal != null ? (
                  <div className="kcal-bar">
                    <div className="kcal-bar-fill" style={{ width: `${Math.min(100, (kcal / 1850) * 100)}%` }} />
                  </div>
                ) : (
                  <div className="kcal-bar empty" />
                )}
                <div className="hist-row-meta">
                  {st === "today" && <span className="hist-tag">hoje</span>}
                  {st === "done" && <span>{kcal} kcal · na meta</span>}
                  {st === "over" && <span>{kcal} kcal · acima</span>}
                  {st === "none" && <span className="dim">sem registro</span>}
                </div>
              </div>
              <span className="chev tiny">›</span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav activeIdx={1} />
    </PhoneP>
  );
};

// ---- export -----------------------------------------------------------

Object.assign(window, {
  HistA, HistB, HistC,
});
