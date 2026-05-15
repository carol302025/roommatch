# RoomMatch — Documentación Técnica TFC
**Universidad Francisco de Vitoria · Grado en Ingeniería Informática**
**Autora:** Carol · **Fecha:** Mayo 2026

---

## 1. Descripción del Proyecto

**RoomMatch** es una plataforma web de búsqueda de piso compartido que conecta a **inquilinos** (personas que buscan habitación) con **propietarios** (personas que publican habitaciones).

A diferencia de plataformas generalistas como Idealista o Fotocasa, RoomMatch aplica un **algoritmo de compatibilidad de estilo de vida** basado en KPIs (indicadores clave), de forma que el inquilino ve primero las habitaciones que mejor se ajustan a su personalidad, hábitos y preferencias, no solo a su presupuesto o localización.

### Problema que resuelve
El proceso de encontrar piso compartido es frustrante: miles de anuncios, filtros solo por precio y zona, y una alta tasa de incompatibilidad entre compañeros de piso que acaba en conflictos o abandonos tempranos. RoomMatch ataca el problema de raíz: **el matching de personas, no solo de inmuebles**.

### Diferencias con otras plataformas

| Característica | Idealista / Fotocasa | RoomMatch |
|---|---|---|
| Filtro por precio y zona | ✓ | ✓ |
| Algoritmo de compatibilidad de estilo de vida | ✗ | ✓ |
| Perfil de personalidad del inquilino | ✗ | ✓ |
| Score de compatibilidad visible | ✗ | ✓ |
| Mensajería integrada | ✗ | ✓ |
| Verificación antiestafa de usuarios | ✗ | ✓ (badge verificado) |
| Sistema de favoritos | ✗ | ✓ |

---

## 2. Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Framework principal de UI |
| React Router DOM | 6 | Navegación entre páginas (SPA) |
| Create React App | — | Scaffolding y bundling |
| CSS puro | — | Estilos propios sin librerías externas |
| Fetch API | nativa | Llamadas HTTP al backend |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.11+ | Lenguaje del servidor |
| FastAPI | 0.110+ | Framework REST API |
| SQLAlchemy | 2.x | ORM para la base de datos |
| Pydantic v2 | 2.x | Validación de datos y schemas |
| python-jose | — | Generación y verificación de JWT |
| bcrypt / passlib | — | Hash seguro de contraseñas |
| Uvicorn | — | Servidor ASGI |

### Base de datos
| Tecnología | Uso |
|---|---|
| PostgreSQL | Base de datos relacional principal |
| Supabase | Hosting gestionado de PostgreSQL |

### Infraestructura / DevOps
| Servicio | Uso |
|---|---|
| GitHub | Control de versiones (repo: carol302025/roommatch) |
| Railway | Despliegue del backend (FastAPI) |
| Vercel | Despliegue del frontend (React) |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────┐
│           USUARIO (Navegador)        │
│         React SPA (Vercel)          │
│   puerto 3000 (dev) / dominio vercel│
└────────────────┬────────────────────┘
                 │ HTTP/HTTPS (JSON)
                 │ Authorization: Bearer <JWT>
┌────────────────▼────────────────────┐
│         BACKEND (Railway)           │
│         FastAPI + Uvicorn           │
│         puerto 8000                 │
│                                     │
│  Routers:                           │
│   /usuarios  → auth, perfiles       │
│   /habitaciones → CRUD pisos        │
│   /mensajes  → chat                 │
│   /favoritos → lista favoritos      │
└────────────────┬────────────────────┘
                 │ SQLAlchemy ORM
┌────────────────▼────────────────────┐
│         BASE DE DATOS               │
│     PostgreSQL en Supabase          │
│                                     │
│  Tablas:                            │
│   usuario                           │
│   perfil_inquilino                  │
│   preferencias_inquilino            │
│   habitacion                        │
│   preferencias_casa                 │
│   mensaje                           │
│   favoritos                         │
└─────────────────────────────────────┘
```

### Patrón de arquitectura
- **Backend:** REST API stateless con autenticación por JWT
- **Frontend:** Single Page Application (SPA) con React Router
- **Comunicación:** JSON sobre HTTPS
- **Autenticación:** Bearer Token en cada petición protegida

---

## 4. Base de Datos

### Diagrama de entidades

```
usuario (1) ──────────── (0..1) perfil_inquilino (1) ── (0..1) preferencias_inquilino
   │
   │ (1) ─────────────── (N) habitacion (1) ──────────── (0..1) preferencias_casa
   │
   │ (1) ─────────────── (N) favoritos ─── (N..1) habitacion
   │
   │ (1) ─────────────── (N) mensaje (emisor)
   │ (1) ─────────────── (N) mensaje (receptor)
