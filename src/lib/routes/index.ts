// URL base de la API. Fuente de verdad única (la reusa también apiClient en
// src/lib/axios.ts) para que no vuelvan a desincronizarse.
//   - En build (prod/dev del workflow) se hornea NEXT_PUBLIC_API_URL
//     (main => https://negora.dveloxsoft.com/api/v2).
//   - En local sin .env, cae a este default. Debe ser un host VIVO: antes era
//     psearch.dveloxsoft.com, que dejó de resolver tras la migración a negora,
//     y por eso el popup de Google (authRoutes.google) y el resto de rutas
//     absolutas apuntaban a un dominio muerto. Para apuntar a un backend local
//     crea un .env.local con NEXT_PUBLIC_API_URL (ver .env.local del repo).
export const BASIC_ROUTE = process.env.NEXT_PUBLIC_API_URL || 'https://negora.dveloxsoft.com/api/v2'
export const LOCAL_ROUTE = 'http://localhost:3000'
