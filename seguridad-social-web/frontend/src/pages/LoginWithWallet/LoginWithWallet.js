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
        // Hacemos polling cada 3-5 segundos...
        const intervalId = setInterval(async () => {
            try {
                const BASE_URL = process.env.REACT_APP_BACKEND_URL;
                const resp = await fetch(`${BASE_URL}/verification/session/${stateId}`);
                const sessionData = await resp.json();
                // sessionData podría ser { status, token, refreshToken, user } etc.

                if (sessionData.status === 'verified') {
                    toast.success('Verificación completada');
                    clearInterval(intervalId);

                    if (sessionData.token && sessionData.user && sessionData.refreshToken) {
                        // Guardar
                        localStorage.setItem('token', sessionData.token);
                        localStorage.setItem('refreshToken', sessionData.refreshToken);
                        localStorage.setItem('user', JSON.stringify(sessionData.user));
                        dispatch(verifyUser({ user: sessionData.user, token: sessionData.token }));
                        setIsLoading(false);
                        navigate('/dashboard');
                    } else {
                        toast.error('Falta token/usuario tras verificación.');
                    }
                } else if (sessionData.status === 'failed') {
                    toast.error('Verificación fallida.');
                    clearInterval(intervalId);
                } else if (sessionData.status === 'expired') {
                    toast.warn('La verificación ha expirado.');
                    clearInterval(intervalId);
                }
                // else => status=pending, no hacer nada, seguimos
            } catch (err) {
                console.error(err);
                clearInterval(intervalId);
                toast.error('Error consultando verificación.');
            }
        }, 3000);
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const dispatch = useDispatch();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await sleep(2000);
            const data = await walletLogin(email, password);

            // 1) Si tu backend devuelve algo como:
            //   { message: 'Login automático iniciado...', state: 'xxxxx', verificationUrl: '...' }
            //   significa que la verificación NO ha terminado.
            if (data.state && data.message) {
                // Ponemos un toast informativo
                toast.info(`Verificación en curso. ID: ${data.state}. Esperando callback...`);

                // Guardamos en localStorage, y pasamos a poll...
                localStorage.setItem('loginState', data.state);

                // Llamamos a una función de “poll”:
                pollVerificationStatus(data.state);

                // Podríamos quedar en un spinner, o permitir un "Cancelar"
                setIsLoading(true);
                return; // Finaliza la función. Aún no hay tokens
            }

            // 2) En caso de que tu backend SÍ devuelva status=verified, token, etc. (si se definiera):
            if (data.status === 'verified' && data.token && data.user && data.refreshToken) {
                // Guardar en localStorage y dispatch
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('flow', data.flow);
                dispatch(verifyUser({ user: data.user, token: data.token }));
                navigate('/dashboard');
            } else {
                toast.error('Error iniciando sesión o verificación no completada.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error iniciando sesión.');
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
