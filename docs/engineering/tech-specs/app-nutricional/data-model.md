# Modelo de Dados — App de Controle Nutricional

## Diagrama ER

```mermaid
erDiagram
    USER ||--o| USER_PROFILE : "tem"
    USER ||--o{ FOOD_LOG : "registra"
    USER ||--o{ NUTRITIONAL_GOAL : "possui histórico"
    FOOD ||--o{ FOOD_LOG : "referenciado em"
    FOOD ||--o{ FOOD_MEASURE : "tem medidas"
    FOOD_MEASURE ||--o{ FOOD_LOG : "usada em"

    USER {
        uuid id PK
        string name
        string email UK
        string password_hash "nullable (OAuth)"
        string provider "email|google|apple"
        string provider_id "nullable"
        boolean email_verified
        timestamp created_at
        timestamp updated_at
    }

    USER_PROFILE {
        uuid id PK
        uuid user_id FK UK
        date birth_date
        enum sex "male|female"
        float height_cm
        float weight_kg
        float body_fat_percent "nullable"
        float tmb
        timestamp updated_at
    }

    NUTRITIONAL_GOAL {
        uuid id PK
        uuid user_id FK
        int calories
        float protein_g
        float fat_g
        float carb_g
        timestamp calculated_at
    }

    FOOD {
        uuid id PK
        string name
        string taco_id UK "nullable"
        float calories_per_100g
        float protein_per_100g
        float fat_per_100g
        float carb_per_100g
        string category "nullable"
    }

    FOOD_MEASURE {
        uuid id PK
        uuid food_id FK
        string description "ex: colher de sopa"
        float grams_equivalent
    }

    FOOD_LOG {
        uuid id PK
        uuid user_id FK
        uuid food_id FK
        date log_date
        enum meal_type "breakfast|lunch|dinner|snack"
        float quantity
        string unit "g|ml|measure"
        uuid food_measure_id FK "nullable"
        float calories "desnormalizado"
        float protein_g "desnormalizado"
        float fat_g "desnormalizado"
        float carb_g "desnormalizado"
        timestamp created_at
    }
```

---

## Schema Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String            @id @default(uuid())
  name          String
  email         String            @unique
  passwordHash  String?           @map("password_hash")
  provider      String            @default("email")
  providerId    String?           @map("provider_id")
  emailVerified Boolean           @default(false) @map("email_verified")
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")
  profile       UserProfile?
  foodLogs      FoodLog[]
  goals         NutritionalGoal[]

  @@map("users")
}

model UserProfile {
  id             String   @id @default(uuid())
  userId         String   @unique @map("user_id")
  birthDate      DateTime @map("birth_date") @db.Date
  sex            Sex
  heightCm       Float    @map("height_cm")
  weightKg       Float    @map("weight_kg")
  bodyFatPercent Float?   @map("body_fat_percent")
  tmb            Float
  updatedAt      DateTime @updatedAt @map("updated_at")
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model NutritionalGoal {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  calories     Int
  proteinG     Float    @map("protein_g")
  fatG         Float    @map("fat_g")
  carbG        Float    @map("carb_g")
  calculatedAt DateTime @default(now()) @map("calculated_at")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("nutritional_goals")
}

model Food {
  id              String        @id @default(uuid())
  name            String
  tacoId          String?       @unique @map("taco_id")
  caloriesPer100g Float         @map("calories_per_100g")
  proteinPer100g  Float         @map("protein_per_100g")
  fatPer100g      Float         @map("fat_per_100g")
  carbPer100g     Float         @map("carb_per_100g")
  category        String?
  measures        FoodMeasure[]
  logs            FoodLog[]

  @@index([name])
  @@map("foods")
}

model FoodMeasure {
  id              String    @id @default(uuid())
  foodId          String    @map("food_id")
  description     String
  gramsEquivalent Float     @map("grams_equivalent")
  food            Food      @relation(fields: [foodId], references: [id], onDelete: Cascade)
  logs            FoodLog[]

  @@map("food_measures")
}

model FoodLog {
  id            String       @id @default(uuid())
  userId        String       @map("user_id")
  foodId        String       @map("food_id")
  logDate       DateTime     @map("log_date") @db.Date
  mealType      MealType     @map("meal_type")
  quantity      Float
  unit          String       @default("g")
  foodMeasureId String?      @map("food_measure_id")
  calories      Float
  proteinG      Float        @map("protein_g")
  fatG          Float        @map("fat_g")
  carbG         Float        @map("carb_g")
  createdAt     DateTime     @default(now()) @map("created_at")
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  food          Food         @relation(fields: [foodId], references: [id])
  foodMeasure   FoodMeasure? @relation(fields: [foodMeasureId], references: [id])

  @@index([userId, logDate])
  @@map("food_logs")
}

enum Sex {
  male
  female
}

enum MealType {
  breakfast
  lunch
  dinner
  snack
}
```

---

## Decisões de Modelagem

### Macros desnormalizados no `food_log`
Os campos `calories`, `protein_g`, `fat_g` e `carb_g` são calculados no momento do registro e gravados diretamente no log. Isso:
- Simplifica queries de relatório (sem JOIN + cálculo dinâmico)
- Preserva o histórico se o dado do alimento for corrigido futuramente
- Permite consultar totais com um único `SUM` sem lógica extra

### `NutritionalGoal` com histórico
Cada atualização de perfil gera um novo registro em `nutritional_goals` ao invés de sobrescrever. O app sempre usa o mais recente (`ORDER BY calculated_at DESC LIMIT 1`). Permite rastrear a evolução das metas.

### `UserProfile` separado de `User`
Separa dados de identidade (auth) de dados corporais (domínio nutricional). Facilita OAuth onde o usuário existe sem ter completado o onboarding (`profile` é nullable).

### Índices
- `foods(name)`: buscas textuais por nome de alimento
- `food_logs(user_id, log_date)`: consultas de relatório diário por usuário

---

## Convenções

| Tipo | Convenção |
|------|-----------|
| IDs | UUIDs v4 |
| Timestamps | UTC, timezone-aware |
| Nomes de tabela | `snake_case`, plural |
| Nomes de coluna | `snake_case` |
| Pesos e medidas | Sistema métrico (kg, cm, g) |
| Datas de log | `DATE` sem hora (dia do usuário, não UTC timestamp) |
