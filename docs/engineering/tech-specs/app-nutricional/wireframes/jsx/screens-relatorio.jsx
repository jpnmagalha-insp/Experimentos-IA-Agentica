// Relatório nutricional wireframes. 3 variations × 2 screens (full + empty).
// Reuses primitives from screens.jsx, screens-perfil.jsx, screens-log.jsx.

// ---- shared helpers ---------------------------------------------------

const MEALS = [
  { name: "Café da manhã", kcal: 320 },
  { name: "Almoço", kcal: 640 },
  { name: "Lanche", kcal: 240 },
  { name: "Jantar", kcal: 0, empty: true },
];

const EMPTY_MEALS = [
  { name: "Café da manhã", kcal: 0, empty: true },
  { name: "Almoço", kcal: 0, empty: true },
  { name: "Lanche", kcal: 0, empty: true },
  { name: "Jantar", kcal: 0, empty: true },
];

const DateNav = ({ label = "Hoje · 13 mai" }) => (
  <div className="date-picker">
    <span className="chev">‹</span>
    <span className="date-label">{label}</span>
    <span className="chev">›</span>
  </div>
);

const EmptyBanner = () => (
  <div className="empty-banner">
    <div className="empty-banner-title">Nenhum registro ainda.</div>
    <div className="empty-banner-sub">Adicione sua primeira refeição para ver seu relatório.</div>
    <div className="spacer-sm" />
    <Btn kind="primary">Ir para o log</Btn>
  </div>
);

// ---- VARIATION A — Lista hierárquica ---------------------------------

const RepA = ({ empty }) => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={null}
        title={<span className="topbar-h1">Relatório</span>}
        right={null}
      />
      <DateNav />
      <div className="spacer-md" />

      {/* CALORIAS — bloco principal */}
      <div className="rep-block rep-primary">
        <div className="rep-eyebrow">Calorias</div>
        <div className="rep-kcal-row">
          <span className="rep-kcal-big">{empty ? "0" : "1.200"}</span>
          <span className="rep-kcal-slash">/</span>
          <span className="rep-kcal-goal">1.850 kcal</span>
        </div>
        <div className="kcal-bar tall">
          <div className="kcal-bar-fill" style={{ width: empty ? "0%" : "64%" }} />
        </div>
        <div className={`rep-status ${empty ? "is-empty" : ""}`}>
          {empty ? "sem registros hoje" : "Déficit de 650 kcal"}
        </div>
      </div>

      {/* MACROS */}
      <div className="rep-block">
        <div className="rep-section-title">Macronutrientes</div>
        <div className="macro-list">
          <MacroLine label="Proteína" value={empty ? 0 : 62} goal={120} unit="g" />
          <MacroLine label="Gordura" value={empty ? 0 : 32} goal={60} unit="g" />
          <MacroLine label="Carboidrato" value={empty ? 0 : 135} goal={220} unit="g" />
        </div>
      </div>

      {/* REFEIÇÕES */}
      <div className="rep-block">
        <div className="rep-section-title">Refeições do dia</div>
        <div className="meal-summary-list">
          {(empty ? EMPTY_MEALS : MEALS).map((m, i) => (
            <div key={i} className={`meal-summary-row ${m.empty ? "dim" : ""}`}>
              <span>{m.name}</span>
              <span className="meal-summary-right">
                {m.empty ? "—" : `${m.kcal} kcal`}
                <span className="chev tiny">›</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {empty && <EmptyBanner />}
    </div>
    <BottomNav activeIdx={1} />
  </PhoneP>
);

const MacroLine = ({ label, value, goal, unit }) => {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="macro-line">
      <div className="macro-line-head">
        <span className="macro-line-label">{label}</span>
        <span className="macro-line-val">
          <b>{value}</b> / {goal} {unit}
        </span>
      </div>
      <div className="kcal-bar"><div className="kcal-bar-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
};

const RepA_Day = () => <RepA />;
const RepA_Empty = () => <RepA empty />;

// ---- VARIATION B — Anel hero ------------------------------------------

const RepB = ({ empty }) => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<span className="chev big">‹</span>}
        title={<span className="topbar-h1">Hoje · 13 mai</span>}
        right={<span className="chev big">›</span>}
      />
      <div className="spacer-md" />

      {/* HERO ring */}
      <div className="rep-hero">
        <div className="ring-svg big">
          <svg viewBox="0 0 120 120" width="170" height="170">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--gray-2)" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ink)" strokeWidth="8"
              strokeDasharray="326.7" strokeDashoffset={empty ? "326.7" : "118"}
              transform="rotate(-90 60 60)" strokeLinecap="round" />
          </svg>
          <div className="ring-center">
            <div className="ring-eyebrow">consumido</div>
            <div className="ring-big xl">{empty ? "0" : "1.200"}</div>
            <div className="ring-sub">de 1.850 kcal</div>
          </div>
        </div>
        <div className={`rep-status pill ${empty ? "is-empty" : ""}`}>
          {empty ? "sem registros hoje" : "Déficit de 650 kcal"}
        </div>
      </div>

      <div className="spacer-md" />
      <div className="rep-section-title">Macronutrientes</div>
      <div className="macro-tri">
        <MacroPill label="Proteína" short="P" value={empty ? 0 : 62} goal={120} />
        <MacroPill label="Gordura" short="G" value={empty ? 0 : 32} goal={60} />
        <MacroPill label="Carboidrato" short="C" value={empty ? 0 : 135} goal={220} />
      </div>

      <div className="spacer-md" />
      <div className="rep-section-title">Refeições</div>
      <div className="meal-summary-list">
        {(empty ? EMPTY_MEALS : MEALS).map((m, i) => (
          <div key={i} className={`meal-summary-row ${m.empty ? "dim" : ""}`}>
            <span>{m.name}</span>
            <span className="meal-summary-right">
              {m.empty ? "—" : `${m.kcal} kcal`}
              <span className="chev tiny">›</span>
            </span>
          </div>
        ))}
      </div>

      {empty && <EmptyBanner />}
    </div>
    <BottomNav activeIdx={1} />
  </PhoneP>
);

