import './Footer.css';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">

                <div className="footer-marca">
                    <span className="footer-logo">RoomMatch</span>
                    <p>Tu hogar empieza con las personas adecuadas..</p>
                </div>

                <div className="footer-col">
                    <h4>Explorar</h4>
                    <Link to="/buscar-pisos">Buscar habitaciones</Link>
                    <Link to="/#como-funciona">Cómo funciona</Link>
                    <Link to="/registro?tipo=propietario">Publicar habitación</Link>
                </div>

                <div className="footer-col">
                    <h4>Legal</h4>
                    <span>Términos de uso</span>
                    <span>Política de privacidad</span>
                    <span>Contacto</span>
                </div>

            </div>

            <div className="footer-bottom">
                <p>© 2026 RoomMatch · Todos los derechos reservados</p>
            </div>
        </footer>
    );
}

export default Footer;
