// src/components/Header/Header.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaGlobe, FaBars, FaTimes } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Obtenemos el estado global para conocer si el usuario está verificado y si tiene la credencial de alta
  const { isVerified, userData } = useSelector((state) => state.auth);

  const hasAltaCredential = userData?.hasAltaCredential || false;

  return (
    <header id="top" className="w-full bg-blanco text-blanco font-body relative z-50">
      {/* Barra superior de idiomas */}
      <div className="w-full bg-azulClaro py-2 text-grisOscuro flex justify-end px-4 items-center">
        <div className="relative group inline-block mr-4">
          <button
            type="button"
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <FaGlobe /> Idiomas
          </button>
          <ul className="absolute hidden group-hover:block bg-blanco text-grisOscuro mt-2 py-2 w-32 text-sm shadow-lg rounded-md border border-gray-200">
            <li><a href="?changeLanguage=es" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">Castellano</a></li>
            <li><a href="?changeLanguage=ca" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">Català</a></li>
            <li><a href="?changeLanguage=gl" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">Galego</a></li>
            <li><a href="?changeLanguage=eu" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">Euskara</a></li>
            <li><a href="?changeLanguage=va" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">Valencià</a></li>
            <li><a href="?changeLanguage=en" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">English</a></li>
            <li><a href="?changeLanguage=fr" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">Français</a></li>
          </ul>
        </div>

        {/* Si el usuario está verificado, mostramos un pequeño texto arriba a la derecha */}
        {isVerified && userData && (
          <div className="text-sm text-gray-700 bg-white px-2 py-1 rounded-full shadow-sm font-body">
            Sesión iniciada como <span className="font-semibold">{userData.firstName}</span>
          </div>
        )}
      </div>

      {/* Contenedor principal con logo y buscador */}
      <div className="w-full bg-blanco text-grisOscuro shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="https://www.inclusion.gob.es" target="_blank" rel="noopener noreferrer" className="mr-4" title="Enlace externo al Ministerio">
              <img
                src="https://www.seg-social.es/wps/contenthandler/wss/!ut/p/digest!XtdIT20stkPclqf1n5x5qQ/war/POINThemeStatic/themes/Portal8.5/css/img/logo-institucional.png"
                alt="Ministerio de Inclusión"
                className="h-12 hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
          <form action="#" className="flex items-center" role="search">
            <input
              type="text"
              placeholder="Introduzca su búsqueda"
              className="border border-gray-300 px-3 py-1 text-sm rounded-l-md focus:outline-none"
            />
            <button
              type="submit"
              className="bg-azulMedio text-white px-4 py-1 text-sm rounded-r-md hover:bg-azulOscuro transition flex items-center gap-1"
            >
              <FaSearch /> Buscar
            </button>
          </form>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-4 block md:hidden text-grisOscuro hover:text-primary focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Menú principal */}
      <div className={`w-full bg-azulOscuro text-blanco ${isOpen ? 'block' : 'hidden'} md:block`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav aria-label="Menú principal">
            <ul className="flex flex-col md:flex-row gap-6 text-sm font-body md:items-center">
              <li>
                <Link to="/" className="hover:text-secondary transition-colors">Inicio</Link>
              </li>
              {!isVerified && (
                <li>
                  <Link to="/verification-tutorial" className="hover:text-secondary transition-colors">Verificación de Identidad</Link>
                </li>
              )}
              {isVerified && (
                <li>
                  <Link to="/dashboard" className="hover:text-secondary transition-colors">Área Personal</Link>
                </li>
              )}
              {!hasAltaCredential && isVerified && (
                <li>
                  <Link to="/alta" className="hover:text-secondary transition-colors">Darse de Alta</Link>
                </li>
              )}
              <li>
                <Link to="/clave" className="hover:text-secondary transition-colors">Acceder con Cl@ve</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
