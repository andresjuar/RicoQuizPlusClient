# RicoQuiz+ Client

SPA en Angular para **RicoQuiz+**, una plataforma de trivia multijugador en tiempo real (estilo Kahoot). Proyecto integrador de *Tecnologías de desarrollo en el cliente* (ITESO), hecho por Andrés y Adán Juárez.

El cliente consume la API propia de RicoQuiz+ (Express + MongoDB), construida en la materia de Tecnologías de desarrollo en el servidor.

## Estado del proyecto

| Área | Estado |
| --- | --- |
| Registro, login con correo y login con Google | Listo |
| Explorar quizzes con búsqueda, categorías y paginación | Listo |
| Detalle de quiz, Mis quizzes (paginar y eliminar), crear y editar quiz | Listo |
| Dashboard e historial de partidas | Listo |
| Manejo centralizado de errores y estados de carga | Listo |
| Partida en vivo por Socket.io | Pendiente: la pantalla de juego usa datos simulados (`shared/mocks`) |
| Despliegue del cliente, ESLint y CI | Pendiente |

## Por qué una API propia

- Ya existía un backend funcional, probado y desplegado de la materia anterior; esta entrega reconstruye solo el cliente.
- El juego necesita un motor en tiempo real (Socket.io), autenticación con JWT y login con Google; una API pública de terceros no ofrece nada de eso.
- Las preguntas se generan con IA (Gemini), las imágenes se guardan en Cloudinary y el correo de activación sale por Brevo; todo eso ya vive en el backend.

## Stack

- Angular 22, TypeScript y SCSS
- Angular CDK (diálogos), RxJS y Signals (`rxResource`, `input()`, `computed`)
- Vitest para las pruebas unitarias
- API REST en Express + MongoDB, desplegada en Render

## Puesta en marcha local

Requisitos: **Node.js 22.22.3 o superior** (lo exige Angular CLI 22) y npm 12.

```bash
npm install
npm start
```

Abre `http://localhost:4200/`. La app recarga sola al guardar cambios.

| Comando | Qué hace |
| --- | --- |
| `npm start` | Servidor de desarrollo (`ng serve`, usa `environment.development.ts`) |
| `npm run build` | Build de producción en `dist/RicoQuizPlusClient/browser` (usa `environment.ts`) |
| `npm test` | Pruebas unitarias con Vitest (`ng test`) |

### Variables de entorno

Viven en `src/environments/`:

| Variable | Para qué sirve |
| --- | --- |
| `apiUrl` | URL base de la API REST |
| `socketUrl` y `socketNamespace` | Servidor y namespace de Socket.io (`/matches`) |
| `googleClientId` | Client ID de Google Identity Services |

Para trabajar contra una API local, cambia `apiUrl` en `environment.development.ts`. La API permite el origen `http://localhost:4200` por CORS. Si publicas el cliente en otro dominio, ese dominio debe agregarse a `CORS_ORIGIN` en la API y a los orígenes autorizados de Google Cloud Console.

> La API gratuita de Render se duerme tras un rato sin uso: la primera petición puede tardar hasta un minuto. La app muestra "Despertando el servidor…" mientras tanto.

## Rutas de la app

| Ruta | Página | Requiere sesión |
| --- | --- | --- |
| `/` | Landing | No |
| `/explore` | Explorar (`?q=&topic=&page=`) | No |
| `/quizzes/:id` | Detalle de un quiz | No |
| `/login`, `/register` | Acceso y registro | No (solo invitados) |
| `/activate/:token` | Activar cuenta | No |
| `/dashboard` | Inicio del usuario | Sí |
| `/quizzes/mine` | Mis quizzes | Sí |
| `/quizzes/new`, `/quizzes/:id/edit` | Crear y editar quiz | Sí |
| `/history` | Historial de partidas | Sí |
| `/room/new` | Nueva partida | Sí |
| `/play/:code` | Partida | No (se puede entrar como invitado) |

## Estructura

```
src/app/
  layouts/          # Layout principal (navbar + contenido)
  pages/            # Una carpeta por página (explore, quiz-detail, my-quizzes, history, ...)
  shared/
    components/     # quiz-card, match-row, paginator, view-state, confirm-dialog, ...
    services/       # QuizService, HistoryService, AuthService, ToastService, ConfirmService, ...
    models/         # Interfaces tipadas (Quiz, QuizSummary, Page<T>, Match, User, ...)
    interceptors/   # auth.interceptor (token) y error.interceptor (errores HTTP)
    guards/         # authGuard, guestGuard, leaveGameGuard, unsavedChangesGuard
    mocks/          # Datos simulados de la partida en vivo (temporal)
```

