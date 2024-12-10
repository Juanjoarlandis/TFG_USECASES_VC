import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { startVerification, checkSessionStatus } from '../../services/api';
import { verifyUser } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';
import { userSchema } from '../../utils/validation';
import { motion } from 'framer-motion';
import './Register.css';
import { FaIdCard, FaQrcode, FaCheckCircle, FaSpinner, FaRedoAlt } from 'react-icons/fa';

const Register = () => {
  const [offerURL, setOfferURL] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [qrVisible, setQrVisible] = useState(false);
  const [isLoadingQRCode, setIsLoadingQRCode] = useState(false);
  const [isVerifiedAnimation, setIsVerifiedAnimation] = useState(false);

  // Estados para el temporizador y expiración del QR
  const [timeLeft, setTimeLeft] = useState(60); // 3 minutos (180s)
  const [qrExpired, setQrExpired] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleVerifyDNI = async () => {
    try {
      const { verificationUrl, sessionId } = await startVerification();
      setIsLoadingQRCode(true);
      setTimeout(() => {
        setOfferURL(verificationUrl);
        setSessionId(sessionId);
        setIsLoadingQRCode(false);
        setQrVisible(true);
        setTimeLeft(120); // Reiniciamos el tiempo al generar un nuevo QR
        setQrExpired(false);
        toast.info('Escanee el código QR con su wallet');
      }, 3000);
    } catch (error) {
      console.error(error);
      toast.error('Error iniciando verificación');
    }
  };

  const checkVerificationStatusCallback = useCallback(async () => {
    if (!sessionId || !qrVisible || qrExpired) return;
    try {
      const data = await checkSessionStatus(sessionId);
      const { status, token, user } = data;

      if (status === 'verified' && token && user) {
        const result = userSchema.safeParse(user);
        if (!result.success) {
          toast.error('Datos de usuario inválidos recibidos del backend.');
          return;
        }
        setIsVerifiedAnimation(true);
        toast.success('Verificación exitosa!');
        setTimeout(() => {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          dispatch(verifyUser({ user, token }));
          navigate('/dashboard');
        }, 2000);
      } else if (status === 'failed') {
        toast.error('Verificación fallida.');
      } else if (status === 'expired') {
        // El backend indica que la sesión expiró
        setQrExpired(true);
        toast.warn('El QR ha expirado. Por favor, genere uno nuevo.');
      }
    } catch (error) {
      console.error(error);
    }
  }, [sessionId, dispatch, navigate, qrVisible, qrExpired]);

  // Polling para verificar estado cada 5s
  useEffect(() => {
    let interval;
    if (sessionId && qrVisible && !qrExpired && !isVerifiedAnimation) {
      interval = setInterval(checkVerificationStatusCallback, 5000);
    }
    return () => clearInterval(interval);
  }, [sessionId, checkVerificationStatusCallback, qrVisible, qrExpired, isVerifiedAnimation]);

  // Contador decreciente del tiempo para el QR
  useEffect(() => {
    if (qrVisible && !isVerifiedAnimation && !qrExpired) {
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
  }, [qrVisible, isVerifiedAnimation, qrExpired]);

  const handleRetry = () => {
    // Reiniciar el proceso
    setQrVisible(false);
    setQrExpired(false);
    setSessionId('');
    handleVerifyDNI();
  };

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
      className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Marca de agua sutil detrás */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '10rem', lineHeight: '1' }}>
        <FaIdCard className="text-primary" />
      </div>

      <h2 className="font-headings text-3xl md:text-4xl mb-6 text-primary font-bold z-10 relative">
        Verificación DNI
      </h2>

      <p className="font-body text-lg md:text-xl mb-8 text-justify max-w-xl leading-relaxed z-10 relative">
        Para acceder a sus servicios personalizados, primero necesitamos verificar su identidad mediante su DNI.
        Asegúrese de contar con su <strong>wallet WaltId</strong> instalada, y su dispositivo con cámara disponible
        para escanear el código QR que se generará.
      </p>

      {isVerifiedAnimation && (
        <motion.div
          className="verification-check-animation flex flex-col items-center justify-center z-10 relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
        >
          <div className="bg-green-600 text-white rounded-full p-4 mb-2">
            <FaCheckCircle className="text-3xl" />
          </div>
          <p className="font-body text-lg mt-2 text-primary font-semibold">Credencial Verificada</p>
        </motion.div>
      )}

      {!isVerifiedAnimation && (
        <>
          {!qrVisible && !isLoadingQRCode && !qrExpired && (
            <motion.button
              onClick={handleVerifyDNI}
              className="px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary transition font-body text-lg font-semibold z-10 relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Iniciar verificación de DNI"
            >
              Iniciar Verificación
            </motion.button>
          )}

          {isLoadingQRCode && (
            <motion.div
              className="loading-animation flex flex-col items-center z-10 relative mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.5 } }}
            >
              <FaSpinner className="animate-spin text-primary text-3xl mb-2" />
              <p className="font-body text-neutralDark mt-2 text-base">Generando QR...</p>
            </motion.div>
          )}

          {qrVisible && !isLoadingQRCode && (
            <motion.div
              className={`flex flex-col items-center mt-6 p-6 bg-white rounded-xl shadow-lg z-10 relative ${qrExpired ? 'opacity-50' : ''}`}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              style={{
                border: '2px solid #004080',
                background: 'linear-gradient(to right, #fafafa, #e3f2fd)'
              }}
            >
              {!qrExpired && (
                <>
                  <p className="font-body mb-4 text-neutralDark text-base flex items-center gap-1">
                    <FaQrcode className="text-primary" /> Escanea este código QR con tu wallet:
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                    <QRCodeCanvas value={offerURL} size={256} className="mb-4" />
                  </motion.div>
                  <p className="font-body text-sm text-neutralDark animate-pulse">
                    Esperando verificación...
                  </p>
                  <p className="font-body text-sm text-neutralDark mt-2 max-w-md text-center">
                    Tiempo restante: {timeLeft}s
                  </p>
                  <p className="font-body text-xs text-neutralDark mt-1 max-w-md text-center">
                    Una vez presentada su credencial, la verificación tardará unos segundos. Por favor mantenga esta ventana abierta.
                  </p>
                </>
              )}
              {qrExpired && (
                <div className="flex flex-col items-center">
                  <p className="font-body text-sm text-neutralDark mb-4 text-center">
                    El tiempo para escanear el QR ha expirado.
                  </p>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary hover:scale-105 transition font-body text-base flex items-center gap-2"
                  >
                    <FaRedoAlt /> Generar Nuevo QR
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Un degradado sutil en la parte inferior */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-neutralLight to-transparent pointer-events-none"></div>
    </motion.div>
  );
};

export default Register;

