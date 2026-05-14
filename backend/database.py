from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()  # carga el archivo .env

DATABASE_URL = os.getenv("DATABASE_URL")  # lee la URL completa del .env

# Creamos la clase de sesion para interactuar con la base de datos
engine = create_engine(DATABASE_URL)

#Creamos una clase de sesion para interactuar con la base de datos(para las consultas)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Creamos la clase base para los modelos de la base de datos
Base = declarative_base()

# Función para obtener una sesión de la base de datos(abre una nueva sesión y la cierra después de cada petición)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
