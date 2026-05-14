import './PublicarPiso.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { crearHabitacion, guardarPreferencias, subirFoto } from '../../services/api';

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

function PublicarPiso() {

    // Control del wizard
    const [paso, setPaso] = useState(1);
    const [habitacionId, setHabitacionId] = useState(null);

    // Paso 1 — datos básicos
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [direccion, setDireccion] = useState('');
    const [precio, setPrecio] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');
    const [fotoPreview, setFotoPreview] = useState(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    // Paso 2 — preferencias de la casa
    const [mascotas, setMascotas] = useState(false);
    const [fumar, setFumar] = useState(false);
    const [gastosIncluidos, setGastosIncluidos] = useState(false);
    const [preferenciaGenero, setPreferenciaGenero] = useState('');
    const [numeroCompaneros, setNumeroCompaneros] = useState('');
    const [perfilBuscado, setPerfilBuscado] = useState('');
    const [ambienteCasa, setAmbienteCasa] = useState('');
    const [ordenEsperado, setOrdenEsperado] = useState('');
    const [horarioCasa, setHorarioCasa] = useState('');
    const [aceptaVisitas, setAceptaVisitas] = useState('');

    // Control
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const { token } = useAuth();
    const navigate = useNavigate();

    // ── Sube la foto al backend en cuanto el usuario la selecciona ──
    async function handleFotoChange(e) {
        const archivo = e.target.files[0];
        if (!archivo) return;

        setFotoPreview(URL.createObjectURL(archivo));
        setSubiendoFoto(true);
        try {
            const respuesta = await subirFoto(archivo);
            setFotoUrl(respuesta.url);
        } catch (err) {
            setError('Error al subir la foto. Comprueba el formato y tamaño.');
        } finally {
            setSubiendoFoto(false);
        }
    }

    // ── Paso 1: guarda la habitación y avanza al paso 2 ──
    async function handlePaso1(e) {
        e.preventDefault();
        setCargando(true);
        setError(null);

        try {
            const datos = { titulo, descripcion, ciudad, direccion, precio: parseFloat(precio), foto_url: fotoUrl || null };
            const respuesta = await crearHabitacion(datos, token);

            if (respuesta.id) {
                setHabitacionId(respuesta.id);
                setPaso(2);
            } else {
                const msg = Array.isArray(respuesta.detail)
                    ? respuesta.detail.map(e => e.msg).join(', ')
                    : respuesta.detail || 'Error al guardar la habitación';
                setError(msg);
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
        } finally {
            setCargando(false);
        }
    }

    // ── Paso 2: guarda las preferencias y redirige ──
    async function handlePaso2(e) {
        e.preventDefault();
        setCargando(true);
        setError(null);

        try {
            const preferencias = {
                mascotas_permitidas: mascotas,
                fumar_permitido: fumar,
                gastos_incluidos: gastosIncluidos,
                preferencia_genero: preferenciaGenero || null,
                numero_companeros: numeroCompaneros ? parseInt(numeroCompaneros) : null,
                perfil_buscado: perfilBuscado || null,
                ambiente_casa: ambienteCasa || null,
                orden_esperado: ordenEsperado || null,
                horario_casa: horarioCasa || null,
                acepta_visitas: aceptaVisitas === 'si' ? true : aceptaVisitas === 'no' ? false : null,
            };

            const respuesta = await guardarPreferencias(habitacionId, preferencias, token);

            if (respuesta.id) {
                navigate('/mis-pisos');
            } else {
                const msg = Array.isArray(respuesta.detail)
                    ? respuesta.detail.map(e => e.msg).join(', ')
                    : respuesta.detail || 'Error al guardar las preferencias';
                setError(msg);
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="publicar-page">

            {/* Panel izquierdo — marketing */}
            <div className="publicar-panel-izq">

                <div className="panel-contenido">

                    {/* Bloque superior — badge + título */}
                    <div className="panel-top">
                        <div className="panel-badge">✦ Publicar es fácil y gratuito</div>
                        <h2>Tu habitación está esperando a la <span className="titulo-verde">persona correcta</span></h2>
                    </div>

                    {/* Bloque inferior — frase + beneficios + social */}
                    <div className="panel-bottom">
                        <div className="panel-frase">
                            <p>RoomMatch te ayuda a conectar con inquilinos reales, compatibles y verificados.</p>
                            <div className="panel-frase-sep" />
                            <p>Publica tu habitación de forma segura y encuentra a la persona adecuada.</p>
                        </div>

                        <ul className="panel-beneficios">
                            <li>
                                <div className="beneficio-icono">👥</div>
                                <div>
                                    <strong>Tranquilidad ante todo</strong>
                                    <span>Perfiles humanos y verificados, con reseñas reales.</span>
                                </div>
                            </li>
                            <li>
                                <div className="beneficio-icono">🌿</div>
                                <div>
                                    <strong>Afinidad de verdad</strong>
                                    <span>Conectamos personas por valores, no solo por precio.</span>
                                </div>
                            </li>
                        </ul>

                        <div className="panel-social">
                            <div className="panel-avatares">
                                <div className="avatar">C</div>
                                <div className="avatar">M</div>
                                <div className="avatar">A</div>
                                <div className="avatar">+</div>
                            </div>
                            <p>Personas reales que encontraron su hogar a través de <strong>RoomMatch</strong></p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Panel derecho — formulario */}
            <div className="publicar-card">

                <button className="btn-volver" onClick={() => navigate(-1)}>
                    ← Volver
                </button>

                {/* Indicador de pasos */}
                <p className="wizard-label">Paso {paso} de 2</p>
                <div className="wizard-steps">
                    <div className={`wizard-step ${paso >= 1 ? 'activo' : ''}`}>
                        <span>1</span> Información básica
                    </div>
                    <div className="wizard-linea" />
                    <div className={`wizard-step ${paso >= 2 ? 'activo' : ''}`}>
                        <span>2</span> Preferencias
                    </div>
                </div>

                {/* ── PASO 1 ── */}
                {paso === 1 && (
                    <form className="publicar-form" onSubmit={handlePaso1}>
                        <div className="form-cabecera">
                            <h2>Datos de la habitación</h2>
                            <p>Cuéntanos lo básico sobre tu espacio</p>
                        </div>

                        <div className="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                placeholder="Ej: Habitación luminosa en el centro"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                required
                            />
                        </div>

                        <div className="publicar-form-row">
                            <div className="form-group">
                                <label>Ciudad</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Madrid"
                                    value={ciudad}
                                    onChange={(e) => setCiudad(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Precio mensual (€)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 450"
                                    value={precio}
                                    onChange={(e) => setPrecio(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Foto de la habitación</label>
                            <div className="foto-upload-area">
                                {fotoPreview
                                    ? <img src={fotoPreview} alt="Preview" className="foto-preview" />
                                    : <div className="foto-placeholder">📷 Haz clic para subir una foto</div>
                                }
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFotoChange}
                                    className="foto-input"
                                />
                            </div>
                            {subiendoFoto && <p className="foto-estado">Subiendo foto...</p>}
                            {fotoUrl && !subiendoFoto && <p className="foto-ok">✓ Foto subida correctamente</p>}
                        </div>

                        <div className="form-opcionales">
                            <p className="opcionales-label">Opcional — añade más detalles</p>

                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    placeholder="Describe la habitación..."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Dirección</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Calle Gran Vía 10"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && <p className="error-mensaje">{error}</p>}

                        <button type="submit" disabled={cargando}>
                            {cargando ? 'Guardando...' : 'Continuar →'}
                        </button>
                    </form>
                )}

                {/* ── PASO 2 ── */}
                {paso === 2 && (
                    <form className="publicar-form" onSubmit={handlePaso2}>
                        <div className="form-cabecera">
                            <h2>¿Qué tipo de persona buscas?</h2>
                            <p>Esto ayuda al sistema a encontrar inquilinos compatibles contigo</p>
                        </div>

                        <div className="prefs-campo-grupo">
                            <label>Perfil buscado</label>
                            <ChipGroup valor={perfilBuscado} onChange={setPerfilBuscado} opciones={[
                                { value: 'estudiante',  label: 'Estudiante',  emoji: '📚' },
                                { value: 'trabajador',  label: 'Trabajador',  emoji: '💼' },
                                { value: 'cualquiera',  label: 'Cualquiera',  emoji: '🤝' },
                            ]} />
                        </div>

                        <div className="prefs-campo-grupo">
                            <label>Ambiente de la casa</label>
                            <ChipGroup valor={ambienteCasa} onChange={setAmbienteCasa} opciones={[
                                { value: 'tranquilo', label: 'Tranquilo', emoji: '🤫' },
                                { value: 'animado',   label: 'Animado',   emoji: '🎉' },
                                { value: 'flexible',  label: 'Flexible',  emoji: '😊' },
                            ]} />
                        </div>

                        <div className="prefs-campo-grupo">
                            <label>Nivel de orden esperado</label>
                            <ChipGroup valor={ordenEsperado} onChange={setOrdenEsperado} opciones={[
                                { value: 'alto',     label: 'Muy ordenado', emoji: '✨' },
                                { value: 'medio',    label: 'Ordenado',     emoji: '🙂' },
                                { value: 'flexible', label: 'Flexible',     emoji: '😅' },
                            ]} />
                        </div>

                        <div className="prefs-campo-grupo">
                            <label>Horario de la casa</label>
                            <ChipGroup valor={horarioCasa} onChange={setHorarioCasa} opciones={[
                                { value: 'madrugador', label: 'Madrugador',  emoji: '🌅' },
                                { value: 'normal',     label: 'Normal',      emoji: '☀️' },
                                { value: 'noctambulo', label: 'Noctámbulo',  emoji: '🌙' },
                                { value: 'flexible',   label: 'Flexible',    emoji: '🔄' },
                            ]} />
                        </div>

                        <div className="prefs-campo-grupo">
                            <label>¿Se aceptan visitas?</label>
                            <ChipGroup valor={aceptaVisitas} onChange={setAceptaVisitas} opciones={[
                                { value: 'si',  label: 'Sí',         emoji: '👥' },
                                { value: 'no',  label: 'No',         emoji: '🚫' },
                                { value: '',    label: 'Indiferente', emoji: '🤷' },
                            ]} />
                        </div>

                        <hr style={{ border: 'none', borderTop: '1.5px solid #f1f5f9', margin: '0.5rem 0' }} />

                        <div className="form-group">
                            <label>Preferencia de género (opcional)</label>
                            <select value={preferenciaGenero} onChange={(e) => setPreferenciaGenero(e.target.value)}>
                                <option value="">Indiferente</option>
                                <option value="hombre">Hombre</option>
                                <option value="mujer">Mujer</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Número de compañeros (opcional)</label>
                            <input
                                type="number"
                                placeholder="Ej: 2"
                                value={numeroCompaneros}
                                onChange={(e) => setNumeroCompaneros(e.target.value)}
                                min="1"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            <div className="prefs-toggle-item" onClick={() => setMascotas(!mascotas)}>
                                <div className="prefs-toggle-texto">
                                    <span className="prefs-toggle-emoji">🐾</span>
                                    <div><strong>Se permiten mascotas</strong></div>
                                </div>
                                <div className={`prefs-toggle-switch ${mascotas ? 'activo' : ''}`}><div className="prefs-toggle-thumb" /></div>
                            </div>
                            <div className="prefs-toggle-item" onClick={() => setFumar(!fumar)}>
                                <div className="prefs-toggle-texto">
                                    <span className="prefs-toggle-emoji">🚬</span>
                                    <div><strong>Se permite fumar</strong></div>
                                </div>
                                <div className={`prefs-toggle-switch ${fumar ? 'activo' : ''}`}><div className="prefs-toggle-thumb" /></div>
                            </div>
                            <div className="prefs-toggle-item" onClick={() => setGastosIncluidos(!gastosIncluidos)}>
                                <div className="prefs-toggle-texto">
                                    <span className="prefs-toggle-emoji">💡</span>
                                    <div><strong>Gastos incluidos en el precio</strong></div>
                                </div>
                                <div className={`prefs-toggle-switch ${gastosIncluidos ? 'activo' : ''}`}><div className="prefs-toggle-thumb" /></div>
                            </div>
                        </div>

                        {error && <p className="error-mensaje">{error}</p>}

                        <div className="publicar-botones">
                            <button type="button" className="btn-secundario" onClick={() => navigate('/mis-pisos')}>
                                Omitir
                            </button>
                            <button type="submit" disabled={cargando}>
                                {cargando ? 'Publicando...' : 'Publicar habitación'}
                            </button>
                        </div>
                    </form>
                )}

            </div>

        </div>
    );
}

export default PublicarPiso;
