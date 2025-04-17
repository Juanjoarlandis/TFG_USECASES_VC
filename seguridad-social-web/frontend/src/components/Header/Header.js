// src/components/Header/Header.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaGlobe, FaBars, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Si quieres dark mode, podrías hacer un state isDarkMode y alternarlo
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { isVerified, userData } = useSelector((state) => state.auth);
  const hasAltaCredential = userData?.hasAltaCredential || false;

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Aplicas la clase 'dark' al <html> o <body>:
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="w-full bg-blanco text-grisOscuro font-body relative z-50">
      {/* Barra superior: Idiomas + Modo Oscuro + Info de sesión */}
      <div className="w-full bg-azulClaro py-2 text-grisOscuro flex justify-end px-4 items-center">
        <div className="flex items-center gap-6">
          {/* Selector de idioma */}
          <div className="relative group inline-block">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">
              <FaGlobe /> Idiomas
            </button>
            <ul className="absolute hidden group-hover:block bg-blanco text-grisOscuro mt-2 py-2 w-32 text-sm shadow-lg rounded-md border border-gray-200 z-20">
              <li><a href="?changeLanguage=es" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">Castellano</a></li>
              <li><a href="?changeLanguage=en" className="block px-4 py-1 hover:bg-azulClaro hover:text-primary">English</a></li>
              {/* Agrega más idiomas si quieres */}
            </ul>
          </div>

          {/* Toggle de modo oscuro */}
          <button
            onClick={handleToggleDarkMode}
            className="flex items-center gap-1 hover:text-primary transition-colors"
            title="Cambiar Modo Oscuro"
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>

          {/* Si el usuario está verificado, muestra info */}
          {isVerified && userData && (
            <div className="text-sm text-gray-700 bg-white px-2 py-1 rounded-full shadow-sm font-body">
              Sesión: <span className="font-semibold">{userData.firstName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Barra principal con logo y buscador */}
      <div className="w-full bg-blanco text-grisOscuro shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" title="Inicio">
              <img
                src="https://www.seg-social.es/wps/contenthandler/wss/!ut/p/digest!XtdIT20stkPclqf1n5x5qQ/war/POINThemeStatic/themes/Portal8.5/css/img/logo-institucional.png"
                alt="Ministerio de Inclusión"
                className="h-12 hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* Buscador */}
          <form action="#" className="hidden lg:flex items-center" role="search">
            <input
              type="text"
              placeholder="Buscar trámites..."
              className="border border-gray-300 px-3 py-1 text-sm rounded-l-md focus:outline-none"
            />
            <button
              type="submit"
              className="bg-azulMedio text-white px-4 py-1 text-sm rounded-r-md hover:bg-primary transition-colors flex items-center gap-1"
            >
              <FaSearch /> Buscar
            </button>
          </form>

          {/* Botón hamburger (mobile) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-4 block lg:hidden text-grisOscuro hover:text-primary focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Menú principal (para móvil y desktop) */}
      <nav className={`bg-azulOscuro text-blanco ${isOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ul className="flex flex-col lg:flex-row gap-6 text-sm items-start lg:items-center">
            <li className="group relative">
              <button className="flex items-center gap-1 hover:text-secondary transition-colors">
                Trámites
              </button>
              {/* Submenú (Mega-menu) */}
              <div className="hidden group-hover:block absolute top-full left-0 bg-azulOscuro border-t border-gray-500 p-4 w-56 z-10">
                <ul className="flex flex-col space-y-2 text-xs">
                  <li>
                    <Link to="/alta" className="hover:text-secondary transition-colors">
                      Alta Seguridad Social
                    </Link>
                  </li>
                  <li>
                    <Link to="/baja" className="hover:text-secondary transition-colors">
                      Baja Seguridad Social
                    </Link>
                  </li>
                  <li>
                    <Link to="/prestaciones" className="hover:text-secondary transition-colors">
                      Prestaciones
                    </Link>
                  </li>
                  <li>
                    <Link to="/citas" className="hover:text-secondary transition-colors">
                      Cita Previa
                    </Link>
                  </li>
                </ul>
              </div>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-secondary transition-colors">
                Área Personal
              </Link>
            </li>
            {!hasAltaCredential && isVerified && (
              <li>
                <Link to="/alta" className="hover:text-secondary transition-colors">
                  Darse de Alta
                </Link>
              </li>
            )}
            <li>
              <Link to="/clave" className="hover:text-secondary transition-colors">
                Acceder con Cl@ve
              </Link>
            </li>
            <li>
              <Link to="/ayuda" className="hover:text-secondary transition-colors">
                Ayuda
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
