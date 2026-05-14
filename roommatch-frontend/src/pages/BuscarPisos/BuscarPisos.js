import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getHabitaciones, toggleFavorito, getFavoritosIds } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './BuscarPisos.css';

function BuscarPisos() {
    const [habitaciones, setHabitaciones] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [buscado, setBuscado] = useState(false);
    const [favoritos, setFavoritos] = useState(new Set());

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { usuario, token } = useAuth();

    // Filtros
    const [presupuestoMax, setPresupuestoMax] = useState(searchParams.get('precio_max') || 800);
    const [ciudad, setCiudad] = useState(searchParams.get('ciudad') || '');
    const [genero, setGenero] = useState('');
    const [tipoInquilino, setTipoInquilino] = useState('');
    const [fumador, setFumador] = useState(false);
    const [mascotas, setMascotas] = useState(false);
    const [visitas, setVisitas] = useState(false);
    const [gastosIncluidos, setGastosIncluidos] = useState(false);

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

    // Solo busca al cargar si el usuario está logueado
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (usuario) buscar(); }, []);

    async function buscar() {
        setCargando(true);
        setError(null);
        setBuscado(true);
        try {
            const filtros = {};
            if (ciudad.trim())     filtros.ciudad         = ciudad.trim();
            if (presupuestoMax)    filtros.precio_max     = presupuestoMax;
            if (tipoInquilino)     filtros.tipo_inquilino = tipoInquilino;

            const datos = await getHabitaciones(filtros);
            setHabitaciones(Array.isArray(datos) ? datos : []);
        } catch (err) {
            setError('No se pudieron cargar las habitaciones');
        } finally {
            setCargando(false);
        }
    }

    function handleBuscar(e) {
        e.preventDefault();
        if (!usuario) {
            navigate('/login');
            return;
        }
        buscar();
    }

    return (
        <div className="buscar-page">

            {/* Panel de filtros */}
            <form className="filtros-panel" onSubmit={handleBuscar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <button type="button" className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>
                    <h2 style={{ margin: 0 }}>Cuéntanos qué buscas</h2>
                </div>

                {/* Fila de tarjetas */}
                <div className="filtros-cards">

                    <div className="filtro-card">
                        <span className="filtro-card-icono">💶</span>
                        <label>Presupuesto</label>
                        <span className="filtro-card-valor">Hasta {presupuestoMax} €</span>
                        <input
                            type="range"
                            min="100"
                            max="2000"
                            step="50"
                            value={presupuestoMax}
                            onChange={(e) => setPresupuestoMax(e.target.value)}
                            className="presupuesto-slider"
                        />
                        <div className="slider-labels">
                            <span>100 €</span>
                            <span>2.000 €</span>
                        </div>
                    </div>

                    <div className="filtro-card">
                        <span className="filtro-card-icono">📍</span>
                        <label>Ciudad</label>
                        <input
                            type="text"
                            placeholder="Barcelona"
                            value={ciudad}
                            onChange={(e) => setCiudad(e.target.value)}
                            className="filtro-input"
                        />
                    </div>

                    <div className="filtro-card">
                        <span className="filtro-card-icono">👤</span>
                        <label>Género</label>
                        <select value={genero} onChange={(e) => setGenero(e.target.value)} className="filtro-select">
                            <option value="">Sin preferencia</option>
                            <option value="hombre">Hombre</option>
                            <option value="mujer">Mujer</option>
                        </select>
                    </div>

                    <div className="filtro-card">
                        <span className="filtro-card-icono">🏠</span>
                        <label>Tipo de inquilino</label>
                        <select value={tipoInquilino} onChange={(e) => setTipoInquilino(e.target.value)} className="filtro-select">
                            <option value="">Cualquiera</option>
                            <option value="estudiante">Estudiante</option>
                            <option value="trabajador">Trabajador</option>
                            <option value="pareja">Pareja</option>
                        </select>
                    </div>

                </div>

                {/* Fila de toggles */}
                <div className="filtros-toggles">
                    <Toggle label="Fumador permitido" icono="🚬" value={fumador} onChange={setFumador} />
                    <Toggle label="Mascotas permitidas" icono="🐾" value={mascotas} onChange={setMascotas} />
                    <Toggle label="Visitas permitidas" icono="👥" value={visitas} onChange={setVisitas} />
                    <Toggle label="Gastos incluidos" icono="💡" value={gastosIncluidos} onChange={setGastosIncluidos} />
                </div>

                {/* Botón buscar */}
                <div className="filtros-accion">
                    <button type="submit" className="btn-ver-compatibles">
                        🔍 Ver habitaciones compatibles
                    </button>
                    {!usuario && (
                        <p className="filtros-aviso">
                            Debes <a href="/login">iniciar sesión</a> o <a href="/registro">registrarte</a> para usar los filtros
                        </p>
                    )}
                </div>
            </form>

            {/* Resultados */}
            {cargando && <p className="buscar-estado">Cargando habitaciones...</p>}
            {error && <p className="buscar-estado error">{error}</p>}

            {buscado && !cargando && !error && habitaciones.length === 0 && (
                <div className="buscar-vacio">
                    <span>🏠</span>
                    <p>No hay habitaciones con esos filtros</p>
                </div>
            )}


            <div className="habitaciones-grid">
                {habitaciones.map((h) => (
                    <Link to={`/pisos/${h.id}`} key={h.id} className="habitacion-card">
                        <div className="card-foto">
                            {h.foto_url
                                ? <img src={h.foto_url} alt={h.titulo} />
                                : <div className="card-foto-placeholder">🏠</div>
                            }
                            <span className="card-disponible">Disponible</span>
                            <button className={`btn-heart ${favoritos.has(h.id) ? 'activo' : ''}`} onClick={e => handleHeart(e, h.id)}>
                                {favoritos.has(h.id) ? '❤️' : '♡'}
                            </button>
                        </div>
                        <div className="card-info">
                            <h3>{h.titulo}</h3>
                            <p className="card-ciudad">📍 {h.ciudad}</p>
                            <span className="card-precio">{h.precio} € <span className="precio-mes">/mes</span></span>
                        </div>
                    </Link>
                ))}
            </div>

        </div>
    );
}

// Componente toggle reutilizable
function Toggle({ label, icono, value, onChange }) {
    return (
        <div className="toggle-item" onClick={() => onChange(!value)}>
            <span className="toggle-icono">{icono}</span>
            <span className="toggle-label">{label}</span>
            <div className={`toggle-switch ${value ? 'activo' : ''}`}>
                <div className="toggle-thumb" />
            </div>
        </div>
    );
}

export default BuscarPisos;