```

### Tabla: `usuario`

| Columna | Tipo | Descripción |
|---|---|---|
| id | INTEGER PK | Identificador único |
| nombre | VARCHAR(30) | Nombre del usuario |
| email | VARCHAR(100) UNIQUE | Email (login) |
| password_hash | VARCHAR(255) | Contraseña hasheada con bcrypt |
| rol | ENUM | `inquilino` / `propietario` / `admin` |
| telefono | VARCHAR(20) | Teléfono de contacto (opcional) |
| foto_perfil | TEXT | URL de la foto de perfil (opcional) |
| activo | BOOLEAN | Soft delete (false = cuenta desactivada) |
| email_verificado | BOOLEAN | Badge antiestafa de usuario verificado |
| notificaciones_activas | BOOLEAN | Preferencia de notificaciones |
| created_at | TIMESTAMP | Fecha de registro |

### Tabla: `perfil_inquilino`

Datos de personalidad y estilo de vida del inquilino. Se crea automáticamente al registrarse como inquilino.

| Columna | Tipo | Valores posibles |
|---|---|---|
| id | INTEGER PK | — |
| usuario_id | INTEGER FK | → usuario.id |
| edad | INTEGER | 18–99 |
| bio | TEXT | Texto libre (max 500 chars) |
| genero | VARCHAR(20) | hombre / mujer / no_binario / prefiero_no_decir |
| fumador | BOOLEAN | — |
| tiene_mascota | BOOLEAN | — |
| estilo_vida | VARCHAR(50) | activo / relajado / equilibrado |
| tipo_persona | VARCHAR(20) | estudiante / trabajador / teletrabajador / nocturno |
| nivel_ruido | VARCHAR(20) | silencioso / tranquilo / animado |
| nivel_orden | VARCHAR(20) | alto / medio / flexible |
| horario | VARCHAR(20) | madrugador / normal / noctambulo |
| tiene_visitas | BOOLEAN | — |
| sociabilidad | VARCHAR(20) | introvertido / equilibrado / extrovertido |

### Tabla: `preferencias_inquilino`

Criterios de búsqueda del inquilino (para el matching).

| Columna | Tipo | Descripción |
|---|---|---|
| id | INTEGER PK | — |
| perfil_inquilino_id | INTEGER FK | → perfil_inquilino.id |
| presupuesto_min | INTEGER | Precio mínimo mensual (€) |
| presupuesto_max | INTEGER | Precio máximo mensual (€) |
| ciudad_preferida | VARCHAR(60) | Ciudad donde busca |
| genero_preferido | VARCHAR(10) | Género de compañeros preferido |
| tipo_inquilino | VARCHAR(20) | Tipo de perfil de compañero buscado |
| fumador_permitido | BOOLEAN | Acepta fumadores |
| mascotas_permitidas | BOOLEAN | Acepta mascotas |
| visitas_permitidas | BOOLEAN | Acepta visitas |
| gastos_incluidos | BOOLEAN | Prefiere gastos incluidos |

### Tabla: `habitacion`

Anuncio publicado por un propietario.

| Columna | Tipo | Descripción |
|---|---|---|
| id | INTEGER PK | — |
| titulo | VARCHAR(100) | Título del anuncio |
| descripcion | TEXT | Descripción libre |
| precio | NUMERIC(10,2) | Precio mensual en euros |
| ciudad | VARCHAR(60) | Ciudad (indexada) |
| direccion | VARCHAR(120) | Dirección completa (opcional) |
| foto_url | TEXT | URL de la foto (opcional) |
| lat | FLOAT | Latitud (para mapa futuro) |
| lon | FLOAT | Longitud (para mapa futuro) |
| disponible | BOOLEAN | Si la habitación está disponible |
| created_at | TIMESTAMP | Fecha de publicación |
| propietario_id | INTEGER FK | → usuario.id |

### Tabla: `preferencias_casa`

Preferencias del propietario sobre el inquilino ideal. Son los KPIs del lado del casa.

| Columna | Tipo | Valores posibles |
|---|---|---|
| id | INTEGER PK | — |
| habitacion_id | INTEGER FK | → habitacion.id |
| mascotas_permitidas | BOOLEAN | — |
| fumar_permitido | BOOLEAN | — |
| preferencia_genero | VARCHAR(10) | hombre / mujer / indiferente |
| numero_companeros | INTEGER | Nº de compañeros actuales |
| tipo_inquilino | VARCHAR(20) | Tipo de inquilino que buscan |
| gastos_incluidos | BOOLEAN | — |
| perfil_buscado | VARCHAR(20) | estudiante / trabajador / cualquiera |
| ambiente_casa | VARCHAR(20) | tranquilo / animado / flexible |
| orden_esperado | VARCHAR(20) | alto / medio / flexible |
| horario_casa | VARCHAR(20) | madrugador / normal / noctambulo / flexible |
| acepta_visitas | BOOLEAN | True / False / NULL (indiferente) |

### Tabla: `mensaje`

Mensajes del chat entre usuarios.

| Columna | Tipo | Descripción |
|---|---|---|
| id | INTEGER PK | — |
| emisor_id | INTEGER FK | → usuario.id |
| receptor_id | INTEGER FK | → usuario.id |
| contenido | TEXT | Texto del mensaje |
| leido | BOOLEAN | Si el receptor lo ha leído |
| fecha | TIMESTAMP | Fecha y hora del envío |
| eliminado_por_emisor | BOOLEAN | Soft delete lado emisor |
| eliminado_por_receptor | BOOLEAN | Soft delete lado receptor |

### Tabla: `favoritos`

Habitaciones guardadas por inquilinos.

| Columna | Tipo | Descripción |
|---|---|---|
| id | INTEGER PK | — |
| usuario_id | INTEGER FK | → usuario.id |
| habitacion_id | INTEGER FK | → habitacion.id |
| created_at | TIMESTAMP | Fecha en que se guardó |

Restricción única: `(usuario_id, habitacion_id)` — un usuario no puede guardar el mismo piso dos veces.

---

## 5. API — Endpoints

### Autenticación
Todos los endpoints protegidos requieren: `Authorization: Bearer <token>`

### `/usuarios` — Gestión de usuarios

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/usuarios/registro` | No | Registro de nuevo usuario |
| POST | `/usuarios/login` | No | Login → devuelve JWT |
| GET | `/usuarios/me` | Sí | Obtener perfil propio |
| PUT | `/usuarios/me` | Sí | Actualizar nombre, email, teléfono, foto |
| PUT | `/usuarios/me/password` | Sí | Cambiar contraseña |
| PUT | `/usuarios/me/notificaciones` | Sí | Activar/desactivar notificaciones |
| DELETE | `/usuarios/me` | Sí | Desactivar cuenta (soft delete) |
| GET | `/usuarios/me/perfil-inquilino` | Sí | Obtener perfil de estilo de vida |
| PUT | `/usuarios/me/perfil-inquilino` | Sí | Actualizar perfil de estilo de vida |
| GET | `/usuarios/me/preferencias` | Sí | Obtener preferencias de búsqueda |
| PUT | `/usuarios/me/preferencias` | Sí | Actualizar preferencias de búsqueda |
| GET | `/usuarios/{id}/publico` | No | Perfil público de cualquier usuario |
| GET | `/usuarios/{id}/compatibilidad` | Sí | Score de compatibilidad propietario↔inquilino |
| POST | `/usuarios/recuperar-password` | No | Solicitar reset de contraseña |
| POST | `/usuarios/reset-password` | No | Aplicar nueva contraseña con token |

