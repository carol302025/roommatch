from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, Text, Numeric, TIMESTAMP, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# -----------------------------------------------
# ENUM para los roles de usuario
# -----------------------------------------------
class RolUsuario(str, enum.Enum):
    inquilino = "inquilino"
    propietario = "propietario"
    admin = "admin"


# -----------------------------------------------
# USUARIO (datos comunes a todos los roles)
# -----------------------------------------------
class Usuario(Base):
    __tablename__ = "usuario"

    id                     = Column(Integer, primary_key=True, index=True)
    nombre                 = Column(String(30), nullable=False)
    email                  = Column(String(100), nullable=False, unique=True, index=True)
    password_hash          = Column(String(255), nullable=False)
    rol                    = Column(Enum(RolUsuario), nullable=False)
    telefono               = Column(String(20), nullable=True)
    foto_perfil            = Column(String, nullable=True)
    activo                 = Column(Boolean, default=True)
    email_verificado       = Column(Boolean, default=False)  # para el badge antiestafa
    notificaciones_activas = Column(Boolean, default=True)
    created_at             = Column(TIMESTAMP, server_default=func.now())

    # Relaciones
    perfil_inquilino = relationship(
        "PerfilInquilino",
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan"
    )
    habitaciones = relationship(
        "Habitacion",
        back_populates="propietario",
        cascade="all, delete-orphan"
    )


# -----------------------------------------------
# PERFIL DE INQUILINO (datos específicos)
# -----------------------------------------------
class PerfilInquilino(Base):
    __tablename__ = "perfil_inquilino"

    id            = Column(Integer, primary_key=True, index=True)
    usuario_id    = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False, unique=True)
    edad          = Column(Integer, nullable=True)
    bio           = Column(Text, nullable=True)
    genero        = Column(String(20), nullable=True)
    fumador       = Column(Boolean, default=False)
    tiene_mascota = Column(Boolean, default=False)
    estilo_vida   = Column(String(50), nullable=True)
    tipo_persona  = Column(String(20), nullable=True)   # estudiante / trabajador / teletrabajador / nocturno
    nivel_ruido   = Column(String(20), nullable=True)   # silencioso / tranquilo / animado
    nivel_orden   = Column(String(20), nullable=True)   # alto / medio / flexible
    horario       = Column(String(20), nullable=True)   # madrugador / normal / noctambulo
    tiene_visitas = Column(Boolean, default=False)
    sociabilidad  = Column(String(20), nullable=True)   # introvertido / equilibrado / extrovertido

    usuario = relationship("Usuario", back_populates="perfil_inquilino")
    preferencias = relationship(
        "PreferenciasInquilino",
        back_populates="perfil",
        uselist=False,
        cascade="all, delete-orphan"
    )


# -----------------------------------------------
# PREFERENCIAS DEL INQUILINO (para el matching)
# -----------------------------------------------
class PreferenciasInquilino(Base):
    __tablename__ = "preferencias_inquilino"

    id                  = Column(Integer, primary_key=True, index=True)
    perfil_inquilino_id = Column(Integer, ForeignKey("perfil_inquilino.id", ondelete="CASCADE"), nullable=False, unique=True)
    presupuesto_min     = Column(Integer, nullable=True)
    presupuesto_max     = Column(Integer, nullable=True)
    ciudad_preferida    = Column(String(60), nullable=True)
    genero_preferido    = Column(String(10), nullable=True)
    tipo_inquilino      = Column(String(20), nullable=True)
    fumador_permitido   = Column(Boolean, default=False)
    mascotas_permitidas = Column(Boolean, default=False)
    visitas_permitidas  = Column(Boolean, default=False)
    gastos_incluidos    = Column(Boolean, default=False)

    perfil = relationship("PerfilInquilino", back_populates="preferencias")


# -----------------------------------------------
# HABITACION (publicada por un propietario)
# -----------------------------------------------
class Habitacion(Base):
    __tablename__ = "habitacion"

    id             = Column(Integer, primary_key=True, index=True)
    titulo         = Column(String(100), nullable=False)
    descripcion    = Column(Text, nullable=True)
    precio         = Column(Numeric(10, 2), nullable=False)
    ciudad         = Column(String(60), nullable=False, index=True)
    direccion      = Column(String(120), nullable=True)
    foto_url       = Column(String, nullable=True)
    lat            = Column(Float, nullable=True)
    lon            = Column(Float, nullable=True)
    disponible     = Column(Boolean, default=True)
    created_at     = Column(TIMESTAMP, server_default=func.now())
    propietario_id = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)

    propietario = relationship("Usuario", back_populates="habitaciones")
    preferencias = relationship(
        "PreferenciasCasa",
        back_populates="habitacion",
        uselist=False,
        cascade="all, delete-orphan"
    )


# -----------------------------------------------
# PREFERENCIAS DE LA HABITACION (para el matching)
# -----------------------------------------------
class PreferenciasCasa(Base):
    __tablename__ = "preferencias_casa"

    id                  = Column(Integer, primary_key=True, index=True)
    habitacion_id       = Column(Integer, ForeignKey("habitacion.id", ondelete="CASCADE"), nullable=False, unique=True)
    mascotas_permitidas = Column(Boolean, default=False)
    fumar_permitido     = Column(Boolean, default=False)
    preferencia_genero  = Column(String(10), nullable=True)
    numero_companeros   = Column(Integer, nullable=True)
    tipo_inquilino      = Column(String(20), nullable=True)
    gastos_incluidos    = Column(Boolean, default=False)
    perfil_buscado      = Column(String(20), nullable=True)  # estudiante / trabajador / cualquiera
    ambiente_casa       = Column(String(20), nullable=True)  # tranquilo / animado / flexible
    orden_esperado      = Column(String(20), nullable=True)  # alto / medio / flexible
    horario_casa        = Column(String(20), nullable=True)  # madrugador / normal / noctambulo / flexible
    acepta_visitas      = Column(Boolean, nullable=True)     # True/False/None = indiferente

    habitacion = relationship("Habitacion", back_populates="preferencias")


class Mensaje(Base):
    __tablename__ = "mensaje"

    id                     = Column(Integer, primary_key=True, index=True)
    emisor_id              = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)
    receptor_id            = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)
    contenido              = Column(Text, nullable=False)
    leido                  = Column(Boolean, default=False)
    fecha                  = Column(TIMESTAMP, server_default=func.now())
    eliminado_por_emisor   = Column(Boolean, default=False)
    eliminado_por_receptor = Column(Boolean, default=False)






class Favorito(Base):
    __tablename__ = "favoritos"

    id            = Column(Integer, primary_key=True, index=True)
    usuario_id    = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)
    habitacion_id = Column(Integer, ForeignKey("habitacion.id", ondelete="CASCADE"), nullable=False)
    created_at    = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('usuario_id', 'habitacion_id', name='uq_favorito_usuario_habitacion'),
    )