const MacroPill = ({ label, short, value, goal }) => {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="macro-pill">
      <div className="macro-pill-head">
        <span className="macro-pill-short">{short}</span>
        <span className="macro-pill-label">{label}</span>
      </div>
      <div className="macro-pill-val"><b>{value}</b> / {goal}g</div>
      <div className="kcal-bar slim"><div className="kcal-bar-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
};

const RepB_Day = () => <RepB />;
const RepB_Empty = () => <RepB empty />;

// ---- VARIATION C — Tile dashboard ------------------------------------

const RepC = ({ empty }) => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={null}
        title={
          <div className="date-picker compact">
            <span className="chev">‹</span>
            <span className="date-label">Hoje · 13 mai</span>
            <span className="chev">›</span>
          </div>
        }
        right={null}
      />
      <div className="spacer-sm" />

      {/* KCAL big tile */}
      <div className="card rep-kcal-tile">
        <div className="rep-eyebrow">Calorias</div>
        <div className="rep-kcal-row">
          <span className="rep-kcal-big xl">{empty ? "0" : "1.200"}</span>
          <div className="rep-kcal-side">
            <div className="rep-kcal-of">de 1.850 kcal</div>
            <div className={`rep-status compact ${empty ? "is-empty" : ""}`}>
              {empty ? "sem registros" : "−650 kcal · déficit"}
            </div>
          </div>
        </div>
        <div className="kcal-bar tall"><div className="kcal-bar-fill" style={{ width: empty ? "0%" : "64%" }} /></div>
      </div>

      <div className="spacer-sm" />
      {/* Macro tile row with mini-rings */}
      <div className="macro-ring-row">
        <MacroRing label="Proteína" value={empty ? 0 : 62} goal={120} unit="g" />
        <MacroRing label="Gordura" value={empty ? 0 : 32} goal={60} unit="g" />
        <MacroRing label="Carbo" value={empty ? 0 : 135} goal={220} unit="g" />
      </div>

      <div className="spacer-sm" />
      <div className="rep-section-title">Refeições</div>
      <div className="meal-summary-cards">
        {(empty ? EMPTY_MEALS : MEALS).map((m, i) => (
          <div key={i} className={`meal-summary-card ${m.empty ? "dim" : ""}`}>
            <span>{m.name}</span>
            <span className="meal-summary-card-kcal">{m.empty ? "—" : `${m.kcal} kcal`}</span>
          </div>
        ))}
      </div>

      {empty && <EmptyBanner />}
    </div>
    <BottomNav activeIdx={1} />
  </PhoneP>
);

const MacroRing = ({ label, value, goal, unit }) => {
  const pct = goal ? Math.min(100, (value / goal) * 100) : 0;
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="macro-ring">
      <div className="macro-ring-svg">
        <svg viewBox="0 0 60 60" width="64" height="64">
          <circle cx="30" cy="30" r={r} fill="none" stroke="var(--gray-2)" strokeWidth="4" />
          <circle cx="30" cy="30" r={r} fill="none" stroke="var(--ink)" strokeWidth="4"
            strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
            transform="rotate(-90 30 30)" strokeLinecap="round" />
        </svg>
        <div className="macro-ring-center">
          <div className="macro-ring-pct">{Math.round(pct)}%</div>
        </div>
      </div>
      <div className="macro-ring-label">{label}</div>
      <div className="macro-ring-val"><b>{value}</b>/{goal}{unit}</div>
    </div>
  );
};

const RepC_Day = () => <RepC />;
const RepC_Empty = () => <RepC empty />;

// ---- export ----------------------------------------------------------

Object.assign(window, {
  RepA_Day, RepA_Empty,
  RepB_Day, RepB_Empty,
  RepC_Day, RepC_Empty,
});
