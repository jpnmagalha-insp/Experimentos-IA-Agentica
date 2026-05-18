# Testes E2E — Critérios de Aceite (BDD)

Cenários escritos em Gherkin. Implementados com **Detox** (React Native e2e) para fluxos de UI e **Supertest + Vitest** para fluxos de API.

---

## Feature: Autenticação

### Cenário: Cadastro com e-mail e senha
```gherkin
Feature: Cadastro de novo usuário

  Scenario: Cadastro bem-sucedido
    Given o usuário está na tela de cadastro
    When ele preenche nome "João Silva", e-mail "joao@email.com" e senha "MinhaSenh@123"
    And toca no botão "Criar conta"
    Then ele deve ser redirecionado para o onboarding
    And um e-mail de verificação deve ser enviado para "joao@email.com"

  Scenario: Cadastro com e-mail já existente
    Given existe uma conta com o e-mail "joao@email.com"
    When o usuário tenta cadastrar com o mesmo e-mail
    Then deve ver a mensagem "E-mail já cadastrado"
    And permanecer na tela de cadastro

  Scenario: Cadastro com senha fraca
    Given o usuário está na tela de cadastro
    When ele preenche a senha "123"
    Then o botão "Criar conta" deve estar desabilitado
    And deve ver a mensagem de validação de senha
```

### Cenário: Login com e-mail e senha
```gherkin
Feature: Login de usuário

  Scenario: Login bem-sucedido
    Given existe uma conta com e-mail "joao@email.com" e senha "MinhaSenh@123"
    When o usuário preenche as credenciais corretas e toca "Entrar"
    Then deve ser redirecionado para a tela principal (DailyLog)

  Scenario: Login com credenciais erradas
    Given existe uma conta com e-mail "joao@email.com"
    When o usuário informa a senha incorreta
    Then deve ver a mensagem "E-mail ou senha incorretos"
    And permanecer na tela de login

  Scenario: Sessão expirada
    Given o usuário está autenticado e o access token expirou
    When ele tenta acessar qualquer tela protegida
    Then o app deve silenciosamente renovar o token via refresh token
    And redirecionar para a tela de login somente se o refresh token também expirou
```

---

## Feature: Onboarding

### Cenário: Preenchimento de dados corporais
```gherkin
Feature: Onboarding de novo usuário

  Scenario: Onboarding completo sem percentual de gordura
    Given o usuário acabou de se cadastrar
    When ele preenche data de nascimento "1990-05-15", sexo "masculino", altura "178cm" e peso "82kg"
    And pula o campo de percentual de gordura
    And toca "Confirmar"
    Then deve ser redirecionado para a tela principal
    And a TMB deve ser calculada pela fórmula Mifflin-St Jeor
    And a meta calórica deve estar visível na tela principal

  Scenario: Onboarding com percentual de gordura informado
    Given o usuário está no onboarding
    When ele preenche todos os dados e informa "18%" de gordura corporal
    And toca "Confirmar"
    Then a TMB deve ser calculada pela fórmula Katch-McArdle

  Scenario: Tentativa de avançar sem preencher campos obrigatórios
    Given o usuário está no onboarding
    When ele toca "Continuar" sem preencher a altura
    Then o botão deve permanecer desabilitado
    And o campo altura deve ser destacado com indicação de obrigatoriedade
```

---

## Feature: Log Alimentar

