"""
Schemas de Pydantic.

Define como entran y salen los datos de la API (validacion + serializacion).
Se mantiene separacion entre:
- Schemas de entrada: lo que recibe la API (Create, Update, Login).
- Schemas de salida: lo que devuelve la API (Response).
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from typing_extensions import Annotated
from datetime import datetime
from enum import Enum


# ==========================================================
# ENUM - tipos de rol (debe coincidir con models.RolUsuario)
# ==========================================================
class RolUsuario(str, Enum):
    inquilino = "inquilino"
    propietario = "propietario"
    admin = "admin"


# ==========================================================
# TOKEN / AUTENTICACION
# ==========================================================
class TokenResponse(BaseModel):
    """Respuesta del endpoint /login."""
    access_token: str
    token_type: str = "bearer"
    rol: RolUsuario
    usuario_id: int


class LoginRequest(BaseModel):
    """Datos recibidos en /login."""
    email: EmailStr
    password: str


class EmailRequest(BaseModel):
    """Para endpoints que solo necesitan un email (ej. recuperar contrasena)."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Para restablecer contrasena con un token de recuperacion."""
    token: str
    new_password: Annotated[str, Field(min_length=6)]


# ==========================================================
# USUARIO - schemas comunes (registro, actualizacion, respuesta)
# ==========================================================
class UsuarioRegistro(BaseModel):
    """Datos para crear un nuevo usuario (inquilino o propietario)."""
    nombre: Annotated[str, Field(min_length=2, max_length=30)]
    email: EmailStr
    password: Annotated[str, Field(min_length=6)]
    rol: RolUsuario
    telefono: Optional[str] = None


class UsuarioUpdate(BaseModel):
    """Datos para actualizar un usuario. Todos los campos son opcionales."""
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    foto_perfil: Optional[str] = None


class PasswordUpdate(BaseModel):
    """Para cambiar contrasena estando logueado."""
    password_actual: str
    password_nuevo: Annotated[str, Field(min_length=6)]


class NotificacionUpdate(BaseModel):
    """Para activar/desactivar notificaciones."""
    notificaciones_activas: bool


class UsuarioResponse(BaseModel):
    """Datos publicos de un usuario (NO incluye password_hash)."""
    id: int
    nombre: str
    email: EmailStr
    rol: RolUsuario
    telefono: Optional[str] = None
    foto_perfil: Optional[str] = None
    email_verificado: bool
    activo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# PERFIL DE INQUILINO (datos especificos del inquilino)
# ==========================================================
class PerfilInquilinoBase(BaseModel):
    """Campos comunes a crear/actualizar/devolver un perfil de inquilino."""
    edad: Optional[int] = Field(None, ge=18, le=99)
    bio: Optional[str] = Field(None, max_length=500)
    genero: Optional[str] = None
    fumador: bool = False
    tiene_mascota: bool = False
    estilo_vida: Optional[str] = None
    tipo_persona: Optional[str] = None
    nivel_ruido: Optional[str] = None
    nivel_orden: Optional[str] = None
    horario: Optional[str] = None
    tiene_visitas: bool = False
    sociabilidad: Optional[str] = None



class PerfilInquilinoUpdate(PerfilInquilinoBase):
    """Para actualizar el perfil del inquilino."""
    pass


class PerfilInquilinoResponse(PerfilInquilinoBase):
    """Respuesta con los datos del perfil."""
    id: int
    usuario_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# PREFERENCIAS DEL INQUILINO (para el matching)
# ==========================================================
class PreferenciasInquilinoBase(BaseModel):
    """Criterios de búsqueda del inquilino."""
    presupuesto_min:    Optional[int] = None
    presupuesto_max:    Optional[int] = None
    ciudad_preferida:   Optional[str] = None
    genero_preferido:   Optional[str] = None
    tipo_inquilino:     Optional[str] = None
    fumador_permitido:  bool = False
    mascotas_permitidas: bool = False
    visitas_permitidas: bool = False
    gastos_incluidos:   bool = False



class PreferenciasInquilinoUpdate(PreferenciasInquilinoBase):
    pass


class PreferenciasInquilinoResponse(PreferenciasInquilinoBase):
    id: int
    perfil_inquilino_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# PREFERENCIAS DE LA CASA (asociadas a la habitacion)
# ==========================================================
class PreferenciasCasaBase(BaseModel):
    mascotas_permitidas: bool = False
    fumar_permitido: bool = False
    preferencia_genero: Optional[str] = None
    numero_companeros: Optional[int] = None
    tipo_inquilino: Optional[str] = None
    gastos_incluidos: bool = False
    perfil_buscado: Optional[str] = None
    ambiente_casa: Optional[str] = None
    orden_esperado: Optional[str] = None
    horario_casa: Optional[str] = None
    acepta_visitas: Optional[bool] = None


class PreferenciasCasaCrear(PreferenciasCasaBase):
    pass


class PreferenciasCasaResponse(PreferenciasCasaBase):
    id: int
    habitacion_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# HABITACION
# ==========================================================
class HabitacionCrear(BaseModel):
    titulo: Annotated[str, Field(min_length=5, max_length=100)]
    descripcion: Optional[str] = None
    precio: float = Field(gt=0, description="Precio mensual en euros")
    ciudad: Annotated[str, Field(min_length=2, max_length=60)]
    direccion: Optional[str] = None
    foto_url: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class HabitacionActualizar(BaseModel):
    """Todos los campos opcionales para permitir edicion parcial."""
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    foto_url: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    disponible: Optional[bool] = None


class HabitacionRespuesta(BaseModel):
    id: int
    titulo: str                     
    descripcion: Optional[str] = None
    precio: float
    ciudad: str
    direccion: Optional[str] = None
    foto_url: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    disponible: bool
    created_at: datetime
    propietario_id: int
    preferencias: Optional[PreferenciasCasaResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# MENSAJES
# ==========================================================
class MensajeCrear(BaseModel):
    """Datos para enviar un mensaje."""
    receptor_id: int
    contenido: Annotated[str, Field(min_length=1, max_length=1000)]


class MensajeResponse(BaseModel):
    """Datos que devuelve la API al consultar mensajes."""
    id: int
    emisor_id: int
    receptor_id: int
    contenido: str
    leido: bool
    fecha: datetime
    eliminado_por_emisor: bool
    eliminado_por_receptor: bool

    model_config = ConfigDict(from_attributes=True)


class MarcarLeidoRequest(BaseModel):
    """Para marcar como leídos todos los mensajes de un emisor concreto."""
    emisor_id: int


class EliminarMensajeRequest(BaseModel):
    """Para eliminar lógicamente la conversación con otro usuario."""
    otro_usuario_id: int
