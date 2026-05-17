import './PerfilPublico.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUsuarioPublico } from '../../services/api';

function PerfilPublico() {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        async function cargar() {
            try {
                const datos = await getUsuarioPublico(id, token);
                setPerfil(datos);
            } catch {
                setPerfil(null);
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, [id, token]);

    if (cargando) return <div className="perfil-pub-loading">Cargando perfil...</div>;
    if (!perfil) return <div className="perfil-pub-loading">Usuario no encontrado.</div>;

    return (
        <div className="perfil-pub-page">
            <div className="perfil-pub-inner">

                <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>

                <div className="perfil-pub-card">

                    {/* Avatar */}
                    <div className="perfil-pub-avatar">
                        {perfil.foto_perfil
                            ? <img src={perfil.foto_perfil} alt={perfil.nombre} />
                            : <span>{perfil.nombre.charAt(0).toUpperCase()}</span>
                        }
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h1 className="perfil-pub-nombre">{perfil.nombre}</h1>
                        {perfil.email_verificado && (
                            <span style={{
                                background: '#dcfce7', color: '#16a34a',
                                fontSize: '0.75rem', fontWeight: 700,
                                padding: '0.2rem 0.65rem', borderRadius: '20px',
                                border: '1.5px solid #86efac', whiteSpace: 'nowrap',
                            }}>
                                ✓ Verificado
                            </span>
                        )}
                    </div>

                    <span className="perfil-pub-rol">
                        {perfil.rol === 'propietario' ? '🏠 Propietario' : '🔍 Inquilino'}
                    </span>

                    <div className="perfil-pub-info">
                        {perfil.telefono && (
                            <div className="perfil-pub-dato">
                                <span className="pub-label">Teléfono</span>
                                <span className="pub-valor">{perfil.telefono}</span>
                            </div>
                        )}
                        {perfil.created_at && (
                            <div className="perfil-pub-dato">
                                <span className="pub-label">Miembro desde</span>
                                <span className="pub-valor">
                                    {new Date(perfil.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Hábitos del inquilino */}
                    {perfil.perfil_inquilino && (
                        <div className="perfil-pub-habitos">
                            <h2 className="perfil-pub-habitos-titulo">Estilo de vida</h2>

                            {perfil.perfil_inquilino.bio && (
                                <p className="perfil-pub-bio">{perfil.perfil_inquilino.bio}</p>
                            )}

                            <div className="perfil-pub-chips">
                                {perfil.perfil_inquilino.tipo_persona && (
                                    <span className="pub-chip">{
                                        { estudiante: '🎓 Estudiante', trabajador: '💼 Trabajador', teletrabajador: '💻 Teletrabajador', nocturno: '🌙 Nocturno' }[perfil.perfil_inquilino.tipo_persona] || perfil.perfil_inquilino.tipo_persona
                                    }</span>
                                )}
                                {perfil.perfil_inquilino.horario && (
                                    <span className="pub-chip">{
                                        { madrugador: '🌅 Madrugador', normal: '🕐 Horario normal', noctambulo: '🦉 Noctámbulo' }[perfil.perfil_inquilino.horario] || perfil.perfil_inquilino.horario
                                    }</span>
                                )}
                                {perfil.perfil_inquilino.nivel_ruido && (
                                    <span className="pub-chip">{
                                        { silencioso: '🔇 Silencioso', tranquilo: '🔉 Tranquilo', animado: '🔊 Animado' }[perfil.perfil_inquilino.nivel_ruido] || perfil.perfil_inquilino.nivel_ruido
                                    }</span>
                                )}
                                {perfil.perfil_inquilino.nivel_orden && (
                                    <span className="pub-chip">{
                                        { alto: '✨ Muy ordenado', medio: '🧹 Ordenado', flexible: '😌 Flexible' }[perfil.perfil_inquilino.nivel_orden] || perfil.perfil_inquilino.nivel_orden
                                    }</span>
                                )}
                                {perfil.perfil_inquilino.sociabilidad && (
                                    <span className="pub-chip">{
                                        { introvertido: '🙂 Introvertido', equilibrado: '😊 Equilibrado', extrovertido: '🎉 Extrovertido' }[perfil.perfil_inquilino.sociabilidad] || perfil.perfil_inquilino.sociabilidad
                                    }</span>
                                )}
                                {perfil.perfil_inquilino.fumador === true && <span className="pub-chip">🚬 Fuma</span>}
                                {perfil.perfil_inquilino.fumador === false && <span className="pub-chip">🚭 No fuma</span>}
                                {perfil.perfil_inquilino.tiene_mascota === true && <span className="pub-chip">🐾 Tiene mascota</span>}
                                {perfil.perfil_inquilino.tiene_visitas === true && <span className="pub-chip">👥 Recibe visitas</span>}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default PerfilPublico;
