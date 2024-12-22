// LoadingVerification.js
import React from 'react';
import { FaIdCard, FaUser } from 'react-icons/fa';

const LoadingVerification = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="relative bg-white p-8 rounded-xl shadow-lg flex flex-col items-center w-80 h-72 overflow-hidden">
                <FaIdCard className="text-primary text-5xl mb-4" />

                <p className="font-body text-gray-700 text-lg font-semibold mb-6 whitespace-nowrap">
                    Verificando credencial...
                </p>

                {/* Contenedor que simula el DNI */}
                <div className="relative w-full h-36 rounded-md overflow-hidden border-2 border-primary bg-gradient-to-br from-gray-100 to-gray-200 p-2">
                    {/* Simulación de foto del DNI */}
                    <div className="w-12 h-12 bg-white border border-gray-300 rounded-sm flex items-center justify-center float-left mr-2">
                        <FaUser className="text-gray-400 text-xl" />
                    </div>

                    {/* Simulación de texto del DNI (líneas representando datos) */}
                    <div className="ml-[3.5rem] mt-1">
                        <div className="h-2 w-3/4 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 w-2/3 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 w-1/2 bg-gray-300 rounded mb-1"></div>
                    </div>

                    {/* Línea de escaneo animada */}
                    <div className="scan-line absolute top-0 left-0 w-full h-full"></div>
                </div>
            </div>

            <style jsx>{`
                .scan-line {
                    background: linear-gradient(
                        to bottom,
                        transparent 0%,
                        rgba(0, 255, 0, 0.2) 25%,
                        rgba(0, 255, 0, 0.4) 50%,
                        rgba(0, 255, 0, 0.2) 75%,
                        transparent 100%
                    );
                    animation: scanAnimation 2.5s infinite ease-in-out;
                }

                @keyframes scanAnimation {
                    0% {
                        transform: translateY(-130%);
                    }
                    50% {
                        transform: translateY(130%);
                    }
                    100% {
                        transform: translateY(-130%);
                    }
                }
            `}</style>
        </div>
    );
};

export default LoadingVerification;
