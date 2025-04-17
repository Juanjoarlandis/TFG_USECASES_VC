// src/components/Footer/Footer.js
import React from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="w-full bg-azulOscuro text-blanco font-body mt-10">
      {/* Sección superior: columnas con info */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Columna 1: Acerca de / Logo */}
        <div>
          <h4 className="text-xl font-semibold mb-3">Seguridad Social</h4>
          <p className="text-sm text-gray-200 leading-relaxed">
            Organismo responsable de la protección social de los ciudadanos.
            Ofrecemos servicios y trámites en línea para facilitar la gestión
            de prestaciones, cotizaciones y otros procedimientos administrativos.
          </p>
          {/* Redes sociales en móvil, si quieres repetirlas aquí */}
          <div className="mt-4 flex space-x-3">
            <a
              href="https://www.facebook.com/seguridadsocial"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary transition-colors"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://twitter.com/seg_social_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary transition-colors"
            >
              <FaTwitter />
            </a>
            <a
              href="https://www.linkedin.com/company/seguridadsocial"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary transition-colors"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://www.youtube.com/user/seguridadsocial"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary transition-colors"
            >
              <FaYoutube />
            </a>
          </div>
        </div>

        {/* Columna 2: Enlaces / Secciones */}
        <div>
          <h5 className="text-lg font-semibold mb-3">Trámites Destacados</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/alta" className="hover:text-secondary transition-colors">
                Solicitar Alta
              </a>
            </li>
            <li>
              <a href="/prestaciones" className="hover:text-secondary transition-colors">
                Prestaciones
              </a>
            </li>
            <li>
              <a href="/jubilacion" className="hover:text-secondary transition-colors">
                Simulador de Jubilación
              </a>
            </li>
            <li>
              <a href="/afiliacion" className="hover:text-secondary transition-colors">
                Afiliación
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 3: Ayuda / Recursos */}
        <div>
          <h5 className="text-lg font-semibold mb-3">Ayuda y Recursos</h5>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/faq" className="hover:text-secondary transition-colors">
                Preguntas Frecuentes (FAQ)
              </a>
            </li>
            <li>
              <a href="/tutoriales" className="hover:text-secondary transition-colors">
                Tutoriales
              </a>
            </li>
            <li>
              <a href="/ayuda" className="hover:text-secondary transition-colors">
                Centro de Ayuda
              </a>
            </li>
            <li>
              <a href="/contacto" className="hover:text-secondary transition-colors">
                Contacto
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 4: Suscripción a boletín */}
        <div>
          <h5 className="text-lg font-semibold mb-3">Suscríbete a nuestro boletín</h5>
          <p className="text-sm text-gray-200 mb-3">
            Recibe noticias, actualizaciones y recordatorios importantes
            directamente en tu email.
          </p>
          <form className="flex flex-col space-y-2">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="px-3 py-2 rounded focus:outline-none text-gray-800"
            />
            <button
              type="submit"
              className="bg-secondary text-neutralDark font-semibold py-2 rounded hover:bg-primary hover:text-white transition-colors"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </div>

      {/* Sección inferior: enlaces legales y copyright */}
      <div className="bg-azulMedio">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-2 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} Seguridad Social. Todos los derechos reservados.
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="/aviso-legal"
              className="hover:text-secondary transition-colors"
            >
              Aviso Legal
            </a>
            <a
              href="/politica-privacidad"
              className="hover:text-secondary transition-colors"
            >
              Política de Privacidad
            </a>
            <a
              href="/politica-cookies"
              className="hover:text-secondary transition-colors"
            >
              Política de Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
