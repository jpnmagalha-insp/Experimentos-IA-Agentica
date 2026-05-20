// Log alimentar wireframes. 3 variations × 3 screens.
// Reuses primitives from screens.jsx + screens-perfil.jsx (BottomNav, TopBar,
// Field, Btn). Loaded after both.

// ---- shared bits ------------------------------------------------------

const SwipeHint = () => (
  <div className="swipe-hint" aria-hidden="true">
    <span>swipe</span><span className="arrow">›</span>
  </div>
);

// ---- VARIATION A — Lista por refeição --------------------------------

const LogA_Day = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={null}
        title={<span className="topbar-h1">Log alimentar</span>}
        right={null}
      />
      <div className="date-picker">
        <span className="chev">‹</span>
        <span className="date-label">Hoje · 13 mai</span>
        <span className="chev">›</span>
      </div>
      <div className="spacer-sm" />
      <div className="kcal-summary">
        <div className="kcal-summary-row">
          <span className="kcal-big">1.200</span>
          <span className="kcal-slash">/</span>
          <span className="kcal-goal">1.850 kcal</span>
        </div>
        <div className="kcal-bar">
          <div className="kcal-bar-fill" style={{ width: "64%" }} />
        </div>
        <div className="kcal-sub">restam 650 kcal</div>
      </div>
      <div className="spacer-md" />
      <MealSection title="Café da manhã" total="320 kcal" items={[
        { name: "Pão integral", qty: "2 fatias", kcal: "180" },
        { name: "Ovo mexido", qty: "2 unidades", kcal: "140" },
      ]} />
      <MealSection title="Almoço" total="640 kcal" items={[
        { name: "Arroz integral", qty: "100g", kcal: "120" },
        { name: "Frango grelhado", qty: "150g", kcal: "270" },
        { name: "Salada", qty: "1 prato", kcal: "70" },
        { name: "Feijão preto", qty: "100g", kcal: "180" },
      ]} />
      <MealSection title="Lanche" total="240 kcal" items={[
        { name: "Iogurte natural", qty: "200g", kcal: "120" },
        { name: "Banana", qty: "1 média", kcal: "120" },
      ]} />
      <MealSection title="Jantar" total="0 kcal" empty />
    </div>
    <BottomNav activeIdx={0} />
  </PhoneP>
);

const MealSection = ({ title, total, items = [], empty }) => (
  <div className="meal-section">
    <div className="meal-head">
      <span className="meal-title">{title}</span>
      <span className="meal-total">{total}</span>
    </div>
    {empty ? (
      <div className="meal-empty">nenhum item registrado</div>
    ) : (
      <div className="meal-items">
        {items.map((it, i) => (
          <div className="meal-item" key={i}>
            <div className="meal-item-name">
              <div>{it.name}</div>
              <div className="meal-item-qty">{it.qty}</div>
            </div>
            <div className="meal-item-kcal">{it.kcal} kcal</div>
            <SwipeHint />
          </div>
        ))}
      </div>
    )}
    <div className="meal-add">+ Adicionar item</div>
  </div>
);

const LogA_Add = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">Cancelar</TopAction>}
        title={<span className="topbar-h1">Adicionar item</span>}
        right={null}
      />
      <div className="spacer-sm" />
      <div className="meal-picker">
        {["Café da manhã", "Almoço", "Lanche", "Jantar"].map((m, i) => (
          <div key={m} className={`meal-pick ${i === 1 ? "active" : ""}`}>{m}</div>
        ))}
      </div>
      <div className="spacer-md" />
      <div className="field-label"><span>O que você comeu?</span></div>
      <div className="textarea">
        <div className="ta-placeholder">2 colheres de arroz,<br/>150g de frango grelhado,<br/>1 prato de salada…</div>
      </div>
      <div className="hint">Informe o alimento e a quantidade. Calculamos os macros pra você.</div>
      <div className="grow" />
      <Btn kind="primary">Calcular macros</Btn>
    </div>
    <BottomNav activeIdx={0} inactive />
  </PhoneP>
);

const LogA_Confirm = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">← Voltar</TopAction>}
        title={<span className="topbar-h1">Confirmar item</span>}
        right={null}
      />
      <div className="spacer-sm" />
      <div className="confirm-card">
        <div className="confirm-name">Arroz integral, frango grelhado e salada</div>
        <div className="confirm-qty">100g + 150g + 1 prato</div>
        <div className="macro-rows">
          <div className="macro-row"><span>Calorias</span><span><b>460</b> kcal</span></div>
          <div className="macro-row"><span>Proteína</span><span><b>42</b> g</span></div>
          <div className="macro-row"><span>Gordura</span><span><b>9</b> g</span></div>
          <div className="macro-row"><span>Carboidrato</span><span><b>52</b> g</span></div>
        </div>
      </div>
      <div className="hint center">Não é o que você quis dizer? <u>Volte e tente novamente.</u></div>
      <div className="grow" />
      <Btn kind="primary">Adicionar ao log</Btn>
    </div>
    <BottomNav activeIdx={0} inactive />
  </PhoneP>
);

