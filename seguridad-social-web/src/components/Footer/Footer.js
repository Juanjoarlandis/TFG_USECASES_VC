// src/components/Footer/Footer.js

import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer id="pie" className="w-full bg-azulOscuro text-blanco mt-10 font-body">
      {/* Submenú en el pie */}
      <div className="w-full bg-azulMedio py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-4 text-sm justify-between items-center">
          <nav aria-label="Enlaces del pie de página" className="flex flex-wrap gap-4">
            <a href="/wps/portal/wss/internet/HerramientasWeb/4c5c5105-04d1-4dfd-8af4-1e2d5c0c1ae3" className="hover:text-blanco transition-colors">Cómo identificarme</a>
            <a href="/wps/portal/wss/internet/MapaWeb" className="hover:text-blanco transition-colors">Mapa Web</a>
            <a href="/wps/portal/wss/internet/Glosario" className="hover:text-blanco transition-colors">Glosario</a>
            <a href="/wps/portal/wss/internet/Enlaces" className="hover:text-blanco transition-colors">Enlaces</a>
            <a href="/wps/portal/wss/internet/Ayuda" className="hover:text-blanco transition-colors">Ayuda</a>
            <a href="/wps/portal/wss/internet/Accesibilidad" className="hover:text-blanco transition-colors">Accesibilidad</a>
            <a href="/wps/portal/wss/internet/InformacionLinguistica" className="hover:text-blanco transition-colors">Información Lingüística</a>
            <a href="/wps/portal/wss/internet/RSS" className="hover:text-blanco transition-colors">RSS</a>
          </nav>
          <div className="flex gap-3">
            <a href="https://www.facebook.com/seguridadsocial" target="_blank" rel="noopener noreferrer" className="hover:text-blanco transition-colors"><FaFacebookF /></a>
            <a href="https://twitter.com/seg_social_" target="_blank" rel="noopener noreferrer" className="hover:text-blanco transition-colors"><FaTwitter /></a>
            <a href="https://www.linkedin.com/company/seguridadsocial" target="_blank" rel="noopener noreferrer" className="hover:text-blanco transition-colors"><FaLinkedinIn /></a>
            <a href="https://www.youtube.com/user/seguridadsocial" target="_blank" rel="noopener noreferrer" className="hover:text-blanco transition-colors"><FaYoutube /></a>
          </div>
        </div>
      </div>

      {/* Aviso legal y copyright */}
      <div className="w-full bg-azulOscuro text-blanco py-4 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-2 md:mb-0 text-center md:text-left">
            Copyright © Seguridad Social {new Date().getFullYear()}. Todos los derechos reservados.
          </div>
          <ul className="flex gap-4">
            <li><a href="/wps/portal/wss/internet/AvisoLegal" className="hover:text-secondary transition-colors">Aviso Legal</a></li>
            <li><a href="/wps/portal/wss/internet/PoliticaCookies" className="hover:text-secondary transition-colors">Política de cookies</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;