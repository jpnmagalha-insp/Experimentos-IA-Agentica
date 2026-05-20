# Regras de Domínio — App de Controle Nutricional

Regras de negócio específicas do domínio nutricional: fórmulas, conversões e cálculos que devem ser implementados de forma consistente no backend.

---

## 1. Cálculo da Taxa Metabólica Basal (TMB)

A TMB representa o consumo calórico mínimo diário em repouso. O app usa duas fórmulas dependendo dos dados disponíveis.

### Regra DR-01: Mifflin-St Jeor (sem percentual de gordura)

Usada quando o usuário **não informa** o percentual de gordura corporal.

```
Homem:  TMB = (10 × peso_kg) + (6.25 × altura_cm) − (5 × idade) + 5
Mulher: TMB = (10 × peso_kg) + (6.25 × altura_cm) − (5 × idade) − 161
```

**Exemplos**:
- Homem, 82kg, 178cm, 34 anos → TMB = 820 + 1122.5 − 170 + 5 = **1777.5 kcal**
- Mulher, 60kg, 165cm, 28 anos → TMB = 600 + 1031.25 − 140 − 161 = **1330.25 kcal**

### Regra DR-02: Katch-McArdle (com percentual de gordura)

Usada quando o usuário **informa** o percentual de gordura. Mais precisa pois considera a massa magra.

```
massa_magra_kg = peso_kg × (1 − (percentual_gordura / 100))
TMB = 370 + (21.6 × massa_magra_kg)
```

**Exemplo**:
- 82kg, 18% de gordura → massa_magra = 82 × 0.82 = 67.24kg → TMB = 370 + 1452.4 = **1822.4 kcal**

### Regra DR-03: Cálculo da idade

A idade é calculada dinamicamente a partir da data de nascimento, considerando se o aniversário já passou no ano atual.

```
idade = ano_atual − ano_nascimento − (aniversario_passou ? 0 : 1)
```

A idade usada no cálculo da TMB **sempre reflete a idade atual**, não a idade no momento do cadastro.

---

## 2. Metas de Macronutrientes

### Regra DR-04: Distribuição padrão de macros (MVP)

No MVP, as metas são calculadas com distribuição fixa baseada na TMB:

| Macro | % das calorias | kcal por grama |
|-------|---------------|----------------|
| Proteína | 30% | 4 kcal/g |
| Gordura | 25% | 9 kcal/g |
| Carboidrato | 45% | 4 kcal/g |

```
meta_calorica    = TMB (arredondado para inteiro)
meta_proteina_g  = round(TMB × 0.30 / 4)
meta_gordura_g   = round(TMB × 0.25 / 9)
meta_carboidrato_g = round(TMB × 0.45 / 4)
```

**Exemplo** (TMB = 1777 kcal):
- Proteína: round(1777 × 0.30 / 4) = round(133.3) = **133g**
- Gordura: round(1777 × 0.25 / 9) = round(49.4) = **49g**
- Carboidrato: round(1777 × 0.45 / 4) = round(200.0) = **200g**

### Regra DR-05: Recálculo automático de metas

As metas devem ser recalculadas **imediatamente** sempre que:
- O usuário salvar alterações no perfil (qualquer campo)
- O app detectar que é o aniversário do usuário (mudança de idade)

O histórico de metas é preservado — cada recálculo gera um novo registro em `nutritional_goals`.

---

## 3. Cálculo de Macros por Alimento

### Regra DR-06: Cálculo proporcional por gramagem

Os valores nutricionais na base TACO são expressos por 100g. O cálculo é proporcional:

```
fator = quantidade_g / 100
calorias  = calories_per_100g × fator
proteina  = protein_per_100g × fator
gordura   = fat_per_100g × fator
carboidrato = carb_per_100g × fator
```

Todos os valores são arredondados para 1 casa decimal (`Math.round(value × 10) / 10`).

**Exemplo**: Arroz branco cozido (128 kcal/100g), 150g:
- Fator: 1.5 → Calorias: 128 × 1.5 = **192.0 kcal**

### Regra DR-07: Conversão de medidas caseiras para gramas

Quando o usuário seleciona uma medida caseira (ex: "1 colher de sopa"), a conversão usa a tabela `food_measures`:

```
grams = quantidade_informada × food_measure.grams_equivalent
```

Em seguida, aplica-se a Regra DR-06 com `quantidade_g = grams`.

**Exemplos de medidas caseiras comuns**:

| Medida | Equivalência típica |
|--------|-------------------|
| 1 colher de sopa (líquidos) | 15 ml |
| 1 colher de sopa (sólidos) | ~15-25g (varia por alimento) |
| 1 colher de chá | 5g |
| 1 xícara de chá | 200ml / ~165-200g |
| 1 unidade (ovo) | ~50-60g |
| 1 fatia de pão | ~25-50g |

As medidas ficam cadastradas por alimento na tabela `food_measures`, importadas da TACO.

### Regra DR-08: Totais diários por refeição e dia

```
total_dia = SUM(calories) para todos os food_logs do user_id na log_date
total_refeicao = SUM(calories) para food_logs filtrados por meal_type
```

Os macros totais seguem a mesma lógica de SUM para `protein_g`, `fat_g`, `carb_g`.

Como os valores são **desnormalizados** no `food_log`, não há cálculo em runtime — apenas agregação.

---

## 4. Balanço Calórico

### Regra DR-09: Déficit e superávit

```
balanço = calorias_consumidas − meta_calorica
```

| Balanço | Status | UI |
|---------|--------|-----|
| balanço < -50 | `"deficit"` | Verde |
| balanço > +50 | `"surplus"` | Vermelho |
| -50 ≤ balanço ≤ +50 | `"on_target"` | Azul |

A margem de ±50 kcal evita oscilação de status por pequenas variações.

---

## 5. Validações de Dados Corporais

### Regra DR-10: Ranges válidos de entrada

| Campo | Mínimo | Máximo | Unidade |
|-------|--------|--------|---------|
| Peso | 30 | 300 | kg |
| Altura | 100 | 250 | cm |
| % Gordura | 3 | 70 | % |
| Data de nascimento | — | hoje − 10 anos | data |
| Data de nascimento | hoje − 120 anos | — | data |

Valores fora desses ranges devem ser rejeitados com erro 400 na API.

---

## 6. Busca de Alimentos

### Regra DR-11: Busca textual insensível a maiúsculas e acentos

A busca deve encontrar "arroz" ao digitar "Arroz", "ARROZ" ou "arroz". Em PostgreSQL:

```sql
SELECT * FROM foods
WHERE unaccent(lower(name)) ILIKE unaccent(lower('%' || $query || '%'))
ORDER BY
  CASE WHEN lower(name) = lower($query) THEN 0 ELSE 1 END,
  name
LIMIT $limit
```

Requer a extensão `unaccent` habilitada no PostgreSQL (`CREATE EXTENSION unaccent`).

A busca só é disparada com mínimo de **2 caracteres** e debounce de **300ms** no frontend.
