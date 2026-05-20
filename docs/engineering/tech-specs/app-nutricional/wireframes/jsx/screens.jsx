// Wireframe screens for the nutrition app onboarding flow.
// 3 variations × 5 screens. Low-fi, sketchy, grayscale + one accent.

const { useState } = React;

// ----- shared primitives -------------------------------------------------

const Phone = ({ children, statusBar = true, label }) => (
  <div className="phone">
    {statusBar && (
      <div className="statusbar">
        <span>9:41</span>
        <span className="dots">●●● ●●</span>
      </div>
    )}
    <div className="phone-body">{children}</div>
    <div className="home-indicator" />
    {label && <div className="phone-tag">{label}</div>}
  </div>
);

const Field = ({ label, value, required, optional, hint, variant = "dash" }) => (
  <div className="field">
    <div className="field-label">
      <span>{label}</span>
      {required && <span className="req">*</span>}
      {optional && <span className="opt">opcional</span>}
    </div>
    <div className={`input ${variant}`}>
      <span className="placeholder">{value || "\u00a0"}</span>
    </div>
    {hint && <div className="hint">{hint}</div>}
  </div>
);

const Btn = ({ kind = "primary", children, full = true, icon }) => (
  <div className={`btn btn-${kind} ${full ? "full" : ""}`}>
    {icon && <span className="btn-icon">{icon}</span>}
    <span>{children}</span>
  </div>
);

const Divider = ({ children = "ou" }) => (
  <div className="divider"><span>{children}</span></div>
);

const Link = ({ children }) => <div className="link">{children}</div>;

const Progress = ({ step, total }) => (
  <div className="progress">
    <div className="progress-label">passo {step} de {total}</div>
    <div className="progress-bar">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`seg ${i < step ? "on" : ""}`} />
      ))}
    </div>
  </div>
);

const Logo = ({ name = "nutri" }) => (
  <div className="logo">
    <div className="logo-mark">
      <div className="mark-ring" />
      <div className="mark-dot" />
    </div>
    <div className="logo-name">{name}</div>
  </div>
);

// ----- VARIATION A — Clássico generoso ----------------------------------
// Vertical flow, labels-on-top, big gaps, CTAs in content flow.

const A1_Welcome = () => (
  <Phone>
    <div className="screen pad-lg center-y">
      <div className="spacer-xl" />
      <div className="badge-mark">
        <div className="circle-md" />
        <div className="circle-md offset" />
      </div>
      <div className="spacer-md" />
      <div className="logo-name big" style={{ textAlign: "center" }}>nutri.</div>
      <div className="tagline">Controle nutricional<br/>simples e preciso.</div>
      <div className="grow" />
      <div className="stack-md">
        <Btn kind="primary">Criar conta</Btn>
        <Btn kind="ghost">Já tenho conta</Btn>
      </div>
    </div>
  </Phone>
);

const A2_Signup = () => (
  <Phone>
    <div className="screen pad-lg">
      <div className="back-arrow">←</div>
      <h1 className="h1">Criar conta</h1>
      <div className="spacer-md" />
      <Field label="Nome ou apelido" />
      <Field label="E-mail" />
      <Field label="Senha" hint="mínimo 8 caracteres" />
      <div className="spacer-md" />
      <Btn kind="primary">Criar conta</Btn>
      <Divider />
      <div className="stack-sm">
        <Btn kind="outline" icon="G">Continuar com Google</Btn>
        <Btn kind="outline" icon="">Continuar com Apple</Btn>
      </div>
      <div className="spacer-md" />
      <Link>Já tenho conta — fazer login</Link>
    </div>
  </Phone>
);

const A3_Login = () => (
  <Phone>
    <div className="screen pad-lg">
      <div className="back-arrow">←</div>
      <h1 className="h1">Entrar</h1>
      <div className="spacer-md" />
      <Field label="E-mail" />
      <Field label="Senha" />
      <div className="right"><Link>Esqueci minha senha</Link></div>
      <div className="spacer-md" />
      <Btn kind="primary">Entrar</Btn>
      <Divider />
      <div className="stack-sm">
        <Btn kind="outline" icon="G">Continuar com Google</Btn>
        <Btn kind="outline" icon="">Continuar com Apple</Btn>
      </div>
      <div className="spacer-md" />
      <Link>Não tenho conta — criar conta</Link>
    </div>
  </Phone>
);

