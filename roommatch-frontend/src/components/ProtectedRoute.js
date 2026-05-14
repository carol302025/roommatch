import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

// rolRequerido es opcional — si no se pasa, solo comprueba que el usuario esté logueado
function ProtectedRoute({ children, rolRequerido }) {
    const { usuario } = useAuth();

    // Si no está logueado, lo mandamos al inicio
    if (!usuario) {
        return <Navigate to="/" />;
    }

    // Si la ruta requiere un rol concreto y el usuario no lo tiene
    if (rolRequerido && usuario.rol !== rolRequerido) {
        return <Navigate to="/" />;
    }

    // Si pasa las dos comprobaciones, mostramos la página
    return children;
}

export default ProtectedRoute;
