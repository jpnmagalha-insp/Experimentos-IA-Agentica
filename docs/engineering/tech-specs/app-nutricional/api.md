# API — App de Controle Nutricional

## Convenções

- **Base URL**: `https://api.appnutricional.com/v1`
- **Formato**: JSON em todas as requisições e respostas
- **Autenticação**: Bearer token JWT no header `Authorization`
- **Datas**: ISO 8601 (`YYYY-MM-DD` para datas, `YYYY-MM-DDTHH:mm:ssZ` para timestamps)
- **Erros**: sempre retornam `{ error: string, details?: object }`
- **Paginação**: `?page=1&limit=20` onde aplicável

---

## Autenticação

### POST `/auth/register`
Cria uma nova conta com e-mail e senha.

**Request**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "MinhaSenh@123"
}
```

**Response 201**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "name": "João Silva", "email": "joao@email.com" }
}
```

**Erros**: `400` validação | `409` e-mail já cadastrado

---

### POST `/auth/login`
Autentica com e-mail e senha.

**Request**
```json
{ "email": "joao@email.com", "password": "MinhaSenh@123" }
```

**Response 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "name": "João Silva", "email": "joao@email.com" }
}
```

**Erros**: `400` validação | `401` credenciais inválidas

---

### POST `/auth/google`
Autentica ou cria conta via Google OAuth2.

**Request**
```json
{ "idToken": "google_id_token_from_expo_auth" }
```

**Response 200**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "name": "João", "email": "joao@gmail.com" },
  "isNewUser": true
}
```

---

### POST `/auth/apple`
Autentica ou cria conta via Apple OAuth2.

**Request**
```json
{
  "identityToken": "apple_identity_token",
  "authorizationCode": "apple_auth_code",
  "fullName": { "givenName": "João", "familyName": "Silva" }
}
```

**Response 200** — mesmo formato do Google

---

### POST `/auth/refresh`
Renova o access token usando o refresh token.

**Request**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200**
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

**Erros**: `401` refresh token inválido ou expirado

---

### POST `/auth/forgot-password`
Envia link de redefinição de senha por e-mail.

**Request**
```json
{ "email": "joao@email.com" }
```

**Response 200** — sempre retorna sucesso (sem revelar se o e-mail existe)
```json
{ "message": "Se o e-mail estiver cadastrado, você receberá as instruções." }
```

---

## Perfil do Usuário

> Todas as rotas abaixo requerem autenticação (`Authorization: Bearer <token>`).

### GET `/users/me`
Retorna os dados do usuário autenticado.

**Response 200**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "emailVerified": true,
  "profile": {
    "birthDate": "1990-05-15",
    "sex": "male",
    "heightCm": 178,
    "weightKg": 82.5,
    "bodyFatPercent": 18.0,
    "tmb": 1920,
    "age": 35
  },
  "currentGoal": {
    "calories": 2300,
    "proteinG": 165,
    "fatG": 77,
    "carbG": 230
  }
}
```

---

### PUT `/users/me/profile`
Atualiza os dados corporais do usuário. Recalcula TMB e metas automaticamente.

**Request**
```json
{
  "birthDate": "1990-05-15",
  "sex": "male",
  "heightCm": 178,
  "weightKg": 80.0,
  "bodyFatPercent": null
}
```

**Response 200**
```json
{
  "profile": { "heightCm": 178, "weightKg": 80.0, "tmb": 1897, "...": "..." },
  "currentGoal": { "calories": 2277, "proteinG": 160, "fatG": 76, "carbG": 228 }
}
```

**Erros**: `400` validação (altura/peso fora de range, data futura, etc.)

---

## Alimentos

### GET `/foods/search`
Busca alimentos na base TACO por nome.

**Query Params**: `q` (obrigatório, mínimo 2 chars) | `limit` (default 10, máx 30)

**Response 200**
```json
{
  "foods": [
    {
      "id": "uuid",
      "name": "Arroz, branco, cozido",
      "caloriesPer100g": 128,
      "proteinPer100g": 2.5,
      "fatPer100g": 0.2,
      "carbPer100g": 28.1,
      "category": "Cereais e derivados",
      "measures": [
        { "id": "uuid", "description": "colher de sopa cheia", "gramsEquivalent": 25 },
        { "id": "uuid", "description": "xícara de chá", "gramsEquivalent": 165 }
      ]
    }
  ]
}
```

---

### GET `/foods/:id`
Retorna os detalhes completos de um alimento.

**Response 200** — mesmo formato de um item de `/foods/search`

**Erros**: `404` alimento não encontrado

---

## Log Alimentar

### GET `/logs`
Lista os logs do dia (ou de uma data específica).

**Query Params**: `date` (YYYY-MM-DD, default: hoje)

**Response 200**
```json
{
  "date": "2025-01-15",
  "meals": {
    "breakfast": [
      {
        "id": "uuid",
        "food": { "id": "uuid", "name": "Ovo, galinha, inteiro, frito" },
        "quantity": 60,
        "unit": "g",
        "calories": 93,
        "proteinG": 7.5,
        "fatG": 6.8,
        "carbG": 0.0
      }
    ],
    "lunch": [],
    "dinner": [],
    "snack": []
  },
  "totals": {
    "calories": 93,
    "proteinG": 7.5,
    "fatG": 6.8,
    "carbG": 0.0
  }
}
```

---

### POST `/logs`
Registra um alimento no log.

**Request**
```json
{
  "foodId": "uuid",
  "mealType": "lunch",
  "quantity": 150,
  "unit": "g",
  "foodMeasureId": null,
  "date": "2025-01-15"
}
```

*Para medidas caseiras, enviar `unit: "measure"` e `foodMeasureId` com o ID da medida selecionada.*

**Response 201**
```json
{
  "id": "uuid",
  "foodId": "uuid",
  "mealType": "lunch",
  "quantity": 150,
  "unit": "g",
  "calories": 192,
  "proteinG": 3.75,
  "fatG": 0.3,
  "carbG": 42.15
}
```

**Erros**: `400` validação | `404` alimento não encontrado

---

### PUT `/logs/:id`
Atualiza a quantidade de um item do log.

**Request**
```json
{ "quantity": 200, "unit": "g" }
```

**Response 200** — item atualizado com macros recalculados

**Erros**: `403` log de outro usuário | `404` log não encontrado

---

### DELETE `/logs/:id`
Remove um item do log.

**Response 204** No Content

**Erros**: `403` log de outro usuário | `404` log não encontrado

---

## Relatório

### GET `/reports/daily`
Retorna o resumo nutricional do dia comparado às metas.

**Query Params**: `date` (YYYY-MM-DD, default: hoje)

**Response 200**
```json
{
  "date": "2025-01-15",
  "goal": {
    "calories": 2300,
    "proteinG": 165,
    "fatG": 77,
    "carbG": 230
  },
  "consumed": {
    "calories": 1450,
    "proteinG": 98,
    "fatG": 52,
    "carbG": 145
  },
  "balance": {
    "calories": -850,
    "status": "deficit"
  },
  "progress": {
    "calories": 0.63,
    "proteinG": 0.59,
    "fatG": 0.68,
    "carbG": 0.63
  }
}
```

`balance.status`: `"deficit"` | `"surplus"` | `"on_target"` (±50 kcal)

---

## Códigos de Erro Padrão

| Código | Significado |
|--------|-------------|
| `400` | Dados de entrada inválidos (detalhes no campo `details`) |
| `401` | Não autenticado ou token expirado |
| `403` | Autenticado mas sem permissão para o recurso |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: e-mail duplicado) |
| `500` | Erro interno do servidor |
