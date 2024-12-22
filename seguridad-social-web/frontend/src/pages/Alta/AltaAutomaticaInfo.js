import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaPassport, FaUserShield, FaBuilding, FaPlay } from 'react-icons/fa';

const AltaAutomaticaInfo = () => {
    const navigate = useNavigate();

    const handleProceed = () => {
        navigate('/alta-automatica');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white relative overflow-hidden text-neutralDark">
            {/* Marca de agua sutil */}
            <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '10rem', lineHeight: '1' }}>
                <FaInfoCircle className="text-primary" />
            </div>

            <h2 className="font-headings text-3xl md:text-4xl mb-6 text-primary font-bold relative z-10">
                Alta Automática en la Seguridad Social
            </h2>
            <p className="font-body text-lg md:text-xl mb-6 text-justify max-w-xl leading-relaxed relative z-10">
                Ha seleccionado el proceso de Alta Automática. Este proceso agiliza la emisión
                de su credencial de alta en la Seguridad Social sin necesidad de escanear códigos QR.
                Sin embargo, antes de continuar es necesario que usted disponga en su wallet de las siguientes credenciales:
            </p>

            <ul className="font-body text-base md:text-lg space-y-4 max-w-lg mb-8 relative z-10">
                <li className="flex items-center gap-3">
                    <FaUserShield className="text-primary text-2xl" />
                    <span><strong>Credencial de Identidad (CustomIdentityCredential):</strong> Permite verificar su identidad personal.</span>
                </li>
                <li className="flex items-center gap-3">
                    <FaPassport className="text-primary text-2xl" />
                    <span><strong>Credencial de Pasaporte (PassportCredential):</strong> Acredita su nacionalidad y su información de viaje.</span>
                </li>
                <li className="flex items-center gap-3">
                    <FaBuilding className="text-primary text-2xl" />
                    <span><strong>Credencial de Registro Laboral del Empleador (EmployerRegistrationCredential):</strong> Demuestra la vinculación con su empleador y el régimen laboral.</span>
                </li>
            </ul>

            <p className="font-body text-base md:text-lg text-justify max-w-xl mb-8 relative z-10">
                Asegúrese de que su wallet WaltId contiene estas tres credenciales verificables.
                Una vez comprobado, puede iniciar el proceso automático.
            </p>

            <button
                onClick={handleProceed}
                className="px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-lg font-semibold relative z-10 flex items-center gap-2"
            >
                <FaPlay />
                Iniciar Proceso Automático
            </button>

            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-neutralLight to-transparent pointer-events-none"></div>
        </div>
    );
};

export default AltaAutomaticaInfo;
