// src/pages/VerificationMethodSelect/VerificationTutorial.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaMobileAlt, FaCamera, FaLightbulb } from 'react-icons/fa';

const VerificationTutorial = () => {
    const navigate = useNavigate();

    const handleUnderstood = () => {
        // Navegamos a la vista Register para generar el QR
        navigate('/register');
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 bg-white text-neutralDark overflow-hidden">
            {/* Marca de agua sutil */}
            <div
                className="absolute bottom-0 right-0 opacity-10 pointer-events-none"
                style={{ fontSize: '10rem', lineHeight: '1' }}
            >
                <FaInfoCircle className="text-primary" />
            </div>

            <h2 className="font-headings text-2xl sm:text-3xl md:text-4xl mb-6 text-primary font-bold relative z-10 text-center">
                Antes de Comenzar
            </h2>
            <p className="font-body text-base sm:text-lg md:text-xl mb-6 text-justify max-w-xl leading-relaxed relative z-10">
                Para verificar su identidad mediante su <strong>DNI</strong>, necesitará tener la aplicación wallet
                <strong> WaltId</strong> instalada en su dispositivo. Asegúrese de disponer de una cámara funcional
                para escanear los códigos <strong>QR</strong> que se mostrarán durante el proceso.
            </p>

            {/* Sección de “Requisitos y Consejos” */}
            <div
                className="relative z-10 mb-8 p-6 sm:p-8 max-w-xl rounded-xl shadow-lg space-y-6"
                style={{
                    border: '2px solid #004080',
                    background: 'linear-gradient(to right, #e0f7fa, #e8f7fa)'
                }}
            >
                {/* Requisitos */}
                <div className="mb-4">
                    <h3 className="font-headings text-lg sm:text-xl md:text-2xl text-primary font-semibold mb-2 flex items-center gap-2">
                        <FaMobileAlt />
                        Requisitos para la Verificación
                    </h3>
                    <ul className="font-body text-sm sm:text-base text-neutralDark space-y-2 pl-5 list-disc">
                        <li>Dispositivo móvil con cámara en buen estado.</li>
                        <li>Aplicación <strong>Wallet WaltId</strong> instalada.</li>
                        <li>Buena iluminación y conexión a Internet estable.</li>
                    </ul>
                </div>

                {/* Consejos para escanear */}
                <div>
                    <h4 className="font-headings text-base sm:text-lg md:text-xl text-primary font-semibold mb-2 flex items-center gap-2">
                        <FaCamera />
                        Consejos para el Escaneo de QR
                    </h4>
                    <ul className="font-body text-sm sm:text-base text-neutralDark space-y-2 pl-5 list-disc">
                        <li>Mantenga el teléfono firme y paralelo al código QR.</li>
                        <li>Asegúrese de que la lente de la cámara esté limpia y sin reflejos.</li>
                        <li>Acerque o aleje ligeramente el dispositivo para lograr un enfoque adecuado.</li>
                    </ul>
                </div>
            </div>

            {/* Extra tips o highlight */}
            <div className="relative z-10 mb-6 max-w-xl p-4 bg-neutralLight rounded-md shadow-md flex items-center gap-3">
                <FaLightbulb className="text-yellow-500 text-2xl" />
                <p className="font-body text-sm sm:text-base text-neutralDark">
                    Consejo: Si encuentra dificultades al escanear, aumente la luminosidad de la pantalla o
                    solicite ayuda a otra persona para sujetar el dispositivo.
                </p>
            </div>

            {/* Botón final */}
            <button
                onClick={handleUnderstood}
                className="px-6 py-3 sm:px-8 sm:py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-base sm:text-lg font-semibold relative z-10"
            >
                Entendido
            </button>

            {/* Gradiente superior */}
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-neutralLight to-transparent pointer-events-none" />
        </div>
    );
};

export default VerificationTutorial;
