import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaIdCard, FaKey } from 'react-icons/fa';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-neutralLight text-neutralDark fade-in-scale relative overflow-hidden">
      {/* Marca de agua semi-transparente */}
      <div
        className="absolute top-0 right-0 opacity-10 pointer-events-none"
        style={{ fontSize: '10rem', lineHeight: '1' }}
      >
        <FaShieldAlt className="text-azulOscuro" />
      </div>

      <h2 className="font-headings text-4xl md:text-5xl mb-7 text-primary font-bold relative z-10">
        {t('welcome')}
      </h2>
      <p className="font-body text-lg md:text-xl mb-10 text-justify max-w-2xl leading-relaxed relative z-10">
        La Seguridad Social pone a su disposición una amplia gama de servicios y trámites
        electrónicos. Al verificar su identidad con el DNI o acceder con Cl@ve u otros medios
        electrónicos reconocidos, podrá gestionar sus prestaciones, consultar su información
        personal y realizar numerosas gestiones sin necesidad de desplazarse, de forma segura
        y disponible las 24 horas del día.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 relative z-10">
        <Link
          to="/login"
          className="px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-lg font-semibold flex items-center gap-2"
          title="Iniciar sesión con cuenta personal"
        >
          <FaIdCard className="inline-block" />
          Iniciar sesión con cuenta
        </Link>

        <Link
          to="/verification-mode"
          className="px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-lg font-semibold flex items-center gap-2"
          title="Verificar su identidad con credencial DNI"
        >
          <FaShieldAlt className="inline-block" />
          {t('verifyDNI')}
        </Link>

        <Link
          to="/clave"
          className="px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-lg font-semibold flex items-center gap-2"
          title="Acceder con Cl@ve"
        >
          <FaKey className="inline-block" />
          Acceder con Cl@ve
        </Link>
      </div>

      {/* Sección extra: beneficios e info adicional */}
      <div className="mt-10 max-w-3xl text-center relative z-10">
        <h3 className="font-headings text-2xl text-primary font-semibold mb-4">
          ¿Por qué usar nuestros servicios en línea?
        </h3>
        <p className="font-body text-base md:text-lg text-neutralDark leading-relaxed mb-6">
          Acceda cómodamente desde su hogar a trámites que antes requerían desplazamientos.
          Garantizamos la seguridad y confidencialidad de sus datos, cumpliendo con las normativas
          vigentes y aplicando las últimas tecnologías de verificación de identidad.
        </p>
        <div className="flex flex-col md:flex-row md:justify-between gap-6">
          <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-xl text-primary font-semibold mb-2">
              Ahorro de tiempo
            </h4>
            <p className="font-body text-neutralDark text-sm">
              Realice sus trámites sin esperas ni colas, cuando usted quiera.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-xl text-primary font-semibold mb-2">
              Accesible 24/7
            </h4>
            <p className="font-body text-neutralDark text-sm">
              Servicios disponibles todos los días, a cualquier hora.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-xl text-primary font-semibold mb-2">
              Seguridad y Confianza
            </h4>
            <p className="font-body text-neutralDark text-sm">
              Verificación de identidad robusta y protección de datos personales.
            </p>
          </div>
        </div>
      </div>

      {/* Texto semi-transparente indicando que es una demo */}
      <div className="relative z-10 mt-6">
        <p className="bg-white bg-opacity-50 p-4 italic rounded-lg text-sm text-neutralDark max-w-2xl mx-auto shadow-md">
          Este sitio es únicamente una demostración. <strong>No</strong> corresponde a ninguna web oficial.
        </p>
      </div>

      {/* Elemento decorativo sutil en el fondo */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-neutralLight to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Home;