const A4_Body1 = () => (
  <Phone>
    <div className="screen pad-lg">
      <Progress step={1} total={2} />
      <div className="spacer-md" />
      <h1 className="h1">Sobre você</h1>
      <p className="sub">Usamos esses dados para calcular suas metas.</p>
      <div className="spacer-md" />
      <Field label="Data de nascimento" required value="__ / __ / ____" />
      <div className="spacer-sm" />
      <div className="field-label"><span>Sexo</span><span className="req">*</span></div>
      <div className="segmented">
        <div className="seg-opt">Masculino</div>
        <div className="seg-opt">Feminino</div>
      </div>
      <div className="grow" />
      <Btn kind="primary">Continuar</Btn>
    </div>
  </Phone>
);

const A5_Body2 = () => (
  <Phone>
    <div className="screen pad-lg">
      <Progress step={2} total={2} />
      <div className="spacer-md" />
      <h1 className="h1">Seus dados físicos</h1>
      <div className="spacer-sm" />
      <Field label="Altura" required value="cm" />
      <Field label="Peso" required value="kg" />
      <Field label="% gordura corporal" optional value="%" />
      <Field label="TMB — Taxa Metabólica Basal" optional value="kcal" hint="calculamos pra você se preferir" />
      <div className="grow" />
      <Btn kind="primary">Concluir</Btn>
    </div>
  </Phone>
);

// ----- VARIATION B — CTA ancorado no rodapé -----------------------------
// Content scrolls, primary CTA pinned at bottom with safe-area-ish band.

const Footer = ({ children }) => (
  <div className="footer-cta">{children}</div>
);

const B1_Welcome = () => (
  <Phone>
    <div className="screen pad-lg has-footer">
      <div className="spacer-xl" />
      <div className="logo-hero">
        <Logo name="nutri." big />
        <div className="hero-mark">
          <div className="circle-lg" />
        </div>
      </div>
      <div className="tagline big">Controle nutricional<br/>simples e preciso.</div>
      <div className="bullets">
        <div className="bullet"><span className="bul">·</span> registre sua comida em segundos</div>
        <div className="bullet"><span className="bul">·</span> metas calculadas pra você</div>
      </div>
    </div>
    <Footer>
      <Btn kind="primary">Criar conta</Btn>
      <div className="footer-link">Já tenho conta</div>
    </Footer>
  </Phone>
);

const B2_Signup = () => (
  <Phone>
    <div className="screen pad-lg has-footer">
      <div className="back-arrow">←</div>
      <h1 className="h1">Criar conta</h1>
      <p className="sub">É rapidinho.</p>
      <div className="spacer-md" />
      <Field label="Nome ou apelido" />
      <Field label="E-mail" />
      <Field label="Senha" hint="mín. 8 caracteres" />
      <Divider />
      <div className="stack-sm">
        <Btn kind="outline" icon="G">Continuar com Google</Btn>
        <Btn kind="outline" icon="">Continuar com Apple</Btn>
      </div>
      <div className="spacer-md" />
      <Link>Já tenho conta — fazer login</Link>
    </div>
    <Footer><Btn kind="primary">Criar conta</Btn></Footer>
  </Phone>
);

const B3_Login = () => (
  <Phone>
    <div className="screen pad-lg has-footer">
      <div className="back-arrow">←</div>
      <h1 className="h1">Entrar</h1>
      <div className="spacer-md" />
      <Field label="E-mail" />
      <Field label="Senha" />
      <div className="right"><Link>Esqueci minha senha</Link></div>
      <Divider />
      <div className="stack-sm">
        <Btn kind="outline" icon="G">Continuar com Google</Btn>
        <Btn kind="outline" icon="">Continuar com Apple</Btn>
      </div>
      <div className="spacer-md" />
      <Link>Não tenho conta — criar conta</Link>
    </div>
    <Footer><Btn kind="primary">Entrar</Btn></Footer>
  </Phone>
);

const B4_Body1 = () => (
  <Phone>
    <div className="screen pad-lg has-footer">
      <Progress step={1} total={2} />
      <div className="spacer-md" />
      <h1 className="h1">Sobre você</h1>
      <p className="sub">Usamos esses dados para calcular suas metas.</p>
      <div className="spacer-md" />
      <Field label="Data de nascimento" required value="__ / __ / ____" />
      <div className="spacer-sm" />
      <div className="field-label"><span>Sexo</span><span className="req">*</span></div>
      <div className="segmented">
        <div className="seg-opt">Masculino</div>
        <div className="seg-opt">Feminino</div>
      </div>
    </div>
    <Footer><Btn kind="primary">Continuar</Btn></Footer>
  </Phone>
);

