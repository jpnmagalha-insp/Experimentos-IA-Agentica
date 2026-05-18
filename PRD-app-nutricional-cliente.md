# App de Controle Nutricional

**Product Requirements Document**

| | |
|---|---|
| Versão | 1.0 |
| Status | Rascunho para validação |
| Base | Entrevista de requisitos |

---

## 1. Problema

O mercado de apps de nutrição não atende usuários com objetivos corporais específicos — como perda de gordura sem perda de massa muscular, ganho de massa ou restrições alimentares. Os apps mais populares falham de formas diferentes: FatSecret e Noom são genéricos demais e pouco precisos nos dados nutricionais. O Simple é o mais próximo do que o usuário precisa, mas peca na interface pouco intuitiva e na falta de granularidade.

> **O app resolve:** Controle preciso de calorias e macronutrientes (proteínas, gorduras, carboidratos) com base nos parâmetros corporais individuais do usuário, com interface simples e decisão alimentar autônoma.

---

## 2. Usuários

### Usuário MVP `free`

Pessoa que já faz ou quer começar a fazer registros alimentares. Foco em saúde e resultado corporal. Objetivos variados: reeducação alimentar, perda de gordura sem perda muscular, ganho de massa, restrição alimentar. Busca autonomia e praticidade na rotina.

### Coach Alimentar IA `pós-MVP · pago`

Coach baseado em inteligência artificial que auxilia o usuário na rotina alimentar com avisos, notificações, dicas e lembretes personalizados. Não entra no MVP.

---

## 3. Modelo de Negócio

| Fase | Modelo | Observação |
|---|---|---|
| MVP | Versão free | Possivelmente com anúncios |
| Pós-tração | Mensalidade + venda de dados | Dados anonimizados; ativada quando a base de usuários justificar |

*Métrica de sucesso principal: volume de usuários ativos.*

---

## 4. Funcionalidades — MVP

*Todas as funcionalidades abaixo são obrigatórias para o lançamento.*

### F0 — Autenticação e Onboarding

Cadastro e login com o menor atrito possível, seguido de coleta dos dados corporais para personalização.

**Cadastro**
- Nome ou apelido, e-mail e senha
- Login social via Google e Apple (obrigatório pela App Store)
- Recuperação de senha por e-mail
- Verificação de e-mail recomendada para garantir base de usuários reais

**Onboarding (logo após o cadastro)**
- Data de nascimento, sexo, altura e peso — obrigatórios
- Percentual de gordura e TMB — opcionais; se não informados, o app estima a TMB automaticamente
- Todos os dados editáveis depois, na tela de perfil

---

### F1 — Perfil do Usuário

Tela onde o usuário visualiza e edita todos os seus dados pessoais e corporais.

**Exibição na tela de perfil**
- Idade calculada automaticamente a partir da data de nascimento
- Sexo, altura, peso, % gordura e TMB
- Data de nascimento visível apenas no modo de edição

**Comportamento**
- O app recalcula as metas nutricionais automaticamente ao salvar qualquer alteração
- Todos os dados ficam salvos entre sessões

---

### F2 — Log Alimentar

O usuário registra o que comeu informando alimentos e quantidades. O app calcula os macros automaticamente.

**Como funciona**
- O usuário digita o alimento e a quantidade; o app associa ao item na base de dados nutricional
- Suporte a medidas caseiras (colher, xícara) e peso em gramas
- Retorno automático de calorias, proteína, gordura e carboidrato

**Organização**
- Log organizado por refeição (café, almoço, jantar, lanche) e por dia
- Edição e exclusão de itens registrados

---

### F3 — Relatório Nutricional

Visão consolidada do dia comparando o que o usuário consumiu com sua meta calórica.

**Dados exibidos**
- Meta calórica diária baseada na TMB
- Total de calorias ingeridas no dia
- Déficit ou superávit calórico
- Breakdown de macros: proteína, gordura e carboidrato (consumido vs. meta)

**Comportamento**
- Atualiza em tempo real conforme o log é preenchido
- Histórico consultável por data desde o cadastro

---

## 5. Fora do Escopo — MVP

- Integração com apps de academia, corrida, passos ou treino
- Perfil de coach alimentar IA e funcionalidades de acompanhamento
- Notificações e lembretes
- Plano pago e paywall
- Cadastro de alimentos personalizados pelo usuário

---

## 6. Restrições

| Dimensão | Definição |
|---|---|
| Prazo | 1 a 2 meses |
| Orçamento | R$ 10.000 |
| Plataforma | iOS e Android via React Native (uma base de código para as duas plataformas) |
| Distribuição | App Store + Google Play |
| LGPD | Sem exigências especiais no MVP |

---

## 7. Ideias para Validar com o Cliente

*Estas funcionalidades não foram discutidas na entrevista mas podem agregar valor. Listadas aqui para validação antes de entrar no escopo.*

### ? Definição de metas: manual vs. calculada

Permitir que o usuário escolha entre definir manualmente sua meta calórica diária ou deixar o app calcular uma meta com base nos dados corporais e objetivo (perder gordura, manter peso, ganhar massa). Baixo esforço de desenvolvimento, alto impacto na personalização.

### ? Registro de atividade física

Uma área simples onde o usuário informa se praticou atividade física (tipo e duração). O app estima o gasto calórico adicional com base no tipo de atividade, duração e peso — o mesmo método usado por apps como MyFitnessPal. Influencia o cálculo de déficit/superávit do dia.

---

*Documento gerado a partir de entrevista de requisitos — validar com o cliente antes de iniciar o desenvolvimento.*
