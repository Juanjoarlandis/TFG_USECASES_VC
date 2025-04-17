// src/pages/Home/Home.js

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaIdCard, FaKey } from 'react-icons/fa';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col items-center justify-start min-h-[80vh] bg-neutralLight text-neutralDark p-4 fade-in-scale overflow-hidden">
      {/* Marca de agua semi-transparente en la esquina superior derecha */}
      <div
        className="absolute top-0 right-0 opacity-10 pointer-events-none"
        style={{ fontSize: '10rem', lineHeight: '1' }}
      >
        <FaShieldAlt className="text-azulOscuro" />
      </div>

      {/* Sección "hero" o de bienvenida */}
      <section className="w-full max-w-5xl text-center mt-8 mb-10 relative z-10 px-4">
        <h2 className="font-headings text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-primary">
          {t('welcome')}
        </h2>
        <p className="font-body text-base sm:text-lg md:text-xl text-justify max-w-3xl mx-auto leading-relaxed mb-8">
          La <strong>Seguridad Social</strong> pone a su disposición una amplia gama de servicios
          y trámites electrónicos. Al verificar su identidad con DNI, Cl@ve u otros medios electrónicos
          reconocidos, podrá gestionar sus prestaciones, consultar su información personal y realizar
          numerosas gestiones sin necesidad de desplazarse, de forma segura y disponible las 24 horas
          del día.
        </p>

        {/* Botones principales de acceso */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Link
            to="/login"
            className="flex-1 px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-base sm:text-lg font-semibold flex items-center justify-center gap-2"
          >
            <FaIdCard className="inline-block" />
            Iniciar sesión con cuenta
          </Link>
          <Link
            to="/verification-mode"
            className="flex-1 px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-base sm:text-lg font-semibold flex items-center justify-center gap-2"
          >
            <FaShieldAlt className="inline-block" />
            {t('verifyDNI')}
          </Link>
          <Link
            to="/clave"
            className="flex-1 px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-base sm:text-lg font-semibold flex items-center justify-center gap-2"
          >
            <FaKey className="inline-block" />
            Acceder con Cl@ve
          </Link>
        </div>
      </section>

      {/* Sección de información o trámites destacados */}
      <section className="w-full max-w-6xl text-center relative z-10 px-4 mt-8">
        <h3 className="font-headings text-2xl sm:text-3xl md:text-4xl text-primary font-semibold mb-6">
          Trámites Destacados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-xl sm:text-2xl text-primary font-semibold mb-2">
              Alta de Seguridad Social
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
              Consulte los requisitos y realice el alta de manera electrónica sin desplazarse.
            </p>
            <Link
              to="/tramites/alta"
              className="inline-block mt-auto bg-secondary text-white px-4 py-2 rounded-full hover:bg-primary transition-colors"
            >
              Ir al trámite
            </Link>
          </div>
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-xl sm:text-2xl text-primary font-semibold mb-2">
              Solicitar Prestaciones
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
              Acceda a la solicitud de prestaciones por desempleo, jubilación, incapacidad y más.
            </p>
            <Link
              to="/tramites/prestaciones"
              className="inline-block mt-auto bg-secondary text-white px-4 py-2 rounded-full hover:bg-primary transition-colors"
            >
              Ir al trámite
            </Link>
          </div>
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-xl sm:text-2xl text-primary font-semibold mb-2">
              Cita Previa
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
              Reserve su cita para atención presencial en las oficinas de la Seguridad Social.
            </p>
            <Link
              to="/tramites/cita-previa"
              className="inline-block mt-auto bg-secondary text-white px-4 py-2 rounded-full hover:bg-primary transition-colors"
            >
              Solicitar cita
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de novedades o noticias */}
      <section className="w-full max-w-6xl text-center relative z-10 px-4 mt-16">
        <h3 className="font-headings text-2xl sm:text-3xl md:text-4xl text-primary font-semibold mb-6">
          Novedades
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Noticia 1 */}
          <article className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow text-left">
            <h4 className="font-headings text-lg sm:text-xl text-primary font-semibold mb-2">
              Cambios en la normativa de cotización
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark mb-2">
              Desde el 1 de mayo se han actualizado los baremos de cotización para trabajadores por cuenta ajena y propia.
            </p>
            <Link to="/noticias/cotizacion" className="text-secondary hover:underline text-sm sm:text-base">
              Leer más...
            </Link>
          </article>
          {/* Noticia 2 */}
          <article className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow text-left">
            <h4 className="font-headings text-lg sm:text-xl text-primary font-semibold mb-2">
              Nueva prestación familiar
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark mb-2">
              Se ha puesto en marcha la nueva prestación para familias con hijos menores de 3 años, con mejoras en los importes.
            </p>
            <Link to="/noticias/prestacion-familiar" className="text-secondary hover:underline text-sm sm:text-base">
              Leer más...
            </Link>
          </article>
        </div>
      </section>

      {/* Sección de preguntas frecuentes */}
      <section className="w-full max-w-6xl text-center relative z-10 px-4 mt-16">
        <h3 className="font-headings text-2xl sm:text-3xl md:text-4xl text-primary font-semibold mb-6">
          Preguntas Frecuentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* FAQ 1 */}
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-lg sm:text-xl text-primary font-semibold mb-2">
              ¿Cómo solicito mi vida laboral?
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark">
              Puede solicitar su vida laboral accediendo con DNIe, Cl@ve o usuario/contraseña.
              Seleccione la opción correspondiente en nuestra sección de trámites.
            </p>
          </div>
          {/* FAQ 2 */}
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-lg sm:text-xl text-primary font-semibold mb-2">
              ¿Necesito acudir a una oficina?
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark">
              La mayoría de trámites pueden realizarse de forma telemática. Solo en casos muy específicos
              es necesario acudir presencialmente.
            </p>
          </div>
          {/* FAQ 3 */}
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-lg sm:text-xl text-primary font-semibold mb-2">
              ¿Cómo contacto con atención al ciudadano?
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark">
              Puede escribirnos mediante el formulario de la sección "Contacto" o llamar al teléfono gratuito
              900-XX-XX-XX.
            </p>
          </div>
          {/* FAQ 4 */}
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
            <h4 className="font-headings text-lg sm:text-xl text-primary font-semibold mb-2">
              ¿Hay un plazo para solicitar prestaciones?
            </h4>
            <p className="font-body text-sm sm:text-base text-neutralDark">
              Sí, las prestaciones deben solicitarse dentro de un plazo desde que ocurre el hecho causante.
              Consulte la normativa específica de cada prestación.
            </p>
          </div>
        </div>
      </section>

      {/* Sección extra: beneficios e info adicional (ya incluida en tu ejemplo) */}
      <section className="mt-16 max-w-4xl text-center relative z-10 px-4">
        <h3 className="font-headings text-2xl sm:text-3xl text-primary font-semibold mb-4">
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
      </section>

      {/* Información de contacto (oficial) */}
      <section className="w-full max-w-4xl text-center relative z-10 px-4 mt-16">
        <h3 className="font-headings text-2xl sm:text-3xl text-primary font-semibold mb-6">
          Información de Contacto
        </h3>
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow">
          <p className="font-body text-sm sm:text-base text-neutralDark mb-2">
            Teléfono de atención ciudadana: <strong>900-XX-XX-XX</strong>
          </p>
          <p className="font-body text-sm sm:text-base text-neutralDark mb-2">
            Horario de atención telefónica: 9:00 a 20:00h, de lunes a viernes.
          </p>
          <p className="font-body text-sm sm:text-base text-neutralDark mb-2">
            También puede enviarnos su consulta a través de nuestro formulario en línea o dirigirse
            a nuestras oficinas con <strong>cita previa</strong>.
          </p>
        </div>
      </section>

      {/* Aviso de demostración */}
      <div className="relative z-10 mt-6 max-w-4xl px-4">
        <p className="bg-white bg-opacity-50 p-4 italic rounded-lg text-sm text-neutralDark mx-auto shadow-md">
          Este sitio es únicamente una demostración. <strong>No</strong> corresponde a ninguna web oficial.
        </p>
      </div>

      {/* Elemento decorativo sutil en el fondo */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-neutralLight to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Home;
