// VerificationTutorial.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaMobileAlt, FaCamera } from 'react-icons/fa';

const VerificationTutorial = () => {
    const navigate = useNavigate();

    const handleUnderstood = () => {
        // Ahora, una vez entendido el tutorial, vamos a la vista Register para generar el QR
        navigate('/register');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white text-neutralDark relative overflow-hidden">
            {/* Marca de agua sutil */}
            <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '10rem', lineHeight: '1' }}>
                <FaInfoCircle className="text-primary" />
            </div>

            <h2 className="font-headings text-3xl md:text-4xl mb-6 text-primary font-bold relative z-10">
                Antes de comenzar
            </h2>
            <p className="font-body text-lg md:text-xl mb-6 text-justify max-w-xl leading-relaxed relative z-10">
                Para verificar su identidad mediante DNI necesitará su wallet WaltId instalada en su dispositivo.
                Asegúrese de que su dispositivo cuenta con cámara para escanear los códigos QR que se le mostrarán.
                Tras entender las instrucciones, procederá a la verificación manual.
            </p>

            <div
                className="relative z-10 mb-8 p-6 max-w-xl rounded-xl shadow-lg"
                style={{
                    border: '2px solid #004080',
                    background: 'linear-gradient(to right, #e0f7fa, #e0f0fa)'
                }}
            >
                <h3 className="font-headings text-xl text-primary font-semibold mb-4 flex items-center gap-2">
                    <FaMobileAlt /> Requisitos para la Verificación
                </h3>
                <ul className="font-body text-base text-neutralDark space-y-3 pl-5 list-disc mb-6">
                    <li>Dispositivo móvil con cámara funcional</li>
                    <li>Aplicación Wallet WaltId instalada</li>
                    <li>Buena iluminación y conexión a Internet</li>
                </ul>
                <h4 className="font-headings text-lg text-primary font-semibold mb-2 flex items-center gap-2">
                    <FaCamera /> Consejos para el escaneo del QR
                </h4>
                <ul className="font-body text-base text-neutralDark space-y-3 pl-5 list-disc">
                    <li>Mantenga el teléfono estable y paralelo al código QR</li>
                    <li>Asegúrese de que la cámara esté limpia y sin reflejos</li>
                    <li>Acerque o aleje ligeramente el dispositivo si no enfoca correctamente</li>
                </ul>
            </div>

            <button
                onClick={handleUnderstood}
                className="px-8 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-lg font-semibold relative z-10"
            >
                Entendido
            </button>

            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-neutralLight to-transparent pointer-events-none"></div>
        </div>
    );
};

export default VerificationTutorial;
