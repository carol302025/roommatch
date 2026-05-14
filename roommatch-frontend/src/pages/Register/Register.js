import { useState } from 'react';
import './Register.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerUsuario } from '../../services/api';
import { Eye, EyeOff } from 'lucide-react';

function Register() {
    const [searchParams] = useSearchParams();
    const rol = searchParams.get('tipo') === 'propietario' ? 'propietario' : 'inquilino';

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [verPass, setVerPass] = useState(false);
    const [verConfirmar, setVerConfirmar] = useState(false);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (password !== confirmar) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setCargando(true);
        try {
            const respuesta = await registerUsuario({ nombre, email, password, rol });
            if (respuesta.id) {
                navigate('/login');
            } else {
                setError(respuesta.detail || 'Error en el registro, inténtalo de nuevo');
            }
        } catch (err) {
            setError(err?.message || 'Error al conectar con el servidor');
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="register-page">
            <div className="register-card">

                <div className="register-header">
                    <Link to="/" className="register-marca">RoomMatch</Link>
                    <h1>Regístrate</h1>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Nombre completo</label>
                        <input
                            type="text"
                            placeholder="Ej: Carolina García"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                        />
                    </div>

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

                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="input-password">
                            <input
                                type={verPass ? 'text' : 'password'}
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <span onClick={() => setVerPass(!verPass)}>
                                {verPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirmar contraseña</label>
                        <div className="input-password">
                            <input
                                type={verConfirmar ? 'text' : 'password'}
                                placeholder="Repite la contraseña"
                                value={confirmar}
                                onChange={e => setConfirmar(e.target.value)}
                                required
                            />
                            <span onClick={() => setVerConfirmar(!verConfirmar)}>
                                {verConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                        </div>
                    </div>

                    {error && <p className="error-mensaje">{error}</p>}

                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>

                </form>

                <p className="register-footer">
                    ¿Ya tienes cuenta?
                    <Link className="register-login-link" to="/login"> Inicia sesión</Link>
                </p>

                <Link to="/" className="register-volver">← Volver al inicio</Link>

            </div>
        </div>
    );
}

export default Register;
