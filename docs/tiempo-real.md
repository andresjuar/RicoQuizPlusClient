# Tiempo real: contrato y funcionamiento

Documentación de la parte de tiempo real del cliente (Entrega 4): cómo se maneja la conexión de Socket.IO, cómo reacciona la interfaz a los eventos del servidor y el contrato completo de eventos.

La fuente elegida y por qué está en el [README](../README.md#tiempo-real-socketio).

## Cómo está organizado

| Pieza | Archivo | Responsabilidad |
| --- | --- | --- |
| `SocketService` | `shared/services/socket.service.ts` | **Única conexión** de toda la app (`providedIn: 'root'`). Manda el token, expone `status()` y `on()`/`emit()` tipados. Ningún componente llama a `io()` |
| `GameRoom` | `shared/services/game-room.service.ts` | Estado de *una* partida (fase, jugadores, pregunta, marcador…). Se provee en `GameShell`, así que existe solo mientras estás en `/play/:code` |
| `RoomSession` | `shared/services/room-session.service.ts` | Rol en la sala (`host`/`player`) que asigna el servidor. Lo leen `*appIsHost` y `*appIsPlayer` |
| `AnswerStorageService` | `shared/services/answer-storage.service.ts` | Guarda en `sessionStorage` la respuesta de la pregunta actual para recuperarla al recargar |
| `ConnectionStatus` | `shared/components/connection-status/connection-status.ts` | Indicador verde, amarillo o rojo del estado de la conexión (navbar) |
| Contrato | `shared/models/socket-events.model.ts` | Tipos de todos los eventos (espejo de `match.types.ts` del backend) |
| Vistas | `pages/play/` | `GameShell` decide la vista por la fase; los componentes solo leen signals y emiten acciones |

## Ciclo de vida de la conexión

1. **Al iniciar sesión** (o al recargar con sesión), un `effect` sobre `AuthService.user()` abre la conexión. Se crea una sola vez en `app.config.ts` (`provideAppInitializer`).
2. **El token** se manda en `handshake.auth.token`, como pide el backend. Es una función que se evalúa en cada (re)conexión, así que siempre usa el token vigente. Si el token es inválido, el servidor rechaza el handshake.
3. **Invitados:** no tienen sesión, así que `GameRoom` abre la conexión al entrar a `/play/:code` (sin token) y la cierra al salir.
4. **Al cerrar sesión** la conexión se cierra. Si entra otro usuario, se reconecta con su token.

## Estado de la conexión y reconexión

- **Indicador:** con sesión, la navbar muestra siempre el estado de la conexión: verde *Conectado*, amarillo *Conectando…* o *Reconectando…* y rojo *Sin conexión* (en móvil solo el punto). Dentro de la partida, la barra superior muestra lo mismo o la fase actual (*Sala abierta*, *En juego*, *Final*). Ambos salen de `SocketService.status()`.
- **Reconexión automática:** la hace Socket.IO. Si el servidor corta la conexión (`io server disconnect`), que es el único caso en que Socket.IO no reintenta solo, `SocketService` vuelve a conectar.
- **Resincronización:** en cada reconexión, `GameRoom` reenvía `room:join` con el mismo código y nombre. El backend reconoce a la persona (por `userId` o nombre de invitado), le conserva el puntaje y responde `room:joined_ok` con `sync`, el estado actual de la sala (lobby, pregunta con segundos restantes, reveal, marcador o final). La vista se reconstruye desde ahí sin recargar.
- **Periodo de gracia del servidor:** un jugador tiene 30 s para volver; el host, 5 s. Si el host no vuelve, la sala se cancela y todos ven "No pudimos entrar a la sala".
- **Limpieza:** `SocketService.on()` regresa un Observable que quita su listener al desuscribirse, y `GameRoom` se suscribe con `takeUntilDestroyed`. Al salir de `/play/:code` se envía `room:leave` y se quitan todos los listeners, así que no se duplican eventos al volver a entrar.
- **Acciones sin conexión:** si se pierde la conexión dentro de la sala, aparece el aviso "Sin conexión, reconectando…" y se desactivan los botones que dependen del servidor (*Iniciar partida*, *Cambiar quiz*, las respuestas, *Revelar respuesta*, *Siguiente pregunta* y *Jugar de nuevo*). Se reactivan solos al volver la conexión. Por si algo se envía justo en ese momento, `emit()` regresa `false` sin enviar nada y se muestra un aviso, en vez de fallar en silencio.
- **Respuesta tras recargar:** al reconectarse, el servidor solo dice `alreadyAnswered: true`, no qué opción elegiste. Por eso `GameRoom` guarda la respuesta de la pregunta actual en `sessionStorage` (una sola entrada, llave `rq_answer`) y la recupera al resincronizar; así el reveal califica bien. La entrada se borra en cada pregunta nueva, al terminar la partida, al jugar de nuevo, si la sala se cancela y al salir de la sala, así que no queda nada guardado después de jugar. Si no está (por ejemplo, otra pestaña), el reveal dice "Respondiste esta pregunta" en vez de calificar.

## Roles dentro de la partida (`*appIsHost` y `*appIsPlayer`)

Las directivas estructurales `*appIsHost` y `*appIsPlayer` muestran un bloque según el rol en la sala (`RoomSession`). Se usan en el lobby (código de sala, cambiar quiz, iniciar partida contra "Esperando al anfitrión"), en la pregunta (imagen de la pregunta, contador de respuestas y "Revelar respuesta" contra "Respuesta enviada"), en el marcador ("Siguiente pregunta") y en los resultados ("Jugar de nuevo").

Ocultar no basta: el servidor valida cada acción (`NOT_HOST`) y nunca manda a los jugadores la respuesta correcta antes del reveal (el host recibe `correctIndex`, los jugadores no).

## Flujo de una partida

1. El host elige un quiz en `/room/new` → `POST /matches` → navega a `/play/<CÓDIGO>` (4 letras).
2. Cada participante entra con el código (como invitado pide un nombre) → `room:join`. La lista del lobby se actualiza en vivo con `room:player_joined`.
3. El host pulsa *Iniciar partida* → `game:start` → todos reciben `game:loading` y `game:ready`; el cliente del host pide la primera pregunta (`game:next_question`).
4. `game:question` → cuenta regresiva con `game:timer_tick` → los jugadores responden (`game:submit_answer`). Al responder todos, al acabarse el tiempo o si el host pulsa *Revelar*, llega `game:answer_revealed` y, 2 s después, `game:leaderboard`.
5. El host pulsa *Siguiente pregunta*; tras la última, el servidor manda `game:over` con el podio. *Jugar de nuevo* crea una partida nueva en la misma sala (`game:play_again_ok`).

## Contrato de eventos

Namespace `/matches`. Los tipos están en `src/app/shared/models/socket-events.model.ts`.

**El cliente envía:**

| Evento | Payload | Quién | Para qué |
| --- | --- | --- | --- |
| `room:join` | `{ roomCode, guestName? }` | Todos | Unirse, entrar tarde o reconectarse. `guestName` (2–30 caracteres) es obligatorio sin sesión |
| `room:leave` | — | Todos | Salir de la sala. Si es el host, la sala se cancela |
| `game:start` | — | Host | Iniciar la partida (requiere quiz y al menos un jugador conectado) |
| `game:next_question` | — | Host | Siguiente pregunta; tras la última, termina la partida |
| `game:reveal_answer` | — | Host | Revelar antes de que acabe el tiempo |
| `game:submit_answer` | `{ questionIndex, answerIndex }` | Jugador | Responder la pregunta actual |
| `game:play_again` | — | Host | Nueva partida en la misma sala (solo al terminar) |

**El cliente recibe:**

| Evento | Payload | Quién lo recibe | Qué hace la interfaz |
| --- | --- | --- | --- |
| `room:joined_ok` | `{ roomCode, role, displayName, score, isReconnect, isLateJoin, players, sync }` | Quien se une | Asigna el rol, pinta la lista y reconstruye la vista desde `sync` |
| `room:player_joined` | `{ players, joined, reconnected }` | Los demás | Actualiza el lobby; el host ve "X entró a la sala" |
| `room:player_disconnected` | `{ players, disconnected, graceSeconds }` | Todos | Marca al jugador como desconectado |
| `room:player_left` | `{ players, left }` | Todos | Lo quita de la lista y avisa |
| `game:loading` | `{ message }` | Todos | Pantalla "Preparando la partida" |
| `game:ready` | `{ totalQuestions }` | Todos | El cliente del host pide la primera pregunta |
| `game:question` | `{ questionIndex, totalQuestions, question, imageUrl?, options, timeLimitSeconds, correctIndex? }` | Todos (`correctIndex` solo el host) | Muestra la pregunta y reinicia la respuesta |
| `game:timer_tick` | `{ questionIndex, secondsLeft }` | Todos | Actualiza la cuenta regresiva |
| `game:answer_received` | `{ received: true }` | El jugador que respondió | Confirmación (la respuesta ya se marcó al enviarla) |
| `game:answer_count` | `{ answeredCount, totalPlayers }` | Host | Barra "N de M respondieron" |
| `game:answer_revealed` | `{ questionIndex, correctIndex, correctText }` | Todos | Pantalla de reveal: correcto, incorrecto o sin respuesta |
| `game:leaderboard` | `{ leaderboard, isFinalRound }` | Todos | Marcador; en la última ronda el botón dice "Ver resultados finales" |
| `game:over` | `{ winner, leaderboard }` | Todos | Podio y clasificación final |
| `game:play_again_ok` | `{ matchId, players }` | Todos | Regresa al lobby; el host reasigna el quiz a la partida nueva |
| `error` | `{ code, message }` | Quien causó el error (o toda la sala si se cancela) | `ROOM_NOT_FOUND`, `ROOM_FINISHED` y `ROOM_CANCELLED` muestran la pantalla de error; el resto, un toast |

## El quiz de la sala (lobby del host)

- **Elegir o cambiar quiz:** el diálogo del lobby tiene dos pestañas: *Elegir existente* (`PATCH /matches/:id/quiz`) y *Generar con IA*, donde el host escribe el tema y elige cuántas preguntas con el mismo slider del formulario de quiz (de 3 a 20). La generación usa `POST /matches/:id/generate-quiz`: la API crea el quiz (privado, en *Mis quizzes*) y lo asigna a la sala. Mientras tanto, el lobby muestra "Preparando el quiz…" y desactiva *Iniciar partida*. *Nueva partida* usa el mismo formulario (`<app-ai-quiz-form>`).
- **QR de acceso:** junto al código, el host ve un QR con el link `/play/<CÓDIGO>` (con el dominio en el que corre la app, local o Netlify). Al escanearlo, el jugador llega directo a la pantalla para poner su nombre. Se genera en el navegador con la librería `qrcode` (componente `RoomQr`), sin mandar el link a ningún servicio externo.
- **Host que entra por link:** `room:joined_ok` no trae el `matchId`, y la API no tiene un endpoint "partida por código". Si el host no viene de *Nueva partida*, `GameRoom` busca la sala entre sus partidas recientes (`GET /matches/user/:id`, que ya trae el `matchId` y el quiz) y carga el quiz. Si no la encuentra, avisa que no podrá cambiar el quiz, pero la partida se puede jugar igual.

## Cómo probarlo

1. Inicia sesión y crea una partida desde *Nueva partida*. Copia el código de 4 letras.
2. En una **ventana privada** (otra sesión), entra al código como invitado. El lobby del host lo muestra sin recargar.
3. Inicia la partida, responde y avanza hasta el final.
4. Recarga la página de un jugador a mitad de una pregunta: vuelve a la misma pregunta con su puntaje. Apaga el wifi unos segundos: el indicador pasa a *Reconectando…* y luego vuelve.

> Usa otra ventana privada u otro navegador para cada jugador: dos pestañas con la misma cuenta son la misma persona para el servidor.
