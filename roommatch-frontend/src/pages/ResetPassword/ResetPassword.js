import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import '../Login/Login.css';

const BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== confirmar) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        setCargando(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/usuarios/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.detail || 'El enlace no es válido o ha expirado');
            } else {
                setExito(true);
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch {
            setError('Error al restablecer la contraseña. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    }

    if (!token) {
        return (
            <div className="login-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️ Enlace no válido</p>
                    <p style={{ color: '#64748b' }}>Este enlace de recuperación no es válido.</p>
                    <Link to="/recuperar-password" style={{ color: '#4A7A4D', fontWeight: 600 }}>
                        Solicitar uno nuevo
                    </Link>
                </div>
            </div>
        );
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
                            <h2>Crea una nueva contraseña segura</h2>
                            <p>Elige una contraseña que no uses en ningún otro sitio.</p>
                        </div>
                    </div>
                </div>

                <div className="login-der">
                    <div className="login-der-header">
                        <h1>Nueva contraseña</h1>
                    </div>

                    {exito ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <p style={{ fontSize: '2rem' }}>✅</p>
                            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>¡Contraseña actualizada!</p>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Redirigiendo al inicio de sesión...
                            </p>
                        </div>
                    ) : (
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nueva contraseña</label>
                                <div className="input-password">
                                    <input
                                        type={verPassword ? 'text' : 'password'}
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <span onClick={() => setVerPassword(!verPassword)}>
                                        {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Confirmar contraseña</label>
                                <input
                                    type="password"
                                    placeholder="Repite la contraseña"
                                    value={confirmar}
                                    onChange={e => setConfirmar(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="error-mensaje">{error}</p>}
                            <button type="submit" disabled={cargando}>
                                {cargando ? 'Guardando...' : 'Establecer nueva contraseña'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