### `/habitaciones` — Gestión de pisos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/habitaciones/` | No | Listar todas las habitaciones disponibles |
| POST | `/habitaciones/` | Sí (propietario) | Publicar nueva habitación (paso 1) |
| GET | `/habitaciones/mis-pisos` | Sí (propietario) | Mis habitaciones publicadas |
| GET | `/habitaciones/matches` | Sí (inquilino) | Habitaciones con score de compatibilidad |
| GET | `/habitaciones/{id}` | No | Detalle de una habitación |
| PUT | `/habitaciones/{id}` | Sí (propietario) | Editar habitación |
| DELETE | `/habitaciones/{id}` | Sí (propietario) | Eliminar habitación |
| POST | `/habitaciones/{id}/preferencias` | Sí (propietario) | Guardar preferencias de casa (paso 2) |
| PUT | `/habitaciones/{id}/preferencias` | Sí (propietario) | Actualizar preferencias de casa |
| GET | `/habitaciones/{id}/preferencias` | No | Ver preferencias de una habitación |

### `/mensajes` — Mensajería

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/mensajes/` | Sí | Enviar mensaje a otro usuario |
| GET | `/mensajes/` | Sí | Listar conversaciones (último mensaje de cada una) |
| GET | `/mensajes/{usuario_id}` | Sí | Obtener todos los mensajes con un usuario |
| PUT | `/mensajes/{usuario_id}/leido` | Sí | Marcar conversación como leída |

### `/favoritos` — Favoritos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/favoritos/{habitacion_id}` | Sí | Guardar habitación en favoritos |
| DELETE | `/favoritos/{habitacion_id}` | Sí | Eliminar de favoritos |
| GET | `/favoritos/` | Sí | Listar mis habitaciones favoritas |

---

## 6. Algoritmo de Matching (KPI-based)

El núcleo diferencial de RoomMatch es su algoritmo de compatibilidad. Se ejecuta en el endpoint `/habitaciones/matches` y calcula un **score del 0 al 100** para cada habitación disponible según el perfil del inquilino autenticado.

### Función `_calcular_score`

**Archivo:** `backend/routers/habitaciones.py`

El algoritmo puntúa 9 KPIs comparando las preferencias de la casa (`PreferenciasCasa`) con el perfil del inquilino (`PerfilInquilino` + `PreferenciasInquilino`):

### KPIs evaluados

| KPI | Puntos | Lógica |
|---|---|---|
| **Presupuesto** | 25 pts | Si el precio de la habitación está dentro del rango presupuesto_min/max del inquilino → 25 pts |
| **Mascotas** | 10 pts | Si ambos coinciden (tiene_mascota del inquilino ↔ mascotas_permitidas de la casa) |
| **Fumador** | 10 pts | Si ambos coinciden (fumador del inquilino ↔ fumar_permitido de la casa) |
| **Tipo de perfil** | 15 pts | Si perfil_buscado de la casa coincide con tipo_persona del inquilino (o la casa acepta "cualquiera") |
| **Ambiente de casa** | 10 pts | Si ambiente_casa de la casa coincide con nivel_ruido del inquilino |
| **Orden** | 10 pts | Si orden_esperado de la casa coincide con nivel_orden del inquilino |
| **Horario** | 10 pts | Si horario_casa coincide con horario del inquilino |
| **Visitas** | 5 pts | Si acepta_visitas de la casa coincide con tiene_visitas del inquilino |
| **Ciudad** | 5 pts | Si la ciudad de la habitación coincide con ciudad_preferida del inquilino |

**Total máximo: 100 puntos**

### Clasificación del score

| Score | Color | Etiqueta |
|---|---|---|
| ≥ 80 | Verde | Alta compatibilidad |
| 50 – 79 | Naranja | Compatibilidad media |
| < 50 | Gris | Poca compatibilidad |

### Dónde se muestra

1. **Home del inquilino:** cada tarjeta de habitación muestra el badge coloreado con el porcentaje
2. **Mensajes (propietario):** al abrir un chat con un inquilino, el propietario ve el score de compatibilidad de ese inquilino con su mejor habitación disponible

---

## 7. Autenticación y Seguridad

### JWT (JSON Web Token)
- Al hacer login, el backend genera un token JWT firmado con una clave secreta
- El token incluye: `sub` (id usuario), `rol`, `email`, y una expiración de 7 días
- El frontend lo guarda en `localStorage` y lo envía en cada petición: `Authorization: Bearer <token>`

### Contraseñas
- Nunca se almacena la contraseña en texto plano
- Se usa **bcrypt** via `passlib` para hashear y verificar contraseñas

### Control de roles
- El backend verifica el rol del usuario en cada endpoint que lo requiere
- Ejemplo: solo un `propietario` puede publicar habitaciones; solo el propietario dueño de una habitación puede editarla

### Sistema antiestafa
- Campo `email_verificado` en la tabla `usuario`
- Los usuarios verificados muestran un **badge verde "✓ Verificado"** en:
  - Su perfil público (`/usuario/:id`)
  - El chat (cabecera de la conversación)
