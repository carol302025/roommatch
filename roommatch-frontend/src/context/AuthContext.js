import { createContext, useState, useContext } from "react";


const AuthContext = createContext(); // Creamos el contexto de autenticación

export function AuthProvider({ children }) {
    // Cargamos el usuario desde localStorage al iniciar la app (por si ya estaba logueado)
    const [usuario, setUsuario] = useState(() => {
        const guardado = localStorage.getItem("usuario");
        return guardado ? JSON.parse(guardado) : null;
    });

    // Cargamos el token desde localStorage al iniciar la app
    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || null;
    });

    // Recibe directamente la respuesta del backend:
    // { access_token, token_type, rol, usuario_id }
    function login(respuestaBackend) {
        const datosUsuario = {
            id: respuestaBackend.usuario_id,
            rol: respuestaBackend.rol,
        };
        setUsuario(datosUsuario);
        setToken(respuestaBackend.access_token);
        localStorage.setItem("usuario", JSON.stringify(datosUsuario));
        localStorage.setItem("token", respuestaBackend.access_token);
    }

    // Cierra sesión: limpia estado y localStorage
    function logout() {
        setUsuario(null);
        setToken(null);
        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
    }

    // Compartimos usuario, token y funciones a través del contexto
    return (
        <AuthContext.Provider value={{ usuario, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para usar el contexto fácilmente desde cualquier componente
export function useAuth() {
    return useContext(AuthContext);
}
