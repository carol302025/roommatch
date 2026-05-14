import { useState } from 'react';
import { enviarMensaje } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Formulario para enviar un primer mensaje al propietario desde DetallePiso.
// Props:
//   receptorId — ID del propietario al que se le envía el mensaje
function FormMensaje({ receptorId }) {
  const { token } = useAuth();
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOk('');
    setError('');

    if (!contenido.trim()) return setError('Escribe un mensaje.');
    if (!token) return setError('Debes iniciar sesión para enviar mensajes.');

    try {
      setLoading(true);
      await enviarMensaje({ receptor_id: receptorId, contenido: contenido.trim() }, token);
      setOk('Mensaje enviado correctamente.');
      setContenido('');
    } catch (err) {
      setError(err?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-mensaje">
      <textarea
        className="form-mensaje-textarea"
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Escribe tu mensaje al propietario..."
        rows={4}
      />
      <button
        type="submit"
        disabled={loading}
        className="form-mensaje-btn"
      >
        {loading ? 'Enviando...' : 'Enviar mensaje'}
      </button>

      {ok && <p className="form-mensaje-ok">{ok}</p>}
      {error && <p className="form-mensaje-error">{error}</p>}
    </form>
  );
}

export default FormMensaje;
