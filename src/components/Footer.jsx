import { Link } from "react-router-dom";

import Icon from "./Icon";
import { useSitio } from "../lib/sitio";
import "../styles/Footer.css";

function Footer() {
  const { negocio } = useSitio();
  return (
    <footer className="footer">
      <div className="footer__inner contenedor">
        <div>
          <p className="footer__marca">Amoma</p>
          <p className="footer__lema">{negocio.lema}</p>
        </div>

        <ul className="footer__datos">
          <li>
            <Icon name="location" /> {negocio.zona}
          </li>
          <li>
            {/* noopener noreferrer: la pestaña nueva no puede acceder a esta página */}
            <a
              href={`https://www.instagram.com/${negocio.instagram}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="instagram" /> @{negocio.instagram}
            </a>
          </li>
          <li>
            <Link to="/contacto" viewTransition>
              <Icon name="phone" /> {negocio.telefonoVisible}
            </Link>
          </li>
        </ul>
      </div>
      <p className="footer__legal contenedor">
        © {new Date().getFullYear()} Amoma · Pastelería casera ·{" "}
        <Link to="/privacidad" viewTransition>
          Privacidad
        </Link>
      </p>
    </footer>
  );
}

export default Footer;
