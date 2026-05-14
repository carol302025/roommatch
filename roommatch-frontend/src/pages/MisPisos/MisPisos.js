import './MisPisos.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMisHabitaciones, eliminarHabitacion } from '../../services/api';

function MisPisos() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [tab, setTab] = useState('activas');

    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        async function cargar() {
            try {
                const datos = await getMisHabitaciones(token);
                setHabitaciones(datos);
            } catch (err) {
                setError('Error al cargar tus habitaciones');
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, [token]);

    async function handleEliminar(id) {
        if (!window.confirm('¿Desactivar esta habitación? Dejará de aparecer en el listado.')) return;
        try {
            await eliminarHabitacion(id, token);
            setHabitaciones(prev =>
                prev.map(h => h.id === id ? { ...h, disponible: false } : h)
            );
        } catch (err) {
            alert('Error al desactivar la habitación');
        }
    }

    const activas   = habitaciones.filter(h => h.disponible);
    const inactivas = habitaciones.filter(h => !h.disponible);
    const mostrar   = tab === 'activas' ? activas : inactivas;

    return (
        <div className="mis-pisos-page">
            <div className="mis-pisos-inner">

                {/* Cabecera */}
                <div className="mis-pisos-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="btn-volver" onClick={() => navigate('/')}>← Volver</button>
                        <div>
                            <h1>Mis publicaciones</h1>
                            <p>Gestiona las habitaciones que has publicado</p>
                        </div>
                    </div>
                    <button className="btn-publicar" onClick={() => navigate('/publicar-piso')}>
                        + Publicar nueva
                    </button>
                </div>

                {/* Tabs */}
                <div className="mis-pisos-tabs">
                    <button
                        className={`tab-btn ${tab === 'activas' ? 'activo' : ''}`}
                        onClick={() => setTab('activas')}
                    >
                        Activas ({activas.length})
                    </button>
                    <button
                        className={`tab-btn ${tab === 'inactivas' ? 'activo' : ''}`}
                        onClick={() => setTab('inactivas')}
                    >
                        Inactivas ({inactivas.length})
                    </button>
                </div>

                {cargando && <p className="mis-pisos-estado">Cargando...</p>}
                {error   && <p className="mis-pisos-estado error">{error}</p>}

                {!cargando && habitaciones.length === 0 && (
                    <div className="mis-pisos-vacio">
                        <div className="vacio-icono">🏠</div>
                        <h2>Aún no has publicado ninguna habitación</h2>
                        <p>Cuando publiques una, aparecerá aquí.</p>
                        <button className="btn-publicar" onClick={() => navigate('/publicar-piso')}>
                            + Publicar mi primera habitación
                        </button>
                    </div>
                )}

                {!cargando && mostrar.length === 0 && habitaciones.length > 0 && (
                    <p className="mis-pisos-estado">No hay habitaciones en esta sección.</p>
                )}

                {mostrar.length > 0 && (
                    <div className="mis-pisos-grid">
                        {mostrar.map(h => (
                            <TarjetaHabitacion key={h.id} habitacion={h} onEliminar={handleEliminar} />
                        ))}
                    </div>
                )}

                {/* Banner promocional */}
                {!cargando && habitaciones.length > 0 && (
                    <div className="promo-banner">
                        <span className="promo-banner-icon">🏡</span>
                        <div className="promo-banner-texto">
                            <h3>¿Quieres más visibilidad?</h3>
                            <p>Destaca tu habitación y llega a más inquilinos interesados.</p>
                        </div>
                        <button className="btn-promocionar">🚀 Promocionar anuncio</button>
                    </div>
                )}

            </div>
        </div>
    );
}

function TarjetaHabitacion({ habitacion: h, onEliminar }) {
    const navigate = useNavigate();
    const pref = h.preferencias;

    return (
        <div className={`mis-pisos-card ${!h.disponible ? 'inactiva' : ''}`}>

            {/* Badge estado + menú */}
            <div className="card-top">
                <span className={`card-badge-estado ${h.disponible ? 'activa' : 'inactiva'}`}>
                    {h.disponible ? 'Activa' : 'Inactiva'}
                </span>
                <button className="card-menu-btn">···</button>
            </div>

            {/* Foto */}
            <div className="card-foto">
                {h.foto_url
                    ? <img src={h.foto_url} alt={h.titulo} />
                    : <div className="card-foto-placeholder">🏠</div>
                }
                <span className="card-precio-badge">{h.precio} €/mes</span>
            </div>

            {/* Cuerpo */}
            <div className="card-body">
                <h3>{h.titulo}</h3>
                <p className="card-ciudad">📍 {h.ciudad}</p>

                {h.descripcion && (
                    <p className="card-descripcion">{h.descripcion}</p>
                )}

                {pref && (
                    <div className="card-features">
                        {pref.numero_companeros && (
                            <span>👥 {pref.numero_companeros} compañeros</span>
                        )}
                        {pref.gastos_incluidos && (
                            <span>💡 Gastos incl.</span>
                        )}
                        {pref.mascotas_permitidas && (
                            <span>🐾 Mascotas</span>
                        )}
                    </div>
                )}

                <div className="card-acciones">
                    <button className="btn-ver" onClick={() => navigate(`/pisos/${h.id}`)}>
                        Ver ↗
                    </button>
                    <button className="btn-editar" onClick={() => navigate(`/editar-piso/${h.id}`)}>
                        Editar
                    </button>
                    {h.disponible && (
                        <button className="btn-desactivar" onClick={() => onEliminar(h.id)}>
                            Desactivar
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}

export default MisPisos;
