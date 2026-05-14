import './Perfil.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getMiPerfil, actualizarPerfil, cambiarPassword, subirFoto } from '../../services/api';

function Perfil() {

    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [datosListos, setDatosListos] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [mensajeDatos, setMensajeDatos] = useState(null);

    const [passActual, setPassActual] = useState('');
    const [passNueva, setPassNueva] = useState('');
    const [guardandoPass, setGuardandoPass] = useState(false);
    const [mensajePass, setMensajePass] = useState(null);

    const [subiendoFotoPerfil, setSubiendoFotoPerfil] = useState(false);

    const { token, logout } = useAuth();
    const navigate = useNavigate();

    async function handleFotoPerfil(e) {
        const archivo = e.target.files[0];
        if (!archivo) return;
        setSubiendoFotoPerfil(true);
        try {
            const { url } = await subirFoto(archivo);
            const actualizado = await actualizarPerfil({ foto_perfil: url }, token);
            setPerfil(actualizado);
        } catch {
            alert('Error al subir la foto');
        } finally {
            setSubiendoFotoPerfil(false);
        }
    }

    useEffect(() => {
        async function cargar() {
            try {
                const datos = await getMiPerfil(token);
                setPerfil(datos);
                setNombre(datos.nombre);
                setEmail(datos.email || '');
                setTelefono(datos.telefono || '');
                setDatosListos(true);
            } catch (err) {
                console.error('Error al cargar el perfil:', err);
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, [token]);

    async function handleGuardarDatos(e) {
        e.preventDefault();
        setGuardando(true);
        setMensajeDatos(null);
        try {
            const actualizado = await actualizarPerfil({ nombre, email, telefono }, token);
            setPerfil(actualizado);
            setMensajeDatos({ tipo: 'ok', texto: '✓ Datos actualizados correctamente' });
        } catch {
            setMensajeDatos({ tipo: 'error', texto: 'Error al guardar los datos' });
        } finally {
            setGuardando(false);
        }
    }

    async function handleCambiarPassword(e) {
        e.preventDefault();
        setGuardandoPass(true);
        setMensajePass(null);
        try {
            await cambiarPassword({ password_actual: passActual, password_nuevo: passNueva }, token);
            setMensajePass({ tipo: 'ok', texto: '✓ Contraseña actualizada correctamente' });
            setPassActual('');
            setPassNueva('');
        } catch {
            setMensajePass({ tipo: 'error', texto: 'La contraseña actual no es correcta' });
        } finally {
            setGuardandoPass(false);
        }
    }

    if (cargando) return <div className="perfil-loading">Cargando perfil...</div>;

    return (
        <>
        <div className="perfil-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn-volver" onClick={() => navigate('/')}>← Volver</button>
                <Link to="/" className="perfil-topbar-logo">RoomMatch</Link>
            </div>
            <div className="perfil-topbar-links">
                {perfil?.rol === 'inquilino' && <Link to="/habitaciones" className="perfil-topbar-link">Explorar</Link>}
                {perfil?.rol === 'inquilino' && <Link to="/mis-preferencias" className="perfil-topbar-link">Mis preferencias</Link>}
                {perfil?.rol === 'propietario' && <Link to="/mis-pisos" className="perfil-topbar-link">Mis pisos</Link>}
                <Link to="/mensajes" className="perfil-topbar-link">Mensajes</Link>
            </div>
        </div>
        <div className="perfil-page">
            <div className="perfil-inner">

                {/* ── Columna izquierda: tarjeta de identidad ── */}
                <aside className="perfil-sidebar">
                    <label className="perfil-avatar-wrap" title="Cambiar foto">
                        {perfil?.foto_perfil
                            ? <img src={perfil.foto_perfil} alt="Foto de perfil" className="perfil-avatar-img" />
                            : <div className="perfil-avatar">{perfil?.nombre.charAt(0).toUpperCase()}</div>
                        }
                        <div className={`perfil-avatar-overlay ${subiendoFotoPerfil ? 'cargando' : ''}`}>
                            {subiendoFotoPerfil ? '...' : '📷'}
                        </div>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFotoPerfil}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <h1 className="perfil-nombre">{perfil?.nombre}</h1>
                    <span className="perfil-rol-badge">
                        {perfil?.rol === 'propietario' ? '🏠 Propietario' : '🔍 Inquilino'}
                    </span>

                    <div className="perfil-info-lista">
                        {perfil?.email && (
                            <div className="perfil-info-item">
                                <span className="info-label">Email</span>
                                <span className="info-valor">{perfil.email}</span>
                            </div>
                        )}
                        {perfil?.telefono && (
                            <div className="perfil-info-item">
                                <span className="info-label">Teléfono</span>
                                <span className="info-valor">{perfil.telefono}</span>
                            </div>
                        )}
                        <div className="perfil-info-item">
                            <span className="info-label">Miembro desde</span>
                            <span className="info-valor">
                                {perfil?.created_at
                                    ? new Date(perfil.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                                    : '—'}
                            </span>
                        </div>
                    </div>

                    {perfil?.rol === 'inquilino' && (
                        <Link to="/mis-preferencias" className="perfil-btn-prefs">
                            🎯 Configurar mi match
                        </Link>
                    )}

                    <button className="btn-cerrar-sesion" onClick={() => { logout(); navigate('/'); }}>
                        Cerrar sesión
                    </button>
                </aside>

                {/* ── Columna derecha: formularios ── */}
                <div className="perfil-forms">

                    {/* Mis datos */}
                    {datosListos && (
                        <div className="perfil-card">
                            <div className="perfil-card-header">
                                <h2>Mis datos</h2>
                                <p>Actualiza tu información personal</p>
                            </div>
                            <form onSubmit={handleGuardarDatos}>
                                <div className="perfil-campos-grid">
                                    <div className="campo-grupo">
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="campo-grupo">
                                        <label>Teléfono</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: 612 345 678"
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                        />
                                    </div>
                                    <div className="campo-grupo campo-full">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {mensajeDatos && (
                                    <p className={`perfil-mensaje ${mensajeDatos.tipo}`}>{mensajeDatos.texto}</p>
                                )}

                                <div className="perfil-card-footer">
                                    <button type="submit" className="btn-guardar-perfil" disabled={guardando}>
                                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Cambiar contraseña */}
                    <div className="perfil-card">
                        <div className="perfil-card-header">
                            <h2>Seguridad</h2>
                            <p>Cambia tu contraseña cuando quieras</p>
                        </div>
                        <form onSubmit={handleCambiarPassword}>
                            <div className="perfil-campos-grid">
                                <div className="campo-grupo campo-full">
                                    <label>Contraseña actual</label>
                                    <input
                                        type="password"
                                        value={passActual}
                                        onChange={(e) => setPassActual(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="campo-grupo campo-full">
                                    <label>Nueva contraseña</label>
                                    <input
                                        type="password"
                                        value={passNueva}
                                        onChange={(e) => setPassNueva(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {mensajePass && (
                                <p className={`perfil-mensaje ${mensajePass.tipo}`}>{mensajePass.texto}</p>
                            )}

                            <div className="perfil-card-footer">
                                <button type="submit" className="btn-guardar-perfil" disabled={guardandoPass}>
                                    {guardandoPass ? 'Actualizando...' : 'Cambiar contraseña'}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
        </>
    );
}

export default Perfil;
