// src/controllers/verificationController.js
const logger = require('../../logger');
const verificationService = require('../services/verificationService');

/**
 * verificationController.js
 * -------------------------
 * Maneja la verificación "manual" (con QR) y la parte de callbacks en manual o para el 
 * login automático ("statusCallbackWalletLogin/:stateId").
 */
module.exports = {
    // 1) Oferta de verificación (manual, 1 cred)
    async offerVerification(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification - start');
            const result = await verificationService.offerVerificationOneCred(req.body);
            // result => { stateId, verificationUrl }
            return res.status(200).json({
                verificationUrl: result.verificationUrl,
                state: result.stateId
            });
        } catch (error) {
            logger.error('[verificationController] Error en offerVerification:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    // 2) Oferta de verificación automática (3 creds)
    async offerVerification3CredsAutomatic(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification3CredsAutomatic - start');
            const result = await verificationService.offerVerification3CredsAutomatic();
            // result => { message, state, verificationUrl }
            return res.status(200).json(result);
        } catch (error) {
            logger.error('[verificationController] Error en offerVerification3CredsAutomatic:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    // 3) Oferta de verificación manual (3 creds)
    async offerVerification3Creds(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification3Creds - start');
            const result = await verificationService.offerVerification3CredsManual();
            // result => { stateId, verificationUrl }
            return res.status(200).json({
                verificationUrl: result.verificationUrl,
                state: result.stateId
            });
        } catch (error) {
            logger.error('[verificationController] Error en offerVerification3Creds:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    // 4) Callback para verificación Alta
    async statusCallbackAlta(req, res, next) {
        try {
            logger.debug('[verificationController] statusCallbackAlta - start');
            const { stateId } = req.params;
            const verificationData = req.body;
            await verificationService.handleStatusCallbackAlta(stateId, verificationData);
            return res.status(200).send('Status callback alta processed successfully');
        } catch (error) {
            logger.error('[verificationController] Error en statusCallbackAlta:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    // 5) Callback genérico (1 cred)
    async statusCallback(req, res, next) {
        try {
            logger.debug('[verificationController] statusCallback - start');
            const { stateId } = req.params;
            await verificationService.handleStatusCallbackGeneric(stateId, req.body);
            return res.status(200).json({ message: 'statusCallback processed successfully' });
        } catch (error) {
            logger.error('[verificationController] Error en statusCallback:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    // 6) Callback especial para login en wallet (walletLogin)
    async statusCallbackWalletLogin(req, res, next) {
        try {
            logger.debug('[verificationController] statusCallbackWalletLogin - start');
            const { stateId } = req.params;
            await verificationService.handleStatusCallbackWalletLogin(stateId, req.body);

            // Podríamos devolver algo más específico si necesitamos
            const updated = await verificationService.getVerificationSession(stateId);
            return res.status(200).json({
                message: 'statusCallbackWalletLogin processed',
                status: updated.status
            });
        } catch (error) {
            logger.error('[verificationController] Error en statusCallbackWalletLogin:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    // 7) GET /verification/session/:stateId
    async getVerificationSession(req, res, next) {
        try {
            logger.debug('[verificationController] getVerificationSession - start');
            const { stateId } = req.params;
            const sessionInfo = await verificationService.getVerificationSession(stateId);
            return res.status(200).json(sessionInfo);
        } catch (error) {
            logger.error('[verificationController] Error en getVerificationSession:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    }
};

function extractPresentationDefinition(resolvedPresentationRequest) {
    // Caso 1: es string con query params (ej: "openid4vp://...?presentation_definition=...")
    if (typeof resolvedPresentationRequest === 'string') {
        const urlObj = new URL(resolvedPresentationRequest);
        const presDef = urlObj.searchParams.get('presentation_definition');
        if (!presDef) {
            throw new Error('No presentation_definition in resolvedPresentationRequest');
        }
        return JSON.parse(decodeURIComponent(presDef));

        // Caso 2: es un objeto con la clave presentation_definition
    } else if (typeof resolvedPresentationRequest === 'object') {
        if (resolvedPresentationRequest.presentation_definition) {
            return resolvedPresentationRequest.presentation_definition;
        }
    }

    // Si nada de lo anterior, lanzamos error
    throw new Error('Could not extract presentationDefinition');
}
