// Profile flow wireframes. 3 variations × 2 screens (View + Edit).
// Reuses primitives + styles from the onboarding wireframe, plus
// profile-specific bits (avatar, list rows, bottom nav, stat tiles).

const { useState: useStateP } = React;

// ----- shared profile primitives ----------------------------------------

const PhoneP = ({ children }) => (
  <div className="phone">
    <div className="statusbar"><span>9:41</span><span className="dots">●●● ●●</span></div>
    <div className="phone-body">{children}</div>
    <div className="home-indicator" />
  </div>
);

// Header bar with left/right slots.
const TopBar = ({ left, title, right }) => (
  <div className="topbar">
    <div className="topbar-side left">{left}</div>
    <div className="topbar-title">{title}</div>
    <div className="topbar-side right">{right}</div>
  </div>
);

// Bottom nav — three tabs. activeIdx 0=Log 1=Relatório 2=Perfil. inactive
// dims the whole bar (used on the Edit screen per spec).
const BottomNav = ({ activeIdx = 2, inactive = false }) => {
  const tabs = [
    { id: "log", label: "Log", icon: PencilIcon },
    { id: "rep", label: "Relatório", icon: ChartIcon },
    { id: "me",  label: "Perfil", icon: PersonIcon },
  ];
  return (
    <div className={`bottom-nav ${inactive ? "is-inactive" : ""}`}>
      {tabs.map((t, i) => {
        const Icon = t.icon;
        const active = i === activeIdx;
        return (
          <div key={t.id} className={`tab ${active ? "active" : ""}`}>
            <Icon active={active} />
            <div className="tab-label">{t.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// Minimal line-icons (SVG primitives are allowed — squares, circles, lines).
const PencilIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 19 L7 18 L18 7 L15 4 L4 15 Z" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"/>
    <path d="M13 6 L16 9" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
  </svg>
);
const ChartIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="11" width="3.5" height="8" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
    <rect x="9.25" y="6" width="3.5" height="13" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
    <rect x="15.5" y="9" width="3.5" height="10" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
  </svg>
);
const PersonIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="7" r="3.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}/>
    <path d="M4 19 C4 14.5 7 13 11 13 C15 13 18 14.5 18 19" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round"/>
  </svg>
);

// Avatar placeholder.
const Avatar = ({ size = 88, initials }) => (
  <div className="avatar" style={{ width: size, height: size }}>
    {initials
      ? <span className="avatar-initials">{initials}</span>
      : <PersonIcon active={false} />}
  </div>
);

// Profile body sections — list-row style.
const ListSection = ({ title, children }) => (
  <div className="list-section">
    <div className="list-section-title">{title}</div>
    <div className="list-rows">{children}</div>
  </div>
);

const Row = ({ label, value, dim }) => (
  <div className="row">
    <span className="row-label">{label}</span>
    <span className={`row-value ${dim ? "dim" : ""}`}>{value}</span>
  </div>
);

// Profile edit primitives (re-use Field/Btn from screens.jsx loaded earlier).

// Logout link.
const Logout = () => <div className="logout">Sair da conta</div>;

// Topbar text actions.
const TopAction = ({ children, kind = "default" }) => (
  <span className={`top-action top-action-${kind}`}>{children}</span>
);

// ----- VARIATION A — Lista clássica -------------------------------------

const PA_View = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<span className="back-arrow inline">←</span>}
        title={<span className="topbar-h1">Perfil</span>}
        right={<TopAction>Editar</TopAction>}
      />
      <div className="spacer-md" />
      <div className="profile-hero">
        <Avatar size={88} />
        <div className="profile-name">Ana Souza</div>
        <div className="profile-sub">ana@email.com</div>
      </div>
      <div className="spacer-md" />
      <ListSection title="Dados pessoais">
        <Row label="Idade" value="28 anos" />
        <Row label="Sexo" value="Masculino" />
      </ListSection>
      <ListSection title="Dados físicos">
        <Row label="Altura" value="178 cm" />
        <Row label="Peso" value="82 kg" />
        <Row label="% gordura corporal" value="18%" />
        <Row label="TMB" value="Estimada · 1.850 kcal" dim />
      </ListSection>
      <div className="grow" />
      <Logout />
    </div>
    <BottomNav activeIdx={2} />
  </PhoneP>
);

const PA_Edit = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">Cancelar</TopAction>}
        title={<span className="topbar-h1">Editar perfil</span>}
        right={<TopAction kind="primary">Salvar</TopAction>}
      />
      <div className="spacer-md" />
      <div className="profile-hero">
        <div className="avatar-edit">
          <Avatar size={76} />
          <div className="avatar-edit-pill">Alterar</div>
        </div>
      </div>
      <div className="spacer-md" />
      <div className="form-section-title">Dados pessoais</div>
      <Field label="Nome ou apelido" required value="Ana Souza" />
      <Field label="Data de nascimento" required value="12 / 05 / 1997" />
      <div className="field-label"><span>Sexo</span><span className="req">*</span></div>
      <div className="segmented">
        <div className="seg-opt">Masculino</div>
        <div className="seg-opt">Feminino</div>
      </div>
      <div className="spacer-md" />
      <div className="form-section-title">Dados físicos</div>
      <Field label="Altura" required value="178 cm" />
      <Field label="Peso" required value="82 kg" />
      <Field label="% gordura corporal" optional value="18%" />
      <Field label="TMB" optional value="1.850 kcal" hint="calculamos pra você se preferir" />
    </div>
    <BottomNav activeIdx={2} inactive />
  </PhoneP>
);

// ----- VARIATION B — Cards agrupados -----------------------------------

const PB_View = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={null}
        title={<span className="topbar-h1">Perfil</span>}
        right={<TopAction>Editar</TopAction>}
      />
      <div className="spacer-md" />
      <div className="card profile-card-hero">
        <Avatar size={64} />
        <div>
          <div className="profile-name compact">Ana Souza</div>
          <div className="profile-sub">ana@email.com</div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Dados pessoais</div>
        <Row label="Idade" value="28 anos" />
        <Row label="Sexo" value="Masculino" />
      </div>
      <div className="card">
        <div className="card-title">Dados físicos</div>
        <Row label="Altura" value="178 cm" />
        <Row label="Peso" value="82 kg" />
        <Row label="% gordura corporal" value="18%" />
        <Row label="TMB" value="Estimada · 1.850 kcal" dim />
      </div>
      <div className="grow" />
      <Logout />
    </div>
    <BottomNav activeIdx={2} />
  </PhoneP>
);

