// src/pages/AltaAutomatica.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

// Importamos nuestro overlay animado
import LoadingVerification from '../LoginWithWallet/LoadingVerification';

const AltaAutomatica = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // para spinner + scanning
    const [showOverlay, setShowOverlay] = useState(true); // para mostrar el DNI scanning

    useEffect(() => {
        const offer3CredsAuto = async () => {
            console.log('[AltaAutomatica] => Llamando a /verification/offer3credsAuto...');

            try {
                const response = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/verification/offer3credsAuto`
                );
                console.log('[AltaAutomatica] => Respuesta de /offer3credsAuto:', response);

                if (response.status === 200) {
                    toast.info('Se ha iniciado la verificación automática de 3 credenciales.');
                    const stateId = response.data.state;
                    console.log('[AltaAutomatica] => stateId =', stateId);

                    localStorage.setItem('tripleCredsStateId', stateId);

                    // Esperamos 3s de delay para que se vea la animación
                    setTimeout(() => {
                        //toast.success('Verificación en proceso. Redirigiendo a emitir la credencial...');
                        setShowOverlay(false);
                        // Navegamos tras 500 ms extra (para que no sea tan brusco)
                        setTimeout(() => {
                            navigate('/alta-emision');
                        }, 500);
                    }, 3000);

                } else {
                    toast.error('Error iniciando la verificación de 3 credenciales');
                    console.log('[AltaAutomatica] => Error HTTP status != 200');
                    setShowOverlay(false);
                }
            } catch (err) {
                console.error('[AltaAutomatica] => Error llamando a /offer3credsAuto:', err);
                toast.error('Ocurrió un error en la verificación automática');
                setShowOverlay(false);
            } finally {
                setLoading(false);
            }
        };

        offer3CredsAuto();
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white relative overflow-hidden">
            {/* Overlay con el DNI scanning si showOverlay = true */}
            {showOverlay && (
                <LoadingVerification message="Verificando credenciales..." />
            )}

            <h1 className="mb-6 text-primary font-headings text-3xl md:text-4xl font-bold">
                Procesando Alta Automática...
            </h1>

            <div className="flex flex-col items-center justify-center">
                <FaCheckCircle
                    className={`text-green-500 text-5xl mb-4 transition-transform duration-300 
                        ${loading ? 'animate-pulse' : 'scale-105'}`}
                />

                {loading ? (
                    <p className="font-body text-lg text-neutralDark text-center">
                        Por favor espere, estamos completando su proceso de alta de forma automática...
                    </p>
                ) : (
                    <p className="font-body text-lg text-neutralDark text-center">
                        Proceso de alta iniciado. Validando sus credenciales...
                    </p>
                )}
            </div>
        </div>
    );
};

export default AltaAutomatica;
