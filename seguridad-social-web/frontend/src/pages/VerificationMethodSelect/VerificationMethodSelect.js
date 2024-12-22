// VerificationMethodSelect.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUnlockAlt, FaQrcode, FaInfoCircle } from 'react-icons/fa';

const VerificationMethodSelect = () => {
    const navigate = useNavigate();

    const handleLoginWithWallet = () => {
        // Flujo futuro de login con wallet
        navigate('/login-with-wallet');
    };

    const handleManualVerification = () => {
        // Ahora vamos primero a la pantalla de tutorial antes de llegar a register
        navigate('/verification-tutorial');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '10rem', lineHeight: '1' }}>
                <FaInfoCircle className="text-primary" />
            </div>

            <h2 className="font-headings text-3xl md:text-4xl mb-6 text-primary font-bold relative z-10">
                Seleccione método de Verificación
            </h2>
            <p className="font-body text-lg md:text-xl mb-8 text-justify max-w-xl leading-relaxed relative z-10">
                Puede iniciar sesión con su wallet WaltId para una verificación automática y transparente, o realizar la verificación manual escaneando códigos QR.
            </p>

            <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <button
                    onClick={handleLoginWithWallet}
                    className="px-8 py-4 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-200 font-body text-lg font-semibold flex items-center gap-2"
                >
                    <FaUnlockAlt /> Login con Wallet
                </button>
                <button
                    onClick={handleManualVerification}
                    className="px-8 py-4 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-200 font-body text-lg font-semibold flex items-center gap-2"
                >
                    <FaQrcode /> Verificación Manual (QR)
                </button>
            </div>
        </div>
    );
};

export default VerificationMethodSelect;
