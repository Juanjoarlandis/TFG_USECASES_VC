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

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
    const { userData, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [showCredentials, setShowCredentials] = useState(false);

    const handleDarseAlta = async () => {
        navigate('/alta');
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

    const hasAltaCredential = userData?.hasAltaCredential || false;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return format(date, 'dd/MM/yyyy', { locale: esLocale });
    };

    // Credencial de alta
    const altaData = userData?.altaCredentialData || null;

    return (
        <div className="min-h-screen w-full bg-gray-100 py-8 px-4 flex flex-col items-center">
            <div className="bg-white w-full max-w-7xl p-8 rounded-xl shadow-md relative overflow-hidden">
                {/* Marca de agua semi-transparente */}
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '9rem', lineHeight: '1' }}>
                    <FaShieldAlt className="text-blue-200" />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between mb-8 relative z-10">
                    <div className="max-w-2xl">
                        <h2 className="font-headings text-3xl md:text-4xl text-primary font-bold mb-2">
                            Bienvenido{userData ? `, ${userData.firstName}` : ''}
                        </h2>
                        <p className="font-body text-neutralDark text-base md:text-lg leading-relaxed">
                            Accede a tu información personal, trámites y beneficios de la Seguridad Social en un entorno seguro, centralizado y fácil de navegar.
                        </p>
                    </div>
                    <div className="mt-6 md:mt-0 flex gap-4">
                        {!hasAltaCredential && (
                            <button
                                onClick={handleDarseAlta}
                                className="px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-200 font-body font-semibold text-base"
                            >
                                Darse de Alta
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 bg-neutralDark text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-200 font-body font-semibold text-base"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                {userData ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {/* Perfil del Usuario */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-center mb-4">
                                    <FaUser className="text-primary text-xl mr-2" />
                                    <h3 className="font-headings text-xl text-primary font-semibold">Perfil del Usuario</h3>
                                </div>
                                {userData.photo && (
                                    <div className="mb-4">
                                        <img src={userData.photo} alt="Foto DNI" className="w-32 h-auto rounded-md border border-gray-200 shadow-sm" />
                                    </div>
                                )}
                                <ul className="font-body text-base text-neutralDark space-y-2">
                                    <li><strong>Nombre:</strong> {userData.firstName} {userData.familyName}</li>
                                    <li><strong>DNI:</strong> {userData.documentNumber}</li>
                                    <li><strong>Fecha de Nacimiento:</strong> {formatDate(userData.birthDate)}</li>
                                    <li><strong>Nacionalidad:</strong> {userData.nationality || 'N/A'}</li>
                                    <li><strong>Género:</strong> {userData.gender || 'N/A'}</li>
                                </ul>
                            </div>

                            {/* Información Documental */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <div className="flex items-center mb-4">
                                    <FaIdCard className="text-primary text-xl mr-2" />
                                    <h3 className="font-headings text-xl text-primary font-semibold">Información del Documento</h3>
                                </div>
                                <p className="font-body text-sm text-neutralDark mb-4">
                                    Aquí se muestra información clave sobre su documento de identidad y su registro en la Seguridad Social.
                                </p>
                                <ul className="font-body text-base text-neutralDark space-y-2">
                                    <li><strong>Tipo de Documento:</strong> Documento Nacional de Identidad</li>
                                    <li><strong>Emisor:</strong> Ministerio del Interior (Gobierno de España)</li>
                                    <li><strong>Nacionalidad:</strong> {userData.nationality || 'N/A'}</li>
                                    <li><strong>Número de la Seguridad Social (NSS):</strong> {userData.nss || 'N/A'}</li>
                                </ul>
                            </div>
                        </div>

                        {/* Pestaña Mis Credenciales */}
                        <div className="mt-10 relative z-10">
                            <button
                                onClick={() => setShowCredentials(!showCredentials)}
                                className="w-full flex items-center justify-between px-6 py-3 bg-gray-50 text-neutralDark rounded-xl shadow-sm hover:bg-gray-100 hover:text-primary transition-colors duration-200 font-body font-semibold text-base focus:outline-none"
                            >
                                <span>Mis Credenciales</span>
                                {showCredentials ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                            {showCredentials && hasAltaCredential && altaData && (
                                <div
                                    className="p-6 mt-4 rounded-xl relative overflow-hidden animate-fadeInZoom bg-gradient-to-r from-blue-100 to-blue-200 shadow-md"
                                    style={{
                                        border: '2px solid gold',
                                    }}
                                >
                                    <div className="absolute top-0 left-0 opacity-5 pointer-events-none" style={{ fontSize: '8rem', lineHeight: '1' }}>
                                        <FaShieldAlt className="text-primary" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4 group" title="Esta credencial acredita su alta en la Seguridad Social">
                                            <FaShieldAlt className="text-primary text-3xl" />
                                            <h3 className="font-headings text-2xl text-primary font-bold">
                                                Credencial de Alta
                                            </h3>
                                            <span className="bg-green-600 text-white text-sm font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                                                VERIFICADO <FaCheckCircle />
                                            </span>
                                        </div>

                                        <p className="font-body text-base text-neutralDark leading-relaxed mb-4">
                                            Esta credencial le acredita como trabajador dado de alta en la Seguridad Social,
                                            otorgándole acceso a prestaciones, servicios y derechos asociados a su afiliación.
                                        </p>
                                        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col gap-2 relative">
                                            <p className="font-body text-sm text-neutralDark flex items-center">
                                                <FaFileAlt className="mr-1" /> <strong>Tipo de Credencial:</strong> {altaData.type?.join(', ')}
                                            </p>
                                            <p className="font-body text-sm text-neutralDark">
                                                <strong>Emisor:</strong> {altaData.issuer?.name} ({altaData.issuer?.id})
                                            </p>
                                            <p className="font-body text-sm text-neutralDark">
                                                <strong>Válida desde:</strong> {altaData.validFrom || 'N/A'}
                                            </p>
                                            <p className="font-body text-sm text-neutralDark">
                                                <strong>Expira el:</strong> {altaData.expirationDate || 'N/A'}
                                            </p>

                                            <div className="mt-4">
                                                <h4 className="font-headings text-lg text-primary font-semibold mb-2">Datos del Empleador</h4>
                                                <p className="font-body text-sm text-neutralDark"><strong>Nombre:</strong> {altaData.credentialSubject?.employer?.employerName}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Código Cuenta Cotización:</strong> {altaData.credentialSubject?.employer?.contributionAccountCode}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Régimen:</strong> {altaData.credentialSubject?.employer?.socialSecurityRegime}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Convenios Colectivos:</strong></p>
                                                <ul className="list-disc pl-5">
                                                    {altaData.credentialSubject?.employer?.collectiveAgreements?.map((acuerdo, i) => (
                                                        <li key={i} className="font-body text-sm text-neutralDark">{acuerdo}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="mt-4">
                                                <h4 className="font-headings text-lg text-primary font-semibold mb-2">Datos del Trabajador</h4>
                                                <p className="font-body text-sm text-neutralDark"><strong>Nombre y Apellidos:</strong> {altaData.credentialSubject?.worker?.nombre} {altaData.credentialSubject?.worker?.apellidos}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>DNI:</strong> {altaData.credentialSubject?.worker?.dni}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>NSS:</strong> {altaData.credentialSubject?.worker?.nss}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Domicilio:</strong> {altaData.credentialSubject?.worker?.domicilio}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Fecha Inicio Actividad:</strong> {altaData.credentialSubject?.worker?.fechaInicioActividad}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Grupo Cotización:</strong> {altaData.credentialSubject?.worker?.grupoCotizacion}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Tipo Contrato:</strong> {altaData.credentialSubject?.worker?.tipoContrato}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Coeficiente Jornada:</strong> {altaData.credentialSubject?.worker?.coeficienteJornada}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Ocupación:</strong> {altaData.credentialSubject?.worker?.ocupacion}</p>
                                                <p className="font-body text-sm text-neutralDark"><strong>Código Cuenta Cotización:</strong> {altaData.credentialSubject?.worker?.codigoCuentaCotizacion}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleDarseBaja}
                                            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-500 hover:scale-105 transition-transform duration-200 font-body font-semibold text-base"
                                            title="Revocar esta credencial"
                                        >
                                            Darse de Baja (Revocar Credencial)
                                        </button>
                                    </div>
                                </div>
                            )}
                            {showCredentials && !hasAltaCredential && (
                                <div className="p-6 mt-4 rounded-xl bg-gray-50 shadow-sm">
                                    <p className="font-body text-base text-neutralDark">No tienes credenciales disponibles en este momento.</p>
                                </div>
                            )}
                        </div>

                        {/* Secciones adicionales del Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mt-10">
                            {/* Historial de Cotizaciones */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Historial de Cotizaciones
                                </h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Consulta tus periodos cotizados, empleadores o regímenes, con fechas y bases detalladas.
                                </p>
                                <div className="overflow-auto">
                                    <table className="min-w-full text-left border-collapse">
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
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Prestaciones Activas
                                </h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Prestación por Desempleo<br />
                                    Importe Mensual: <strong>800€</strong><br />
                                    Inicio: 01/06/2021 - Duración: 12 meses<br />
                                    Próxima revisión: 01/06/2022
                                </p>
                            </div>

                            {/* Avisos y Notificaciones */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaBell /> Avisos y Notificaciones
                                </h3>
                                <ul className="font-body text-base text-neutralDark space-y-2 list-disc pl-5">
                                    <li>Tienes una comunicación pendiente del INSS.</li>
                                    <li>Próxima renovación de prestación en 30 días.</li>
                                    <li>Cambio legislativo en cotizaciones, válido a partir de 2025.</li>
                                </ul>
                            </div>

                            {/* Simulador */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaRegSmile /> Simulador de Jubilación
                                </h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Estimación de pensión a los 67 años: <strong>1.200€/mes</strong><br />
                                    Tiempo de cotización adicional recomendado: 2 años más a jornada completa.<br />
                                    Añade tus datos para simular distintos escenarios.
                                </p>
                            </div>

                            {/* Información de Afiliación */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Información de Afiliación
                                </h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Régimen: Autónomos<br />
                                    Último empleador: Empresa Ejemplo S.A.<br />
                                    Código de Cuenta de Cotización: 0110-123456789
                                </p>
                            </div>

                            {/* Descarga Documentación */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaDownload /> Descarga de Documentación Oficial
                                </h3>
                                <ul className="font-body text-base text-neutralDark list-disc pl-5 space-y-2">
                                    <li><a href="#vidalaboral" className="text-primary hover:underline">Informe de vida laboral</a></li>
                                    <li><a href="#pensiones" className="text-primary hover:underline">Certificado de pensiones</a></li>
                                    <li><a href="#bases" className="text-primary hover:underline">Informe de bases de cotización</a></li>
                                    <li><a href="#corriente" className="text-primary hover:underline">Certificado de estar al corriente</a></li>
                                </ul>
                            </div>

                            {/* Servicios en Línea */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaInfoCircle /> Servicios en Línea
                                </h3>
                                <ul className="font-body text-base text-neutralDark list-disc pl-5 space-y-2">
                                    <li><a href="#prestaciones" className="text-primary hover:underline">Solicitud de prestaciones</a></li>
                                    <li><a href="#cita-previa" className="text-primary hover:underline">Cita previa en oficinas</a></li>
                                    <li><a href="#modificacion-datos" className="text-primary hover:underline">Modificación de datos personales</a></li>
                                    <li><a href="#simuladores" className="text-primary hover:underline">Simuladores y guías</a></li>
                                </ul>
                            </div>

                            {/* Centro de Ayuda */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaLifeRing /> Centro de Ayuda
                                </h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Preguntas Frecuentes:
                                    <ul className="list-disc pl-5 mt-2 space-y-2">
                                        <li>¿Cómo solicitar la jubilación?</li>
                                        <li>¿Qué documentos necesito para la prestación por desempleo?</li>
                                        <li>¿Cómo modificar mi domicilio?</li>
                                    </ul>
                                </p>
                                <p className="font-body text-base text-neutralDark">
                                    Para más información, llame al <strong>900 123 456</strong> o visite nuestro chat de asistencia.
                                </p>
                            </div>

                            {/* Estado Actual */}
                            <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                                    <FaRegSmile /> Estado Actual
                                </h3>
                                <p className="font-body text-base text-neutralDark">
                                    <span className="text-green-600 font-bold">Sin incidencias.</span> Estás al corriente de tus cotizaciones y no hay alertas.
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
