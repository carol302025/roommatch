const BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

// Helper para no repetir fetch en cada llamada
async function apiFetch(endpoint, opciones = {}) {
    const { headers = {}, ...resto } = opciones;
    const cleanEndpoint = String(endpoint).replace(/^\//, '');

    const response = await fetch(`${BASE_URL}/${cleanEndpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers, // Permite añadir Authorization u otros headers
        },
        ...resto,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let data = null;
    if (response.status !== 204) {
        data = isJson ? await response.json() : await response.text();
    }

    if (!response.ok) {
        const error = new Error(
            (data && data.detail) || `Error HTTP ${response.status}`
        );
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}


    



// ── USUARIOS ──────────────────────────────────────────────

// Registro — devuelve el usuario creado (con id)
export async function registerUsuario(datos) {
    return apiFetch('usuarios/registro', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
}

// Login — devuelve { access_token, token_type, rol, usuario_id }
export async function loginUsuario(datos) {
    return apiFetch('usuarios/login', {
        method: 'POST',
        body: JSON.stringify(datos),
    });
}

// Perfil del usuario logueado
export async function getMiPerfil(token) {
    return apiFetch('usuarios/me', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
}


// ── HABITACIONES ──────────────────────────────────────────

// Listado público con filtros opcionales (ciudad, precio_min, precio_max)
export async function getHabitaciones(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    return apiFetch(`habitaciones${params ? `?${params}` : ''}`);
}

// Detalle de una habitación (público)
export async function getHabitacion(id) {
    return apiFetch(`habitaciones/${id}`);
}

// Crear habitación (solo propietario)
export async function crearHabitacion(datos, token) {
    return apiFetch('habitaciones', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
    });
}

// Habitaciones del propietario logueado
export async function getMisHabitaciones(token) {
    return apiFetch('habitaciones/mis/listado', {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
}

// Desactivar una habitación (soft delete — solo dueño)
export async function eliminarHabitacion(habitacionId, token) {
    return apiFetch(`habitaciones/${habitacionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
}

// Actualizar nombre y teléfono del usuario
export async function actualizarPerfil(datos, token) {
    return apiFetch('usuarios/me', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

// Cambiar contraseña
export async function cambiarPassword(datos, token) {
    return apiFetch('usuarios/me/password', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

// Guardar preferencias de una habitación (paso 2 del wizard)
export async function guardarPreferencias(habitacionId, datos, token) {
    return apiFetch(`habitaciones/${habitacionId}/preferencias`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
    });
}

// Editar habitación (solo dueño)
export async function actualizarHabitacion(id, datos, token) {
    return apiFetch(`habitaciones/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

// Actualizar preferencias de una habitación (upsert)
export async function actualizarPreferencias(habitacionId, datos, token) {
    return apiFetch(`habitaciones/${habitacionId}/preferencias`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

// ── MENSAJES ──────────────────────────────────────────────

// Enviar mensaje a otro usuario — datos: { receptor_id, contenido }
export async function enviarMensaje(datos, token) {
    return apiFetch('mensaje/enviar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

// Obtener la conversación completa con otro usuario
export async function getConversacion(otroUsuarioId, token) {
    return apiFetch(`mensaje/conversacion?otro_usuario_id=${otroUsuarioId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// Obtener el último mensaje de cada conversación (para la lista de chats)
export async function getConversaciones(token) {
    return apiFetch('mensaje/conversaciones', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// Marcar como leídos todos los mensajes de un emisor
export async function marcarConversacionLeida(emisorId, token) {
    return apiFetch('mensaje/conversacion/leida', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ emisor_id: emisorId }),
    });
}

// Número de mensajes no leídos
export async function getMensajesNoLeidos(token) {
    return apiFetch('mensaje/no-leidos', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// Perfil público de un usuario (para mostrar su nombre en el chat)
export async function getUsuarioPublico(id, token) {
    return apiFetch(`usuarios/${id}/publico`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// ── PERFIL INQUILINO + MATCHING ───────────────────────────

export async function getPerfilInquilino(token) {
    return apiFetch('usuarios/me/perfil-inquilino', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

export async function actualizarPerfilInquilino(datos, token) {
    return apiFetch('usuarios/me/perfil-inquilino', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

export async function getPreferenciasInquilino(token) {
    return apiFetch('usuarios/me/preferencias', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

export async function actualizarPreferenciasInquilino(datos, token) {
    return apiFetch('usuarios/me/preferencias', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

export async function getMatches(token) {
    return apiFetch('habitaciones/matches', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// ── FAVORITOS ─────────────────────────────────────────────

// Añadir o quitar favorito — devuelve { guardado: true/false }
export async function toggleFavorito(habitacionId, token) {
    return apiFetch(`favoritos/${habitacionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// IDs de las habitaciones favoritas del usuario
export async function getFavoritosIds(token) {
    return apiFetch('favoritos/ids', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// Habitaciones favoritas completas
export async function getMisFavoritos(token) {
    return apiFetch('favoritos', {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// ── COMPATIBILIDAD ────────────────────────────────────────────

export async function calcularCompatibilidad(inquilinoId, token) {
    return apiFetch(`usuarios/${inquilinoId}/compatibilidad`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// ── UPLOAD ──────────────────────────────────────────────────

// ── RESEÑAS ──────────────────────────────────────────────────

export async function getResenas(habitacionId) {
    return apiFetch(`resenas/${habitacionId}`);
}

export async function crearResena(habitacionId, datos, token) {
    return apiFetch(`resenas/${habitacionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datos),
    });
}

export async function eliminarResena(resenaId, token) {
    return apiFetch(`resenas/${resenaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
}

// Subir foto — devuelve { url: "http://..." }
// Usa FormData porque es un archivo, no JSON
export async function subirFoto(archivo) {
    const formData = new FormData();
    formData.append('file', archivo);

    const response = await fetch(`${BASE_URL}/upload/foto`, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Error al subir la foto');
    return data;
}
