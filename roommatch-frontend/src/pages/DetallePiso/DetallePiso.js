import './DetallePiso.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getHabitacion, getResenas, crearResena } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function DetallePiso() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario, token } = useAuth();
    const [habitacion, setHabitacion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [resenas, setResenas] = useState([]);
    const [puntuacion, setPuntuacion] = useState(5);
    const [comentario, setComentario] = useState('');
    const [enviandoResena, setEnviandoResena] = useState(false);
    const [errorResena, setErrorResena] = useState(null);

    function handleContactar() {
        if (!usuario) {
            navigate('/login');
            return;
        }
        navigate(`/mensajes?con=${habitacion.propietario_id}`);
    }

    useEffect(() => {
        async function cargar() {
            try {
                const datos = await getHabitacion(id);
                if (datos.id) {
                    setHabitacion(datos);
                } else {
                    setError('Habitación no encontrada');
                }
            } catch (err) {
                setError('No se pudo cargar la habitación');
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, [id]);

    useEffect(() => {
        getResenas(id).then(setResenas).catch(() => {});
    }, [id]);

    async function handleEnviarResena(e) {
        e.preventDefault();
        setEnviandoResena(true);
        setErrorResena(null);
        try {
            const nueva = await crearResena(id, { puntuacion, comentario }, token);
            setResenas(prev => [nueva, ...prev]);
            setComentario('');
            setPuntuacion(5);
        } catch (err) {
            setErrorResena(err.message || 'No se pudo enviar la reseña');
        } finally {
            setEnviandoResena(false);
        }
    }

    if (cargando) return <div className="detalle-page"><div className="detalle-inner"><p>Cargando...</p></div></div>;
    if (error) return <div className="detalle-page"><div className="detalle-inner"><p className="detalle-error">{error}</p></div></div>;

    const pref = habitacion.preferencias;

    return (
        <>
        <div className="detalle-topbar">
            <button className="detalle-topbar-volver" onClick={() => navigate(-1)}>← Volver</button>
            <Link to="/" className="detalle-topbar-logo">RoomMatch</Link>
            <div className="detalle-topbar-links">
                {usuario?.rol === 'inquilino' && <Link to="/habitaciones" className="detalle-topbar-link">Buscar pisos</Link>}
                {usuario?.rol === 'propietario' && <Link to="/mis-pisos" className="detalle-topbar-link">Mis pisos</Link>}
                {usuario && <Link to="/mensajes" className="detalle-topbar-link">Mensajes</Link>}
                {usuario && <Link to="/perfil" className="detalle-topbar-link">Mi perfil</Link>}
                {!usuario && <Link to="/login" className="detalle-topbar-link">Iniciar sesión</Link>}
            </div>
        </div>
        <div className="detalle-page">
        <div className="detalle-inner">

            {/* Foto */}
            <div className="detalle-foto">
                {habitacion.foto_url
                    ? <img src={habitacion.foto_url} alt={habitacion.titulo} />
                    : <div className="detalle-foto-placeholder">🏠<span>Sin foto disponible</span></div>
                }
            </div>

            {/* Contenido en dos columnas */}
            <div className="detalle-body">

                {/* Columna izquierda */}
                <div className="detalle-izq">

                    <h1>{habitacion.titulo}</h1>

                    <div className="detalle-meta">
                        <span>📍 {habitacion.ciudad}{habitacion.direccion ? `, ${habitacion.direccion}` : ''}</span>
                    </div>

                    {habitacion.descripcion && (
                        <div className="detalle-seccion">
                            <h2>Descripción</h2>
                            <p>{habitacion.descripcion}</p>
                        </div>
                    )}

                    {pref && (
                        <div className="detalle-seccion">
                            <h2>Condiciones de la casa</h2>
                            <div className="detalle-badges">
                                <span className={`badge ${pref.mascotas_permitidas ? 'ok' : 'no'}`}>
                                    {pref.mascotas_permitidas ? '✓' : '✗'} Mascotas
                                </span>
                                <span className={`badge ${pref.fumar_permitido ? 'ok' : 'no'}`}>
                                    {pref.fumar_permitido ? '✓' : '✗'} Fumar
                                </span>
                                <span className={`badge ${pref.gastos_incluidos ? 'ok' : 'no'}`}>
                                    {pref.gastos_incluidos ? '✓ Gastos incluidos' : '✗ Gastos no incluidos'}
                                </span>
                                {pref.tipo_inquilino && (
                                    <span className="badge neutro">
                                        👤 {pref.tipo_inquilino.charAt(0).toUpperCase() + pref.tipo_inquilino.slice(1)}
                                    </span>
                                )}
                                {pref.preferencia_genero && (
                                    <span className="badge neutro">
                                        {pref.preferencia_genero === 'hombre' ? '♂' : '♀'} Solo {pref.preferencia_genero}
                                    </span>
                                )}
                                {pref.numero_companeros && (
                                    <span className="badge neutro">
                                        👥 {pref.numero_companeros} compañeros
                                    </span>
                                )}
                                {pref.acepta_visitas !== null && pref.acepta_visitas !== undefined && (
                                    <span className={`badge ${pref.acepta_visitas ? 'ok' : 'no'}`}>
                                        {pref.acepta_visitas ? '✓' : '✗'} Visitas
                                    </span>
                                )}
                                {pref.horario_casa && (
                                    <span className="badge neutro">
                                        🕐 {pref.horario_casa.charAt(0).toUpperCase() + pref.horario_casa.slice(1)}
                                    </span>
                                )}
                                {pref.perfil_buscado && (
                                    <span className="badge neutro">
                                        👤 {pref.perfil_buscado.charAt(0).toUpperCase() + pref.perfil_buscado.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Reseñas ── */}
                    <div className="detalle-seccion">
                        <h2>Reseñas ({resenas.length})</h2>

                        {resenas.length === 0 && (
                            <p className="resenas-vacio">Aún no hay reseñas para esta habitación.</p>
                        )}

                        {resenas.map(r => (
                            <div key={r.id} className="resena-item">
                                <div className="resena-header">
                                    <span className="resena-autor">{r.autor_nombre || 'Usuario'}</span>
                                    <span className="resena-estrellas">
                                        {'★'.repeat(r.puntuacion)}{'☆'.repeat(5 - r.puntuacion)}
                                    </span>
                                    <span className="resena-fecha">
                                        {new Date(r.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                </div>
                                {r.comentario && <p className="resena-comentario">{r.comentario}</p>}
                            </div>
                        ))}

                        {usuario?.rol === 'inquilino' && (
                            <form className="resena-form" onSubmit={handleEnviarResena}>
                                <h3>Deja tu valoración</h3>
                                <div className="resena-estrellas-select">
                                    {[1,2,3,4,5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            className={`estrella-btn ${puntuacion >= n ? 'activa' : ''}`}
                                            onClick={() => setPuntuacion(n)}
                                        >★</button>
                                    ))}
                                </div>
                                <textarea
                                    placeholder="Cuéntanos tu experiencia (opcional)"
                                    value={comentario}
                                    onChange={e => setComentario(e.target.value)}
                                    rows={3}
                                    className="resena-textarea"
                                />
                                {errorResena && <p className="error-mensaje">{errorResena}</p>}
                                <button type="submit" className="btn-contactar" disabled={enviandoResena}>
                                    {enviandoResena ? 'Enviando...' : 'Publicar reseña'}
                                </button>
                            </form>
                        )}
                    </div>

                </div>

                {/* Columna derecha — precio y contacto */}
                <div className="detalle-der">
                    <div className="detalle-card-precio">
                        <p className="detalle-precio">{habitacion.precio} €<span>/mes</span></p>
                        {habitacion.fecha_disponible && (
                            <p className="gastos-tag">📅 Disponible desde: {new Date(habitacion.fecha_disponible).toLocaleDateString('es-ES')}</p>
                        )}
                        {pref?.gastos_incluidos && (
                            <p className="gastos-tag">Gastos incluidos</p>
                        )}
                        {usuario?.rol === 'inquilino' && (
                            <>
                                <button className="btn-contactar" onClick={handleContactar}>
                                    Contactar al anunciante
                                </button>
                                <Link className="detalle-ver-propietario" to={`/usuario/${habitacion.propietario_id}`}>
                                    Ver perfil del propietario →
                                </Link>
                            </>
                        )}
                        {!usuario && (
                            <button className="btn-contactar" onClick={handleContactar}>
                                Contactar al anunciante
                            </button>
                        )}
                        <p className="detalle-aviso">Publicado el {new Date(habitacion.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                </div>

            </div>

        </div>
        </div>
        </>
    );
}

export default DetallePiso;
