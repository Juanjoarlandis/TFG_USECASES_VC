const axios = require('axios');
const logger = require('../../logger');

async function getUserInfo(token) {
    logger.debug('walletService.getUserInfo - solicitando info del holder');
    const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
    const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`, config);
    logger.debug('walletService.getUserInfo - info recibida');
    return response.data;
}

async function listDIDs(token, walletId) {
    logger.debug(`walletService.listDIDs - Listando DIDs del wallet: ${walletId}`);
    const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
    const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/dids`, config);
    logger.debug('walletService.listDIDs - DIDs recibidos:', response.data);
    return response.data;
}

async function listCredentials(token, walletId) {
    logger.debug(`walletService.listCredentials - Listando credenciales del wallet: ${walletId}`);
    const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
    const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials?sortBy=addedOn`, config);
    logger.debug('walletService.listCredentials - credenciales recibidas:', response.data.map(c => c.id));
    return response.data;
}

module.exports = {
    getUserInfo,
    listDIDs,
    listCredentials
};
