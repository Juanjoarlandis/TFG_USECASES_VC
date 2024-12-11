import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, verifyUser } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { fetchUserDataByDni } from '../../services/api';
import { format } from 'date-fns';
import esLocale from 'date-fns/locale/es';
import { FaShieldAlt, FaCheckCircle, FaCalendarAlt, FaFileAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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
            const response = await axios.post(`${BASE_URL}/revocar-credencial`, { dni });
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

    // Extraemos la credencial de alta si está disponible
    const altaData = userData?.altaCredentialData || null;

    return (
        <div className="min-h-[80vh] p-4 bg-neutralLight fade-in-scale flex flex-col items-center">
            <div className="bg-white w-full max-w-7xl p-8 rounded-xl shadow-lg relative overflow-hidden">
                {/* Marca de agua semi-transparente */}
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '10rem', lineHeight: '1' }}>
                    <FaShieldAlt className="text-azulOscuro" />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between mb-8 relative z-10">
                    <div>
                        <h2 className="font-headings text-3xl md:text-4xl text-primary font-bold mb-2">
                            Bienvenido{userData ? `, ${userData.firstName}` : ''}
                        </h2>
                        <p className="font-body text-neutralDark text-base md:text-lg max-w-2xl leading-relaxed">
                            Bienvenido al área personal de la Seguridad Social. Desde aquí puedes consultar y gestionar
                            tu información, trámites y beneficios de forma segura y centralizada.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-4">
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
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Perfil del Usuario</h3>
                                {userData.photo && (
                                    <div className="mb-4">
                                        <img src={userData.photo} alt="Foto DNI" className="w-32 h-auto rounded-md" />
                                    </div>
                                )}
                                <ul className="font-body text-base text-neutralDark space-y-2">
                                    <li><strong>Nombre:</strong> {userData.firstName} {userData.familyName}</li>
                                    <li><strong>DNI:</strong> {userData.documentNumber}</li>
                                    <li><strong>Fecha de Nacimiento:</strong> {formatDate(userData.birthDate)}</li>
                                    <li><strong>Nacionalidad:</strong> {userData.nationality || 'N/A'}</li>
                                    <li><strong>Género:</strong> {userData.gender || 'N/A'} - Sexo (Documento): {userData.sex || 'N/A'}</li>
                                    <li><strong>Dirección:</strong> {userData.currentAddress && userData.currentAddress.join(', ')}</li>
                                    <li><strong>Lugar de Nacimiento:</strong> {userData.placeOfBirth ? `${userData.placeOfBirth.locality}, ${userData.placeOfBirth.province}, ${userData.placeOfBirth.country}` : 'N/A'}</li>
                                </ul>
                            </div>

                            {/* Información Documental */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Información del Documento</h3>
                                <ul className="font-body text-base text-neutralDark space-y-2">
                                    <li><strong>Número Personal:</strong> {userData.personalNumber || 'N/A'}</li>
                                    <li><strong>NSS:</strong> {userData.nss || 'N/A'}</li>
                                    <li><strong>Número CAN:</strong> {userData.canNumber || 'N/A'}</li>
                                    <li>
                                        <strong><FaCalendarAlt className="inline-block mr-1" />Fecha de Emisión del DNI:</strong> {formatDate(userData.dniIssueDate)}
                                    </li>
                                    <li><strong>Serie Láser:</strong> {userData.laserEngravedSerial || 'N/A'}</li>
                                    <li><strong>Ascendientes:</strong></li>
                                    {userData.ascendants && userData.ascendants.length > 0 ? (
                                        <ul className="pl-4 list-disc">
                                            {userData.ascendants.map((asc, index) => (
                                                <li key={index}>{asc.givenName} {asc.familyName}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="font-body text-base text-neutralDark">No hay ascendientes registrados.</p>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Pestaña Mis Credenciales */}
                        <div className="mt-6 relative z-10">
                            <button
                                onClick={() => setShowCredentials(!showCredentials)}
                                className="w-full flex items-center justify-between px-6 py-3 bg-neutralLight text-neutralDark rounded-xl shadow-inner hover:bg-neutralDark hover:text-white transition-colors duration-200 font-body font-semibold text-base focus:outline-none"
                            >
                                <span>Mis Credenciales</span>
                                {showCredentials ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                            {showCredentials && hasAltaCredential && altaData && (
                                <div
                                    className="p-6 mt-4 rounded-xl relative overflow-hidden animate-fadeInZoom bg-gradient-to-r from-blue-100 to-blue-300"
                                    style={{
                                        border: '2px solid gold',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {/* Marca de agua suave */}
                                    <div className="absolute top-0 left-0 opacity-5 pointer-events-none" style={{ fontSize: '8rem', lineHeight: '1' }}>
                                        <FaShieldAlt className="text-primary" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4 group" title="Esta credencial acredita su alta en la Seguridad Social">
                                            <FaShieldAlt className="text-primary text-3xl" />
                                            <h3 className="font-headings text-2xl text-primary font-bold">
                                                Credencial de Alta
                                            </h3>
                                            <span className="bg-green-600 text-white text-sm font-semibold px-2 py-1 rounded-full">VERIFICADO <FaCheckCircle className="inline-block ml-1" /></span>
                                        </div>

                                        <p className="font-body text-base text-neutralDark leading-relaxed mb-4">
                                            Esta credencial le acredita como trabajador dado de alta en la Seguridad Social, otorgándole acceso a
                                            prestaciones, servicios y derechos asociados a su afiliación.
                                        </p>
                                        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col gap-2 relative">
                                            <p className="font-body text-sm text-neutralDark">
                                                <FaFileAlt className="inline-block mr-1" /> <strong>Tipo de Credencial:</strong> {altaData.type?.join(', ')}
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

                                            {/* Datos del Empleador */}
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

                                            {/* Datos del Trabajador */}
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
                                <div className="p-6 mt-4 rounded-xl bg-neutralLight shadow-inner">
                                    <p className="font-body text-base text-neutralDark">No tienes credenciales disponibles en este momento.</p>
                                </div>
                            )}
                        </div>

                        {/* Secciones adicionales del Dashboard (Historial, Prestaciones, etc.) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 mt-6">
                            {/* Historial de Cotizaciones */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Historial de Cotizaciones</h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    A continuación se muestran sus periodos cotizados, empleadores o regímenes, fechas y bases:
                                </p>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2">Empleador/Régimen</th>
                                            <th className="py-2">Inicio</th>
                                            <th className="py-2">Fin</th>
                                            <th className="py-2">Días Cotizados</th>
                                            <th className="py-2">Base Cotización</th>
                                            <th className="py-2">Grupo Cotización</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b hover:bg-gray-100 transition-colors">
                                            <td>Empresa Ejemplo S.A.</td>
                                            <td>01/01/2010</td>
                                            <td>31/12/2015</td>
                                            <td>2190</td>
                                            <td>30.000€/año</td>
                                            <td>Grupo 1</td>
                                        </tr>
                                        <tr className="border-b hover:bg-gray-100 transition-colors">
                                            <td>Autónomo - Régimen Especial</td>
                                            <td>01/01/2016</td>
                                            <td>Actualidad</td>
                                            <td>2600</td>
                                            <td>15.000€/año</td>
                                            <td>Grupo 3</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Prestaciones Activas */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Prestaciones Activas</h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Prestación por Desempleo<br />
                                    Importe Mensual: <strong>800€</strong><br />
                                    Fecha Inicio: 01/06/2021 - Duración: 12 meses<br />
                                    Próxima revisión: 01/06/2022
                                </p>
                            </div>

                            {/* Avisos y Notificaciones */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Avisos y Notificaciones Oficiales</h3>
                                <ul className="font-body text-base text-neutralDark space-y-2 list-disc pl-5">
                                    <li>Tienes una comunicación pendiente del INSS (haz clic aquí para verla).</li>
                                    <li>Próxima renovación de prestación en 30 días.</li>
                                    <li>Cambio legislativo en cotizaciones, válido a partir de 2025.</li>
                                </ul>
                            </div>

                            {/* Simulador */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Simulador de Jubilación</h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Estimación de pensión a los 67 años: <strong>1.200€/mes</strong><br />
                                    Tiempo de cotización necesario para mejorar: 2 años más a jornada completa<br />
                                    Escenarios hipotéticos: Añade aquí tus datos para simular.
                                </p>
                            </div>

                            {/* Información de Afiliación */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Información de Afiliación</h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Régimen: Autónomos<br />
                                    Último empleador: Empresa Ejemplo S.A.<br />
                                    Código de Cuenta de Cotización: 0110-123456789
                                </p>
                            </div>

                            {/* Descarga Documentación */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Descarga de Documentación Oficial</h3>
                                <ul className="font-body text-base text-neutralDark list-disc pl-5 space-y-2">
                                    <li><a href="#vidalaboral">Informe de vida laboral</a></li>
                                    <li><a href="#pensiones">Certificado de pensiones</a></li>
                                    <li><a href="#bases">Informe de bases de cotización</a></li>
                                    <li><a href="#corriente">Certificado de estar al corriente</a></li>
                                </ul>
                            </div>

                            {/* Servicios en Línea */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner md:col-span-2">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Servicios en Línea</h3>
                                <ul className="font-body text-base text-neutralDark list-disc pl-5 space-y-2">
                                    <li><a href="#prestaciones">Solicitud de prestaciones</a></li>
                                    <li><a href="#cita-previa">Cita previa en oficinas</a></li>
                                    <li><a href="#modificacion-datos">Modificación de datos personales</a></li>
                                    <li><a href="#simuladores">Simuladores y guías</a></li>
                                </ul>
                            </div>

                            {/* Centro de Ayuda */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Centro de Ayuda</h3>
                                <p className="font-body text-base text-neutralDark mb-4">
                                    Preguntas Frecuentes:
                                    <ul className="list-disc pl-5 mt-2 space-y-2">
                                        <li>¿Cómo solicitar la jubilación?</li>
                                        <li>¿Qué documentos necesito para la prestación por desempleo?</li>
                                        <li>¿Cómo modificar mi domicilio?</li>
                                    </ul>
                                </p>
                                <p className="font-body text-base text-neutralDark">
                                    Para más información, llame al 900 123 456 o visite nuestro chat de asistencia.
                                </p>
                            </div>

                            {/* Estado Actual */}
                            <div className="bg-neutralLight p-6 rounded-xl shadow-inner">
                                <h3 className="font-headings text-xl text-primary font-semibold mb-4">Estado Actual</h3>
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
