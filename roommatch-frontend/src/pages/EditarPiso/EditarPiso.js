import './EditarPiso.css';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHabitacion, actualizarHabitacion, actualizarPreferencias, subirFoto } from '../../services/api';

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

function EditarPiso() {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);

    // Datos básicos
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [direccion, setDireccion] = useState('');
    const [precio, setPrecio] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');
    const [fotoPreview, setFotoPreview] = useState(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    // Preferencias
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

    useEffect(() => {
        async function cargar() {
            try {
                const h = await getHabitacion(id);
                setTitulo(h.titulo || '');
                setDescripcion(h.descripcion || '');
                setCiudad(h.ciudad || '');
                setDireccion(h.direccion || '');
                setPrecio(h.precio?.toString() || '');
                setFotoUrl(h.foto_url || '');
                if (h.foto_url) setFotoPreview(h.foto_url);

                const p = h.preferencias;
                if (p) {
                    setMascotas(p.mascotas_permitidas ?? false);
                    setFumar(p.fumar_permitido ?? false);
                    setGastosIncluidos(p.gastos_incluidos ?? false);
                    setPreferenciaGenero(p.preferencia_genero || '');
                    setNumeroCompaneros(p.numero_companeros?.toString() || '');
                    setPerfilBuscado(p.perfil_buscado || '');
                    setAmbienteCasa(p.ambiente_casa || '');
                    setOrdenEsperado(p.orden_esperado || '');
                    setHorarioCasa(p.horario_casa || '');
                    setAceptaVisitas(p.acepta_visitas === true ? 'si' : p.acepta_visitas === false ? 'no' : '');
                }
            } catch {
                setError('No se pudo cargar la habitación.');
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, [id]);

    async function handleFotoChange(e) {
        const archivo = e.target.files[0];
        if (!archivo) return;
        setFotoPreview(URL.createObjectURL(archivo));
        setSubiendoFoto(true);
        try {
            const respuesta = await subirFoto(archivo);
            setFotoUrl(respuesta.url);
        } catch {
            setError('Error al subir la foto.');
        } finally {
            setSubiendoFoto(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setGuardando(true);
        setError(null);

        try {
            await actualizarHabitacion(id, {
                titulo,
                descripcion: descripcion || null,
                ciudad,
                direccion: direccion || null,
                precio: parseFloat(precio),
                foto_url: fotoUrl || null,
            }, token);

            await actualizarPreferencias(id, {
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
            }, token);

            setExito(true);
            setTimeout(() => navigate('/mis-pisos'), 1200);
        } catch (err) {
            setError(err.message || 'Error al guardar los cambios.');
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) return <div className="editar-loading">Cargando anuncio...</div>;

    return (
        <div className="editar-page">
            <div className="editar-inner">

                <div className="editar-header">
                    <button className="btn-volver" onClick={() => navigate(-1)}>
                        ← Volver
                    </button>
                    <div>
                        <h1>Editar anuncio</h1>
                        <p>Modifica los datos de tu habitación</p>
                    </div>
                </div>

                <form className="editar-form" onSubmit={handleSubmit}>

                    {/* ── Sección: Datos básicos ── */}
                    <div className="editar-seccion">
                        <h2 className="seccion-titulo">Información básica</h2>

                        <div className="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ej: Habitación luminosa en el centro"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Ciudad</label>
                                <input
                                    type="text"
                                    value={ciudad}
                                    onChange={(e) => setCiudad(e.target.value)}
                                    placeholder="Ej: Madrid"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Precio mensual (€)</label>
                                <input
                                    type="number"
                                    value={precio}
                                    onChange={(e) => setPrecio(e.target.value)}
                                    placeholder="Ej: 450"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Dirección (opcional)</label>
                            <input
                                type="text"
                                value={direccion}
                                onChange={(e) => setDireccion(e.target.value)}
                                placeholder="Ej: Calle Gran Vía 10"
                            />
                        </div>

                        <div className="form-group">
                            <label>Descripción (opcional)</label>
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Describe la habitación..."
                                rows={4}
                            />
                        </div>

                        <div className="form-group">
                            <label>Foto de la habitación</label>
                            <div className="foto-upload-area">
                                {fotoPreview
                                    ? <img src={fotoPreview} alt="Preview" className="foto-preview" />
                                    : <div className="foto-placeholder">📷 Haz clic para cambiar la foto</div>
                                }
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFotoChange}
                                    className="foto-input"
                                />
                            </div>
                            {subiendoFoto && <p className="foto-estado">Subiendo foto...</p>}
                            {fotoUrl && !subiendoFoto && fotoPreview !== null && (
                                <p className="foto-ok">✓ Foto lista</p>
                            )}
                        </div>
                    </div>

                    {/* ── Sección: Preferencias ── */}
                    <div className="editar-seccion">
                        <h2 className="seccion-titulo">¿Qué tipo de persona buscas?</h2>

                        <div className="prefs-campo-grupo">
                            <label>Perfil buscado</label>
                            <ChipGroup valor={perfilBuscado} onChange={setPerfilBuscado} opciones={[
                                { value: 'estudiante', label: 'Estudiante', emoji: '📚' },
                                { value: 'trabajador', label: 'Trabajador', emoji: '💼' },
                                { value: 'cualquiera', label: 'Cualquiera', emoji: '🤝' },
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
                                { value: 'madrugador', label: 'Madrugador', emoji: '🌅' },
                                { value: 'normal',     label: 'Normal',     emoji: '☀️' },
                                { value: 'noctambulo', label: 'Noctámbulo', emoji: '🌙' },
                                { value: 'flexible',   label: 'Flexible',   emoji: '🔄' },
                            ]} />
                        </div>

                        <div className="prefs-campo-grupo">
                            <label>¿Se aceptan visitas?</label>
                            <ChipGroup valor={aceptaVisitas} onChange={setAceptaVisitas} opciones={[
                                { value: 'si', label: 'Sí',          emoji: '👥' },
                                { value: 'no', label: 'No',          emoji: '🚫' },
                                { value: '',   label: 'Indiferente', emoji: '🤷' },
                            ]} />
                        </div>

                        <div className="preferencias-grid" style={{ marginTop: '1.5rem' }}>
                            <label className="toggle-label">
                                <span>¿Se permiten mascotas?</span>
                                <input type="checkbox" checked={mascotas} onChange={(e) => setMascotas(e.target.checked)} />
                                <span className="toggle-slider" />
                            </label>
                            <label className="toggle-label">
                                <span>¿Se permite fumar?</span>
                                <input type="checkbox" checked={fumar} onChange={(e) => setFumar(e.target.checked)} />
                                <span className="toggle-slider" />
                            </label>
                            <label className="toggle-label">
                                <span>¿Gastos incluidos?</span>
                                <input type="checkbox" checked={gastosIncluidos} onChange={(e) => setGastosIncluidos(e.target.checked)} />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="form-row" style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                                <label>Preferencia de género</label>
                                <select value={preferenciaGenero} onChange={(e) => setPreferenciaGenero(e.target.value)}>
                                    <option value="">Indiferente</option>
                                    <option value="hombre">Hombre</option>
                                    <option value="mujer">Mujer</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Nº de compañeros</label>
                                <input
                                    type="number"
                                    value={numeroCompaneros}
                                    onChange={(e) => setNumeroCompaneros(e.target.value)}
                                    placeholder="Ej: 2"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    {error && <p className="error-mensaje">{error}</p>}
                    {exito && <p className="exito-mensaje">✓ Cambios guardados. Volviendo...</p>}

                    <div className="editar-acciones">
                        <button type="button" className="btn-cancelar" onClick={() => navigate('/mis-pisos')}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-guardar" disabled={guardando || subiendoFoto}>
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default EditarPiso;
