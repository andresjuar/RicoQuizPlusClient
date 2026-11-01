# RicoQuizPlusClient

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.




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
| GET | `/quizzes?q=&topic=&page=&limit=` | — | Explorar |
| GET | `/quizzes/mine?visibility=&page=&limit=` | Bearer | Mis quizzes |
| GET | `/quizzes/:id` | Opcional | Detalle y edición |
| POST | `/quizzes` | Bearer | Crear quiz |
| PUT | `/quizzes/:id` | Bearer (dueño) | Editar quiz |
| DELETE | `/quizzes/:id` | Bearer (dueño) | Eliminar quiz |
| POST | `/quizzes/generate-questions` | Bearer | Preguntas con IA (sin guardar) |
| GET | `/matches/user/:userId` | — | Historial |
| GET | `/matches/rooms/:code/exists` | — | Unirse con código |

### Modelos

Definidos en `src/app/shared/models/`:
- `QuizSummary`: tarjeta en listados, con `questionCount` y `totalSeconds` y sin preguntas.
- `Quiz`: quiz completo con `questions`.
- `Page<T>`: `{ data, total, page, limit, totalPages }`.
- `User` y `AuthResponse`: `{ token, user }`.

### Errores

Todas las respuestas de error tienen la forma `{ "message": string, "errores"?: string[] }`.

| Status | Cuándo | Qué hace el cliente |
| --- | --- | --- |
| 400 | Validación o datos faltantes | Muestra `errores[0]` o `message` |
| 401 | Sin token, token inválido o credenciales incorrectas | Con sesión abierta: cierra sesión y redirige a `/login` |
| 403 | No eres dueño del recurso | Toast con el mensaje |
| 404 | Recurso no existe (o quiz privado ajeno) | Toast y regresa a la lista |
| 500 | Error inesperado | "Ocurrió un error en el servidor" |
| 0 / 502–504 | Render dormido o caído | "No pudimos conectar con el servidor…" |

Manejo centralizado en `src/app/shared/interceptors/error.interceptor.ts`.