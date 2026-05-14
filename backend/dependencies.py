"""
Dependencias de FastAPI reutilizables.

Contiene las funciones que se usan con Depends(...) en los routers:
- get_current_user: valida el JWT y devuelve el usuario autenticado.
- require_rol: valida que el usuario tenga un rol especifico.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario, RolUsuario
from auth import decode_access_token


# tokenUrl apunta al endpoint donde el cliente obtiene el token (para /docs)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Valida el token JWT y devuelve el usuario autenticado.
    Se usa como dependencia en rutas protegidas.

    Ejemplo de uso:
        @router.get("/me")
        def leer_perfil(user: Usuario = Depends(get_current_user)):
            return user

    Raises:
        HTTPException 401 si el token es invalido, expirado, o el usuario no existe.
    """
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token de acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if not payload:
        raise credenciales_invalidas

    usuario_id = payload.get("sub")  # sub = identificador del usuario
    if not usuario_id:
        raise credenciales_invalidas

    usuario = db.query(Usuario).filter(
        Usuario.id == int(usuario_id),
        Usuario.activo == True
    ).first()

    if not usuario:
        raise credenciales_invalidas

    return usuario


def require_rol(rol_requerido: RolUsuario):
    """
    Fabrica una dependencia que exige un rol concreto.
    Uso:
        @router.post("/habitaciones")
        def crear(user = Depends(require_rol(RolUsuario.propietario))):
            ...
    """
    def _check(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol != rol_requerido:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Esta accion requiere rol '{rol_requerido.value}'"
            )
        return usuario
    return _check