### Cenário: Registro de alimento em gramas
```gherkin
Feature: Registro de alimento no log diário

  Scenario: Adicionar alimento por gramagem
    Given o usuário está na tela principal do dia atual
    When ele toca "+ Add" na seção "Almoço"
    And digita "arroz branco" no campo de busca
    Then deve ver uma lista de sugestões contendo "Arroz, branco, cozido"
    When ele seleciona "Arroz, branco, cozido"
    And informa "150" gramas
    Then deve ver o preview "192 kcal · P: 3.8g · G: 0.3g · C: 42.2g"
    When toca "Adicionar ao log"
    Then o item deve aparecer na seção "Almoço" com os macros corretos
    And o total de calorias do dia deve ser atualizado

  Scenario: Adicionar alimento por medida caseira
    Given o usuário está adicionando "Azeite de oliva"
    When ele seleciona a unidade "colher de sopa" (13g)
    And informa quantidade "2"
    Then o preview deve mostrar os macros equivalentes a 26g de azeite

  Scenario: Busca sem resultados
    Given o usuário está na tela de busca de alimentos
    When ele digita "xyzabc123"
    Then deve ver a mensagem "Nenhum alimento encontrado"

  Scenario: Editar quantidade de item registrado
    Given existe um log de "Ovo frito 60g" no café da manhã
    When o usuário toca no item e altera a quantidade para "90g"
    And confirma a alteração
    Then os macros do item devem ser recalculados para 90g
    And o total do dia deve ser atualizado

  Scenario: Excluir item do log
    Given existe um log de "Pão francês 50g" no café da manhã
    When o usuário faz swipe-to-delete no item e confirma
    Then o item deve ser removido da lista
    And o total de calorias do dia deve diminuir proporcionalmente
```

---

## Feature: Relatório Nutricional

### Cenário: Visualização do relatório diário
```gherkin
Feature: Relatório nutricional do dia

  Scenario: Relatório com déficit calórico
    Given o usuário tem meta de 2300 kcal
    And registrou alimentos totalizando 1450 kcal no dia
    When ele acessa a aba "Relatório"
    Then deve ver "1450 / 2300 kcal"
    And a indicação "-850 kcal (déficit)" em verde
    And barras de progresso para proteína, gordura e carboidrato

  Scenario: Relatório com superávit calórico
    Given o usuário tem meta de 2300 kcal
    And registrou alimentos totalizando 2600 kcal
    When ele acessa a aba "Relatório"
    Then deve ver a indicação "+300 kcal (superávit)" em vermelho

  Scenario: Consulta de relatório histórico
    Given o usuário tem logs registrados em "2025-01-10"
    When ele navega para a data "10 de Janeiro" no relatório
    Then deve ver o resumo correto daquele dia

  Scenario: Relatório de dia sem registros
    Given o usuário não tem logs em "2025-01-01"
    When ele navega para essa data
    Then deve ver "0 / 2300 kcal" e todos os macros em zero
```

---

## Feature: Perfil do Usuário

### Cenário: Atualização de dados corporais
```gherkin
Feature: Edição de perfil

  Scenario: Atualizar peso recalcula metas
    Given o usuário está na tela de edição de perfil
    And o perfil atual tem peso "82kg"
    When ele altera o peso para "80kg" e salva
    Then a TMB deve ser recalculada
    And a meta calórica na tela principal deve refletir o novo valor

  Scenario: Visualização de idade calculada
    Given o usuário nasceu em "1990-05-15"
    When ele acessa a tela de perfil (modo visualização)
    Then deve ver "35 anos" (calculado a partir da data de nascimento)
    And não deve ver a data de nascimento diretamente

  Scenario: Data de nascimento visível apenas no modo de edição
    Given o usuário está no modo de visualização do perfil
    When ele toca em "Editar"
    Then o campo "Data de nascimento" deve se tornar visível e editável
```

---

## Cenários de Borda

```gherkin
Feature: Cenários de borda

  Scenario: Usuário tenta acessar rota protegida sem login
    Given o usuário não está autenticado
    When ele tenta acessar a tela principal diretamente
    Then deve ser redirecionado para a tela de login

  Scenario: Busca de alimento com debounce
    Given o usuário está na tela de busca
    When ele digita "arr" rapidamente letra por letra
    Then a API deve ser consultada apenas após 300ms da última tecla
    And não deve disparar múltiplas requisições desnecessárias

  Scenario: Sem conexão à internet
    Given o usuário está offline
    When ele tenta adicionar um alimento
    Then deve ver um aviso "Sem conexão. Tente novamente."
    And os dados do cache devem permanecer visíveis em modo somente-leitura
```
