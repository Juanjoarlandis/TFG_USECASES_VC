// src/components/LoadingEmission.js
import React from 'react';
import { FaStamp } from 'react-icons/fa';

const LoadingEmission = ({ message = 'Emitiendo credencial...' }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="relative bg-white p-8 rounded-xl shadow-lg flex flex-col items-center w-64 h-64 overflow-hidden">
                {/* Texto */}
                <p className="font-body text-primary text-lg font-semibold mb-4">
                    {message}
                </p>

                {/* Contenedor que simula el papel + sello */}
                <div className="relative w-full h-32 rounded-md overflow-hidden border-2 border-primary bg-gradient-to-br from-gray-100 to-gray-200 p-2">
                    {/* “Paper" lines (simulando datos en la credencial) */}
                    <div className="mt-2 space-y-2">
                        <div className="h-2 w-3/4 bg-gray-300 rounded"></div>
                        <div className="h-2 w-2/3 bg-gray-300 rounded"></div>
                        <div className="h-2 w-1/2 bg-gray-300 rounded"></div>
                    </div>

                    {/* Sello: bajará y subirá con animación */}
                    <div className="stamp-container absolute w-16 h-16 bg-transparent flex justify-center items-center left-1/2 transform -translate-x-1/2">
                        <FaStamp className="text-red-600 text-4xl stamp-icon" />
                    </div>

                    {/* Marca que queda en el “documento” tras la animación */}
                    <div className="stamp-mark absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        w-24 h-24 bg-red-100 border-2 border-red-600 rounded-full text-red-600
                        opacity-0 flex items-center justify-center font-bold text-sm 
                        stamp-mark-text">
                        SELLADO
                    </div>
                </div>
            </div>

            <style jsx>{`
                /* Animación de sello */
                .stamp-container {
                    animation: stampMovement 2.5s infinite ease-in-out;
                }

                /* El ícono de stamp gira al bajar y al subir un poco */
                .stamp-icon {
                    animation: spinIcon 2.5s infinite ease-in-out;
                }

                /* La marca (SELLADO) aparece en mitad de la animación */
                .stamp-mark {
                    animation: markAppear 2.5s infinite ease-in-out;
                }

                @keyframes stampMovement {
                    0% {
                        transform: translateX(-50%) translateY(-120%);
                    }
                    30% {
                        transform: translateX(-50%) translateY(0%); /* golpea el papel */
                    }
                    45% {
                        transform: translateX(-50%) translateY(-10%); /* rebote */
                    }
                    60% {
                        transform: translateX(-50%) translateY(0%);
                    }
                    100% {
                        transform: translateX(-50%) translateY(-120%);
                    }
                }

                @keyframes spinIcon {
                    0% {
                        transform: rotate(0deg);
                    }
                    30% {
                        transform: rotate(15deg);
                    }
                    45% {
                        transform: rotate(-5deg);
                    }
                    60% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(0deg);
                    }
                }

                @keyframes markAppear {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-50%) scale(0.1);
                    }
                    30% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(-50%) scale(1);
                    }
                    60% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(-50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-50%) scale(0.1);
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingEmission;