## Contrato de API

Fuente de datos: API propia **RicoQuiz+** (Express + MongoDB), desplegada en Render.

- Especificación completa (OpenAPI 3.0): [`docs/openapi.json`](./docs/openapi.json)
- Documentación interactiva: https://proyecto-final-servidor-k6wl.onrender.com/api-docs
- Para verla como página: abrir https://editor.swagger.io y arrastrar `docs/openapi.json`.

### Endpoints que usa el cliente

| Método | Ruta | Auth | Uso en el cliente |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | Registro |
| POST | `/auth/login` | — | Login |
| POST | `/auth/google` | — | Login con Google |
| GET | `/auth/me` | Bearer | Restaurar sesión al recargar |
| GET | `/auth/activate/:token` | — | Activar cuenta |
| POST | `/auth/resend-activation` | — | Reenviar correo de activación |
| GET | `/quizzes?q=&topic=&page=&limit=` | — | Explorar |
| GET | `/quizzes/mine?visibility=&page=&limit=` | Bearer | Mis quizzes |
| GET | `/quizzes/:id` | Opcional | Detalle y edición |
| POST | `/quizzes` | Bearer | Crear quiz |
| PUT | `/quizzes/:id` | Bearer (dueño) | Editar quiz |
| DELETE | `/quizzes/:id` | Bearer (dueño) | Eliminar quiz |
| POST | `/quizzes/generate-questions` | Bearer | Preguntas con IA (sin guardar) |
| POST | `/quizzes/generate` | Bearer | Generar y guardar un quiz con IA (Nueva partida) |
| GET | `/matches/user/:userId` | — | Historial |
| GET | `/matches/rooms/:code/exists` | — | Unirse con código |

### Modelos

Definidos en `src/app/shared/models/`:

- `QuizSummary`: tarjeta en listados, con `questionCount` y `totalSeconds` y sin preguntas.
- `Quiz`: quiz completo con `questions`.
- `Page<T>`: `{ data, total, page, limit, totalPages }`.
- `User` y `AuthResponse`: `{ token, user }`.
- `Match` y `MatchHistoryItem`: partida completa y la fila que ve el usuario en su historial.

### Errores

Todas las respuestas de error tienen la forma `{ "message": string, "errores"?: string[] }`.

| Status | Cuándo | Qué hace el cliente |
| --- | --- | --- |
| 400 | Validación o datos faltantes | Toast con `errores[0]` o `message` |
| 401 | Sin token, token inválido o credenciales incorrectas | Con sesión abierta: cierra sesión y redirige a `/login` |
| 403 | No eres dueño del recurso | Toast con el mensaje |
| 404 | Recurso no existe (o quiz privado ajeno) | Toast con el mensaje; la vista muestra el error con "Reintentar" |
| 500 | Error inesperado | "Ocurrió un error en el servidor" |
| 0 / 502–504 | Render dormido o caído | "No pudimos conectar con el servidor…" |

## Manejo de errores y estados de vista

- **Errores HTTP:** se manejan en un solo lugar, `src/app/shared/interceptors/error.interceptor.ts`. Normaliza el error a `ApiError`, muestra el toast y cierra la sesión en 401. Los componentes no muestran mensajes de error propios.
- **Estados de carga, error y vacío:** los resuelve el componente `<app-view-state>` sobre un `rxResource`. La página solo pinta el contenido cuando el estado es "listo", porque `resource.value()` lanza si el recurso está en error.
- **Peticiones HTTP:** solo viven en los servicios (`shared/services`); los componentes nunca usan `HttpClient`.

## Despliegue

- **API:** Render, en https://proyecto-final-servidor-k6wl.onrender.com
- **Cliente:** `npm run build` genera el sitio estático en `dist/RicoQuizPlusClient/browser`. Al ser una SPA, el hosting debe redirigir todas las rutas a `index.html`. La configuración del hosting (Netlify) está pendiente.

## Flujo de trabajo

1. Una rama por issue, desde `main` actualizado: `feature/n4-explorar-paginacion`.
2. Commits convencionales: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
3. Pull request hacia `main` usando la plantilla de `.github/pull_request_template.md`: qué cambia, issue que cierra (`Closes #NN`) y cómo probar.
4. El otro integrante revisa y aprueba antes del merge.
5. Si un cambio toca algo compartido (`QuizService`, modelos, `<app-view-state>`), se avisa antes para no pisarse.