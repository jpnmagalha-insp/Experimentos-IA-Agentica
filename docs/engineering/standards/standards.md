# Engineering Standards

Padrões e boas práticas adotados pelo time de engenharia.

---

## Guia de Estilo de Código

- **TypeScript** obrigatório em todo código novo. Sem `any` explícito; prefira `unknown` quando o tipo for incerto.
- **Prettier** para formatação automática (configuração no repositório, sem sobrescrever por arquivo).
- **ESLint** com ruleset do time — nenhum warning deve ser ignorado com `// eslint-disable` sem comentário justificando.
- Funções puras e pequenas: uma responsabilidade por função, máximo de ~40 linhas antes de considerar extração.
- Evite comentários que apenas repetem o código; comente o _porquê_, não o _o quê_.

---

## Convenções de Nomenclatura

| Contexto                 | Convenção              | Exemplo                     |
| ------------------------ | ---------------------- | --------------------------- |
| Variáveis e funções      | `camelCase`            | `getUserData`               |
| Componentes React/RN     | `PascalCase`           | `DailyLogScreen`            |
| Arquivos de componentes  | `PascalCase.tsx`       | `FoodDetailScreen.tsx`      |
| Hooks customizados       | `use` + `PascalCase`   | `useDailyLog`               |
| Constantes globais       | `UPPER_SNAKE_CASE`     | `MAX_RETRY_COUNT`           |
| Tipos e interfaces       | `PascalCase`           | `AuthStore`, `UserProfile`  |
| CSS / NativeWind classes | Tailwind padrão        | —                           |
| Branches Git             | `tipo/descricao-curta` | `feat/food-search-debounce` |

---

## Padrões de Commits e Pull Requests

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição curta no imperativo>

[corpo opcional]

[rodapé opcional — ex: BREAKING CHANGE, closes #123]
```

**Tipos permitidos:**

| Tipo       | Quando usar                                 |
| ---------- | ------------------------------------------- |
| `feat`     | Nova funcionalidade                         |
| `fix`      | Correção de bug                             |
| `refactor` | Mudança de código sem alterar comportamento |
| `chore`    | Tarefas de manutenção (deps, config, CI)    |
| `test`     | Adição ou correção de testes                |
| `docs`     | Documentação                                |
| `perf`     | Melhoria de performance                     |
| `style`    | Formatação, sem mudança de lógica           |

**Exemplos:**

```
feat(food-search): add 300ms debounce to search input
fix(auth): clear tokens from SecureStore on logout
docs(readme): update local setup instructions
```

### Pull Requests

- Título segue o mesmo padrão de Conventional Commits.
- Descrição obrigatória com: **o quê** foi feito, **por quê**, e **como testar**.
- PRs devem ser pequenos e focados — evite misturar refactor com nova feature.
- Screenshots ou screen recordings para mudanças visuais.
- Branch base: `main` para hotfixes, `develop` para features.
- Delete a branch após merge.

---

## Code Review

### Quem revisa

- Mínimo de **1 aprovação** para PRs de manutenção/chore.
- Mínimo de **2 aprovações** para features e mudanças em fluxos críticos (auth, pagamento, dados do usuário).

### O que o revisor verifica

- Lógica e corretude — o código faz o que diz fazer?
- Cobertura de casos de erro e edge cases.
- Aderência aos padrões deste documento.
- Legibilidade — outro desenvolvedor entenderia sem contexto adicional?
- Segurança — dados sensíveis expostos? Inputs validados?

### Etiqueta de review

- Comentários construtivos, não pessoais. Prefira perguntas a afirmações.
- Distinguir bloqueadores de sugestões: use prefixos como `[blocker]`, `[nit]`, `[sugestão]`.
- Autor responde a todos os comentários antes de solicitar re-review.
- Aprovação não é obrigação de silêncio — deixe sugestões mesmo ao aprovar.

---

## Definição de "Pronto" (Definition of Done)

Um item está **pronto** quando:

- [ ] Código implementado e funcionando conforme o critério de aceite
- [ ] Testes escritos para lógica crítica (unitários e/ou integração)
- [ ] Sem warnings de lint ou erros de TypeScript
- [ ] Code review aprovado com o número mínimo de aprovações
- [ ] Branch atualizada com `develop` (sem conflitos)
- [ ] Documentação atualizada se houve mudança de contrato, fluxo ou configuração
- [ ] Testado em pelo menos um dispositivo iOS e um Android (para mudanças de UI)
