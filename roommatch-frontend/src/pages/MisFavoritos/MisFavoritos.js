import './MisFavoritos.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMisFavoritos, toggleFavorito } from '../../services/api';

function MisFavoritos() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [favoritos, setFavoritos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        getMisFavoritos(token)
            .then(data => setFavoritos(Array.isArray(data) ? data : []))
            .catch(() => setFavoritos([]))
            .finally(() => setCargando(false));
    }, [token]);

    async function handleQuitar(e, habitacionId) {
        e.preventDefault();
        await toggleFavorito(habitacionId, token);
        setFavoritos(prev => prev.filter(h => h.id !== habitacionId));
    }

    if (cargando) return <div className="favs-loading">Cargando favoritos...</div>;

    return (
        <div className="favs-page">
            <div className="favs-inner">
                <div className="favs-header">
                    <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>
                    <h1>❤️ Mis favoritos</h1>
                    <p>{favoritos.length} {favoritos.length === 1 ? 'habitación guardada' : 'habitaciones guardadas'}</p>
                </div>

                {favoritos.length === 0 ? (
                    <div className="favs-vacio">
                        <span>🏠</span>
                        <p>Aún no has guardado ninguna habitación</p>
                        <Link to="/buscar-pisos" className="favs-btn-buscar">Explorar habitaciones</Link>
                    </div>
                ) : (
                    <div className="favs-grid">
                        {favoritos.map(h => (
                            <Link to={`/pisos/${h.id}`} key={h.id} className="favs-card">
                                <div className="favs-card-foto">
                                    {h.foto_url
                                        ? <img src={h.foto_url} alt={h.titulo} />
                                        : <div className="favs-placeholder">🏠</div>
                                    }
                                    <button
                                        className="favs-quitar"
                                        onClick={e => handleQuitar(e, h.id)}
                                        title="Quitar de favoritos"
                                    >
                                        ❤️
                                    </button>
                                </div>
                                <div className="favs-card-info">
                                    <h3>{h.titulo}</h3>
                                    <p>📍 {h.ciudad}</p>
                                    <span>{h.precio} € <span>/mes</span></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MisFavoritos;
