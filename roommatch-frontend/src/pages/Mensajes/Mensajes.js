import './Mensajes.css';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getConversaciones, getConversacion, enviarMensaje, getUsuarioPublico, marcarConversacionLeida, calcularCompatibilidad } from '../../services/api';

function Mensajes() {
    const { usuario, token } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const mensajesEndRef = useRef(null);

    const [conversaciones, setConversaciones] = useState([]);
    const [conversacionActiva, setConversacionActiva] = useState(null); // ID del otro usuario
    const [mensajes, setMensajes] = useState([]);
    const [nombreOtro, setNombreOtro] = useState('');
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [nombresCache, setNombresCache] = useState({}); // { userId: nombre }
    const [verificadosCache, setVerificadosCache] = useState({}); // { userId: bool }
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [compatibilidad, setCompatibilidad] = useState(null);

    // Al entrar: carga conversaciones y comprueba si viene con ?con=ID
    useEffect(() => {
        async function init() {
            try {
                const convs = await getConversaciones(token);
                setConversaciones(convs);

                // Carga los nombres de cada interlocutor
                const nombres = {};
                const verificados = {};
                for (const msg of convs) {
                    const otroId = msg.emisor_id === usuario.id ? msg.receptor_id : msg.emisor_id;
                    if (!nombres[otroId]) {
                        try {
                            const u = await getUsuarioPublico(otroId, token);
                            nombres[otroId] = u.nombre;
                            verificados[otroId] = u.email_verificado || false;
                        } catch {
                            nombres[otroId] = `Usuario ${otroId}`;
                            verificados[otroId] = false;
                        }
                    }
                }
                setNombresCache(nombres);
                setVerificadosCache(verificados);

                // Si viene de DetallePiso con ?con=ID, abrir ese chat
                const params = new URLSearchParams(location.search);
                const conId = params.get('con');
                if (conId) {
                    setConversacionActiva(parseInt(conId));
                }
            } finally {
                setCargando(false);
            }
        }
        init();
    }, [token, usuario.id, location.search]);

    // Cuando cambia la conversación activa, carga los mensajes
    useEffect(() => {
        if (!conversacionActiva) return;
        getConversacion(conversacionActiva, token)
            .then(setMensajes)
            .catch(err => console.error('Error cargando mensajes:', err));
    }, [conversacionActiva, token]);

    // Carga el nombre del otro usuario (usa cache si ya lo tiene)
    const nombreEnCache = nombresCache[conversacionActiva];
    useEffect(() => {
        if (!conversacionActiva) return;
        if (nombreEnCache) {
            setNombreOtro(nombreEnCache);
            return;
        }
        getUsuarioPublico(conversacionActiva, token)
            .then(u => {
                setNombreOtro(u.nombre);
                setNombresCache(prev => ({ ...prev, [conversacionActiva]: u.nombre }));
            })
            .catch(() => setNombreOtro(`Usuario ${conversacionActiva}`));
    }, [conversacionActiva, token, nombreEnCache]);

    // Scroll automático al último mensaje
    useEffect(() => {
        mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    async function seleccionar(otroId) {
        setConversacionActiva(otroId);
        setMensajes([]);
        setNombreOtro('');
        setCompatibilidad(null);
        try {
            await marcarConversacionLeida(otroId, token);
            window.dispatchEvent(new Event('mensajes-leidos'));
        } catch {
            // silencioso
        }
        if (usuario?.rol === 'propietario') {
            calcularCompatibilidad(otroId, token)
                .then(c => setCompatibilidad(c))
                .catch(() => {});
        }
    }

    async function handleEnviar(e) {
        e.preventDefault();
        if (!nuevoMensaje.trim() || !conversacionActiva) return;

        try {
            setEnviando(true);
            await enviarMensaje({ receptor_id: conversacionActiva, contenido: nuevoMensaje.trim() }, token);
            setNuevoMensaje('');

            // Refresca los mensajes y la lista de conversaciones
            const [data, convs] = await Promise.all([
                getConversacion(conversacionActiva, token),
                getConversaciones(token),
            ]);
            setMensajes(data);
            setConversaciones(convs);
        } catch (err) {
            console.error('Error enviando mensaje:', err);
        } finally {
            setEnviando(false);
        }
    }

    if (cargando) return <div className="mensajes-page"><p className="mensajes-cargando">Cargando mensajes...</p></div>;

    return (
        <>
        <div className="mensajes-topbar">
            <div className="mensajes-topbar-izq">
                <button className="mensajes-topbar-volver" onClick={() => navigate(-1)}>← Volver</button>
                <Link to="/" className="mensajes-topbar-logo">RoomMatch</Link>
            </div>
            <div className="mensajes-topbar-links">
                {usuario?.rol === 'inquilino' && <Link to="/buscar-pisos" className="mensajes-topbar-link">Buscar pisos</Link>}
                {usuario?.rol === 'propietario' && <Link to="/mis-pisos" className="mensajes-topbar-link">Mis pisos</Link>}
                <Link to="/perfil" className="mensajes-topbar-link">Mi perfil</Link>
            </div>
        </div>
        <div className="mensajes-page">

            {/* ── Columna izquierda: lista de conversaciones ── */}
            <div className="mensajes-lista">
                <h2 className="mensajes-titulo">Mensajes</h2>

                {conversaciones.length === 0 && (
                    <p className="mensajes-vacio">Aún no tienes conversaciones.</p>
                )}

                {conversaciones.map(msg => {
                    const otroId = msg.emisor_id === usuario.id ? msg.receptor_id : msg.emisor_id;
                    const nombre = nombresCache[otroId] || `Usuario ${otroId}`;
                    const activo = conversacionActiva === otroId;

                    return (
                        <div
                            key={otroId}
                            className={`conv-item ${activo ? 'activo' : ''}`}
                            onClick={() => seleccionar(otroId)}
                        >
                            <div className="conv-avatar">{nombre.charAt(0).toUpperCase()}</div>
                            <div className="conv-info">
                                <p className="conv-nombre">{nombre}</p>
                                <p className="conv-preview">{msg.contenido}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Columna derecha: chat ── */}
            <div className="mensajes-chat">

                {!conversacionActiva ? (
                    <div className="chat-placeholder">
                        <span>💬</span>
                        <p>Selecciona una conversación para empezar</p>
                    </div>
                ) : (
                    <>
                        {/* Cabecera */}
                        <div className="chat-header">
                            <div className="conv-avatar">{nombreOtro.charAt(0).toUpperCase()}</div>
                            <div className="chat-header-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button className="chat-header-nombre" onClick={() => navigate(`/usuario/${conversacionActiva}`)}>
                                        {nombreOtro}
                                    </button>
                                    {verificadosCache[conversacionActiva] && (
                                        <span style={{
                                            background: '#dcfce7', color: '#16a34a',
                                            fontSize: '0.72rem', fontWeight: 700,
                                            padding: '0.15rem 0.55rem', borderRadius: '20px',
                                            border: '1.5px solid #86efac', whiteSpace: 'nowrap',
                                        }}>✓ Verificado</span>
                                    )}
                                </div>
                                {compatibilidad?.score != null && (
                                    <span style={{
                                        background: compatibilidad.color === 'verde' ? '#dcfce7' : compatibilidad.color === 'naranja' ? '#ffedd5' : '#f1f5f9',
                                        color: compatibilidad.color === 'verde' ? '#16a34a' : compatibilidad.color === 'naranja' ? '#ea580c' : '#64748b',
                                        fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.7rem',
                                        borderRadius: '20px', whiteSpace: 'nowrap',
                                    }}>
                                        {compatibilidad.score}% · {compatibilidad.etiqueta}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Burbujas de mensajes */}
                        <div className="chat-burbujas">
                            {mensajes.length === 0 && (
                                <p className="chat-sin-mensajes">Envía el primer mensaje</p>
                            )}
                            {mensajes.map(m => (
                                <div
                                    key={m.id}
                                    className={`burbuja ${m.emisor_id === usuario.id ? 'propio' : 'ajeno'}`}
                                >
                                    <p>{m.contenido}</p>
                                    <span className="burbuja-hora">
                                        {new Date(m.fecha.endsWith('Z') ? m.fecha : m.fecha + 'Z')
                                            .toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={mensajesEndRef} />
                        </div>

                        {/* Input para escribir */}
                        <form className="chat-input" onSubmit={handleEnviar}>
                            <input
                                type="text"
                                value={nuevoMensaje}
                                onChange={(e) => setNuevoMensaje(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                disabled={enviando}
                            />
                            <button type="submit" disabled={enviando || !nuevoMensaje.trim()}>
                                Enviar
                            </button>
                        </form>
                    </>
                )}

            </div>
        </div>
        </>
    );
}

export default Mensajes;