const PB_Edit = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">Cancelar</TopAction>}
        title={<span className="topbar-h1">Editar perfil</span>}
        right={<TopAction kind="primary">Salvar</TopAction>}
      />
      <div className="spacer-md" />
      <div className="card profile-card-hero">
        <div className="avatar-edit small">
          <Avatar size={56} />
          <div className="avatar-edit-pill">Alterar</div>
        </div>
        <div className="card-title compact">Foto</div>
      </div>
      <div className="card">
        <div className="card-title">Dados pessoais</div>
        <Field label="Nome ou apelido" required value="Ana Souza" />
        <Field label="Data de nascimento" required value="12 / 05 / 1997" />
        <div className="field-label"><span>Sexo</span><span className="req">*</span></div>
        <div className="segmented">
          <div className="seg-opt">Masculino</div>
          <div className="seg-opt">Feminino</div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Dados físicos</div>
        <Field label="Altura (cm)" required value="178" />
        <Field label="Peso (kg)" required value="82" />
        <Field label="% gordura corporal" optional value="18" />
        <Field label="TMB (kcal)" optional value="1850" hint="calculamos pra você se preferir" />
      </div>
    </div>
    <BottomNav activeIdx={2} inactive />
  </PhoneP>
);

// ----- VARIATION C — Stats hero + lista --------------------------------

const Stat = ({ label, value, sub }) => (
  <div className="stat-tile">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

const PC_View = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={null}
        title={<span className="topbar-h1">Perfil</span>}
        right={<TopAction>Editar</TopAction>}
      />
      <div className="spacer-md" />
      <div className="profile-hero compact">
        <Avatar size={72} />
        <div className="profile-name">Ana Souza</div>
        <div className="profile-sub">28 anos · Masculino</div>
      </div>
      <div className="spacer-md" />
      <div className="stat-grid">
        <Stat label="Altura" value="178" sub="cm" />
        <Stat label="Peso" value="82" sub="kg" />
        <Stat label="% gordura" value="18" sub="%" />
        <Stat label="TMB" value="1.850" sub="kcal · estimada" />
      </div>
      <div className="grow" />
      <Logout />
    </div>
    <BottomNav activeIdx={2} />
  </PhoneP>
);

const PC_Edit = () => (
  <PhoneP>
    <div className="screen pad-md scroll-area">
      <TopBar
        left={<TopAction kind="quiet">Cancelar</TopAction>}
        title={<span className="topbar-h1">Editar perfil</span>}
        right={<TopAction kind="primary">Salvar</TopAction>}
      />
      <div className="spacer-md" />
      <div className="profile-hero compact">
        <div className="avatar-edit">
          <Avatar size={64} />
          <div className="avatar-edit-pill">Alterar foto</div>
        </div>
      </div>
      <div className="spacer-md" />
      <div className="form-section-title">Dados pessoais</div>
      <Field label="Nome ou apelido" required value="Ana Souza" />
      <Field label="Data de nascimento" required value="12 / 05 / 1997" />
      <div className="field-label"><span>Sexo</span><span className="req">*</span></div>
      <div className="segmented">
        <div className="seg-opt">Masculino</div>
        <div className="seg-opt">Feminino</div>
      </div>
      <div className="spacer-md" />
      <div className="form-section-title">Dados físicos</div>
      <div className="grid-2">
        <Field label="Altura (cm)" required value="178" />
        <Field label="Peso (kg)" required value="82" />
      </div>
      <Field label="% gordura corporal" optional value="18" />
      <Field label="TMB (kcal)" optional value="1850" hint="calculamos pra você se preferir" />
    </div>
    <BottomNav activeIdx={2} inactive />
  </PhoneP>
);

// ----- export ----------------------------------------------------------

Object.assign(window, {
  PA_View, PA_Edit,
  PB_View, PB_Edit,
  PC_View, PC_Edit,
});
