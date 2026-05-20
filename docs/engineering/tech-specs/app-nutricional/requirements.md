# Requirements — App de Controle Nutricional

## Introdução

Aplicativo mobile cross-platform (iOS e Android) para controle preciso de calorias e macronutrientes com base nos parâmetros corporais individuais do usuário. Resolve a falta de precisão e personalização dos apps de nutrição existentes no mercado (FatSecret, Noom, Simple).

---

## Requirement 1 — Autenticação

**User Story:** Como visitante, quero criar uma conta com e-mail/senha ou login social, para que eu possa acessar o app com segurança e persistir meus dados entre sessões.

#### Critérios de Aceite

1. WHEN o usuário preenche nome, e-mail e senha válidos THEN o sistema SHALL criar a conta e enviar e-mail de verificação
2. WHEN o usuário tenta cadastrar com e-mail já existente THEN o sistema SHALL exibir "E-mail já cadastrado" sem revelar dados
3. WHEN o usuário toca em "Entrar com Google" THEN o sistema SHALL iniciar o fluxo OAuth2 do Google e criar/autenticar a conta
4. WHEN o usuário toca em "Entrar com Apple" THEN o sistema SHALL iniciar o fluxo OAuth2 da Apple e criar/autenticar a conta (obrigatório App Store)
5. WHEN o usuário informa e-mail cadastrado na recuperação de senha THEN o sistema SHALL enviar link de redefinição
6. WHEN o usuário informa e-mail não cadastrado na recuperação THEN o sistema SHALL exibir mensagem genérica sem confirmar existência do e-mail
7. WHEN a sessão do usuário expira THEN o sistema SHALL redirecionar para a tela de login preservando a rota de destino

---

## Requirement 2 — Onboarding

**User Story:** Como novo usuário, quero informar meus dados corporais logo após o cadastro, para que o app calcule uma meta calórica personalizada antes de eu começar a usar.

#### Critérios de Aceite

1. WHEN o usuário completa o cadastro pela primeira vez THEN o sistema SHALL exibir o fluxo de onboarding antes da tela principal
2. WHEN o usuário informa data de nascimento, sexo, altura e peso THEN o sistema SHALL habilitar o botão de continuar
3. IF o usuário não informa percentual de gordura THEN o sistema SHALL calcular a TMB pela fórmula de Mifflin-St Jeor
4. IF o usuário informa percentual de gordura THEN o sistema SHALL calcular a TMB pela fórmula de Katch-McArdle
5. WHEN o usuário confirma o onboarding THEN o sistema SHALL salvar o perfil, calcular as metas de macros e redirecionar para a tela principal
6. WHEN o usuário já completou o onboarding em sessões anteriores THEN o sistema SHALL pular o fluxo de onboarding

---

## Requirement 3 — Perfil do Usuário

**User Story:** Como usuário cadastrado, quero visualizar e editar meus dados corporais a qualquer momento, para que minhas metas nutricionais reflitam mudanças no meu corpo.

#### Critérios de Aceite

1. WHEN o usuário acessa a tela de perfil THEN o sistema SHALL exibir sexo, altura, peso, % gordura e TMB calculada
2. WHEN o usuário está no modo de visualização THEN o sistema SHALL exibir a idade calculada (sem mostrar a data de nascimento)
3. WHEN o usuário entra no modo de edição THEN o sistema SHALL exibir a data de nascimento editável
4. WHEN o usuário salva alterações no perfil THEN o sistema SHALL recalcular a TMB e as metas de macronutrientes automaticamente
5. WHILE o usuário está autenticado THEN o sistema SHALL manter todos os dados do perfil persistidos entre sessões

---

## Requirement 4 — Log Alimentar

**User Story:** Como usuário, quero registrar os alimentos que comi informando nome e quantidade, para que o app calcule automaticamente meus macronutrientes do dia.

#### Critérios de Aceite

1. WHEN o usuário digita o nome de um alimento THEN o sistema SHALL exibir sugestões da base TACO em tempo real (debounce de 300ms)
2. WHEN o usuário seleciona um alimento e informa a quantidade em gramas THEN o sistema SHALL calcular e exibir calorias, proteína, gordura e carboidrato
3. WHEN o usuário informa a quantidade em medida caseira (ex: "1 colher de sopa") THEN o sistema SHALL converter para gramas e calcular os macros correspondentes
4. WHEN o usuário confirma o registro THEN o sistema SHALL associá-lo à refeição selecionada (café, almoço, jantar, lanche) e à data atual
5. WHEN o usuário edita a quantidade de um item do log THEN o sistema SHALL recalcular os macros daquele item e atualizar os totais do dia
6. WHEN o usuário exclui um item do log THEN o sistema SHALL remover o item e recalcular os totais do dia imediatamente
7. WHEN o usuário navega para uma data anterior THEN o sistema SHALL exibir os logs daquele dia organizados por refeição
8. IF o alimento buscado não existir na base THEN o sistema SHALL informar que o alimento não foi encontrado

---

## Requirement 5 — Relatório Nutricional

**User Story:** Como usuário, quero ver um resumo comparando o que consumi com minha meta diária, para que eu possa tomar decisões alimentares conscientes ao longo do dia.

#### Critérios de Aceite

1. WHEN o usuário acessa a tela principal THEN o sistema SHALL exibir: meta calórica, total consumido, déficit/superávit e breakdown de macros (consumido vs. meta)
2. WHEN o usuário adiciona, edita ou remove um item do log THEN o sistema SHALL atualizar o relatório em tempo real
3. WHEN o total de calorias consumidas supera a meta THEN o sistema SHALL indicar visualmente o superávit (ex: cor vermelha)
4. WHEN o total de calorias consumidas está abaixo da meta THEN o sistema SHALL indicar visualmente o déficit (ex: cor verde)
5. WHEN o usuário navega para uma data anterior THEN o sistema SHALL exibir o relatório histórico daquele dia
6. WHERE o breakdown de macros THEN o sistema SHALL exibir barras de progresso para proteína, gordura e carboidrato com valores em gramas