- Previene la suplantación de identidad y perfiles falsos

### Soft delete
- Los usuarios no se eliminan físicamente: se marca `activo = False`
- Los mensajes tienen `eliminado_por_emisor` / `eliminado_por_receptor` para borrado lógico

---

## 8. Frontend — Páginas y Funcionalidades

### Estructura de carpetas
```
roommatch-frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.js        ← Estado global de autenticación (usuario, token, rol)
│   ├── services/
│   │   └── api.js                ← Todas las llamadas al backend
│   ├── pages/
│   │   ├── Login/                ← Pantalla de acceso
│   │   ├── Registro/             ← Crear cuenta (inquilino / propietario)
│   │   ├── Home/                 ← Dashboard principal
│   │   ├── Perfil/               ← Mi perfil (datos básicos + foto)
│   │   ├── MiPerfil/             ← Perfil de estilo de vida (inquilino)
│   │   ├── MisPreferencias/      ← Preferencias de búsqueda (inquilino)
│   │   ├── BuscarPisos/          ← Listado con filtros (todos los usuarios)
│   │   ├── DetallePiso/          ← Ficha completa de una habitación
│   │   ├── PublicarPiso/         ← Publicar nueva habitación (propietario, 2 pasos)
│   │   ├── EditarPiso/           ← Editar habitación existente (propietario)
│   │   ├── MisPisos/             ← Gestión de mis habitaciones (propietario)
│   │   ├── MisFavoritos/         ← Habitaciones guardadas (inquilino)
│   │   ├── Mensajes/             ← Sistema de mensajería con chat
│   │   ├── PerfilPublico/        ← Perfil público de cualquier usuario
│   │   └── ResetPassword/        ← Restablecer contraseña
│   └── index.css                 ← Estilos globales (chips, botones comunes)
```

### Página a página

#### Login y Registro
- Login con email + contraseña, redirige según rol (inquilino → Home con matches / propietario → Home con sus pisos)
- Registro con selección de rol mediante chips visuales
- Recuperación de contraseña por email

#### Home (Dashboard)
- **Inquilino:** muestra habitaciones ordenadas por score de compatibilidad (mayor a menor), con badge de color por cada tarjeta
- **Propietario:** muestra sus habitaciones publicadas con estado (disponible / no disponible) y acceso a estadísticas
- Barra de navegación superior con accesos a mensajes, perfil, etc.
- Indicador de mensajes no leídos en tiempo real

#### Perfil
- Foto de perfil (URL), nombre, email, teléfono
- Cambio de contraseña
- Activar/desactivar notificaciones
- Desactivar cuenta

#### Mi Perfil (Inquilino)
- Formulario completo con chips interactivos para seleccionar:
  - Tipo de persona (estudiante, trabajador, teletrabajador, noctámbulo)
  - Nivel de ruido, nivel de orden, horario
  - Sociabilidad, estilo de vida
  - Si fuma, si tiene mascota, si recibe visitas
  - Edad, género, bio

#### Mis Preferencias (Inquilino)
- Presupuesto mínimo y máximo
- Ciudad preferida
- Preferencias de convivencia (fumadores, mascotas, visitas)
- Si requiere gastos incluidos

#### Buscar Pisos
- Disponible para todos los roles
- Filtros por ciudad y precio (rango min-max)
- Tarjetas con foto, título, precio, ciudad y badge de compatibilidad (solo inquilinos)

#### Detalle Piso
- Foto, descripción completa, precio, ciudad, dirección
- Preferencias de la casa (perfil buscado, ambiente, orden, horario, mascotas, fumar, visitas)
- Botón "Contactar" → redirige a Mensajes con ese propietario abierto
- Sistema de favoritos (solo inquilinos)

#### Publicar Piso (2 pasos)
- **Paso 1:** título, descripción, precio, ciudad, dirección, foto
- **Paso 2 (KPIs):** perfil buscado, ambiente de casa, orden esperado, horario de casa, acepta visitas — todo con chips interactivos

#### Editar Piso
- Misma estructura que PublicarPiso
- Carga los datos actuales al entrar y permite modificarlos

#### Mensajes
- Columna izquierda: lista de conversaciones con preview del último mensaje
- Columna derecha: chat con burbujas (propios / ajenos)
- Cabecera del chat muestra: nombre del interlocutor, badge "✓ Verificado" si aplica, badge de compatibilidad (solo para propietarios)
- Auto-scroll al último mensaje
- Marcado automático como leído al abrir conversación

#### Mis Favoritos
- Grid de habitaciones guardadas
- Botón para eliminar de favoritos
- Acceso directo al detalle de cada piso

#### Perfil Público
- Nombre, foto, rol, teléfono, fecha de registro
- Badge "✓ Verificado" si el usuario está verificado

---

## 9. Componente ChipGroup

Componente reutilizable creado para la selección de opciones de estilo de vida en múltiples páginas.

```jsx
function ChipGroup({ opciones, valor, onChange }) {
    return (
        <div className="chip-group">
            {opciones.map(op => (
                <button
                    key={op.value}
                    type="button"
                    className={`chip ${valor === op.value ? 'activo' : ''}`}
                    onClick={() => onChange(op.value === valor ? '' : op.value)}
                >
                    {op.label}
                </button>
            ))}
        </div>
    );
}
```

Usado en: `PublicarPiso`, `EditarPiso`, `MiPerfil`, `MisPreferencias`, `Registro`.

---

## 10. Flujos de Usuario

### Flujo Inquilino
```
Registro (rol: inquilino)
    ↓
Home → ve habitaciones con score de compatibilidad
    ↓
Completar Perfil → estilo de vida (MiPerfil)
    ↓
Completar Preferencias → presupuesto, ciudad (MisPreferencias)
    ↓
Matches mejoran automáticamente
    ↓
Detalle Piso → guardar en favoritos / contactar propietario
    ↓
Mensajes → chat directo con propietario
```

