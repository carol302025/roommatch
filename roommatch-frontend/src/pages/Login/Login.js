import { useState } from "react";
import './Login.css';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginUsuario } from "../../services/api";
import loginBg from '../../assets/login-bg.png';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setCargando(true);
        setError(null);
        try {
            const respuesta = await loginUsuario({ email, password });
            if (respuesta.access_token) {
                login(respuesta);
                navigate(respuesta.rol === 'propietario' ? '/mis-pisos' : '/habitaciones');
            } else {
                setError(respuesta.detail || 'Email o contraseña incorrectos');
            }
        } catch {
            setError('Email o contraseña incorrectos');
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="login-page">
            <Link to="/" className="login-volver">← Volver al inicio</Link>
        <div className="login-card">

            {/* ── Panel izquierdo: imagen + mensaje ── */}
            <div className="login-izq" style={{ backgroundImage: `url(${loginBg})` }}>
                <div className="login-izq-overlay">
                    <div className="login-izq-top">
                        <Link to="/" className="login-izq-marca">RoomMatch</Link>
                    </div>
                    <div className="login-izq-texto">
                        <h2>Que compartir piso no sea una apuesta</h2>
                        <p>Conoce el espacio, habla con las personas y decide con tranquilidad.</p>
                    </div>
                </div>
            </div>

            {/* ── Panel derecho: formulario ── */}
            <div className="login-der">
                <div className="login-der-header">
                    <h1>Inicia sesión para continuar</h1>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="input-password">
                            <input
                                type={verPassword ? "text" : "password"}
                                placeholder="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span onClick={() => setVerPassword(!verPassword)}>
                                {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                        </div>
                    </div>

                    <p className="olvidaste">¿Olvidaste tu contraseña?</p>

                    {error && <p className="error-mensaje">{error}</p>}

                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Entrando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <p className="login-footer">
                    ¿No tienes cuenta?
                    <Link className="login-registro-link" to="/registro"> Regístrate aquí</Link>
                </p>
            </div>

        </div>
        </div>
    );
}

export default Login;