// ---- VARIATION B — Timeline cronológica ------------------------------

const LogB_Day = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<span className="chev big">‹</span>}
        title={<span className="topbar-h1">Hoje · 13 mai</span>}
        right={<span className="chev big">›</span>}
      />
      <div className="spacer-sm" />
      <div className="kcal-ring">
        <div className="ring-svg">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gray-2)" strokeWidth="6"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ink)" strokeWidth="6"
              strokeDasharray="263.9" strokeDashoffset="95"
              transform="rotate(-90 50 50)" strokeLinecap="round"/>
          </svg>
          <div className="ring-center">
            <div className="ring-big">1.200</div>
            <div className="ring-sub">de 1.850</div>
          </div>
        </div>
        <div className="ring-side">
          <div className="ring-side-row"><span>P</span><span>62 g</span></div>
          <div className="ring-side-row"><span>G</span><span>32 g</span></div>
          <div className="ring-side-row"><span>C</span><span>135 g</span></div>
        </div>
      </div>
      <div className="spacer-md" />
      <div className="timeline">
        <TLEntry time="08:20" meal="Café da manhã" name="Pão integral · Ovo mexido" kcal="320" />
        <TLEntry time="12:45" meal="Almoço" name="Arroz, frango grelhado, salada, feijão" kcal="640" />
        <TLEntry time="16:10" meal="Lanche" name="Iogurte natural · Banana" kcal="240" />
        <TLEntry time="—" meal="Jantar" name="ainda não registrado" empty />
      </div>
      <div className="spacer-md" />
      <Btn kind="primary">+ Adicionar item</Btn>
    </div>
    <BottomNav activeIdx={0} />
  </PhoneP>
);

const TLEntry = ({ time, meal, name, kcal, empty }) => (
  <div className={`tl-entry ${empty ? "empty" : ""}`}>
    <div className="tl-time">{time}</div>
    <div className="tl-dot" />
    <div className="tl-body">
      <div className="tl-meal">{meal}</div>
      <div className="tl-name">{name}</div>
    </div>
    {!empty && <div className="tl-kcal">{kcal} kcal</div>}
  </div>
);

const LogB_Add = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">Cancelar</TopAction>}
        title={<span className="topbar-h1">Adicionar item</span>}
        right={null}
      />
      <div className="spacer-sm" />
      <div className="chat-meal-tag">
        <span>Para o</span>
        <span className="chat-meal-chip">Almoço ▾</span>
      </div>
      <div className="spacer-md" />
      <div className="chat-prompt">O que você comeu?</div>
      <div className="textarea big">
        <div className="ta-placeholder">2 colheres de arroz, 150g de frango grelhado, 1 prato de salada…</div>
      </div>
      <div className="hint">Informe o alimento e a quantidade. Calculamos os macros pra você.</div>
      <div className="spacer-sm" />
      <div className="suggest-chips">
        <span className="chip">Banana média</span>
        <span className="chip">Ovo cozido</span>
        <span className="chip">Café com leite</span>
      </div>
      <div className="grow" />
      <Btn kind="primary">Calcular macros</Btn>
    </div>
    <BottomNav activeIdx={0} inactive />
  </PhoneP>
);

const LogB_Confirm = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">← Voltar</TopAction>}
        title={<span className="topbar-h1">Confirmar item</span>}
        right={null}
      />
      <div className="spacer-sm" />
      <div className="confirm-name big">Arroz integral, frango grelhado e salada</div>
      <div className="confirm-qty">100g + 150g + 1 prato</div>
      <div className="spacer-sm" />
      <div className="macro-tiles">
        <div className="macro-tile big">
          <div className="m-val">460</div>
          <div className="m-lab">kcal</div>
        </div>
        <div className="macro-tile">
          <div className="m-val">42</div>
          <div className="m-lab">prot · g</div>
        </div>
        <div className="macro-tile">
          <div className="m-val">9</div>
          <div className="m-lab">gord · g</div>
        </div>
        <div className="macro-tile">
          <div className="m-val">52</div>
          <div className="m-lab">carbo · g</div>
        </div>
      </div>
      <div className="spacer-sm" />
      <div className="hint center">Não é o que você quis dizer? <u>Volte e tente novamente.</u></div>
      <div className="grow" />
      <Btn kind="primary">Adicionar ao log</Btn>
    </div>
    <BottomNav activeIdx={0} inactive />
  </PhoneP>
);

