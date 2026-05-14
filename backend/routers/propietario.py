from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import Propietario
from schemas import PropietarioRegistro, PropietarioLogin, PropietarioResponse, TokenResponse, PropietarioUpdate, EmailRequest, ResetPasswordRequest, NotificacionUpdate
from auth import hash_password, verify_password, create_access_token, decode_access_token
from datetime import timedelta

router = APIRouter(prefix="/propietario", tags=["Propietario"])


# Función para obtener el propietario actual a partir del token de acceso
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/propietario/login")

def get_current_propietario(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Propietario:
    payload = decode_access_token(token)
    if not payload or payload.get("sub") != "propietario":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de acceso inválido",
                            headers={"WWW-Authenticate": "Bearer"})
    propietario = db.query(Propietario).filter(Propietario.id == payload.get("id"), Propietario.activo == True).first()
    if not propietario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Propietario no encontrado")
    return propietario

# -----------------------------------------------
# RUTAS DE ENDPOINTS PARA PROPIETARIO
# -----------------------------------------------
# Crear Perfil de Propietario 
@router.post("/registro", response_model=PropietarioResponse, status_code=status.HTTP_201_CREATED)
def registrar_propietario(datos: PropietarioRegistro, db: Session = Depends(get_db)):
    existe = db.query(Propietario).filter(Propietario.email == datos.email).first()
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")
    
    nuevo =  Propietario(
        nombre=datos.nombre,
        email=datos.email,
        password_hash=hash_password(datos.password),
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

 # Endpoint para el login del propietario, que devuelve un token de acceso JWT si las credenciales son correctas
@router.post("/login", response_model=TokenResponse)
def login_propietario(datos: PropietarioLogin, db: Session = Depends(get_db)):
    propietario = db.query(Propietario).filter(Propietario.email == datos.email, Propietario.activo == True).first()
    if not propietario or not verify_password(datos.password, propietario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")
    
    token = create_access_token({"sub": "propietario", "id": propietario.id, "email": propietario.email})
    return {"access_token": token, "token_type": "bearer"}

# Para obtener el perfil del propietario autenticado a través del token de acceso, se crea un endpoint protegido que requiere autenticacion 

@router.get("/perfil", response_model=PropietarioResponse)
def obtner_propietario(current_user: Propietario = Depends(get_current_propietario)):
    return current_user


# Endpoint para actualizar el perfil del propietario, que permite modificar su nombre, apellido, email, contraseña y teléfono. Solo el propietario autenticado puede actualizar su propio perfil.
@router.put("/perfil/actualizar", response_model=PropietarioResponse)
def actaualizar_propietario(datos: PropietarioUpdate, db: Session = Depends(get_db),
                            current_user: Propietario = Depends(get_current_propietario)):
    if  datos.email and  datos.email != current_user.email:
        existe = db.query(Propietario).filter(Propietario.email == datos.email).first()
        if existe:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")
        current_user.email = datos.email
    if datos.nombre is not None:
        current_user.nombre = datos.nombre
    if datos.password:

        current_user.password_hash = hash_password(datos.password)

    db.commit()
    db.refresh(current_user)
    return current_user

# Para eliminar el perfil del propietario 
@router.delete("/perfil/eliminar", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_propietario(db: Session = Depends(get_db), current_user: Propietario = Depends(get_current_propietario)):
    current_user.activo = False
    db.commit()
    return None

  # Endpoint para solicitar la recuperación de contraseña
@router.post("/recuperar-password")
def solicitar_recuperacion_password(datos: EmailRequest, db: Session = Depends(get_db)):
    propietario = db.query(Propietario).filter(Propietario.email == datos.email, Propietario.activo == True).first()
    if propietario:
        token = create_access_token(
        {"sub": "recuperar", "id": propietario.id},
        ACCESS_TOKEN_EXPIRE_MINUTES=timedelta(minutes=30)
    )
        print(f"Enlace: http://localhost:8000/propietario/reset-password?token={token}")

    return {"msg": "Si el email existe, se enviará un enlace"}


# Endpoint para restablecer la contraseña 
@router.post("/reset-password")
def resetear_password(
    datos: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    payload = decode_access_token(datos.token)

    if not payload or payload.get("sub") != "recuperar":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    propietario = db.query(Propietario).filter(
        Propietario.id == payload.get("id"),
        Propietario.activo == True
    ).first()

    if not propietario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se puede restablecer la contraseña"
        )

    propietario.password_hash = hash_password(datos.new_password)

    db.commit()
    db.refresh(propietario)

    return {"msg": "Contraseña actualizada correctamente"}

# Endpoint para actualizar las preferencias de notificaciones del propietario, puede activar o desactivar las notificaciones 
@router.put("/notificaciones", response_model=PropietarioResponse)
def actualizar_notifcaciones(datos: NotificacionUpdate, db: Session = Depends(get_db), current_user: Propietario = Depends(get_current_propietario)):
    try:
        current_user.notificaciones_activas = datos.notificaciones_activas
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


