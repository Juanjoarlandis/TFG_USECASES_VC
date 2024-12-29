// src/controllers/issuanceController.js
const logger = require('../../logger');
const issuanceService = require('../services/issuanceService');

module.exports = {
    async offerIssuance(req, res, next) {
        try {
            logger.debug('[offerIssuance] => BODY:', req.body);
            const { stateId } = req.body; // o const stateId = req.body.stateId
            if (!stateId) {
                return res.status(400).json({ error: 'Missing stateId' });
            }
            const result = await issuanceService.offerIssuance(stateId);
            return res.status(200).json(result);
        } catch (error) {
            logger.error('[offerIssuance] => Error:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    async issuanceStatusCallback(req, res, next) {
        try {
            logger.debug('[issuanceStatusCallback] => params:', req.params);
            const { stateId } = req.params;
            await issuanceService.handleIssuanceCallback(stateId);
            return res.status(200).json({ message: 'Issuance callback processed successfully' });
        } catch (error) {
            logger.error('[issuanceStatusCallback] => Error:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    async getIssuanceSessionStatus(req, res, next) {
        try {
            logger.debug('[getIssuanceSessionStatus] => params:', req.params);
            const { stateId } = req.params;
            const issuanceStatus = await issuanceService.getIssuanceSessionStatus(stateId);
            return res.status(200).json({ issuanceStatus });
        } catch (error) {
            logger.error('[getIssuanceSessionStatus] => Error:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    },

    async claimAltaCredential(req, res, next) {
        try {
            logger.debug('[claimAltaCredential] => BODY:', req.body);
            const { stateId } = req.body;
            if (!stateId) {
                return res.status(400).json({ error: 'Missing stateId' });
            }
            const result = await issuanceService.claimAltaCredential(stateId);
            return res.status(200).json(result);
        } catch (error) {
            logger.error('[claimAltaCredential] => Error:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    }
};