### Flujo Propietario
```
Registro (rol: propietario)
    ↓
Home → ve sus habitaciones publicadas
    ↓
Publicar Piso (paso 1: datos) → (paso 2: KPIs de convivencia)
    ↓
MisPisos → gestionar, editar, activar/desactivar
    ↓
Mensajes → recibe contactos de inquilinos
    ↓
Al abrir chat → ve score de compatibilidad del inquilino
    ↓
Perfil Público del inquilino → ver su información y badge verificado
```

---

## 11. Decisiones de Diseño Relevantes

### ¿Por qué FastAPI?
- Documentación automática (Swagger UI en `/docs`)
- Validación automática con Pydantic
- Rendimiento superior a Flask para APIs REST
- Soporte nativo para async

### ¿Por qué Supabase?
- PostgreSQL gestionado sin coste de mantenimiento
- Fácil acceso desde Railway (variable de entorno `DATABASE_URL`)
- Panel web para consultas SQL directas

### ¿Por qué soft delete en usuarios?
- Los mensajes enviados y las habitaciones publicadas deben seguir visibles aunque la cuenta se desactive
- Permite recuperar cuentas si el usuario lo solicita

### ¿Por qué el matching está en el backend?
- Los datos del perfil son privados y no deben enviarse al cliente
- El cálculo sobre múltiples habitaciones sería ineficiente en el navegador
- Permite escalar el algoritmo sin tocar el frontend

### Propietario puede buscar pisos
- Decisión consciente: un propietario puede querer explorar el mercado o buscar para un familiar
- No se restringe el acceso a BuscarPisos por rol

---

## 12. Estructura del Repositorio

```
roommatch/                          ← Repositorio principal (GitHub: carol302025/roommatch)
├── backend/
│   ├── main.py                     ← Punto de entrada FastAPI
│   ├── database.py                 ← Conexión a PostgreSQL (SQLAlchemy)
│   ├── models.py                   ← Modelos ORM (tablas)
│   ├── schemas.py                  ← Schemas Pydantic (validación)
│   ├── auth.py                     ← JWT, bcrypt
│   ├── dependencies.py             ← get_current_user
│   ├── requirements.txt            ← Dependencias Python
│   └── routers/
│       ├── usuarios.py             ← Endpoints de usuario y compatibilidad
│       ├── habitaciones.py         ← Endpoints de pisos y algoritmo matching
│       ├── mensajes.py             ← Endpoints de mensajería
│       └── favoritos.py            ← Endpoints de favoritos
└── roommatch-frontend/
    ├── public/
    ├── src/
    │   ├── context/AuthContext.js
    │   ├── services/api.js
    │   ├── pages/                  ← Una carpeta por página (JS + CSS)
    │   ├── App.js                  ← Rutas de React Router
    │   └── index.css               ← Estilos globales
    └── package.json
```

---

## 13. Variables de Entorno

### Backend (`.env`) — NO subir a GitHub
```
DATABASE_URL=postgresql://usuario:password@host:5432/database
SECRET_KEY=clave_secreta_para_jwt
```

### Frontend
- La URL del backend se configura en `src/services/api.js` mediante la constante `BASE_URL`

---

## 14. Resumen de Funcionalidades Implementadas

| # | Funcionalidad | Estado |
|---|---|---|
| 1 | Registro e inicio de sesión con JWT | ✅ |
| 2 | Dos roles: inquilino y propietario | ✅ |
| 3 | Perfil de estilo de vida del inquilino (9 KPIs) | ✅ |
| 4 | Preferencias de búsqueda del inquilino | ✅ |
| 5 | Publicar habitación (2 pasos con KPIs de casa) | ✅ |
| 6 | Editar habitación | ✅ |
| 7 | Eliminar habitación | ✅ |
| 8 | Algoritmo de matching con score 0-100 | ✅ |
| 9 | Home con habitaciones ordenadas por compatibilidad | ✅ |
| 10 | Badge de compatibilidad con colores (verde/naranja/gris) | ✅ |
| 11 | Buscar pisos con filtros de ciudad y precio | ✅ |
| 12 | Detalle completo de habitación | ✅ |
| 13 | Sistema de favoritos | ✅ |
| 14 | Mensajería en tiempo real (polling) | ✅ |
| 15 | Badge "✓ Verificado" antiestafa | ✅ |
| 16 | Perfil público de usuarios | ✅ |
| 17 | Score de compatibilidad en chat (propietario) | ✅ |
| 18 | Recuperación de contraseña por token | ✅ |
| 19 | Soft delete de cuentas | ✅ |
| 20 | Indicador de mensajes no leídos | ✅ |

---

## 15. Manual de Usuario

### 15.1 Registro e inicio de sesión

#### Crear una cuenta nueva
1. Abre la aplicación y haz clic en **"Crear cuenta"**
2. Introduce tu nombre, email y contraseña (mínimo 6 caracteres)
3. Selecciona tu rol:
   - **Inquilino** → si buscas habitación
   - **Propietario** → si tienes una habitación para alquilar
4. Opcionalmente añade tu teléfono de contacto
5. Haz clic en **"Registrarme"**

#### Iniciar sesión
1. Introduce tu email y contraseña
2. Haz clic en **"Entrar"**
3. Serás redirigido automáticamente a tu página principal según tu rol

#### Recuperar contraseña
1. En la pantalla de login, haz clic en **"¿Olvidaste tu contraseña?"**
2. Introduce tu email
3. Recibirás un enlace de recuperación (en modo desarrollo aparece en los logs del servidor)
4. Haz clic en el enlace e introduce tu nueva contraseña

