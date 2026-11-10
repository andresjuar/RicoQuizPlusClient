/**
 * Plantilla de entorno del cliente.
 *
 * Cómo usarlo: copia este archivo como `environment.ts` (producción) y como
 * `environment.development.ts` (desarrollo, con `production: false`) y reemplaza los placeholders.
 *
 * El cliente NO guarda secretos: la URL de la API y el client ID de Google son identificadores
 * públicos (viajan al navegador de todos modos). Los secretos reales (JWT_SECRET, URI de Mongo,
 * llaves de Gemini, Cloudinary y Brevo) viven solo en el .env de la API, en Render, y nunca van en este repo.
 */
export const environment = {
  production: true,
  apiUrl: 'https://TU-API.onrender.com',
  socketUrl: 'https://TU-API.onrender.com',
  socketNamespace: '/matches',
  googleClientId: 'TU_CLIENT_ID.apps.googleusercontent.com',
};
