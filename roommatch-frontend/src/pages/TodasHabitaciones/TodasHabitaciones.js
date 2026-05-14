import './TodasHabitaciones.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHabitaciones, toggleFavorito, getFavoritosIds } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function TodasHabitaciones() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [favoritos, setFavoritos] = useState(new Set());
    const { usuario, token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getHabitaciones()
            .then(data => setHabitaciones(Array.isArray(data) ? data : []))
            .catch(() => setHabitaciones([]))
            .finally(() => setCargando(false));
    }, []);

    useEffect(() => {
        if (!token || usuario?.rol !== 'inquilino') return;
        getFavoritosIds(token)
            .then(ids => setFavoritos(new Set(ids)))
            .catch(() => {});
    }, [token, usuario]);

    async function handleHeart(e, habitacionId) {
        e.preventDefault();
        if (!token || usuario?.rol !== 'inquilino') { navigate('/login'); return; }
        const { guardado } = await toggleFavorito(habitacionId, token);
        setFavoritos(prev => {
            const next = new Set(prev);
            guardado ? next.add(habitacionId) : next.delete(habitacionId);
            return next;
        });
    }

    if (cargando) return <div className="todas-loading">Cargando habitaciones...</div>;

    return (
        <>
        <div className="todas-topbar">
            <Link to="/" className="todas-topbar-logo">RoomMatch</Link>
            <div className="todas-topbar-links">
                <Link to="/buscar-pisos" className="todas-topbar-link">Buscar con filtros</Link>
                {usuario && <Link to="/mensajes" className="todas-topbar-link">Mensajes</Link>}
                {usuario && <Link to="/perfil" className="todas-topbar-link">Mi perfil</Link>}
            </div>
        </div>
        <div className="todas-page">
            <div className="todas-inner">
                <div className="todas-header">
                    <button className="todas-volver" onClick={() => navigate(-1)}>← Volver</button>
                    <h1>Habitaciones disponibles</h1>
                    <p>{habitaciones.length} habitaciones encontradas</p>
                </div>

                {habitaciones.length === 0 ? (
                    <div className="todas-vacio">
                        <span>🏠</span>
                        <p>No hay habitaciones disponibles en este momento</p>
                    </div>
                ) : (
                    <div className="todas-grid">
                        {habitaciones.map(h => (
                            <Link to={`/pisos/${h.id}`} key={h.id} className="todas-card">
                                <div className="todas-card-foto">
                                    {h.foto_url
                                        ? <img src={h.foto_url} alt={h.titulo} />
                                        : <div className="todas-placeholder">🏠</div>
                                    }
                                    <button
                                        className={`btn-heart ${favoritos.has(h.id) ? 'activo' : ''}`}
                                        onClick={e => handleHeart(e, h.id)}
                                    >
                                        {favoritos.has(h.id) ? '❤️' : '♡'}
                                    </button>
                                </div>
                                <div className="todas-card-info">
                                    <h3>{h.titulo}</h3>
                                    <p>📍 {h.ciudad}</p>
                                    <span>{h.precio} € <span className="mes">/mes</span></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

export default TodasHabitaciones;
