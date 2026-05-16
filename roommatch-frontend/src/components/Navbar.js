import { Link, useNavigate } from "react-router-dom";
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getMensajesNoLeidos } from '../services/api';

function Navbar() {
    const { usuario, token, logout } = useAuth();
    const navigate = useNavigate();
    const [noLeidos, setNoLeidos] = useState(0);

    useEffect(() => {
        if (!token) return;

        async function fetchNoLeidos() {
            try {
                const { count } = await getMensajesNoLeidos(token);
                setNoLeidos(count);
            } catch {
                setNoLeidos(0);
            }
        }

        fetchNoLeidos();
        const intervalo = setInterval(fetchNoLeidos, 30000);
        window.addEventListener('mensajes-leidos', fetchNoLeidos);
        return () => {
            clearInterval(intervalo);
            window.removeEventListener('mensajes-leidos', fetchNoLeidos);
        };
    }, [token]);

    function handleLogout() {
        logout();
        navigate('/');
    }

    return (
        <nav className="navbar">
            <div className='navbar-logo'>
                <Link to='/'>
                    RoomMatch
                </Link>
            </div>

            <div className="navbar-center">
                {!usuario && (
                    <>
                        <Link className="nav-link" to="/buscar-pisos">Buscar pisos</Link>
                        <Link className="navbar-pill" to="/registro?tipo=propietario">Publicar habitación</Link>
                    </>
                )}
                {usuario?.rol === 'inquilino' && (
                    <>
                        <Link className="nav-link" to="/buscar-pisos">Buscar pisos</Link>
                        <Link className="nav-link" to="/mis-favoritos">Mis favoritos</Link>
                    </>
                )}
                {usuario?.rol === 'propietario' && (
                    <Link className="nav-link" to="/mis-pisos">Mis pisos</Link>
                )}
            </div>

            <div className="navbar-actions">
                {!usuario && (
                    <>
                        <Link className="btn-registro" to="/registro">Registrarse</Link>
                        <Link className="btn-login" to="/login">Iniciar sesión</Link>
                    </>
                )}

                {usuario && (
                    <>
                        <Link className="nav-link nav-mensajes" to="/mensajes">
                            Mensajes
                            {noLeidos > 0 && (
                                <span className="navbar-badge">{noLeidos > 9 ? '9+' : noLeidos}</span>
                            )}
                        </Link>
                        <Link className="nav-link" to="/perfil">Mi perfil</Link>
                        <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