---

### 15.2 Manual del Inquilino

#### Completar tu perfil de estilo de vida
Es muy importante completar este perfil para que el algoritmo pueda encontrarte las mejores habitaciones.

1. Ve a **"Mi perfil"** → **"Editar perfil de convivencia"**
2. Rellena tus datos personales: edad, género, bio
3. Selecciona tus hábitos usando los chips de colores:
   - **¿Fumas?** → Sí / No
   - **¿Tienes mascota?** → Sí / No
   - **Tipo de persona** → Estudiante / Trabajador / Teletrabajador / Noctámbulo
   - **Nivel de ruido** → Silencioso / Tranquilo / Animado
   - **Nivel de orden** → Alto / Medio / Flexible
   - **Horario** → Madrugador / Normal / Noctámbulo
   - **¿Recibes visitas?** → Sí / No
   - **Sociabilidad** → Introvertido / Equilibrado / Extrovertido
4. Haz clic en **"Guardar"**

#### Configurar tus preferencias de búsqueda
1. Ve a **"Mi perfil"** → **"Mis preferencias"**
2. Indica tu presupuesto mensual (mínimo y máximo en €)
3. Escribe la ciudad donde buscas habitación
4. Marca tus requisitos: fumadores, mascotas, visitas, gastos incluidos
5. Haz clic en **"Guardar preferencias"**

#### Ver habitaciones con compatibilidad
1. En el **Home**, verás todas las habitaciones disponibles ordenadas de mayor a menor compatibilidad contigo
2. Cada tarjeta muestra un **badge de color**:
   - 🟢 **Verde** (≥80%) → Alta compatibilidad
   - 🟠 **Naranja** (50-79%) → Compatibilidad media
   - ⚫ **Gris** (<50%) → Poca compatibilidad
3. Cuanto más completo tengas tu perfil, más precisos serán los porcentajes

#### Buscar pisos con filtros
1. Haz clic en **"Buscar pisos"** en el menú
2. Usa los filtros para filtrar por **ciudad** y rango de **precio**
3. Los resultados se actualizan automáticamente al aplicar filtros

#### Ver el detalle de una habitación
1. Haz clic en cualquier tarjeta de habitación
2. Verás: foto, descripción, precio, ciudad, dirección
3. En la sección **"Lo que buscan"** podrás leer las preferencias del propietario
4. Puedes guardar la habitación en **favoritos** con el botón ❤️
5. Para contactar al propietario, haz clic en **"Contactar"**

#### Guardar y gestionar favoritos
1. En el detalle de cualquier habitación, haz clic en el corazón para guardarla
2. Accede a tus favoritos desde el menú → **"Mis favoritos"**
3. Para eliminar un favorito, haz clic en **"Eliminar"** dentro de la tarjeta

#### Enviar un mensaje a un propietario
1. En el detalle del piso, haz clic en **"Contactar"**
2. Serás llevado directamente al chat con ese propietario
3. Escribe tu mensaje en el campo inferior y pulsa **"Enviar"**
4. Puedes ver todos tus chats activos en el menú → **"Mensajes"**

---

### 15.3 Manual del Propietario

#### Publicar una habitación
El proceso tiene **dos pasos**:

**Paso 1 — Datos de la habitación:**
1. Ve a **"Mis pisos"** → **"Publicar nueva habitación"**
2. Introduce:
   - Título del anuncio (obligatorio)
   - Descripción
   - Precio mensual en euros (obligatorio)
   - Ciudad (obligatorio)
   - Dirección
   - URL de una foto
3. Haz clic en **"Siguiente"**

**Paso 2 — Perfil del inquilino buscado:**
1. Selecciona usando los chips qué tipo de inquilino buscas:
   - **Perfil buscado** → Estudiante / Trabajador / Cualquiera
   - **Ambiente de la casa** → Tranquilo / Animado / Flexible
   - **Orden esperado** → Alto / Medio / Flexible
   - **Horario de la casa** → Madrugador / Normal / Noctámbulo / Flexible
   - **¿Acepta visitas?** → Sí / No / Indiferente
2. Haz clic en **"Publicar habitación"**

> Cuanto más completes el paso 2, más preciso será el matching con los inquilinos.

#### Gestionar mis habitaciones
1. Accede a **"Mis pisos"** desde el menú
2. Verás todas tus habitaciones publicadas
3. Para cada habitación puedes:
   - **Editar** → modificar datos o preferencias
   - **Marcar como no disponible** → la habitación deja de aparecer en búsquedas pero no se elimina
   - **Eliminar** → se borra permanentemente

#### Responder mensajes de inquilinos
1. Accede a **"Mensajes"** desde el menú
2. Verás la lista de inquilinos que te han contactado
3. Al abrir un chat verás:
   - El nombre del inquilino
   - Badge **"✓ Verificado"** si su email está verificado
   - El **porcentaje de compatibilidad** del inquilino con tu mejor habitación disponible
4. Haz clic en el nombre del inquilino para ver su perfil público

#### Ver el perfil de un inquilino
1. En el chat, haz clic en el nombre del inquilino
2. Verás su información pública: nombre, rol, teléfono, fecha de registro
3. Si tiene el badge **"✓ Verificado"** significa que su identidad ha sido confirmada

---

### 15.4 Funciones comunes a todos los usuarios

#### Editar mi perfil
1. Ve a **"Mi perfil"** en el menú
2. Modifica nombre, email o teléfono
3. Para añadir foto de perfil, introduce la URL de una imagen en el campo correspondiente
4. Haz clic en **"Guardar cambios"**

#### Cambiar contraseña
1. Ve a **"Mi perfil"** → sección de contraseña
2. Introduce la contraseña actual
3. Introduce la nueva contraseña (mínimo 6 caracteres) y confírmala
4. Haz clic en **"Cambiar contraseña"**

