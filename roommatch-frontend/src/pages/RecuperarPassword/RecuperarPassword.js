import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Login/Login.css';

const BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

function RecuperarPassword() {
    const [email, setEmail] = useState('');
    const [enviado, setEnviado] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setCargando(true);
        setError(null);
        try {
            await fetch(`${BASE_URL}/usuarios/recuperar-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            setEnviado(true);
        } catch {
            setError('Error al procesar la solicitud. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="login-page">
            <Link to="/login" className="login-volver">← Volver al inicio de sesión</Link>
            <div className="login-card">

                <div className="login-izq" style={{ background: 'linear-gradient(135deg, #2d5a30 0%, #4A7A4D 100%)' }}>
                    <div className="login-izq-overlay">
                        <div className="login-izq-top">
                            <Link to="/" className="login-izq-marca">RoomMatch</Link>
                        </div>
                        <div className="login-izq-texto">
                            <h2>Recupera el acceso a tu cuenta</h2>
                            <p>Te enviaremos un enlace para restablecer tu contraseña.</p>
                        </div>
                    </div>
                </div>

                <div className="login-der">
                    <div className="login-der-header">
                        <h1>¿Olvidaste tu contraseña?</h1>
                    </div>

                    {enviado ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <p style={{ fontSize: '2rem' }}>📧</p>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Solicitud enviada</p>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
                            </p>
                            <Link to="/login" style={{ display: 'block', marginTop: '1.5rem', color: '#4A7A4D', fontWeight: 600 }}>
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <form className="login-form" onSubmit={handleSubmit}>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
                            </p>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="error-mensaje">{error}</p>}
                            <button type="submit" disabled={cargando}>
                                {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RecuperarPassword;