// ---- VARIATION C — Card hero + refeições compactas -------------------

const LogC_Day = () => (
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
      <div className="card kcal-hero">
        <div className="kcal-hero-top">
          <div>
            <div className="kcal-hero-big">1.200<span className="kcal-hero-of"> / 1.850</span></div>
            <div className="kcal-hero-lab">kcal · 64% da meta</div>
          </div>
          <div className="kcal-hero-stat">
            <div className="kcal-hero-stat-val">650</div>
            <div className="kcal-hero-stat-lab">restantes</div>
          </div>
        </div>
        <div className="kcal-bar"><div className="kcal-bar-fill" style={{width: "64%"}}/></div>
        <div className="macro-mini">
          <div><b>P</b> 62g</div><div><b>G</b> 32g</div><div><b>C</b> 135g</div>
        </div>
      </div>
      <div className="spacer-sm" />
      <MealCardC title="Café da manhã" total="320" items={2} />
      <MealCardC title="Almoço" total="640" items={4} />
      <MealCardC title="Lanche" total="240" items={2} />
      <MealCardC title="Jantar" total="0" items={0} />
    </div>
    <BottomNav activeIdx={0} />
  </PhoneP>
);

const MealCardC = ({ title, total, items }) => (
  <div className="meal-card-c">
    <div className="mcc-left">
      <div className="mcc-title">{title}</div>
      <div className="mcc-sub">
        {items === 0 ? "nenhum item · toque para adicionar" : `${items} ${items === 1 ? "item" : "itens"}`}
      </div>
    </div>
    <div className="mcc-right">
      <div className="mcc-kcal">{total} <span>kcal</span></div>
      <div className="mcc-add">+</div>
    </div>
  </div>
);

const LogC_Add = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">Cancelar</TopAction>}
        title={<span className="topbar-h1">Adicionar item</span>}
        right={null}
      />
      <div className="spacer-sm" />
      <div className="field-label"><span>Refeição</span></div>
      <div className="dropdown-row">
        <span>Almoço</span><span className="chev down">▾</span>
      </div>
      <div className="spacer-md" />
      <div className="field-label"><span>O que você comeu?</span></div>
      <div className="textarea">
        <div className="ta-placeholder">2 colheres de arroz,<br/>150g de frango,<br/>1 prato de salada…</div>
      </div>
      <div className="hint">Informe o alimento e a quantidade. Calculamos os macros pra você.</div>
      <div className="grow" />
      <Btn kind="primary">Calcular macros</Btn>
    </div>
    <BottomNav activeIdx={0} inactive />
  </PhoneP>
);

const LogC_Confirm = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">← Voltar</TopAction>}
        title={<span className="topbar-h1">Confirmar item</span>}
        right={null}
      />
      <div className="spacer-sm" />
      <div className="card confirm-card-c">
        <div className="confirm-pill">reconhecido</div>
        <div className="confirm-name">Arroz integral, frango grelhado e salada</div>
        <div className="confirm-qty">100g + 150g + 1 prato</div>
        <div className="spacer-sm" />
        <div className="macro-bars">
          <MacroBar label="Proteína" value={42} max={60} unit="g" />
          <MacroBar label="Gordura" value={9} max={25} unit="g" />
          <MacroBar label="Carboidrato" value={52} max={80} unit="g" />
        </div>
        <div className="confirm-kcal-row">
          <span>Total</span><span><b>460</b> kcal</span>
        </div>
      </div>
      <div className="hint center">Não é o que você quis dizer? <u>Volte e tente novamente.</u></div>
      <div className="grow" />
      <Btn kind="primary">Adicionar ao log</Btn>
    </div>
    <BottomNav activeIdx={0} inactive />
  </PhoneP>
);

const MacroBar = ({ label, value, max, unit }) => (
  <div className="macro-bar">
    <div className="macro-bar-head">
      <span>{label}</span>
      <span><b>{value}</b> {unit}</span>
    </div>
    <div className="macro-bar-track">
      <div className="macro-bar-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  </div>
);

// ---- export ----------------------------------------------------------

Object.assign(window, {
  LogA_Day, LogA_Add, LogA_Confirm,
  LogB_Day, LogB_Add, LogB_Confirm,
  LogC_Day, LogC_Add, LogC_Confirm,
});