#### Desactivar cuenta
1. Ve a **"Mi perfil"** → sección de cuenta
2. Haz clic en **"Desactivar cuenta"**
3. La cuenta queda desactivada (soft delete) — no se borran los mensajes ni los pisos publicados

---

## 16. Mejoras Futuras

Las siguientes funcionalidades no se han implementado en esta versión por limitaciones de tiempo, pero están identificadas como líneas de trabajo futuro:

### 16.1 Mejoras de alto impacto

| Mejora | Descripción | Justificación |
|---|---|---|
| **Notificaciones en tiempo real** | Usar WebSockets (ej. Socket.io) en lugar de recargar manualmente | Experiencia de chat más fluida |
| **Verificación de email automática** | Enviar email con enlace para activar `email_verificado` automáticamente | Actualmente el campo se activa manualmente en BD |
| **Subida de fotos directa** | Integrar Cloudinary o Supabase Storage para subir imágenes desde el dispositivo | Ahora solo se admite URL externa |
| **Mapa de habitaciones** | Mostrar habitaciones en un mapa interactivo usando Leaflet.js o Google Maps | Las columnas `lat` y `lon` ya están en el modelo |
| **Valoraciones y reseñas** | Sistema de puntuación entre propietarios e inquilinos tras una estancia | Aumenta la confianza en la plataforma |

### 16.2 Mejoras de matching

| Mejora | Descripción |
|---|---|
| **Ponderación dinámica** | Permitir al inquilino indicar qué KPIs son más importantes para él (ej. el presupuesto es crítico) |
| **Más KPIs** | Añadir: mascotas en la casa, idioma, ocupación de compañeros, internet incluido |
| **Matching bidireccional** | Calcular score también desde el lado del propietario hacia todos los inquilinos activos |
| **Historial de compatibilidad** | Guardar el score en base de datos para analizar tendencias |

### 16.3 Mejoras de seguridad

| Mejora | Descripción |
|---|---|
| **Verificación de identidad** | Integrar verificación con DNI digital o face recognition |
| **2FA (autenticación en dos pasos)** | Segundo factor via SMS o app de autenticación |
| **Rate limiting** | Limitar intentos de login para prevenir ataques de fuerza bruta |
| **HTTPS obligatorio** | En producción, forzar conexiones seguras (ya gestionado por Railway/Vercel) |

### 16.4 Mejoras de experiencia de usuario

| Mejora | Descripción |
|---|---|
| **App móvil (React Native)** | Versión nativa para iOS y Android |
| **Filtros avanzados en búsqueda** | Filtrar por KPIs: mascotas, fumadores, ambiente, etc. |
| **Notificaciones push** | Alertas cuando llega un nuevo mensaje |
| **Dark mode** | Tema oscuro para la interfaz |
| **Internacionalización (i18n)** | Soporte para inglés y otros idiomas |

### 16.5 Mejoras de infraestructura

| Mejora | Descripción |
|---|---|
| **CI/CD automático** | GitHub Actions para despliegue automático al hacer push a main |
| **Tests automatizados** | Tests unitarios para el algoritmo de matching con Pytest |
| **Panel de administración** | Interfaz para gestionar usuarios verificados, moderar anuncios |
| **Caché de resultados** | Redis para cachear los matches más consultados |

---

## 17. Anexo

### Anexo A — Instalación y ejecución en local

#### Requisitos previos
- Python 3.11 o superior
- Node.js 18 o superior
- Git
- Una base de datos PostgreSQL (o cuenta en Supabase)

#### Backend

```bash
# 1. Clonar el repositorio
git clone https://github.com/carol302025/roommatch.git
cd roommatch/backend

# 2. Crear entorno virtual
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Crear archivo .env con las variables de entorno
# DATABASE_URL=postgresql://usuario:password@host:5432/database
# SECRET_KEY=tu_clave_secreta_aqui

# 5. Arrancar el servidor
uvicorn main:app --reload --port 8000
```

El backend estará disponible en: `http://localhost:8000`
La documentación interactiva (Swagger): `http://localhost:8000/docs`

#### Frontend

```bash
# 1. Ir a la carpeta del frontend
cd roommatch/roommatch-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar la URL del backend en src/services/api.js
# const BASE_URL = 'http://localhost:8000'

# 4. Arrancar el servidor de desarrollo
npm start
```

El frontend estará disponible en: `http://localhost:3000`

---

### Anexo B — Esquema SQL de creación de tablas

