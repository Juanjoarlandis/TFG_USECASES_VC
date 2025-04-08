import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { FaIdCard, FaCheckCircle, FaQrcode, FaRedoAlt } from 'react-icons/fa';
import { useDispatch } from 'react-redux';

import {
    offerThreeCredsVerification,
    checkThreeCredsVerificationStatus,
    offerIssuance,
    checkIssuanceSessionStatus
} from '../../services/api';

// Importamos Anime.js (v4) como un método 'animate'
import { animate } from 'animejs';

const Alta = () => {
    const [verificationUrl, setVerificationUrl] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [qrVisible, setQrVisible] = useState(false);
    const [issuanceOfferUrl, setIssuanceOfferUrl] = useState('');
    const [issuanceQrVisible, setIssuanceQrVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [qrExpired, setQrExpired] = useState(false);
    const [issuanceAccepted, setIssuanceAccepted] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Refs para animar contenedor, QR de verificación, QR de emisión y mensaje final
    const containerRef = useRef(null);
    const verificationQRRef = useRef(null);
    const issuanceQRRef = useRef(null);
    const acceptedRef = useRef(null);

    // Al montar el componente, animamos la sección principal
    useEffect(() => {
        if (containerRef.current) {
            animate(containerRef.current, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 500,
                easing: 'easeOutQuad'
            });
        }
    }, []);

    // Animación para QR de verificación cada vez que se muestre
    useEffect(() => {
        if (qrVisible && !issuanceQrVisible && !qrExpired && verificationQRRef.current) {
            animate(verificationQRRef.current, {
                opacity: [0, 1],
                scale: [0.95, 1],
                duration: 700,
                easing: 'easeOutElastic'
            });
        }
    }, [qrVisible, issuanceQrVisible, qrExpired]);

    // Animación para QR de emisión cada vez que se muestre
    useEffect(() => {
        if (issuanceQrVisible && !issuanceAccepted && issuanceQRRef.current) {
            animate(issuanceQRRef.current, {
                opacity: [0, 1],
                scale: [0.95, 1],
                duration: 700,
                easing: 'easeOutElastic'
            });
        }
    }, [issuanceQrVisible, issuanceAccepted]);

    // Animación del mensaje final si la credencial fue aceptada
    useEffect(() => {
        if (issuanceAccepted && acceptedRef.current) {
            animate(acceptedRef.current, {
                opacity: [0, 1],
                scale: [0.95, 1],
                duration: 500,
                easing: 'easeOutQuad'
            });
        }
    }, [issuanceAccepted]);

    // 1) Inicia la verificación de 3 credenciales
    const startThreeCredsVerification = async () => {
        try {
            const { verificationUrl, stateId } = await offerThreeCredsVerification();
            setVerificationUrl(verificationUrl);
            setSessionId(stateId);
            setQrVisible(true);
            setTimeLeft(180);
            setQrExpired(false);
        } catch (error) {
            console.error(error);
            toast.error('Error iniciando verificación para el alta.');
        }
    };

    // 2) Polling: revisa si la verificación de 3 creds se completó
    const checkStatus = useCallback(async () => {
        if (!sessionId || !qrVisible || qrExpired || issuanceQrVisible) return;
        try {
            const statusRes = await checkThreeCredsVerificationStatus(sessionId);
            const { status } = statusRes;

            if (status === 'verified') {
                toast.success('¡Verificación completada! Emisión de credencial en proceso...');
                // Llamamos a offerIssuance
                const result = await offerIssuance(sessionId);
                console.log('IssuanceOfferUrl:', result.data);
                const { issuanceOfferUrl, state } = result.data;

                if (!issuanceOfferUrl) {
                    toast.error('No se recibió la URL de emisión');
                    return;
                }
                setIssuanceOfferUrl(issuanceOfferUrl);
                setIssuanceQrVisible(true);

            } else if (status === 'failed') {
                toast.error('La verificación ha fallado.');
            } else if (status === 'expired') {
                setQrExpired(true);
                toast.warn('El QR ha expirado. Por favor genere uno nuevo.');
            }
            // pending => no hacemos nada
        } catch (error) {
            console.error(error);
            toast.error('Error consultando estado de la verificación.');
        }
    }, [sessionId, qrVisible, qrExpired, issuanceQrVisible]);

    useEffect(() => {
        let interval;
        if (sessionId && qrVisible && !qrExpired && !issuanceQrVisible) {
            interval = setInterval(checkStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [sessionId, qrVisible, qrExpired, issuanceQrVisible, checkStatus]);

    // 3) Temporizador para expirar el QR de verificación en 180s
    useEffect(() => {
        if (qrVisible && !qrExpired && !issuanceQrVisible) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setQrExpired(true);
                        toast.warn('El tiempo para escanear el QR ha finalizado. Genera uno nuevo.');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [qrVisible, qrExpired, issuanceQrVisible]);

    // 4) Retry en caso de fallo o expiración
    const handleRetry = () => {
        setQrVisible(false);
        setQrExpired(false);
        setSessionId('');
        setIssuanceOfferUrl('');
        setIssuanceQrVisible(false);
        startThreeCredsVerification();
    };

    // 5) Polling para verificar si el holder aceptó la credencial
    const checkIssuanceStatus = useCallback(async () => {
        if (!sessionId || !issuanceQrVisible || issuanceAccepted) return;
        try {
            const { issuanceStatus } = await checkIssuanceSessionStatus(sessionId);
            if (issuanceStatus === 'accepted') {
                setIssuanceAccepted(true);
                toast.success('¡Credencial aceptada! Redirigiendo al dashboard...');
                setTimeout(() => navigate('/dashboard'), 3000);
            }
        } catch (error) {
            console.error(error);
            toast.error('Error consultando estado de emisión.');
        }
    }, [sessionId, issuanceQrVisible, issuanceAccepted, navigate]);

    useEffect(() => {
        let interval;
        if (sessionId && issuanceQrVisible && !issuanceAccepted) {
            interval = setInterval(checkIssuanceStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [sessionId, issuanceQrVisible, issuanceAccepted, checkIssuanceStatus]);

    return (
        <div
            ref={containerRef}
            className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white text-neutralDark relative overflow-hidden"
        >
            {/* Icono de fondo */}
            <div
                className="absolute bottom-0 right-0 opacity-10 pointer-events-none"
                style={{ fontSize: '10rem', lineHeight: '1' }}
            >
                <FaIdCard className="text-primary" />
            </div>

            <h2 className="font-headings text-3xl md:text-4xl mb-6 text-primary font-bold z-10 relative">
                Proceso de Alta
            </h2>
            <p className="font-body text-lg md:text-xl mb-6 text-justify max-w-xl leading-relaxed z-10 relative">
                Para darse de alta en la Seguridad Social necesita presentar <strong>3 credenciales</strong>:<br />
                - Credencial de Identidad<br />
                - Credencial de Pasaporte<br />
                - Credencial de Registro Laboral del Empleador<br />
                Una vez validadas estas 3 credenciales, procederemos a la emisión de su credencial de Alta en la Seguridad Social.
            </p>

            {/* Botón inicial */}
            {!qrVisible && !issuanceQrVisible && !issuanceAccepted && (
                <button
                    onClick={startThreeCredsVerification}
                    className="px-7 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition font-body text-lg font-semibold focus:outline-none z-10 relative flex items-center gap-2"
                >
                    <FaQrcode />
                    Iniciar verificación (3 Credenciales)
                </button>
            )}

            {/* QR de verificación */}
            {qrVisible && !issuanceQrVisible && (
                <div
                    ref={verificationQRRef}
                    className={`flex flex-col items-center mt-7 p-7 rounded-xl shadow-lg z-10 relative ${qrExpired ? 'opacity-50' : ''
                        }`}
                    style={{
                        border: '2px solid #004080',
                        background: 'linear-gradient(to right, #e0f7fa, #f0f7fa)',
                        opacity: 0
                    }}
                >
                    {!qrExpired && (
                        <>
                            <p className="font-body mb-4 text-neutralDark text-base">
                                <FaQrcode className="inline-block mr-1 text-primary" />
                                Escanee este código QR con su wallet y presente las 3 credenciales requeridas:
                            </p>
                            <div className="hover:scale-105 transition-transform duration-200 ease-in-out">
                                <QRCodeCanvas
                                    value={verificationUrl || ''}
                                    size={256}
                                    className="mb-4 border-4 border-white shadow-md"
                                />
                            </div>
                            <p className="font-body text-sm text-neutralDark animate-pulse">
                                Esperando verificación...
                            </p>
                            <p className="font-body text-xs text-neutralDark mt-2">
                                Tiempo restante: {timeLeft}s
                            </p>
                        </>
                    )}

                    {qrExpired && (
                        <div className="flex flex-col items-center">
                            <p className="font-body text-sm text-neutralDark mb-4 text-center">
                                El tiempo para escanear el QR ha expirado.
                            </p>
                            <button
                                className="px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition-transform duration-200 font-body font-semibold text-base flex items-center gap-2"
                                onClick={handleRetry}
                            >
                                <FaRedoAlt /> Generar Nuevo QR
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* QR para emisión de la credencial */}
            {issuanceQrVisible && !issuanceAccepted && (
                <div
                    ref={issuanceQRRef}
                    className="flex flex-col items-center mt-6 p-6 rounded-xl shadow-lg z-10 relative"
                    style={{
                        border: '2px solid #004080',
                        background: 'linear-gradient(to right, #e6fffa, #f0ffff)',
                        opacity: 0
                    }}
                >
                    <p className="font-body mb-4 text-neutralDark text-base flex items-center gap-2">
                        <FaCheckCircle className="text-green-600" /> Verificación completada.
                        <br />
                        Ahora escanee este QR para recibir su credencial <strong>Alta_Seguridad_Social</strong>:
                    </p>
                    <div className="hover:scale-105 transition-transform duration-200 ease-in-out">
                        <QRCodeCanvas
                            value={issuanceOfferUrl || ''}
                            size={256}
                            className="mb-4 border-4 border-white shadow-md"
                        />
                    </div>
                    <p className="font-body text-sm text-neutralDark mb-4">
                        Escanee para emitir la credencial en su wallet.
                    </p>
                    <p className="font-body text-sm text-neutralDark">
                        Esperando que aceptes la credencial...
                    </p>
                </div>
            )}

            {/* Mensaje final si la credencial fue aceptada */}
            {issuanceAccepted && (
                <div
                    ref={acceptedRef}
                    className="flex flex-col items-center mt-6 p-6 rounded-xl shadow-lg z-10 relative"
                    style={{
                        border: '2px solid #004080',
                        background: 'linear-gradient(to right, #e0ffe0, #e0ffe0)',
                        opacity: 0
                    }}
                >
                    <p className="font-body mb-4 text-neutralDark text-base flex items-center gap-2">
                        <FaCheckCircle className="text-green-600" /> Credencial emitida y aceptada.
                        <br />
                        Redirigiendo al Dashboard...
                    </p>
                </div>
            )}

            {/* Sombra degrade en la parte superior */}
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-neutralLight to-transparent pointer-events-none"></div>
        </div>
    );
};

export default Alta;
