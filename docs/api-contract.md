# Contrato de API — RicoQuiz+

Este documento describe la parte de la API de RicoQuiz+ que consume el cliente Angular: los endpoints, los modelos de datos y las respuestas de error.

- **Fuente de datos:** API propia (Node.js, Express, TypeScript, MongoDB/Mongoose), repo [andresjuar/RicoQuizPlus](https://github.com/andresjuar/RicoQuizPlus).
- **Base URL (producción):** `https://proyecto-final-servidor-k6wl.onrender.com`
- **Base URL (local):** `http://localhost:3000`
- **Especificación OpenAPI 3.0 completa:** [`openapi.json`](./openapi.json). También está en [Swagger UI](https://proyecto-final-servidor-k6wl.onrender.com/api-docs).
- **En el cliente:** la URL base sale de `environment.apiUrl`, los modelos están en `src/app/shared/models/` y las llamadas en `src/app/shared/services/`.

## Índice

1. [Convenciones](#1-convenciones)
2. [Modelos de datos](#2-modelos-de-datos)
3. [Endpoints](#3-endpoints)
   - [Autenticación](#31-autenticación)
   - [Quizzes](#32-quizzes)
   - [Partidas](#33-partidas)
4. [Errores](#4-errores)

---

## 1. Convenciones

| Tema | Regla |
| --- | --- |
| Formato | Peticiones y respuestas en JSON (`Content-Type: application/json`) |
| Autenticación | JWT en el header `Authorization: Bearer <token>`. Lo agrega `authInterceptor` en el cliente |
| Identificadores | `_id` de MongoDB (ObjectId, 24 caracteres hexadecimales) |
| Fechas | ISO 8601 (`2026-11-01T18:30:00.000Z`) |
| Paginación | Query params `page` (desde 1, por defecto 1) y `limit` (por defecto 10, máximo 50). La respuesta es un [`Page<T>`](#paget) |
| CORS | Solo se aceptan los orígenes de `CORS_ORIGIN` en la API: el dominio de Netlify, sus deploy previews y `http://localhost:4200` |
| Disponibilidad | Render gratuito se duerme tras un rato sin uso; la primera petición puede tardar hasta un minuto. `GET /health` responde `{ "status": "ok" }` cuando el servidor está arriba |

**Columna "Auth" en las tablas:**
- **—**: no requiere token.
- **Bearer**: requiere token válido; sin él responde 401.
- **Bearer (dueño)**: además, el recurso debe pertenecer al usuario del token; si no, responde 403.
- **Opcional**: funciona sin token; con token, además puede ver sus quizzes privados.

---

## 2. Modelos de datos

Las reglas de cada campo son las que valida la API (Mongoose). El cliente aplica las mismas en sus formularios.

### User

Usuario de la plataforma. La API nunca regresa `password` ni `googleId`.

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `_id` | string | — |
| `email` | string | Obligatorio, único, formato de correo, se guarda en minúsculas |
| `displayName` | string | Obligatorio, 2 a 50 caracteres |
| `avatarUrl` | string | Opcional. En cuentas de Google, la foto de perfil |
| `isActive` | boolean | `false` hasta activar por correo (solo si `REQUIRE_EMAIL_ACTIVATION=true`) |
| `authProvider` | `"local"` \| `"google"` | `local` = correo y contraseña; `google` = creada con Google (sin contraseña) |
| `createdAt` | string (fecha) | — |

### AuthResponse

Lo que regresan `POST /auth/login` y `POST /auth/google`.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "6a54...",
    "email": "andres@example.com",
    "displayName": "Andres",
    "avatarUrl": "",
    "isActive": true,
    "authProvider": "local",
    "createdAt": "2026-11-01T18:30:00.000Z"
  }
}
```

### RegisterResponse

Lo que regresa `POST /auth/register`. Trae `token` solo cuando la API no exige activación por correo.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `message` | string | Texto para el usuario |
| `requiresActivation` | boolean | `true` si hay que activar la cuenta por correo antes del login |
| `user` | [User](#user) | — |
| `token` | string | Solo si `requiresActivation` es `false` |

### Question

Pregunta de un quiz. No tiene `_id` propio; se identifica por su posición en `questions`.

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `question` | string | Obligatorio |
| `imageUrl` | string | Opcional |
| `options` | string[] | Obligatorio, al menos 2. El cliente permite de 2 a 4 y no deja repetir opciones (`uniqueOptions`) |
| `correctIndex` | number | Obligatorio, entero, debe apuntar a una opción existente (`0 ≤ correctIndex < options.length`) |
| `timeLimitSeconds` | number | 5 a 120; por defecto 20 |

### Quiz

Quiz completo, con preguntas. Lo regresan `GET /quizzes/:id`, `POST /quizzes` y `PUT /quizzes/:id`.

| Campo | Tipo | Reglas |
| --- | --- | --- |
| `_id` | string | — |
| `title` | string | Obligatorio, 3 a 100 caracteres |
| `description` | string | Máximo 500 caracteres; por defecto `""` |
| `coverImageUrl` | string | Por defecto `""` |
| `owner` | `{ _id, displayName, avatarUrl }` | Lo asigna la API con el usuario del token; llega poblado en `GET /quizzes/:id` |
| `topic` | string | Por defecto `""`. El cliente lo exige |
| `generatedByAI` | boolean | Por defecto `false` |
| `isPublic` | boolean | Por defecto `false`. Solo los públicos aparecen en `GET /quizzes` |
| `tags` | string[] | Por defecto `[]` |
| `timesPlayed` | number | ≥ 0; lo actualiza la API al terminar partidas |
| `questions` | [Question](#question)[] | Obligatorio, al menos 1 |
| `createdAt`, `updatedAt` | string (fecha) | — |

### QuizSummary

Quiz en listados (`GET /quizzes`, `GET /quizzes/mine`). **No trae `questions`**, para no exponer las respuestas correctas y para que las páginas pesen menos. En su lugar trae conteos.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `_id`, `title`, `description`, `coverImageUrl`, `topic`, `tags`, `isPublic`, `timesPlayed`, `createdAt`, `updatedAt` | — | Igual que en [Quiz](#quiz) |
| `owner` | `{ _id, displayName, avatarUrl }` | Poblado |
| `questionCount` | number | Número de preguntas |
| `totalSeconds` | number | Suma de `timeLimitSeconds` de todas las preguntas |

### QuizDraft

Cuerpo que manda el cliente en `POST /quizzes` y `PUT /quizzes/:id`.

```json
{
  "title": "Misterios del cosmos",
  "description": "Planetas, estrellas y agujeros negros.",
  "topic": "Ciencia",
  "isPublic": true,
  "tags": ["espacio", "planetas"],
  "questions": [
    {
      "question": "¿Cuál es el planeta más grande del sistema solar?",
      "options": ["Saturno", "Júpiter", "Neptuno", "Tierra"],
      "correctIndex": 1,
      "timeLimitSeconds": 20
    }
  ]
}
```

En `PUT` solo se actualizan los campos que vengan en el cuerpo (`title`, `description`, `coverImageUrl`, `topic`, `isPublic`, `tags`, `questions`); el resto se ignora.

### Page\<T>

Envoltura de todas las respuestas paginadas.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `data` | T[] | Elementos de la página |
| `total` | number | Total de elementos que cumplen el filtro |
| `page` | number | Página actual (desde 1) |
| `limit` | number | Tamaño de página |
| `totalPages` | number | `ceil(total / limit)`. No viene en el historial de partidas |

### Match y MatchPlayer

Partida guardada al terminar un juego por Socket.io. El cliente solo la lee en el historial.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `_id` | string | — |
| `quiz` | `{ _id, title }` | Poblado en `GET /matches/user/:userId` |
| `host` | string | `_id` del usuario anfitrión |
| `roomCode` | string | Código de 4 letras, en mayúsculas |
| `status` | `"waiting"` \| `"in_progress"` \| `"finished"` \| `"cancelled"` | — |
| `startedAt`, `finishedAt` | string (fecha) \| null | — |
| `players` | MatchPlayer[] | `{ user?, guestName?, score, correctAnswers }`; `user` es el `_id` si jugó con sesión |
| `createdAt` | string (fecha) | — |

**MatchHistoryItem** no viene de la API: lo calcula `HistoryService` a partir de cada `Match` (ordena `players` por `score` y busca al usuario). Tiene `matchId`, `quizTitle`, `playedAt`, `score`, `rank` y `totalPlayers`.

### Error

Formato único de todas las respuestas de error. Ver [sección 4](#4-errores).

```json
{
  "message": "Error de validación",
  "errores": ["El título debe tener al menos 3 caracteres"]
}
```

`errores` solo viene en errores de validación de Mongoose (400).

---

## 3. Endpoints

### 3.1 Autenticación

| Método | Ruta | Auth | Cuerpo / params | Éxito | Uso en el cliente |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | — | `{ displayName, email, password }` | 201 [RegisterResponse](#registerresponse) | Registro |
| POST | `/auth/login` | — | `{ email, password }` | 200 [AuthResponse](#authresponse) | Inicio de sesión |
| POST | `/auth/google` | — | `{ credential }` (ID token de Google Identity Services) | 200 [AuthResponse](#authresponse) | Botón de Google en landing, login y registro |
| GET | `/auth/me` | Bearer | — | 200 `{ user: User }` | Restaurar la sesión al recargar |
| GET | `/auth/activate/:token` | — | `token` en la ruta | 200 `{ message }` | Página `/activate/:token` |
| POST | `/auth/resend-activation` | — | `{ email }` | 200 `{ message }` (siempre el mismo, exista o no el correo) | Reenviar correo de activación |

**`POST /auth/google`:** la API verifica el token contra su `GOOGLE_CLIENT_ID`. Si ya existe un usuario con ese `googleId`, inicia sesión; si existe una cuenta local con el mismo correo (verificado por Google), la vincula; si no existe, crea una cuenta `authProvider: "google"` ya activa.

**Errores de autenticación:**

| Endpoint | Status | `message` |
| --- | --- | --- |
| register | 400 | `email, displayName y contraseña son requeridos` |
| register | 400 | `El correo ya está registrado` |
| register | 400 | `Error de validación` + `errores[]` (formato de correo, longitud de nombre o contraseña) |
| login | 400 | `email y password son requeridos` |
| login | 400 | `Esta cuenta se creó con Google. Inicia sesión con Google.` |
| login | 401 | `Credenciales inválidas` |
| login | 403 | `Debes activar tu cuenta antes de iniciar sesión. Revisa tu correo.` (solo con activación prendida) |
| google | 400 | `credential es requerido` |
| google | 401 | `El token de Google es inválido o expiró` |
| google | 401 | `Tu correo de Google no está verificado` |
| google | 503 | `El inicio de sesión con Google no está configurado en el servidor` |
| me | 401 | `No autorizado: token requerido` · `Token inválido o expirado` · `El usuario de esta sesión ya no existe` |
| activate | 400 | `El link de activación es inválido o ya expiró` |
| activate | 404 | `El usuario de este link ya no existe` |
| resend-activation | 400 | `email es requerido` |

### 3.2 Quizzes

| Método | Ruta | Auth | Cuerpo / params | Éxito | Uso en el cliente |
| --- | --- | --- | --- | --- | --- |
| GET | `/quizzes` | — | Query: `q`, `topic`, `tags`, `page`, `limit` | 200 [Page](#paget)<[QuizSummary](#quizsummary)> | Explorar, landing, Nueva partida |
| GET | `/quizzes/mine` | Bearer | Query: `visibility` (`all` \| `public` \| `private`), `q`, `topic`, `page`, `limit` | 200 [Page](#paget)<[QuizSummary](#quizsummary)> | Mis quizzes, dashboard |
| GET | `/quizzes/:id` | Opcional | `id` en la ruta | 200 [Quiz](#quiz) | Detalle y edición |
| POST | `/quizzes` | Bearer | [QuizDraft](#quizdraft) | 201 [Quiz](#quiz) | Crear quiz |
| PUT | `/quizzes/:id` | Bearer (dueño) | [QuizDraft](#quizdraft) (campos parciales) | 200 [Quiz](#quiz) | Editar quiz |
| DELETE | `/quizzes/:id` | Bearer (dueño) | `id` en la ruta | 200 `{ "message": "Quiz eliminado" }` | Eliminar desde Mis quizzes y Detalle |
| POST | `/quizzes/generate-questions` | Bearer | `{ topic, numQuestions }` (1 a 20, por defecto 5) | 200 `{ questions: Question[] }` (no guarda nada) | Botón "Generar con IA" del formulario |
| POST | `/quizzes/generate` | Bearer | `{ topic, numQuestions, title?, description?, isPublic?, tags? }` | 201 [Quiz](#quiz) (guardado, privado por defecto) | Generar un quiz en Nueva partida |

**Búsqueda y filtros de los listados:**

- `q` busca, sin distinguir mayúsculas, en `title`, `description` y `tags`. Los caracteres especiales se escapan.
- `topic` filtra por tema exacto (`Ciencia`, `Deportes`, …).
- `tags` acepta varios separados por coma; regresa los quizzes que tengan al menos uno.
- Los resultados se ordenan del más nuevo al más viejo.

**`GET /quizzes/:id` y quizzes privados:** un quiz privado solo lo puede ver su dueño. Para cualquier otro usuario, o sin token, la API responde 404, igual que si no existiera.

**Errores de quizzes:**

| Endpoint | Status | `message` |
| --- | --- | --- |
| mine, POST, PUT, DELETE, generate* | 401 | `No autorizado: token requerido` · `Token inválido o expirado` |
| `:id` (GET, PUT, DELETE) | 400 | `Identificador inválido: <id>` (no es un ObjectId) |
| `:id` (GET, PUT, DELETE) | 404 | `Quiz no encontrado` |
| PUT | 403 | `No tienes permiso para editar este quiz` |
| DELETE | 403 | `No tienes permiso para eliminar este quiz` |
| POST, PUT | 400 | `Error de validación` + `errores[]`, por ejemplo `El título debe tener al menos 3 caracteres`, `Cada pregunta debe tener al menos 2 opciones`, `correctIndex debe apuntar a una opción válida de la pregunta`, `El tiempo límite máximo es de 120 segundos` |
| generate, generate-questions | 400 | `El topic es requerido` |
| generate, generate-questions | 502 | `No se pudieron generar las preguntas con IA, intenta de nuevo` |

### 3.3 Partidas

El juego en tiempo real usa Socket.io (namespace `/matches`) y queda fuera de este contrato REST. El cliente solo usa estos dos endpoints:

| Método | Ruta | Auth | Cuerpo / params | Éxito | Uso en el cliente |
| --- | --- | --- | --- | --- | --- |
| GET | `/matches/user/:userId` | — | Query: `page`, `limit` | 200 [Page](#paget)<[Match](#match-y-matchplayer)> (sin `totalPages`), más recientes primero | Historial y dashboard |
| GET | `/matches/rooms/:code/exists` | — | `code` en la ruta (no distingue mayúsculas) | 200 `{ exists: boolean, inProgress: boolean }` | Formulario "Código de sala" en la landing |

`exists` es `true` solo si la sala está en `waiting` o `in_progress`.

---

## 4. Errores

### Formato

Todas las respuestas de error usan el [modelo Error](#error): `{ "message": string, "errores"?: string[] }`. Los mensajes están en español y se pueden mostrar directo al usuario.

### Catálogo de status

| Status | Significado | Ejemplo de `message` |
| --- | --- | --- |
| 400 | Datos faltantes, inválidos o con formato incorrecto | `Error de validación` + `errores[]`; `Identificador inválido: abc` |
| 401 | Sin token, token inválido o expirado, o credenciales incorrectas | `No autorizado: token requerido`; `Credenciales inválidas` |
| 403 | Autenticado pero sin permiso sobre el recurso | `No tienes permiso para editar este quiz` |
| 404 | El recurso no existe (o es un quiz privado ajeno) | `Quiz no encontrado`; `Ruta no encontrada` |
| 500 | Error inesperado del servidor | `Error del servidor` |
| 502 | Falló un servicio externo (IA) | `No se pudieron generar las preguntas con IA, intenta de nuevo` |
| 503 | Función no configurada en el servidor | `El inicio de sesión con Google no está configurado en el servidor` |
| 0 | Sin respuesta: el navegador no llegó a la API (sin conexión, CORS o servidor dormido) | — (lo genera el navegador) |

### Cómo los maneja el cliente

Todos los errores HTTP pasan por un solo lugar: `src/app/shared/interceptors/error.interceptor.ts`. El interceptor convierte la respuesta en un `ApiError` (`message`, `status`, `details`) y decide qué hacer:

| Status | Acción |
| --- | --- |
| 400 | Muestra `errores[0]` si viene, si no `message`. En registro, el correo duplicado se marca en el campo de correo |
| 401 con sesión abierta | Cierra la sesión, avisa "Tu sesión expiró" y redirige a `/login?returnUrl=<página actual>` |
| 401 sin sesión (login) | El formulario muestra "Credenciales inválidas" |
| 403, 404 | Toast con el `message`. Las vistas con `<app-view-state>` muestran el error y un botón "Reintentar" |
| 500 | "Ocurrió un error en el servidor. Intenta más tarde." (no muestra detalles internos) |
| 0, 502, 503, 504 | "No pudimos conectar con el servidor. Si estuvo inactivo puede tardar hasta un minuto en despertar; intenta de nuevo." |

Las peticiones cuyo error ya pinta el propio formulario (login, registro, Google, activación y `/auth/me`) se marcan con el `HttpContextToken` `SILENT_ERROR` para no mostrar el mensaje dos veces.
