// src/pages/VerificationMethodSelect/VerificationMethodSelect.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUnlockAlt, FaQrcode, FaInfoCircle, FaWallet } from 'react-icons/fa';

const VerificationMethodSelect = () => {
    const navigate = useNavigate();

    const handleLoginWithWallet = () => {
        // Navega al flujo de login con wallet
        navigate('/login-with-wallet');
    };

    const handleManualVerification = () => {
        // Navega a la pantalla de tutorial antes de llegar a Register
        navigate('/verification-tutorial');
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 bg-white text-neutralDark overflow-hidden">
            {/* Marca de agua decorativa */}
            <div
                className="absolute bottom-0 right-0 opacity-10 pointer-events-none"
                style={{ fontSize: '10rem', lineHeight: '1' }}
            >
                <FaInfoCircle className="text-primary" />
            </div>

            <h2 className="font-headings text-2xl sm:text-3xl md:text-4xl mb-6 text-primary font-bold relative z-10 text-center">
                Seleccione el Método de Verificación
            </h2>
            <p className="font-body text-base sm:text-lg md:text-xl mb-8 text-justify max-w-2xl leading-relaxed relative z-10">
                Puede iniciar sesión con su wallet <strong>WaltId</strong> para una verificación automática, fluida y sin escanear códigos,
                o bien realizar la verificación de forma manual escaneando un código <strong>QR</strong> con su dispositivo.
                Elija la opción que mejor se adapte a sus necesidades:
            </p>

            {/* Contenedor de opciones */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                {/* Opción 1: Login con Wallet */}
                <div className="bg-white border-2 border-primary rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
                    <div className="mb-4 flex justify-center items-center text-primary">
                        <FaWallet className="text-4xl sm:text-5xl" />
                    </div>
                    <h3 className="font-headings text-lg sm:text-xl text-primary font-bold mb-3 text-center">
                        Verificación Automática
                    </h3>
                    <p className="font-body text-sm sm:text-base text-neutralDark mb-5 text-center max-w-xs">
                        Ideal para usuarios que ya tengan su <strong>wallet WaltId</strong>. Permite un proceso de verificación continuo
                        sin necesidad de escanear códigos, ofreciendo mayor comodidad y rapidez.
                    </p>
                    <button
                        onClick={handleLoginWithWallet}
                        className="px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-sm sm:text-base font-semibold flex items-center gap-2"
                    >
                        <FaUnlockAlt />
                        Iniciar con Wallet
                    </button>
                </div>

                {/* Opción 2: Verificación Manual (QR) */}
                <div className="bg-white border-2 border-primary rounded-xl shadow-lg p-6 flex flex-col items-center hover:shadow-xl transition-shadow">
                    <div className="mb-4 flex justify-center items-center text-primary">
                        <FaQrcode className="text-4xl sm:text-5xl" />
                    </div>
                    <h3 className="font-headings text-lg sm:text-xl text-primary font-bold mb-3 text-center">
                        Verificación Manual
                    </h3>
                    <p className="font-body text-sm sm:text-base text-neutralDark mb-5 text-center max-w-xs">
                        Escanee un código <strong>QR</strong> para verificar su identidad con credencial <strong>DNI</strong> o similar.
                        Es la opción clásica que requiere su dispositivo móvil para captar el código visual.
                    </p>
                    <button
                        onClick={handleManualVerification}
                        className="px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-300 font-body text-sm sm:text-base font-semibold flex items-center gap-2"
                    >
                        <FaQrcode />
                        Verificación QR
                    </button>
                </div>
            </div>

            {/* Degradado en la parte superior */}
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-neutralLight to-transparent pointer-events-none" />
        </div>
    );
};

export default VerificationMethodSelect;
