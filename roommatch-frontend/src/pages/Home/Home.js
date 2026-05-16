import './Home.css';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getHabitaciones, toggleFavorito, getFavoritosIds, getMatches } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import heroBg from '../../assets/imagen2.png';
import logo from '../../assets/logoP.png';

const CIUDADES = [
    { id: 'todas',     label: 'Todas',     emoji: '🌍' },
    { id: 'madrid',    label: 'Madrid',    emoji: '🏛️' },
    { id: 'barcelona', label: 'Barcelona', emoji: '🏖️' },
    { id: 'valencia',  label: 'Valencia',  emoji: '🌴' },
    { id: 'sevilla',   label: 'Sevilla',   emoji: '🌸' },
];

function esNueva(h) {
    const diff = (Date.now() - new Date(h.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
}

function Home() {
    const [ciudad, setCiudad] = useState('');
    const [fecha, setFecha] = useState('');
    const [precioMax, setPrecioMax] = useState('');
    const [habitaciones, setHabitaciones] = useState([]);
    const [ciudadFiltro, setCiudadFiltro] = useState('todas');
    const [matches, setMatches] = useState([]);
    const navigate = useNavigate();
    const { usuario, token, logout } = useAuth();
    const [favoritos, setFavoritos] = useState(new Set());

    useEffect(() => {
        async function cargar() {
            try {
                const datos = await getHabitaciones();
                setHabitaciones(Array.isArray(datos) ? datos.slice(0, 8) : []);
            } catch (err) {
                console.error('Error al cargar habitaciones');
            }
        }
        cargar();
    }, []);

    useEffect(() => {
        if (!token || usuario?.rol !== 'inquilino') return;
        getFavoritosIds(token).then(ids => setFavoritos(new Set(ids))).catch(() => {});
        getMatches(token).then(data => setMatches(Array.isArray(data) ? data : [])).catch(() => {});
    }, [token, usuario]);

    async function handleHeart(e, habitacionId) {
        e.preventDefault();
        if (!token || usuario?.rol !== 'inquilino') {
            navigate('/login');
            return;
        }
        const { guardado } = await toggleFavorito(habitacionId, token);
        setFavoritos(prev => {
            const next = new Set(prev);
            guardado ? next.add(habitacionId) : next.delete(habitacionId);
            return next;
        });
    }

    function handleBuscar(e) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (ciudad.trim()) params.set('ciudad', ciudad.trim());
        if (precioMax)     params.set('precio_max', precioMax);
        if (fecha)         params.set('fecha', fecha);
        navigate(`/buscar-pisos${params.toString() ? `?${params.toString()}` : ''}`);
    }

    const filtradas = ciudadFiltro === 'todas'
        ? habitaciones
        : habitaciones.filter(h => h.ciudad?.toLowerCase() === ciudadFiltro);

    const featCard   = filtradas[0];
    const smallCards = filtradas.slice(1, 3);

    return (
        <div className="home-page">

            {/* ── HERO ── */}
            <div className="hero-wrapper" style={{ backgroundImage: `url(${heroBg})` }}>

                <header className="home-header">
                    <Link to="/" className="home-header-logo">
                        <img src={logo} alt="RoomMatch" />
                        RoomMatch
                    </Link>
                    <nav className="home-header-nav">
                        <Link to="/buscar-pisos" className="home-nav-link">Explorar</Link>
                        <a href="#como-funciona" className="home-nav-link">Cómo funciona</a>
                        {!usuario && (
                            <>
                                <Link to="/login" className="home-nav-link">Iniciar sesión</Link>
                                <Link to="/registro?tipo=propietario" className="home-nav-pill">Publicar habitación</Link>
                            </>
                        )}
                        {usuario?.rol === 'inquilino' && (
                            <>
                                <Link to="/mis-preferencias" className="home-nav-link">Mi match</Link>
                                <Link to="/mensajes" className="home-nav-link">Mensajes</Link>
                                <Link to="/perfil" className="home-nav-link">Mi perfil</Link>
                                <button className="home-nav-link home-nav-btn" onClick={() => logout()}>Cerrar sesión</button>
                            </>
                        )}
                        {usuario?.rol === 'propietario' && (
                            <>
                                <Link to="/mis-pisos" className="home-nav-link">Mis pisos</Link>
                                <Link to="/mensajes" className="home-nav-link">Mensajes</Link>
                                <Link to="/perfil" className="home-nav-link">Mi perfil</Link>
                                <Link to="/publicar-piso" className="home-nav-pill">Publicar habitación</Link>
                                <button className="home-nav-link home-nav-btn" onClick={() => logout()}>Cerrar sesión</button>
                            </>
                        )}
                    </nav>
                </header>

                <section className="hero">
                    <h1>Encuentra tu compañero<br />de piso ideal</h1>
                    <form className="hero-searchbar" onSubmit={handleBuscar}>
                        <div className="searchbar-campo">
                            <span>🔍</span>
                            <input
                                type="text"
                                placeholder="¿Dónde quieres vivir?"
                                value={ciudad}
                                onChange={e => setCiudad(e.target.value)}
                            />
                        </div>
                        <div className="searchbar-divider" />
                        <div className="searchbar-campo">
                            <span>📅</span>
                            <input
                                type="date"
                                value={fecha}
                                onChange={e => setFecha(e.target.value)}
                            />
                        </div>
                        <div className="searchbar-divider" />
                        <div className="searchbar-campo">
                            <span>💰</span>
                            <select value={precioMax} onChange={e => setPrecioMax(e.target.value)}>
                                <option value="">Precio máximo</option>
                                <option value="300">Hasta 300 €</option>
                                <option value="500">Hasta 500 €</option>
                                <option value="800">Hasta 800 €</option>
                                <option value="1200">Hasta 1.200 €</option>
                            </select>
                        </div>
                        <button type="submit" className="searchbar-btn">Buscar</button>
                    </form>
                </section>

                <div className="hero-wave">
                    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="white" />
                    </svg>
                </div>
            </div>

            {/* ── CONTENIDO ── */}
            <div className="home-content">

                {/* Tagline */}
                <p className="home-tagline">RoomMatch te conecta con personas que comparten tu estilo de vida, intereses y presupuesto. El hogar perfecto empieza con la compañía perfecta.</p>

                {/* Chips de ciudad */}
                <div className="ciudad-chips">
                    {CIUDADES.map(c => (
                        <button
                            key={c.id}
                            className={`ciudad-chip ${ciudadFiltro === c.id ? 'activo' : ''}`}
                            onClick={() => setCiudadFiltro(c.id)}
                        >
                            <span>{c.emoji}</span> {c.label}
                        </button>
                    ))}
                </div>

                {/* ── HABITACIONES DESTACADAS ── */}
                {filtradas.length > 0 && (
                    <section className="seccion">
                        <div className="seccion-header">
                            <h2 className="seccion-titulo-verde">Habitaciones destacadas</h2>
                            <Link to="/habitaciones" className="seccion-ver-todas">Ver todas →</Link>
                        </div>

                        <div className="destacadas-layout">
                            {featCard && (
                                <Link to={`/pisos/${featCard.id}`} className="feat-card">
                                    {featCard.foto_url
                                        ? <img src={featCard.foto_url} alt={featCard.titulo} className="feat-img" />
                                        : <div className="feat-placeholder" />
                                    }
                                    <span className="feat-badge">⭐ Destacado</span>
                                    <div className="feat-overlay">
                                        <h3>{featCard.titulo}</h3>
                                        <p className="feat-ciudad">📍 {featCard.ciudad}</p>
                                        <div className="feat-meta">
                                            <span>💶 {featCard.precio} €/mes</span>
                                            {featCard.preferencias?.gastos_incluidos && (
                                                <span>✓ Gastos incl.</span>
                                            )}
                                        </div>
                                        <div className="feat-btn">Ver detalles →</div>
                                    </div>
                                </Link>
                            )}

                            <div className="small-cards">
                                {smallCards.map(h => (
                                    <Link to={`/pisos/${h.id}`} key={h.id} className="small-card">
                                        <div className="small-card-foto">
                                            {h.foto_url
                                                ? <img src={h.foto_url} alt={h.titulo} />
                                                : <div className="small-placeholder" />
                                            }
                                            {esNueva(h) && <span className="badge-nuevo">Nuevo</span>}
                                            <button className={`btn-heart ${favoritos.has(h.id) ? 'activo' : ''}`} onClick={e => handleHeart(e, h.id)}>{favoritos.has(h.id) ? '❤️' : '♡'}</button>
                                        </div>
                                        <div className="small-card-info">
                                            <h3>{h.titulo}</h3>
                                            <p className="small-ciudad">📍 {h.ciudad}</p>
                                            <div className="small-meta">
                                                <span>💶 {h.precio} €/mes</span>
                                                {h.preferencias?.gastos_incluidos && <span>✓ Gastos incl.</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── MATCHES ── */}
                {usuario?.rol === 'inquilino' && (
                    <section className="seccion">
                        <div className="seccion-titulo">
                            <span>💚</span>
                            <h2>Tu match perfecto</h2>
                        </div>

                        {matches.length === 0 ? (
                            <div className="matches-vacio">
                                <p>Rellena tus <Link to="/mis-preferencias">preferencias de búsqueda</Link> para ver habitaciones compatibles contigo</p>
                            </div>
                        ) : (
                            <div className="encajan-grid">
                                {matches.map(h => (
                                    <Link to={`/pisos/${h.id}`} key={h.id} className="encajan-card">
                                        <div className="encajan-foto">
                                            {h.foto_url
                                                ? <img src={h.foto_url} alt={h.titulo} />
                                                : <div className="small-placeholder" />
                                            }
                                            <span
                                            className="match-badge"
                                            style={{ background: h.color === 'verde' ? '#16a34a' : h.color === 'naranja' ? '#f97316' : '#6b7280' }}
                                        >
                                            {h.score}% · {h.etiqueta}
                                        </span>
                                            <button className={`btn-heart ${favoritos.has(h.id) ? 'activo' : ''}`} onClick={e => handleHeart(e, h.id)}>{favoritos.has(h.id) ? '❤️' : '♡'}</button>
                                        </div>
                                        <div className="encajan-info">
                                            <h3>{h.titulo}</h3>
                                            <p>📍 {h.ciudad}</p>
                                            <span>💶 {h.precio} €/mes</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {!usuario && (
                    <section className="seccion">
                        <div className="seccion-titulo">
                            <span>💚</span>
                            <h2>Tu match perfecto</h2>
                        </div>
                        <div className="matches-vacio">
                            <p><Link to="/registro">Regístrate</Link> para ver habitaciones compatibles con tu perfil</p>
                        </div>
                    </section>
                )}

                {/* ── CTA NO LOGUEADO ── */}
                {!usuario && (
                    <section className="cta-banner">
                        <div className="cta-banner-izq">
                            <span className="cta-banner-icon">🏠</span>
                            <div>
                                <h3>¿Aún no eres miembro?</h3>
                                <p>Únete a RoomMatch y encuentra tu hogar ideal más rápido.</p>
                            </div>
                        </div>
                        <div className="cta-banner-acciones">
                            <Link to="/login" className="btn-outline">Iniciar sesión</Link>
                            <Link to="/registro" className="btn-solid">Crear cuenta</Link>
                        </div>
                    </section>
                )}

                {/* ── CÓMO FUNCIONA ── */}
                <section className="home-como" id="como-funciona">
                    <div className="como-header">
                        <h2>Cómo funciona</h2>
                        <p>Cuatro pasos para encontrar tu próximo hogar</p>
                    </div>
                    <div className="como-pasos">
                        <div className="como-paso paso-azul">
                            <div className="paso-top"><span className="paso-num">01</span><span className="paso-emoji">🔍</span></div>
                            <h3>Busca</h3>
                            <p>Filtra por ciudad y precio hasta encontrar opciones que se ajusten a lo que necesitas.</p>
                        </div>
                        <div className="como-paso paso-verde">
                            <div className="paso-top"><span className="paso-num">02</span><span className="paso-emoji">💚</span></div>
                            <h3>Haz match</h3>
                            <p>Nuestro algoritmo calcula tu % de compatibilidad con cada habitación según tu estilo de vida, hábitos y preferencias.</p>
                        </div>
                        <div className="como-paso paso-naranja">
                            <div className="paso-top"><span className="paso-num">03</span><span className="paso-emoji">💬</span></div>
                            <h3>Conecta</h3>
                            <p>Habla directamente con el propietario. Sin intermediarios, sin comisiones.</p>
                        </div>
                        <div className="como-paso paso-morado">
                            <div className="paso-top"><span className="paso-num">04</span><span className="paso-emoji">🏡</span></div>
                            <h3>Vive</h3>
                            <p>Empieza una nueva etapa en un hogar que elegiste tú, con personas que elegiste tú.</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}

export default Home;
