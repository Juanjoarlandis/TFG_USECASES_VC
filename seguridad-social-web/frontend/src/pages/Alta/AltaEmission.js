// src/pages/AltaEmission.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingEmission from './LoadingEmission';

const AltaEmission = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showOverlay, setShowOverlay] = useState(true);

    const stateId = localStorage.getItem('tripleCredsStateId');
    console.log('[AltaEmission] => stateId desde localStorage:', stateId);

    useEffect(() => {
        if (!stateId) {
            toast.error('No se encontró la sesión de verificación. Redirigiendo...');
            navigate('/dashboard');
            return;
        }

        const checkVerificationAndIssue = async () => {
            try {
                console.log('[AltaEmission] => Iniciando polling para ver si session está verified...');

                let pollingAttempts = 0;
                const maxAttempts = 10;
                let verified = false;

                while (pollingAttempts < maxAttempts && !verified) {
                    const resp = await axios.get(
                        `${process.env.REACT_APP_BACKEND_URL}/verification/session/${stateId}`
                    );
                    const { status } = resp.data;
                    console.log('[AltaEmission] => session status=', status);

                    if (status === 'verified') {
                        verified = true;
                        break;
                    } else if (status === 'failed' || status === 'expired') {
                        toast.error(`La verificación falló o expiró (estado=${status}).`);
                        setShowOverlay(false);
                        return navigate('/dashboard');
                    }
                    // Esperamos 2s y re-intentamos
                    pollingAttempts += 1;
                    await new Promise((r) => setTimeout(r, 2000));
                }

                if (!verified) {
                    toast.error('No se pudo confirmar la verificación de 3 credenciales.');
                    setShowOverlay(false);
                    return navigate('/dashboard');
                }

                // YA verified => Llamamos a /issuance/offerIssuance
                toast.info('Verificación OK. Empezando emisión de alta...');
                const issueResp = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/issuance/offerIssuance`,
                    { stateId }
                );
                console.log('[AltaEmission] => Respuesta de /offerIssuance:', issueResp);

                if (issueResp.status !== 200) {
                    toast.error('Error en la oferta de emisión de la credencial');
                    setShowOverlay(false);
                    return navigate('/dashboard');
                }

                toast.info('Oferta de emisión generada. Reclamando la credencial en la wallet...');
                const useResp = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/issuance/claimAltaCredential`,
                    { stateId }
                );
                console.log('[AltaEmission] => Respuesta de /claimAltaCredential:', useResp);

                if (useResp.status === 200) {
                    toast.success('Credencial de Alta emitida y guardada en la wallet con éxito');
                } else {
                    toast.error('Error al reclamar la credencial de alta');
                }

                // Dejamos 3s para que se vea la animación de sello
                setTimeout(() => {
                    setShowOverlay(false);
                    // Un pequeño extra: medio segundo antes de redirigir
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 500);
                }, 3000);

            } catch (err) {
                console.error('[AltaEmission] => Error general:', err);
                toast.error('Ocurrió un error al emitir la credencial de alta.');
                setShowOverlay(false);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        checkVerificationAndIssue();
    }, [navigate, stateId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-white relative overflow-hidden">
            {showOverlay && <LoadingEmission message="Emitiendo credencial de Alta..." />}

            <h1 className="font-headings text-2xl text-primary font-bold mb-4">
                Emisión de Credencial de Alta
            </h1>
            {loading ? (
                <p className="font-body text-lg text-neutralDark text-center">
                    Por favor espere mientras emitimos su credencial de alta...
                </p>
            ) : (
                <p className="font-body text-lg text-neutralDark text-center">
                    Proceso de emisión finalizado. Puedes volver al dashboard.
                </p>
            )}
        </div>
    );
};

export default AltaEmission;
