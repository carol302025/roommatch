import './DetallePiso.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getHabitacion } from '../../services/api';
import FormMensaje from '../../components/FormMensaje';
import { useAuth } from '../../context/AuthContext';

function DetallePiso() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const [habitacion, setHabitacion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    function handleContactar() {
        if (!usuario) {
            navigate('/login');
            return;
        }
        setMostrarFormulario(v => !v);
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
                                    {mostrarFormulario ? 'Ocultar formulario' : 'Contactar al anunciante'}
                                </button>
                                {mostrarFormulario && (
                                    <div style={{ marginTop: '12px' }}>
                                        <FormMensaje receptorId={habitacion.propietario_id} />
                                    </div>
                                )}
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
