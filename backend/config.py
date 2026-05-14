"""
Configuracion global de la aplicacion.

Todas las variables sensibles se cargan desde el archivo .env
(que nunca se sube a git - debe estar en .gitignore).
"""
import os
from dotenv import load_dotenv

# Carga las variables de entorno desde .env
load_dotenv()

# ----------------------------------------------------------
# Seguridad / JWT
# ----------------------------------------------------------
SECRET_KEY: str = os.getenv("SECRET_KEY", "clave_secreta_provisional_solo_desarrollo")

# Aviso visible si se esta usando la clave por defecto (seguridad)
if SECRET_KEY == "clave_secreta_provisional_solo_desarrollo":
    print("AVISO: usando SECRET_KEY por defecto. Configura SECRET_KEY en .env para produccion.")

# Algoritmo de firma del JWT (HS256 = HMAC con SHA-256, estandar de la industria)
ALGORITHM: str = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24


