// src/pages/Alta/Alta.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaIdCard, FaCheckCircle, FaQrcode, FaRedoAlt } from 'react-icons/fa';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;


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

    const startThreeCredsVerification = async () => {
        try {
            // Cambiamos el endpoint de 2 a 3 credenciales
            const response = await axios.post(`${BASE_URL}/verification/offer3creds`, {});
            setVerificationUrl(response.data.verificationUrl);
            setSessionId(response.data.state);
            setQrVisible(true);
            setTimeLeft(180);
            setQrExpired(false);
        } catch (error) {
            console.error(error);
            toast.error('Error iniciando verificación para el alta.');
        }
    };

    const checkStatus = useCallback(async () => {
        if (!sessionId || !qrVisible || qrExpired || issuanceQrVisible) return;
        try {
            const statusRes = await axios.get(`${BASE_URL}/verification/session/${sessionId}`);
            const { status } = statusRes.data;
            if (status === 'verified') {
                toast.success('¡Verificación completada! Emisión de credencial en proceso...');
                const issuanceRes = await axios.post(`${BASE_URL}/issuance/offer`, { stateId: sessionId });
                setIssuanceOfferUrl(issuanceRes.data.issuanceOfferUrl);
                setIssuanceQrVisible(true);
            } else if (status === 'failed') {
                toast.error('La verificación ha fallado.');
            } else if (status === 'expired') {
                setQrExpired(true);
                toast.warn('El QR ha expirado. Por favor genere uno nuevo.');
            }
        } catch (error) {
            console.error(error);
        }
    }, [sessionId, qrVisible, qrExpired, issuanceQrVisible]);

    useEffect(() => {
        let interval;
        if (sessionId && qrVisible && !qrExpired && !issuanceQrVisible) {
            interval = setInterval(checkStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [sessionId, qrVisible, qrExpired, issuanceQrVisible, checkStatus]);

    useEffect(() => {
        if (qrVisible && !qrExpired && !issuanceQrVisible) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setQrExpired(true);
                        toast.warn('El tiempo para escanear el QR ha finalizado. Genere uno nuevo.');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [qrVisible, qrExpired, issuanceQrVisible]);

    const handleRetry = () => {
        setQrVisible(false);
        setQrExpired(false);
        setSessionId('');
        setIssuanceOfferUrl('');
        setIssuanceQrVisible(false);
        startThreeCredsVerification();
    };

    const checkIssuanceStatus = useCallback(async () => {
        if (!sessionId || !issuanceQrVisible || issuanceAccepted) return;
        try {
            const res = await axios.get(`${BASE_URL}/issuance/session/${sessionId}`);
            const { issuanceStatus } = res.data;
            if (issuanceStatus === 'accepted') {
                setIssuanceAccepted(true);
                toast.success('¡Credencial aceptada! Redirigiendo al dashboard...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error(error);
        }
    }, [sessionId, issuanceQrVisible, issuanceAccepted, navigate]);

    useEffect(() => {
        let interval;
        if (sessionId && issuanceQrVisible && !issuanceAccepted) {
            interval = setInterval(checkIssuanceStatus, 5000);
        }
        return () => clearInterval(interval);
    }, [sessionId, issuanceQrVisible, issuanceAccepted, checkIssuanceStatus]);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: 'easeOut' }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: 'spring', stiffness: 120, damping: 15 }
        }
    };

    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white text-neutralDark relative overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '10rem', lineHeight: '1' }}>
                <FaIdCard className="text-primary" />
            </div>

            <h2 className="font-headings text-3xl md:text-4xl mb-6 text-primary font-bold z-10 relative">
                Proceso de Alta
            </h2>
            <p className="font-body text-lg md:text-xl mb-6 text-justify max-w-xl leading-relaxed z-10 relative">
                Para darse de alta en la Seguridad Social necesita presentar <strong>3 credenciales</strong>:
                <br /><br />
                <strong>- Credencial de Identidad</strong><br />
                <strong>- Credencial de Pasaporte</strong><br />
                <strong>- Credencial de Registro Laboral del Empleador</strong><br /><br />
                Una vez validadas estas 3 credenciales, procederemos a la emisión de su credencial de Alta en la Seguridad Social.
            </p>

            {!qrVisible && !issuanceQrVisible && !issuanceAccepted && (
                <motion.button
                    onClick={startThreeCredsVerification}
                    className="px-7 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition font-body text-lg font-semibold focus:outline-none z-10 relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Iniciar verificación (3 Credenciales)
                </motion.button>
            )}

            {qrVisible && !issuanceQrVisible && (
                <motion.div
                    className={`flex flex-col items-center mt-7 p-7 rounded-xl shadow-lg z-10 relative ${qrExpired ? 'opacity-50' : ''}`}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                        border: '2px solid #004080',
                        background: 'linear-gradient(to right, #e0f7fa, #e0f0fa)'
                    }}
                >
                    {!qrExpired && (
                        <>
                            <p className="font-body mb-4 text-neutralDark text-base">
                                <FaQrcode className="inline-block mr-1 text-primary" /> Escanee este código QR con su wallet y presente las 3 credenciales requeridas:
                            </p>
                            <div className="hover:scale-105 transition-transform duration-200 ease-in-out">
                                <QRCodeCanvas value={verificationUrl} size={256} className="mb-4" />
                            </div>
                            <p className="font-body text-sm text-neutralDark animate-pulse">
                                Esperando verificación...
                            </p>
                            <p className="font-body text-xs text-neutralDark mt-2">Tiempo restante: {timeLeft}s</p>
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
                </motion.div>
            )}

            {issuanceQrVisible && !issuanceAccepted && (
                <motion.div
                    className="flex flex-col items-center mt-6 p-6 rounded-xl shadow-lg z-10 relative"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                        border: '2px solid #004080',
                        background: 'linear-gradient(to right, #e0f7fa, #e0f0fa)'
                    }}
                >
                    <p className="font-body mb-4 text-neutralDark text-base flex items-center gap-2">
                        <FaCheckCircle className="text-green-600" /> Verificación completada.<br />
                        Ahora escanee este QR para recibir su credencial <strong>Alta_Seguridad_Social</strong>:
                    </p>
                    <div className="hover:scale-105 transition-transform duration-200 ease-in-out">
                        <QRCodeCanvas value={issuanceOfferUrl} size={256} className="mb-4" />
                    </div>
                    <p className="font-body text-sm text-neutralDark mb-4">Escanee para emitir la credencial en su wallet.</p>
                    <p className="font-body text-sm text-neutralDark">Esperando que aceptes la credencial...</p>
                </motion.div>
            )}

            {issuanceAccepted && (
                <motion.div
                    className="flex flex-col items-center mt-6 p-6 rounded-xl shadow-lg z-10 relative"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.5 } }}
                    style={{
                        border: '2px solid #004080',
                        background: 'linear-gradient(to right, #e0ffe0, #e0ffe0)'
                    }}
                >
                    <p className="font-body mb-4 text-neutralDark text-base flex items-center gap-2">
                        <FaCheckCircle className="text-green-600" /> Credencial emitida y aceptada.<br />
                        Redirigiendo al Dashboard...
                    </p>
                </motion.div>
            )}

            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-neutralLight to-transparent pointer-events-none"></div>
        </motion.div>
    );
};

export default Alta;
