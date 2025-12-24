# 🚀 Project Roadmap: Spotify AI Stats (Broslunas App)

## 🛠 Fase 0: Configuración Inicial & Entorno
- [ ] **Inicializar Proyecto:** Crear app con `npx create-next-app@latest` (TS, Tailwind, ESLint).
- [ ] **Instalar Dependencias Core:**
    - `npm install @supabase/supabase-js @supabase/auth-helpers-nextjs`
    - `npm install next-auth`
    - `npm install gsap` (Animaciones)
    - `npm install lucide-react` (Iconos)
    - `npm install zustand` (Gestor de estado ligero)
    - `npm install clsx tailwind-merge` (Utilidades para clases CSS condicionales)
- [ ] **Configuración de Estilos:**
    - [ ] Configurar `tailwind.config.ts` con la paleta de colores y fuentes.
    - [ ] Crear clase base `.glass-panel` en `globals.css` (backdrop-filter, bordes, sombras).
- [ ] **Variables de Entorno:** Crear `.env.local` con keys de Supabase, NextAuth y Spotify.

## 🗄 Fase 1: Backend & Base de Datos (Supabase)
- [ ] **Crear Proyecto en Supabase.**
- [ ] **Definir Tablas SQL:**
    - [ ] Tabla `users` (Extendiendo auth.users o vinculada).
    - [ ] Enum `privacy_status` ('private', 'mixed', 'public').
    - [ ] Tabla `privacy_settings` (FK a users).
    - [ ] Tabla `stats_snapshots` (Para guardar históricos jsonb).
- [ ] **Políticas de Seguridad (RLS):**
    - [ ] Configurar RLS para que usuarios solo editen su propio perfil.
    - [ ] Configurar RLS de lectura basada en el estado `privacy_status` (amigos vs público).

## 🔐 Fase 2: Autenticación & Spotify API
- [ ] **Spotify Developer Dashboard:**
    - [ ] Crear app en Spotify dev dashboard.
    - [ ] Obtener `Client ID` y `Client Secret`.
    - [ ] Configurar Redirect URIs.
- [ ] **NextAuth Setup:**
    - [ ] Configurar `[...nextauth]/route.ts`.
    - [ ] Implementar **Rotation Refresh Token Strategy** (Vital para que no expire la sesión).
    - [ ] Personalizar la callback de `session` para incluir el ID de usuario y Token.
- [ ] **Middleware:** Proteger rutas `/dashboard` y `/chat`.

## 🎨 Fase 3: Layout & Navegación (UI Core)
- [ ] **Componentes Base:**
    - [ ] Crear componente `GlassCard`.
    - [ ] Crear componente `Button` (variantes primary/neon, ghost).
- [ ] **Navegación Responsiva:**
    - [ ] **Desktop/Tablet:** Implementar "Dock Flotante" inferior (centrado, animado con GSAP).
    - [ ] **Móvil:** Implementar "Header Sticky" superior + Menú Hamburguesa.
- [ ] **Efectos:** Integrar GSAP para transiciones de página suaves.

## 📊 Fase 4: Dashboard & Widgets (Bento Grid)
- [ ] **Lógica de Datos:**
    - [ ] Crear servicio/hook `useSpotifyStats`.
    - [ ] Implementar "Auto-Sync" (Perfil + Top 5) al montar componente.
    - [ ] Implementar "Full-Sync" (Botón manual) para análisis profundo.
- [ ] **Desarrollo de Widgets:**
    - [ ] **Widget Resumen:** (Días/Horas/Minutos).
    - [ ] **Widget Top Tracks:** Lista con scroll y portadas pequeñas.
    - [ ] **Widget Top Artists:** Grid de avatares circulares.
    - [ ] **Widget Chart:** Gráfico de géneros (usando Recharts o CSS puro).
    - [ ] **Widget Obscurity/Vibe:** (Opcional) Datos curiosos.

## 🤖 Fase 5: Chatbot UI (Integration Ready)
- [ ] **Store Global:** Configurar Zustand para manejar el estado del chat (mensajes, isOpen).
- [ ] **Componente Burbuja:** Botón flotante en `layout.tsx` (bottom-right).
- [ ] **Componente Chat Modal/Panel:** La interfaz que se abre al clicar la burbuja.
- [ ] **Página `/chat`:** Vista dedicada a pantalla completa.
- [ ] **Sincronización:** Asegurar que si escribo en la burbuja, aparece en la página y viceversa.

## 👥 Fase 6: Funciones Sociales & Exportación
- [ ] **Sistema de Perfiles:** Ruta dinámica `user/[id]`.
- [ ] **Lógica de Privacidad:** Validar si el usuario visitante puede ver los datos (Public vs Private).
- [ ] **Share Card:**
    - [ ] Crear componente visual específico para exportar (formato Story de Instagram).
    - [ ] Integrar librería para convertir HTML a PNG/JPG.

## 🚀 Fase 7: Polish & Deploy
- [ ] **Testing:** Verificar flujo de login y errores de API de Spotify.
- [ ] **Optimización:** Lazy loading de componentes pesados (gráficos).
- [ ] **Deploy:** Subir a Vercel.
- [ ] **Configurar Variables de Producción:** Actualizar URL de callback en Spotify Dashboard.