import './MisPreferencias.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getPerfilInquilino, actualizarPerfilInquilino, getPreferenciasInquilino, actualizarPreferenciasInquilino } from '../../services/api';
import logo from '../../assets/logoP.png';

function ChipGroup({ opciones, valor, onChange }) {
    return (
        <div className="chip-group">
            {opciones.map(op => (
                <button
                    key={op.value}
                    type="button"
                    className={`chip ${valor === op.value ? 'activo' : ''}`}
                    onClick={() => onChange(valor === op.value ? '' : op.value)}
                >
                    <span>{op.emoji}</span> {op.label}
                </button>
            ))}
        </div>
    );
}

function MisPreferencias() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [fumador, setFumador] = useState(false);
    const [tieneMascota, setTieneMascota] = useState(false);
    const [tieneVisitas, setTieneVisitas] = useState(false);
    const [tipoPersona, setTipoPersona] = useState('');
    const [nivelRuido, setNivelRuido] = useState('');
    const [nivelOrden, setNivelOrden] = useState('');
    const [horario, setHorario] = useState('');
    const [sociabilidad, setSociabilidad] = useState('');
    const [presupuestoMax, setPresupuestoMax] = useState('');
    const [ciudadPreferida, setCiudadPreferida] = useState('');
    const [gastosIncluidos, setGastosIncluidos] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        async function cargar() {
            try {
                const pi = await getPerfilInquilino(token);
                setFumador(pi.fumador || false);
                setTieneMascota(pi.tiene_mascota || false);
                setTieneVisitas(pi.tiene_visitas || false);
                setTipoPersona(pi.tipo_persona || '');
                setNivelRuido(pi.nivel_ruido || '');
                setNivelOrden(pi.nivel_orden || '');
                setHorario(pi.horario || '');
                setSociabilidad(pi.sociabilidad || '');
            } catch {}
            try {
                const pr = await getPreferenciasInquilino(token);
                setPresupuestoMax(pr.presupuesto_max || '');
                setCiudadPreferida(pr.ciudad_preferida || '');
                setGastosIncluidos(pr.gastos_incluidos || false);
            } catch {}
            setCargando(false);
        }
        cargar();
    }, [token]);

    async function handleGuardar(e) {
        e.preventDefault();
        setGuardando(true);
        setMensaje(null);
        try {
            await actualizarPerfilInquilino({
                fumador, tiene_mascota: tieneMascota, tiene_visitas: tieneVisitas,
                tipo_persona: tipoPersona || null, nivel_ruido: nivelRuido || null,
                nivel_orden: nivelOrden || null, horario: horario || null,
                sociabilidad: sociabilidad || null,
            }, token);
            await actualizarPreferenciasInquilino({
                presupuesto_max: presupuestoMax ? parseInt(presupuestoMax) : null,
                ciudad_preferida: ciudadPreferida || null,
                gastos_incluidos: gastosIncluidos,
            }, token);
            setMensaje({ tipo: 'ok', texto: '✓ Preferencias guardadas. Tu match se actualizará.' });
        } catch {
            setMensaje({ tipo: 'error', texto: 'Error al guardar las preferencias' });
        } finally {
            setGuardando(false);
        }
    }

    return (
        <>
        <div className="prefs-topbar">
            <div className="prefs-topbar-izq">
                <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>
                <Link to="/" className="prefs-topbar-logo">
                    <img src={logo} alt="RoomMatch" />
                    RoomMatch
                </Link>
            </div>
            <div className="prefs-topbar-links">
                <Link to="/habitaciones" className="prefs-topbar-link">Explorar</Link>
                <Link to="/mis-favoritos" className="prefs-topbar-link">Favoritos</Link>
                <Link to="/mensajes" className="prefs-topbar-link">Mensajes</Link>
                <Link to="/perfil" className="prefs-topbar-link">Mi perfil</Link>
                <button className="prefs-topbar-link prefs-topbar-btn" onClick={() => { logout(); navigate('/'); }}>
                    Cerrar sesión
                </button>
            </div>
        </div>

        <div className="prefs-page">
            <div className="prefs-inner">

                <div className="prefs-heading">
                    <h1>Mi perfil de convivencia</h1>
                    <p>Cuanto más rellenes, más precisos serán tus matches</p>
                </div>

                {cargando ? (
                    <div className="prefs-loading">Cargando preferencias...</div>
                ) : (
                    <form className="prefs-form" onSubmit={handleGuardar}>

                        {/* ── Quién eres ── */}
                        <div className="prefs-card">
                            <div className="prefs-card-header">
                                <span className="prefs-card-icon">🧑</span>
                                <div>
                                    <h2>¿Quién eres?</h2>
                                    <p>Tu estilo de vida para encontrar el hogar ideal</p>
                                </div>
                            </div>

                            <div className="prefs-campos-chips">
                                <div className="prefs-campo-grupo">
                                    <label>¿A qué te dedicas?</label>
                                    <ChipGroup valor={tipoPersona} onChange={setTipoPersona} opciones={[
                                        { value: 'estudiante',    label: 'Estudiante',      emoji: '📚' },
                                        { value: 'trabajador',    label: 'Trabajador',      emoji: '💼' },
                                        { value: 'teletrabajador',label: 'Teletrabajo',     emoji: '💻' },
                                        { value: 'nocturno',      label: 'Turno nocturno',  emoji: '🌙' },
                                    ]} />
                                </div>

                                <div className="prefs-campo-grupo">
                                    <label>¿Cómo es tu nivel de ruido?</label>
                                    <ChipGroup valor={nivelRuido} onChange={setNivelRuido} opciones={[
                                        { value: 'silencioso', label: 'Muy silencioso', emoji: '🤫' },
                                        { value: 'tranquilo',  label: 'Tranquilo',      emoji: '😌' },
                                        { value: 'animado',    label: 'Animado',        emoji: '🎉' },
                                    ]} />
                                </div>

                                <div className="prefs-campo-grupo">
                                    <label>¿Cuál es tu nivel de orden?</label>
                                    <ChipGroup valor={nivelOrden} onChange={setNivelOrden} opciones={[
                                        { value: 'alto',     label: 'Muy ordenado', emoji: '✨' },
                                        { value: 'medio',    label: 'Ordenado',     emoji: '🙂' },
                                        { value: 'flexible', label: 'Flexible',     emoji: '😅' },
                                    ]} />
                                </div>

                                <div className="prefs-campo-grupo">
                                    <label>¿Cuál es tu horario habitual?</label>
                                    <ChipGroup valor={horario} onChange={setHorario} opciones={[
                                        { value: 'madrugador', label: 'Madrugador',  emoji: '🌅' },
                                        { value: 'normal',     label: 'Normal',      emoji: '☀️' },
                                        { value: 'noctambulo', label: 'Noctámbulo',  emoji: '🌙' },
                                    ]} />
                                </div>

                                <div className="prefs-campo-grupo">
                                    <label>¿Cómo eres socialmente?</label>
                                    <ChipGroup valor={sociabilidad} onChange={setSociabilidad} opciones={[
                                        { value: 'introvertido',  label: 'Introvertido',  emoji: '📖' },
                                        { value: 'equilibrado',   label: 'Equilibrado',   emoji: '⚖️' },
                                        { value: 'extrovertido',  label: 'Extrovertido',  emoji: '🎤' },
                                    ]} />
                                </div>
                            </div>

                            <div className="prefs-toggles">
                                <div className="prefs-toggle-item" onClick={() => setFumador(!fumador)}>
                                    <div className="prefs-toggle-texto">
                                        <span className="prefs-toggle-emoji">🚬</span>
                                        <div><strong>Soy fumador</strong><p>Buscaremos habitaciones que lo permitan</p></div>
                                    </div>
                                    <div className={`prefs-toggle-switch ${fumador ? 'activo' : ''}`}><div className="prefs-toggle-thumb" /></div>
                                </div>
                                <div className="prefs-toggle-item" onClick={() => setTieneMascota(!tieneMascota)}>
                                    <div className="prefs-toggle-texto">
                                        <span className="prefs-toggle-emoji">🐾</span>
                                        <div><strong>Tengo mascota</strong><p>Solo verás pisos que acepten animales</p></div>
                                    </div>
                                    <div className={`prefs-toggle-switch ${tieneMascota ? 'activo' : ''}`}><div className="prefs-toggle-thumb" /></div>
                                </div>
                                <div className="prefs-toggle-item" onClick={() => setTieneVisitas(!tieneVisitas)}>
                                    <div className="prefs-toggle-texto">
                                        <span className="prefs-toggle-emoji">👥</span>
                                        <div><strong>Recibo visitas con frecuencia</strong><p>Buscaremos pisos donde esto esté permitido</p></div>
                                    </div>
                                    <div className={`prefs-toggle-switch ${tieneVisitas ? 'activo' : ''}`}><div className="prefs-toggle-thumb" /></div>
                                </div>
                            </div>
                        </div>

                        {/* ── Qué buscas ── */}
                        <div className="prefs-card">
                            <div className="prefs-card-header">
                                <span className="prefs-card-icon">💰</span>
                                <div>
                                    <h2>¿Qué buscas?</h2>
                                    <p>Presupuesto y ubicación para afinar los resultados</p>
                                </div>
                            </div>
                            <div className="prefs-campos">
                                <div className="campo-grupo">
                                    <label>Presupuesto máximo (€/mes)</label>
                                    <input type="number" placeholder="Ej: 600" value={presupuestoMax} onChange={e => setPresupuestoMax(e.target.value)} min="0" />
                                </div>
                                <div className="campo-grupo">
                                    <label>Ciudad preferida</label>
                                    <input type="text" placeholder="Ej: Madrid" value={ciudadPreferida} onChange={e => setCiudadPreferida(e.target.value)} />
                                </div>
                            </div>
                            <div className="prefs-toggles">
                                <div className="prefs-toggle-item" onClick={() => setGastosIncluidos(!gastosIncluidos)}>
                                    <div className="prefs-toggle-texto">
                                        <span className="prefs-toggle-emoji">💡</span>
                                        <div><strong>Necesito gastos incluidos</strong><p>Agua, luz e internet ya incluidos en el precio</p></div>
                                    </div>
                                    <div className={`prefs-toggle-switch ${gastosIncluidos ? 'activo' : ''}`}><div className="prefs-toggle-thumb" /></div>
                                </div>
                            </div>
                        </div>

                        {mensaje && <p className={`prefs-mensaje ${mensaje.tipo}`}>{mensaje.texto}</p>}

                        <div className="prefs-footer">
                            <button type="submit" className="prefs-btn-guardar" disabled={guardando}>
                                {guardando ? 'Guardando...' : 'Guardar preferencias'}
                            </button>
                            <Link to="/" className="prefs-btn-match">Ver mi match →</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
        </>
    );
}

export default MisPreferencias;
