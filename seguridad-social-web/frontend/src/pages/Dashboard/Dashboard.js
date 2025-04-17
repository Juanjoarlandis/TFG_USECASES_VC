// src/pages/Dashboard/Dashboard.js

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, verifyUser } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { fetchUserDataByDni } from '../../services/api';
import { format } from 'date-fns';
import esLocale from 'date-fns/locale/es';
import {
    FaShieldAlt, FaCheckCircle, FaCalendarAlt, FaFileAlt, FaChevronDown, FaChevronUp,
    FaUser, FaIdCard, FaInfoCircle, FaBell, FaDownload, FaLifeRing, FaRegSmile
} from 'react-icons/fa';

import { QRCodeCanvas } from 'qrcode.react';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
    const { userData, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [showCredentials, setShowCredentials] = useState(false);

    const handleDarseAlta = async () => {
        const flow = userData?.flow || 'manual';
        if (flow === 'automatic') {
            navigate('/alta-automatica-info');
        } else {
            navigate('/alta');
        }
    };

    const handleDarseBaja = async () => {
        try {
            const dni = userData.documentNumber;
            const response = await axios.post(`${BASE_URL}/revocar/credencial`, { dni });
            if (response.status === 200) {
                toast.success('Credencial revocada con éxito.');
                refreshUserData();
            }
        } catch (error) {
            console.error(error);
            toast.error('Error revocando credencial.');
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const refreshUserData = async () => {
        if (userData && userData.documentNumber) {
            try {
                const updatedUser = await fetchUserDataByDni(userData.documentNumber);
                if (updatedUser && updatedUser.user) {
                    dispatch(verifyUser({ user: updatedUser.user, token }));
                    localStorage.setItem('user', JSON.stringify(updatedUser.user));
                }
            } catch (err) {
                console.error('Error actualizando datos de usuario:', err);
            }
        }
    };

    useEffect(() => {
        refreshUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Flags de credenciales:
    const hasAltaCredential = userData?.hasAltaCredential || false;
    const hasPassportCredential = userData?.hasPassportCredential || false;
    // Ajusta a tu gusto, o asume que =true si quieres forzar la 2a credencial

    // Datos de la credencial de Alta
    const altaData = userData?.altaCredentialData || null;

    // Datos de la credencial “pasaporte”
    const passportData = userData?.passportCredentialData || {
        // Ejemplo ficticio si no lo tienes en backend
        type: ['PassportCredential'],
        issuer: { name: 'Ministerio de Asuntos Exteriores', id: 'urn:gob:es:maec' },
        validFrom: '2021-01-01',
        expirationDate: '2031-01-01',
        encodedJWT: 'JWT_PASSPORT_234kFic88sample', // ficticio
        credentialSubject: {
            passport: {
                passNumber: 'ABC1234567',
                nationality: 'ES',
                birthPlace: 'Madrid',
                holderName: 'John Doe'
            }
        }
    };

    // Formateo de fechas con date-fns
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return format(date, 'dd/MM/yyyy', { locale: esLocale });
    };

    /**
     * Credencial estilo tarjeta (Alta)
     * Se aumenta max-w a "max-w-lg"
     */
    const CardStyledCredential = ({ credData }) => {
        return (
            <div className="relative w-full max-w-lg bg-white shadow-lg rounded-xl overflow-hidden mx-auto mt-6">
                {/* Barra superior con color corporativo */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaShieldAlt className="text-white text-2xl" />
                        <h3 className="font-headings text-white text-sm sm:text-base md:text-lg font-semibold">
                            ALTA SEGURIDAD SOCIAL
                        </h3>
                    </div>
                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        VERIFICADO <FaCheckCircle />
                    </div>
                </div>

                {/* Capa semitransparente con sello */}
                <div
                    className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center"
                    style={{ zIndex: 0 }}
                >
                    <FaShieldAlt className="text-blue-700 text-[12rem]" />
                </div>

                {/* Contenido principal de la tarjeta */}
                <div className="relative p-4 sm:p-6 z-10 font-body">
                    <h4 className="text-primary font-headings text-base sm:text-lg md:text-xl mb-2 flex items-center gap-2">
                        <FaFileAlt className="text-primary" />
                        Credencial Oficial
                    </h4>
                    <p className="text-neutralDark text-sm sm:text-base mb-4 leading-relaxed">
                        Esta tarjeta acredita la Alta en la Seguridad Social, habilitando
                        al titular a todos los derechos y prestaciones correspondientes.
                    </p>

                    {/* Datos principales (usar grid para estilo DNI) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-neutralDark">
                        <p><strong>Tipo:</strong> {credData.type?.join(', ')}</p>
                        <p><strong>Emisor:</strong> {credData.issuer?.name} ({credData.issuer?.id})</p>
                        <p><strong>Válida desde:</strong> {credData.validFrom || 'N/A'}</p>
                        <p><strong>Expira el:</strong> {credData.expirationDate || 'N/A'}</p>
                    </div>

                    {/* Divider */}
                    <hr className="my-3" />

                    {/* Datos del Titular de la Alta (worker) */}
                    <h5 className="font-headings text-sm sm:text-base text-primary font-semibold mb-2">
                        Datos del Titular
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-neutralDark">
                        <p>
                            <strong>Nombre:</strong>{' '}
                            {credData.credentialSubject?.worker?.nombre}{' '}
                            {credData.credentialSubject?.worker?.apellidos}
                        </p>
                        <p>
                            <strong>DNI:</strong> {credData.credentialSubject?.worker?.dni}
                        </p>
                        <p>
                            <strong>NSS:</strong> {credData.credentialSubject?.worker?.nss}
                        </p>
                        <p>
                            <strong>Fecha Inicio Act.:</strong>{' '}
                            {credData.credentialSubject?.worker?.fechaInicioActividad}
                        </p>
                    </div>

                    {/* Divider */}
                    <hr className="my-3" />

                    {/* Sección QR y Firma */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-3">
                        {credData.encodedJWT && (
                            <div className="flex flex-col items-center">
                                <QRCodeCanvas
                                    value={credData.encodedJWT}
                                    size={120}
                                    className="border border-gray-200 shadow-sm"
                                />
                                <p className="text-[0.75rem] sm:text-xs text-neutralDark mt-1">
                                    Escanee para validar
                                </p>
                            </div>
                        )}
                        <div className="text-right sm:text-left text-xs text-neutralDark">
                            <p className="font-semibold">Fdo: El Titular</p>
                            <p className="italic">___________________</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Credencial estilo tarjeta (Pasaporte)
     * Similar pero con color distinto y datos adaptados
     */
    const CardStyledPassport = ({ passData }) => {
        return (
            <div className="relative w-full max-w-lg bg-white shadow-lg rounded-xl overflow-hidden mx-auto mt-6">
                {/* Barra superior con color distinto (ej: verde) */}
                <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaIdCard className="text-white text-2xl" />
                        <h3 className="font-headings text-white text-sm sm:text-base md:text-lg font-semibold">
                            PASAPORTE ELECTRÓNICO
                        </h3>
                    </div>
                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        ACTIVO <FaCheckCircle />
                    </div>
                </div>

                {/* Sello semitransparente */}
                <div
                    className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center"
                    style={{ zIndex: 0 }}
                >
                    <FaIdCard className="text-green-700 text-[12rem]" />
                </div>

                {/* Contenido principal de la tarjeta */}
                <div className="relative p-4 sm:p-6 z-10 font-body">
                    <h4 className="text-green-800 font-headings text-base sm:text-lg md:text-xl mb-2 flex items-center gap-2">
                        <FaFileAlt className="text-green-800" />
                        Credencial de Pasaporte
                    </h4>
                    <p className="text-neutralDark text-sm sm:text-base mb-4 leading-relaxed">
                        Documento de viaje oficial emitido por el Estado, válido para la identificación internacional
                        del titular.
                    </p>

                    {/* Datos principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-neutralDark">
                        <p><strong>Tipo:</strong> {passData.type?.join(', ')}</p>
                        <p><strong>Emisor:</strong> {passData.issuer?.name} ({passData.issuer?.id})</p>
                        <p><strong>Válido desde:</strong> {passData.validFrom || 'N/A'}</p>
                        <p><strong>Expira el:</strong> {passData.expirationDate || 'N/A'}</p>
                    </div>

                    <hr className="my-3" />

                    <h5 className="font-headings text-sm sm:text-base text-green-800 font-semibold mb-2">
                        Datos del Pasaporte
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-neutralDark">
                        <p><strong>Número:</strong> {passData.credentialSubject?.passport?.passNumber}</p>
                        <p><strong>Nacionalidad:</strong> {passData.credentialSubject?.passport?.nationality}</p>
                        <p><strong>Lugar de Nacimiento:</strong> {passData.credentialSubject?.passport?.birthPlace}</p>
                        <p><strong>Nombre Titular:</strong> {passData.credentialSubject?.passport?.holderName}</p>
                    </div>

                    <hr className="my-3" />

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-3">
                        {passData.encodedJWT && (
                            <div className="flex flex-col items-center">
                                <QRCodeCanvas
                                    value={passData.encodedJWT}
                                    size={120}
                                    className="border border-gray-200 shadow-sm"
                                />
                                <p className="text-[0.75rem] sm:text-xs text-neutralDark mt-1">
                                    Escanee para validar
                                </p>
                            </div>
                        )}
                        <div className="text-right sm:text-left text-xs text-neutralDark">
                            <p className="font-semibold">Fdo: El Titular</p>
                            <p className="italic">___________________</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-gray-100 py-8 px-4 flex flex-col items-center">
            <div className="bg-white w-full max-w-5xl md:max-w-7xl mx-auto p-6 md:p-8 rounded-xl shadow-md relative overflow-hidden">
                {/* Marca de agua semi-transparente */}
                <div
                    className="absolute top-0 right-0 opacity-10 pointer-events-none"
                    style={{ fontSize: '9rem', lineHeight: '1' }}
                >
                    <FaShieldAlt className="text-blue-200" />
                </div>

                {/* Encabezado del Dashboard */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 relative z-10">
                    <div className="max-w-2xl">
                        <h2 className="font-headings text-2xl sm:text-3xl md:text-4xl text-primary font-bold mb-2">
                            Bienvenido{userData ? `, ${userData.firstName}` : ''}
                        </h2>
                        <p className="font-body text-sm sm:text-base md:text-lg text-neutralDark leading-relaxed">
                            Accede a tu información personal, trámites y beneficios de la Seguridad Social
                            en un entorno seguro, centralizado y fácil de navegar.
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 flex gap-4">
                        {!hasAltaCredential && (
                            <button
                                onClick={handleDarseAlta}
                                className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-200 font-body font-semibold text-sm sm:text-base"
                            >
                                Darse de Alta
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-neutralDark text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-200 font-body font-semibold text-sm sm:text-base"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                {userData ? (
                    <>
                        {/* GRID PRINCIPAL DE DOS COLUMNAS EN MD */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {/* Perfil del Usuario */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-center mb-4">
                                    <FaUser className="text-primary text-xl mr-2" />
                                    <h3 className="font-headings text-lg sm:text-xl text-primary font-semibold">
                                        Perfil del Usuario
                                    </h3>
                                </div>
                                {userData.photo && (
                                    <div className="mb-4">
                                        <img
                                            src={userData.photo}
                                            alt="Foto DNI"
                                            className="w-24 sm:w-32 h-auto rounded-md border border-gray-200 shadow-sm"
                                        />
                                    </div>
                                )}
                                <ul className="font-body text-sm sm:text-base text-neutralDark space-y-2">
                                    <li>
                                        <strong>Nombre:</strong> {userData.firstName} {userData.familyName}
                                    </li>
                                    <li>
                                        <strong>DNI:</strong> {userData.documentNumber}
                                    </li>
                                    <li>
                                        <strong>Fecha de Nacimiento:</strong> {formatDate(userData.birthDate)}
                                    </li>
                                    <li>
                                        <strong>Nacionalidad:</strong> {userData.nationality || 'N/A'}
                                    </li>
                                    <li>
                                        <strong>Género:</strong> {userData.gender || 'N/A'}
                                    </li>
                                </ul>
                            </div>

                            {/* Información Documental */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-center mb-4">
                                    <FaIdCard className="text-primary text-xl mr-2" />
                                    <h3 className="font-headings text-lg sm:text-xl text-primary font-semibold">
                                        Información del Documento
                                    </h3>
                                </div>
                                <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
                                    Aquí se muestra información clave sobre su documento de identidad y su registro
                                    en la Seguridad Social.
                                </p>
                                <ul className="font-body text-sm sm:text-base text-neutralDark space-y-2">
                                    <li>
                                        <strong>Tipo de Documento:</strong> Documento Nacional de Identidad
                                    </li>
                                    <li>
                                        <strong>Emisor:</strong> Ministerio del Interior (Gobierno de España)
                                    </li>
                                    <li>
                                        <strong>Nacionalidad:</strong> {userData.nationality || 'N/A'}
                                    </li>
                                    <li>
                                        <strong>Número de la Seguridad Social (NSS):</strong> {userData.nss || 'N/A'}
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Pestaña de Credenciales */}
                        <div className="mt-10 relative z-10">
                            <button
                                onClick={() => setShowCredentials(!showCredentials)}
                                className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 text-neutralDark rounded-xl shadow-sm 
                  hover:bg-gray-100 hover:text-primary transition-colors duration-200 font-body 
                  font-semibold text-sm sm:text-base focus:outline-none"
                            >
                                <span>Mis Credenciales</span>
                                {showCredentials ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {showCredentials && (
                                <div className="mt-4 animate-fadeInZoom">
                                    {/* 1) Credencial de Alta */}
                                    {hasAltaCredential && altaData ? (
                                        <div>
                                            <CardStyledCredential credData={altaData} />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={handleDarseBaja}
                                                    className="mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-full 
                            hover:bg-red-500 hover:scale-105 transition-transform duration-200 
                            font-body font-semibold text-sm sm:text-base"
                                                    title="Revocar esta credencial"
                                                >
                                                    Darse de Baja (Revocar Credencial)
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-xl bg-gray-50 shadow-sm mb-6">
                                            <p className="font-body text-sm sm:text-base text-neutralDark">
                                                No tienes la credencial de Alta disponible en este momento.
                                            </p>
                                        </div>
                                    )}

                                    {/* 2) Credencial de Pasaporte (ejemplo ficticio) */}
                                    {hasPassportCredential ? (
                                        <CardStyledPassport passData={passportData} />
                                    ) : (
                                        <div className="p-6 rounded-xl bg-gray-50 shadow-sm mt-6">
                                            <p className="font-body text-sm sm:text-base text-neutralDark">
                                                No tienes la credencial de Pasaporte disponible actualmente.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Secciones adicionales del Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mt-10">
                            {/* Historial de Cotizaciones */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2 overflow-auto">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Historial de Cotizaciones
                                </h3>
                                <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
                                    Consulta tus periodos cotizados, empleadores o regímenes, con fechas y bases detalladas.
                                </p>
                                <div className="overflow-auto">
                                    <table className="min-w-full text-left border-collapse text-xs sm:text-sm md:text-base">
                                        <thead>
                                            <tr className="border-b bg-gray-100">
                                                <th className="py-2 px-2">Empleador/Régimen</th>
                                                <th className="py-2 px-2">Inicio</th>
                                                <th className="py-2 px-2">Fin</th>
                                                <th className="py-2 px-2">Días Cotizados</th>
                                                <th className="py-2 px-2">Base Cotización</th>
                                                <th className="py-2 px-2">Grupo Cotización</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="py-2 px-2">Empresa Ejemplo S.A.</td>
                                                <td className="py-2 px-2">01/01/2010</td>
                                                <td className="py-2 px-2">31/12/2015</td>
                                                <td className="py-2 px-2">2190</td>
                                                <td className="py-2 px-2">30.000€/año</td>
                                                <td className="py-2 px-2">Grupo 1</td>
                                            </tr>
                                            <tr className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="py-2 px-2">Autónomo - Régimen Especial</td>
                                                <td className="py-2 px-2">01/01/2016</td>
                                                <td className="py-2 px-2">Actualidad</td>
                                                <td className="py-2 px-2">2600</td>
                                                <td className="py-2 px-2">15.000€/año</td>
                                                <td className="py-2 px-2">Grupo 3</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Prestaciones Activas */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Prestaciones Activas
                                </h3>
                                <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
                                    Prestación por Desempleo<br />
                                    Importe Mensual: <strong>800€</strong><br />
                                    Inicio: 01/06/2021 - Duración: 12 meses<br />
                                    Próxima revisión: 01/06/2022
                                </p>
                            </div>

                            {/* Avisos y Notificaciones */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaBell /> Avisos y Notificaciones
                                </h3>
                                <ul className="font-body text-sm sm:text-base text-neutralDark space-y-2 list-disc pl-5">
                                    <li>Tienes una comunicación pendiente del INSS.</li>
                                    <li>Próxima renovación de prestación en 30 días.</li>
                                    <li>Cambio legislativo en cotizaciones, válido a partir de 2025.</li>
                                </ul>
                            </div>

                            {/* Simulador */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaRegSmile /> Simulador de Jubilación
                                </h3>
                                <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
                                    Estimación de pensión a los 67 años: <strong>1.200€/mes</strong><br />
                                    Tiempo de cotización adicional recomendado: 2 años más a jornada completa.<br />
                                    Añade tus datos para simular distintos escenarios.
                                </p>
                            </div>

                            {/* Información de Afiliación */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Información de Afiliación
                                </h3>
                                <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
                                    Régimen: Autónomos<br />
                                    Último empleador: Empresa Ejemplo S.A.<br />
                                    Código de Cuenta de Cotización: 0110-123456789
                                </p>
                            </div>

                            {/* Descarga Documentación */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaDownload /> Descarga de Documentación Oficial
                                </h3>
                                <ul className="font-body text-sm sm:text-base text-neutralDark list-disc pl-5 space-y-2">
                                    <li>
                                        <a href="#vidalaboral" className="text-primary hover:underline">
                                            Informe de vida laboral
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#pensiones" className="text-primary hover:underline">
                                            Certificado de pensiones
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#bases" className="text-primary hover:underline">
                                            Informe de bases de cotización
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#corriente" className="text-primary hover:underline">
                                            Certificado de estar al corriente
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Servicios en Línea */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Servicios en Línea
                                </h3>
                                <ul className="font-body text-sm sm:text-base text-neutralDark list-disc pl-5 space-y-2">
                                    <li>
                                        <a href="#prestaciones" className="text-primary hover:underline">
                                            Solicitud de prestaciones
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#cita-previa" className="text-primary hover:underline">
                                            Cita previa en oficinas
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#modificacion-datos" className="text-primary hover:underline">
                                            Modificación de datos personales
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#simuladores" className="text-primary hover:underline">
                                            Simuladores y guías
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Centro de Ayuda */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaLifeRing /> Centro de Ayuda
                                </h3>
                                <p className="font-body text-sm sm:text-base text-neutralDark mb-4">
                                    Preguntas Frecuentes:
                                    <ul className="list-disc pl-5 mt-2 space-y-2">
                                        <li>¿Cómo solicitar la jubilación?</li>
                                        <li>¿Qué documentos necesito para la prestación por desempleo?</li>
                                        <li>¿Cómo modificar mi domicilio?</li>
                                    </ul>
                                </p>
                                <p className="font-body text-sm sm:text-base text-neutralDark">
                                    Para más información, llame al <strong>900 123 456</strong>
                                    o visite nuestro chat de asistencia.
                                </p>
                            </div>

                            {/* Estado Actual */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaRegSmile /> Estado Actual
                                </h3>
                                <p className="font-body text-sm sm:text-base text-neutralDark">
                                    <span className="text-green-600 font-bold">Sin incidencias.</span>
                                    Estás al corriente de tus cotizaciones y no hay alertas.
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="font-body text-center text-red-600 text-base mt-8">
                        No hay datos de usuario disponibles. ¿Está verificado?
                    </p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