```sql
-- Tipos ENUM
CREATE TYPE rolusuario AS ENUM ('inquilino', 'propietario', 'admin');

-- Tabla usuario
CREATE TABLE usuario (
    id                     SERIAL PRIMARY KEY,
    nombre                 VARCHAR(30) NOT NULL,
    email                  VARCHAR(100) NOT NULL UNIQUE,
    password_hash          VARCHAR(255) NOT NULL,
    rol                    rolusuario NOT NULL,
    telefono               VARCHAR(20),
    foto_perfil            TEXT,
    activo                 BOOLEAN DEFAULT TRUE,
    email_verificado       BOOLEAN DEFAULT FALSE,
    notificaciones_activas BOOLEAN DEFAULT TRUE,
    created_at             TIMESTAMP DEFAULT NOW()
);

-- Tabla perfil_inquilino
CREATE TABLE perfil_inquilino (
    id            SERIAL PRIMARY KEY,
    usuario_id    INTEGER NOT NULL UNIQUE REFERENCES usuario(id) ON DELETE CASCADE,
    edad          INTEGER CHECK (edad >= 18 AND edad <= 99),
    bio           TEXT,
    genero        VARCHAR(20),
    fumador       BOOLEAN DEFAULT FALSE,
    tiene_mascota BOOLEAN DEFAULT FALSE,
    estilo_vida   VARCHAR(50),
    tipo_persona  VARCHAR(20),
    nivel_ruido   VARCHAR(20),
    nivel_orden   VARCHAR(20),
    horario       VARCHAR(20),
    tiene_visitas BOOLEAN DEFAULT FALSE,
    sociabilidad  VARCHAR(20)
);

-- Tabla preferencias_inquilino
CREATE TABLE preferencias_inquilino (
    id                  SERIAL PRIMARY KEY,
    perfil_inquilino_id INTEGER NOT NULL UNIQUE REFERENCES perfil_inquilino(id) ON DELETE CASCADE,
    presupuesto_min     INTEGER,
    presupuesto_max     INTEGER,
    ciudad_preferida    VARCHAR(60),
    genero_preferido    VARCHAR(10),
    tipo_inquilino      VARCHAR(20),
    fumador_permitido   BOOLEAN DEFAULT FALSE,
    mascotas_permitidas BOOLEAN DEFAULT FALSE,
    visitas_permitidas  BOOLEAN DEFAULT FALSE,
    gastos_incluidos    BOOLEAN DEFAULT FALSE
);

-- Tabla habitacion
CREATE TABLE habitacion (
    id             SERIAL PRIMARY KEY,
    titulo         VARCHAR(100) NOT NULL,
    descripcion    TEXT,
    precio         NUMERIC(10,2) NOT NULL,
    ciudad         VARCHAR(60) NOT NULL,
    direccion      VARCHAR(120),
    foto_url       TEXT,
    lat            FLOAT,
    lon            FLOAT,
    disponible     BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMP DEFAULT NOW(),
    propietario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabla preferencias_casa
CREATE TABLE preferencias_casa (
    id                  SERIAL PRIMARY KEY,
    habitacion_id       INTEGER NOT NULL UNIQUE REFERENCES habitacion(id) ON DELETE CASCADE,
    mascotas_permitidas BOOLEAN DEFAULT FALSE,
    fumar_permitido     BOOLEAN DEFAULT FALSE,
    preferencia_genero  VARCHAR(10),
    numero_companeros   INTEGER,
    tipo_inquilino      VARCHAR(20),
    gastos_incluidos    BOOLEAN DEFAULT FALSE,
    perfil_buscado      VARCHAR(20),
    ambiente_casa       VARCHAR(20),
    orden_esperado      VARCHAR(20),
    horario_casa        VARCHAR(20),
    acepta_visitas      BOOLEAN
);

-- Tabla mensaje
CREATE TABLE mensaje (
    id                     SERIAL PRIMARY KEY,
    emisor_id              INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    receptor_id            INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    contenido              TEXT NOT NULL,
    leido                  BOOLEAN DEFAULT FALSE,
    fecha                  TIMESTAMP DEFAULT NOW(),
    eliminado_por_emisor   BOOLEAN DEFAULT FALSE,
    eliminado_por_receptor BOOLEAN DEFAULT FALSE
);

-- Tabla favoritos
CREATE TABLE favoritos (
    id            SERIAL PRIMARY KEY,
    usuario_id    INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    habitacion_id INTEGER NOT NULL REFERENCES habitacion(id) ON DELETE CASCADE,
    created_at    TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_favorito_usuario_habitacion UNIQUE (usuario_id, habitacion_id)
);
```

---

### Anexo C — Glosario de términos

| Término | Definición |
|---|---|
| **KPI** | Key Performance Indicator. En RoomMatch se usa para nombrar los criterios de compatibilidad de estilo de vida |
| **Matching** | Proceso de calcular la compatibilidad entre un inquilino y una habitación |
| **Score** | Puntuación de compatibilidad del 0 al 100 |
| **JWT** | JSON Web Token. Token cifrado que permite autenticar peticiones sin guardar sesión en el servidor |
| **Soft delete** | Eliminación lógica: el registro no se borra de la base de datos, sino que se marca como inactivo |
| **SPA** | Single Page Application. El frontend carga una sola vez y navega sin recargar la página |
| **ORM** | Object-Relational Mapper. SQLAlchemy traduce objetos Python a tablas SQL |
| **REST API** | Interfaz de comunicación basada en HTTP con recursos y verbos estándar (GET, POST, PUT, DELETE) |
| **Badge verificado** | Distintivo visual (✓) que indica que el email del usuario ha sido confirmado, como medida antiestafa |
| **Propietario** | Rol de usuario que publica habitaciones en la plataforma |
| **Inquilino** | Rol de usuario que busca habitación y tiene perfil de estilo de vida |
| **Pydantic** | Librería Python para validar y serializar datos usando anotaciones de tipo |
| **bcrypt** | Algoritmo de hashing de contraseñas diseñado para ser computacionalmente costoso y resistente a ataques |

---

### Anexo D — Capturas de pantalla de las pantallas principales

*(Las capturas se adjuntan como fichero separado o en la presentación)*

**Pantallas del inquilino:**
- Home con matches y badges de compatibilidad
- Formulario de perfil de estilo de vida (chips interactivos)
- Detalle de habitación con preferencias de la casa
- Sistema de mensajería con badge verificado

**Pantallas del propietario:**
- Dashboard con mis habitaciones
- Publicar piso (paso 1 y paso 2 con chips)
- Chat con badge de compatibilidad del inquilino

---

### Anexo E — Enlace al repositorio y despliegue

| Recurso | URL |
|---|---|
| Repositorio GitHub | https://github.com/carol302025/roommatch |
| Backend desplegado | (Railway — URL tras despliegue) |
| Frontend desplegado | (Vercel — URL tras despliegue) |
| Documentación API (Swagger) | /docs en la URL del backend |