const B5_Body2 = () => (
  <Phone>
    <div className="screen pad-lg has-footer">
      <Progress step={2} total={2} />
      <div className="spacer-md" />
      <h1 className="h1">Seus dados físicos</h1>
      <div className="spacer-sm" />
      <Field label="Altura (cm)" required />
      <Field label="Peso (kg)" required />
      <Field label="% gordura corporal" optional />
      <Field label="TMB (kcal)" optional hint="calculamos pra você se preferir" />
    </div>
    <Footer><Btn kind="primary">Concluir</Btn></Footer>
  </Phone>
);

// ----- VARIATION C — Cartões agrupados ----------------------------------
// Fields grouped into cards/sections; more visual chunking.

const Card = ({ title, children }) => (
  <div className="card">
    {title && <div className="card-title">{title}</div>}
    <div className="card-body">{children}</div>
  </div>
);

const C1_Welcome = () => (
  <Phone>
    <div className="screen pad-lg center-y">
      <div className="spacer-lg" />
      <div className="badge-mark">
        <div className="circle-md" />
        <div className="circle-md offset" />
      </div>
      <div className="spacer-md" />
      <div className="logo-name big">nutri.</div>
      <div className="tagline">Controle nutricional<br/>simples e preciso.</div>
      <div className="grow" />
      <Card>
        <Btn kind="primary">Criar conta</Btn>
        <div className="spacer-sm" />
        <Btn kind="ghost">Já tenho conta</Btn>
      </Card>
    </div>
  </Phone>
);

const C2_Signup = () => (
  <Phone>
    <div className="screen pad-md">
      <div className="back-arrow">←</div>
      <h1 className="h1">Criar conta</h1>
      <div className="spacer-sm" />
      <Card title="Seus dados">
        <Field label="Nome ou apelido" />
        <Field label="E-mail" />
        <Field label="Senha" hint="mín. 8 caracteres" />
      </Card>
      <Btn kind="primary">Criar conta</Btn>
      <Divider />
      <Card title="Ou continue com">
        <Btn kind="outline" icon="G">Google</Btn>
        <div className="spacer-xs" />
        <Btn kind="outline" icon="">Apple</Btn>
      </Card>
      <div className="spacer-sm" />
      <Link>Já tenho conta — fazer login</Link>
    </div>
  </Phone>
);

const C3_Login = () => (
  <Phone>
    <div className="screen pad-md">
      <div className="back-arrow">←</div>
      <h1 className="h1">Entrar</h1>
      <div className="spacer-sm" />
      <Card>
        <Field label="E-mail" />
        <Field label="Senha" />
        <div className="right"><Link>Esqueci minha senha</Link></div>
      </Card>
      <Btn kind="primary">Entrar</Btn>
      <Divider />
      <Card title="Ou continue com">
        <Btn kind="outline" icon="G">Google</Btn>
        <div className="spacer-xs" />
        <Btn kind="outline" icon="">Apple</Btn>
      </Card>
      <div className="spacer-sm" />
      <Link>Não tenho conta — criar conta</Link>
    </div>
  </Phone>
);

const C4_Body1 = () => (
  <Phone>
    <div className="screen pad-md">
      <Progress step={1} total={2} />
      <div className="spacer-sm" />
      <h1 className="h1">Sobre você</h1>
      <p className="sub">Usamos esses dados para calcular suas metas.</p>
      <div className="spacer-sm" />
      <Card title="Idade">
        <Field label="Data de nascimento" required value="__ / __ / ____" />
      </Card>
      <Card title="Sexo">
        <div className="segmented">
          <div className="seg-opt">Masculino</div>
          <div className="seg-opt">Feminino</div>
        </div>
        <div className="req-note">* obrigatório</div>
      </Card>
      <div className="grow" />
      <Btn kind="primary">Continuar</Btn>
    </div>
  </Phone>
);

const C5_Body2 = () => (
  <Phone>
    <div className="screen pad-md">
      <Progress step={2} total={2} />
      <div className="spacer-sm" />
      <h1 className="h1">Seus dados físicos</h1>
      <div className="spacer-sm" />
      <Card title="Obrigatórios">
        <Field label="Altura (cm)" required />
        <Field label="Peso (kg)" required />
      </Card>
      <Card title="Opcionais">
        <Field label="% gordura corporal" optional />
        <Field label="TMB (kcal)" optional hint="calculamos pra você se preferir" />
      </Card>
      <div className="grow" />
      <Btn kind="primary">Concluir</Btn>
    </div>
  </Phone>
);

// ----- export -----------------------------------------------------------

Object.assign(window, {
  A1_Welcome, A2_Signup, A3_Login, A4_Body1, A5_Body2,
  B1_Welcome, B2_Signup, B3_Login, B4_Body1, B5_Body2,
  C1_Welcome, C2_Signup, C3_Login, C4_Body1, C5_Body2,
});
