// src/services/offerService.js
const axios = require('axios');
const HolderSessionManager = require('./HolderSessionManager');
const logger = require('../../logger');

/**
 * Realiza la lógica para usar una "credential offer" 
 * en la wallet: se resuelve la oferta enviándola al endpoint useOfferRequest.
 * 
 * @param {string} offerUrl - URL de la oferta de credencial
 * @param {string} did - DID del holder en la wallet
 * @returns {Promise<Object>} - Devuelve la respuesta JSON de la wallet
 */
async function useCredentialOffer(offerUrl, did) {
    logger.debug('[offerService] useCredentialOffer - start');
    if (!offerUrl || !did) {
        const err = new Error('Missing offerUrl or did');
        err.status = 400;
        throw err;
    }

    // 1) Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();

    // 2) Construir la solicitud a la wallet
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'text/plain'
        }
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/useOfferRequest?did=${encodeURIComponent(did)}`;

    logger.debug(`[offerService] Calling useOfferRequest URL: ${url}`);

    // 3) Realizar la llamada con axios
    const response = await axios.post(url, offerUrl, config);

    // 4) Devolver la respuesta JSON
    return response.data;
}

module.exports = {
    useCredentialOffer
};
