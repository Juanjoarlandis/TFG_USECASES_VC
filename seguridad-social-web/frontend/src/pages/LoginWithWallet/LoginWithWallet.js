// LoginWithWallet.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';
import LoadingVerification from './LoadingVerification';
import { walletLogin } from '../../services/api'; // Ajustar la ruta del import según tu estructura
import { useDispatch } from 'react-redux';
import { verifyUser } from '../../store/authSlice';

const LoginWithWallet = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/verification-mode');
    };

    const pollVerificationStatus = (stateId) => {
        // Hacemos polling cada 3 s
        const intervalId = setInterval(async () => {
            try {
                const BASE_URL = process.env.REACT_APP_BACKEND_URL;
                const resp = await fetch(`${BASE_URL}/verification/session/${stateId}`);

                /* ─── Manejo de respuestas con error ───────────────────────────── */
                if (!resp.ok) {
                    const errData = await resp.json().catch(() => ({}));

                    if (errData.code === 'IDENTITY_CRED_MISSING') {
                        toast.warn(
                            'Tu wallet no contiene la Credencial de Identidad. ' +
                            'Añádela e intenta de nuevo.'
                        );
                    } else if (resp.status === 404) {
                        toast.error('Sesión no encontrada o expirada.');
                    } else {
                        toast.error('Error consultando verificación.');
                    }

                    clearInterval(intervalId);
                    setIsLoading(false);
                    return;
                }

                /* ─── Si la respuesta es exitosa ──────────────────────────────── */
                const sessionData = await resp.json();

                if (sessionData.status === 'verified') {
                    toast.success('Verificación completada');
                    clearInterval(intervalId);

                    if (sessionData.token && sessionData.user && sessionData.refreshToken) {
                        // Guardar tokens y datos
                        localStorage.setItem('token', sessionData.token);
                        localStorage.setItem('refreshToken', sessionData.refreshToken);
                        localStorage.setItem('user', JSON.stringify(sessionData.user));
                        dispatch(verifyUser({ user: sessionData.user, token: sessionData.token }));
                        setIsLoading(false);
                        navigate('/dashboard');
                    } else {
                        toast.error('Falta token o usuario tras verificación.');
                        setIsLoading(false);
                    }
                } else if (sessionData.status === 'failed') {
                    toast.error('Verificación fallida.');
                    clearInterval(intervalId);
                    setIsLoading(false);
                } else if (sessionData.status === 'expired') {
                    toast.warn('La verificación ha expirado.');
                    clearInterval(intervalId);
                    setIsLoading(false);
                }
                // status === 'pending' → no hacemos nada, seguimos poll
            } catch (err) {
                console.error(err);
                clearInterval(intervalId);
                toast.error('Error consultando verificación.');
                setIsLoading(false);
            }
        }, 3000);
    };


    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const dispatch = useDispatch();
    const handleSubmit = async e => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await sleep(2000);
            const data = await walletLogin(email, password);

            // 1) Falta Credencial de Identidad en la wallet
            if (data.status === 404 && data.code === 'IDENTITY_CRED_MISSING') {
                toast.warn(
                    <div>
                        <strong>¡Credencial no encontrada!</strong>
                        <div style={{ marginTop: 4, fontSize: '0.9em' }}>
                            No hemos detectado tu credencial de identidad (DNI) en la wallet.<br />
                            Por favor:
                            <ol style={{ paddingLeft: 16, margin: '4px 0' }}>
                                <li>Añade tu DNI en la sección “Credenciales” de tu wallet.</li>
                                <li>Vuelve aquí y vuelve a intentarlo.</li>
                            </ol>
                        </div>
                    </div>,
                    {
                        autoClose: 10000,      // 10 segundos
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    }
                );
                setIsLoading(false);
                return;
            }

            // 2) Flujo de verificación pendiente
            if (data.status === 200 && data.state && data.message) {
                toast.info(`Verificación en curso. ID: ${data.state}. Esperando callback…`);
                localStorage.setItem('loginState', data.state);
                pollVerificationStatus(data.state);
                return;
            }

            // 3) Verificación completada inmediatamente
            if (
                data.status === 200 &&
                data.status === 'verified' &&
                data.token &&
                data.refreshToken &&
                data.user
            ) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('flow', data.flow);
                dispatch(verifyUser({ user: data.user, token: data.token }));
                navigate('/dashboard');
                return;
            }

            // 4) Otros casos inesperados
            toast.error('Verificación no completada o respuesta inesperada.');
            setIsLoading(false);

        } catch (err) {
            console.error(err);
            toast.error('Error de servidor. Intenta de nuevo más tarde.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white relative overflow-hidden">
            {/* Marca de agua suave */}
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none" style={{ fontSize: '10rem', lineHeight: '1' }}>
                <FaUser className="text-primary" />
            </div>

            <h2 className="font-headings text-3xl md:text-4xl mb-6 text-primary font-bold relative z-10">
                Iniciar Sesión con Wallet
            </h2>
            <p className="font-body text-lg md:text-xl mb-8 text-justify max-w-xl leading-relaxed relative z-10">
                Ingrese sus credenciales de la cuenta WaltId. El sistema verificará automáticamente su identidad utilizando su credencial DNI.
            </p>

            <form onSubmit={handleSubmit} className="bg-neutralLight p-6 rounded-xl shadow-md max-w-sm w-full relative z-10">
                <div className="mb-4">
                    <label className="font-body text-base text-neutralDark block mb-2" htmlFor="email">
                        Correo electrónico
                    </label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-300 focus-within:border-primary transition-colors">
                        <FaUser className="text-gray-500" />
                        <input
                            id="email"
                            type="email"
                            className="flex-1 outline-none font-body text-base text-neutralDark"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="mb-6">
                    <label className="font-body text-base text-neutralDark block mb-2" htmlFor="password">
                        Contraseña
                    </label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-300 focus-within:border-primary transition-colors">
                        <FaLock className="text-gray-500" />
                        <input
                            id="password"
                            type="password"
                            className="flex-1 outline-none font-body text-base text-neutralDark"
                            placeholder="********"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className={`px-6 py-3 w-full rounded-full font-body text-lg font-semibold text-white transition-transform duration-200 flex items-center justify-center gap-2 ${isLoading ? 'bg-neutralDark' : 'bg-primary hover:bg-secondary hover:scale-105'
                        }`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Iniciando...' : <>
                        <FaSignInAlt />
                        Iniciar Sesión
                    </>}
                </button>
                <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 mt-4 flex items-center gap-2 text-sm text-primary hover:text-secondary transition-colors"
                >
                    <FaArrowLeft /> Volver a la selección de método
                </button>
            </form>

            {isLoading && <LoadingVerification />}
        </div>
    );
};

export default LoginWithWallet;
