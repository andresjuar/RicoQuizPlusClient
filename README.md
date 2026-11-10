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
| Autenticación y roles: sesión con JWT, guardias de ruta, directiva *appHasRole y vistas 403/404 | Listo |
| Partida en vivo por Socket.io | Pendiente: la pantalla de juego usa datos simulados (`shared/mocks`) |
| Despliegue del cliente en Netlify | Listo |
| ESLint y CI | Pendiente |

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
| `/quizzes/new`, `/quizzes/:id/edit` | Crear y editar quiz | Sí (y para editar, ser el dueño del quiz) |
| `/history` | Historial de partidas | Sí |
| `/room/new` | Nueva partida | Sí |
| `/play/:code` | Partida | No (se puede entrar como invitado) |
| `/403` | Acceso denegado | No |

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
    directives/     # has-role (*appHasRole), copy-to-clipboard
    guards/         # authGuard, guestGuard, ownerGuard, leaveGameGuard, unsavedChangesGuard
    mocks/          # Datos simulados de la partida en vivo (temporal)
```

## Autenticación y permisos

### Proveedor de autenticación

Se usa una **API propia con JWT** (la de RicoQuiz+, en Express y MongoDB), en lugar de un BaaS como Firebase o Supabase o de una API simulada. Por qué:

- El backend ya existía y ya resolvía registro, login, activación por correo y login con Google; reutilizarlo evita duplicar esa lógica.
- Un JWT es una sesión sin estado: la API no guarda sesiones, solo valida la firma del token en cada petición. Eso encaja con un servidor gratuito que se duerme.
- Tenemos control total de cómo se guardan las contraseñas y qué lleva el token.

Cómo funciona:

1. **Registro** (`POST /auth/register`): la API guarda al usuario con la contraseña **hasheada con bcrypt (10 rondas)**; nunca se guarda ni se devuelve en texto plano. Al iniciar sesión se compara con `bcrypt.compare`. Si la activación por correo está encendida (`REQUIRE_EMAIL_ACTIVATION`), la API manda un correo con un enlace a `/activate/:token`; si no, regresa la sesión directamente.
2. **Login** (`POST /auth/login`) o **Google** (`POST /auth/google`, con el credential de Google Identity Services): la API responde `{ token, user }`. Las cuentas creadas con Google no tienen contraseña; si intentan entrar con contraseña, la API responde 400 con "Esta cuenta se creó con Google. Inicia sesión con Google."
3. El **JWT** se firma con `JWT_SECRET` (HS256) y dura **7 días por defecto** (configurable con la variable `JWT_EXPIRES_IN`). Su payload es `{ id, email }` más `iat` y `exp`; no lleva rol ni nombre.
4. El cliente guarda el token y usa `user` como estado de la sesión.

### Manejo de la sesión

| Qué | Cómo |
| --- | --- |
| Lógica de sesión | Vive solo en `AuthService` (signals `user`, `isAuthenticated` y `role`). Ningún componente toca el token |
| Guardar el token | `TokenStorageService`, en localStorage con la llave `rq_token` |
| Persistencia al recargar | Al arrancar, `restoreSession()` pide `GET /auth/me`. Espera como máximo 5 s; si la API tarda (Render dormido), la app se muestra con un aviso y los guards esperan con `whenReady()` |
| Token en cada petición | `auth.interceptor.ts` agrega `Authorization: Bearer <token>` automáticamente, y solo a las peticiones a nuestra API |
| Token vencido o inválido | La API responde 401 con `{ "message": "Token inválido o expirado" }` (sin token: "No autorizado: token requerido"). Si `/auth/me` responde 401, se borra el token. En cualquier otra petición, `error.interceptor.ts` cierra la sesión, avisa "Tu sesión expiró. Vuelve a iniciar sesión." y redirige a `/login?returnUrl=<ruta actual>` |
| Cerrar sesión | Menú de usuario, confirmación y `AuthService.logout()`: borra el token y el usuario y redirige a `/` (vista pública) |

**Dónde vive el token.** Está en localStorage: es simple y sobrevive a recargas, pero un script malicioso (XSS) podría leerlo. Una cookie `httpOnly` sería más segura contra XSS, pero obliga a configurar CORS con credenciales y protección contra CSRF entre dos dominios distintos (Netlify y Render). Para este proyecto se eligió localStorage y se mitiga así: Angular escapa el HTML por defecto, no se usa `innerHTML` con datos de usuarios y el token solo viaja a nuestra API.

### Roles y permisos

Hay dos roles y se obtienen **de la sesión**: sin sesión eres `invitado` y con sesión eres `user`. `AuthService.role()` lo calcula a partir del usuario que restaura `/auth/me`; no está escrito en ningún componente ni se elige en la interfaz. La API no tiene campo `role` y el token no lleva rol. Además de los roles, hay un permiso por recurso: **solo el dueño de un quiz puede editarlo o eliminarlo**.

| Acción | Invitado (sin sesión) | Usuario (con sesión) |
| --- | --- | --- |
| Explorar y ver el detalle de quizzes públicos | Sí | Sí |
| Unirse a una partida con un código (`/play/:code`) | Sí | Sí |
| Crear partida, crear quiz, ver Mis quizzes e Historial | No (se redirige al login) | Sí |
| Editar o eliminar un quiz | No | Solo si es el dueño |

`host` y `player` (`PlayerRole` en la pantalla de partida) son roles **del juego**, no de la aplicación.

### Guardias de ruta

| Guardia | Qué hace | Rutas |
| --- | --- | --- |
| `authGuard` | Sin sesión redirige a `/login?returnUrl=<ruta pedida>`; tras iniciar sesión se regresa a esa ruta | `/dashboard`, `/quizzes/mine`, `/quizzes/new`, `/quizzes/:id/edit`, `/history`, `/room/new` |
| `guestGuard` | Con sesión redirige a `/dashboard`: un usuario con sesión no vuelve a login ni a registro | `/login`, `/register` |
| `ownerGuard` | Si no eres el dueño del quiz, lleva a la vista `/403` (Acceso denegado). Si la petición falla, deja pasar y el formulario muestra el error | `/quizzes/:id/edit` |

`leaveGameGuard` y `unsavedChangesGuard` solo piden confirmación al salir de una partida o de un formulario con cambios; no tienen que ver con la autenticación.

### Elementos de la interfaz según el rol

La directiva estructural `*appHasRole` muestra u oculta un bloque según el rol de la sesión, por ejemplo `*appHasRole="'user'"` o `*appHasRole="['invitado']"`. Se actualiza sola al iniciar o cerrar sesión, sin recargar, y evita repetir `@if` con roles en cada componente. Se usa en: el navbar (`shared/components/navbar/navbar.html`), para mostrar Inicio, Mis quizzes, Historial, "+ Crear quiz" y el menú de usuario a quien tiene sesión, y los botones Iniciar sesión y Registrarse al invitado.

Ocultar un botón no basta: aunque la interfaz lo oculte, la API vuelve a validar. Si la API rechaza una acción con un **403**, el interceptor muestra un aviso y no cierra la sesión. Si la acción era eliminar un quiz (en el detalle o en Mis quizzes), la pantalla se vuelve a pedir para no quedar en un estado inconsistente; al guardar en el formulario, el botón se vuelve a habilitar y se conservan los datos.

### Vistas 403 y 404

- `/403`: "Acceso denegado", con botones para ir al inicio o a Mis quizzes.
- Cualquier ruta que no existe muestra la vista 404.

### Formularios de acceso

Login y registro muestran errores por campo, deshabilitan el botón mientras se procesa y muestran un mensaje claro cuando las credenciales son inválidas o el correo ya está registrado. Si la cuenta necesita activación, se puede reenviar el correo desde el registro o desde la pantalla de activación.

### Variables de entorno y secretos

El repo no guarda secretos. Las variables del cliente están en `src/environments/` y su plantilla es `src/environments/environment.example.ts`. La URL de la API y el client ID de Google son identificadores públicos. Los secretos reales (`JWT_SECRET`, URI de Mongo, llaves de Gemini, Cloudinary y Brevo, entre otros) viven en las variables de entorno de la API en Render. La API incluye un `.env.example` con los nombres de esas variables, sin valores, y su `.env` está en `.gitignore`.

### Cómo comprobarlo

1. Sin sesión, abre `/quizzes/mine`: te lleva a `/login?returnUrl=%2Fquizzes%2Fmine` y, al iniciar sesión, regresas a Mis quizzes.
2. Con sesión, abre `/login`: te lleva a `/dashboard`.
3. Con la cuenta B, abre `/quizzes/<id de un quiz de A>/edit`: te lleva a `/403`.
4. Inicia y cierra sesión: el navbar cambia sin recargar.
5. Borra el token de localStorage y navega a Mis quizzes: sale "Tu sesión expiró" y vuelves al login.

## Contrato de API

Fuente de datos: API propia **RicoQuiz+** (Express + MongoDB), desplegada en Render.

- **[Contrato de API](./docs/api-contract.md)**: endpoints que usa el cliente, modelos de datos y respuestas de error.
- **[Especificación OpenAPI 3.0](./docs/openapi.json)**: todos los endpoints de la API. Se puede abrir en https://editor.swagger.io.
- **Documentación interactiva:** https://proyecto-final-servidor-k6wl.onrender.com/api-docs

Todas las respuestas de error tienen la forma `{ "message": string, "errores"?: string[] }` y se manejan en un solo lugar: `src/app/shared/interceptors/error.interceptor.ts`.

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
| 401 | Sin token, token inválido o vencido, o credenciales incorrectas | Con sesión abierta: cierra la sesión, avisa "Tu sesión expiró. Vuelve a iniciar sesión." y redirige a `/login?returnUrl=<ruta actual>` |
| 403 | No tienes permiso (por ejemplo, editar o eliminar un quiz que no es tuyo) | Toast de aviso con el mensaje de la API (o "No tienes permiso para realizar esta acción."); no cierra la sesión ni navega |
| 404 | Recurso no existe (o quiz privado ajeno) | Toast con el mensaje; la vista muestra el error con "Reintentar" |
| 500 | Error inesperado | "Ocurrió un error en el servidor" |
| 0 / 502–504 | Render dormido o caído | "No pudimos conectar con el servidor…" |

## Manejo de errores y estados de vista

- **Errores HTTP:** se manejan en un solo lugar, `src/app/shared/interceptors/error.interceptor.ts`. Normaliza el error a `ApiError` y muestra el toast; en un 401 cierra la sesión y redirige al login, y en un 403 avisa sin cerrar la sesión. Los componentes no muestran mensajes de error propios.
- **Estados de carga, error y vacío:** los resuelve el componente `<app-view-state>` sobre un `rxResource`. La página solo pinta el contenido cuando el estado es "listo", porque `resource.value()` lanza si el recurso está en error.
- **Peticiones HTTP:** solo viven en los servicios (`shared/services`); los componentes nunca usan `HttpClient`.

## Despliegue

- **API:** Render, en https://proyecto-final-servidor-k6wl.onrender.com
- **Cliente:** Netlify, en https://ricoquiz.netlify.app. `netlify.toml` define el build (`npm run build`, carpeta `dist/RicoQuizPlusClient/browser`) y la regla que redirige todas las rutas a `index.html`, necesaria porque es una SPA.

## Flujo de trabajo

1. Una rama por issue, desde `main` actualizado: `feature/n4-explorar-paginacion`.
2. Commits convencionales: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
3. Pull request hacia `main` usando la plantilla de `.github/pull_request_template.md`: qué cambia, issue que cierra (`Closes #NN`) y cómo probar.
4. El otro integrante revisa y aprueba antes del merge.
5. Si un cambio toca algo compartido (`QuizService`, modelos, `<app-view-state>`), se avisa antes para no pisarse.