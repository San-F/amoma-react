import logo from "../assets/img/logo.png";
import Icon from "./Icon";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer>
      <img src={logo} alt="Logo Amoma" />
      <p>Amoma - Casero y hecho con amor</p>
      <p>
        {/* noopener noreferrer evita que la pestaña nueva acceda a esta página */}
        <a
          href="https://www.instagram.com/amoma.cakeshop/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="instagram" /> @amoma.cakeshop
        </a>
      </p>
    </footer>
  );
}

export default Footer;
