// src/controllers/presentationController.js
const logger = require('../../logger');
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest
} = require('../services/presentationService');

module.exports = {
    async resolvePresentationRequest(req, res) {
        try {
            const { presentationRequestUrl } = req.body;
            if (!presentationRequestUrl) return res.status(400).json({ error: 'Missing presentationRequestUrl' });

            logger.debug(`[presentationController] resolvePresentationRequest => ${presentationRequestUrl}`);
            const data = await resolvePresentationRequest(presentationRequestUrl);
            logger.debug(`[presentationController] data => ${JSON.stringify(data, null, 2)}`);
            res.status(200).json(data);
        } catch (error) {
            logger.error('Error resolving presentation request:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    async matchCredentialsForPresentation(req, res) {
        try {
            const { presentationDefinition } = req.body;
            if (!presentationDefinition) return res.status(400).json({ error: 'Missing presentationDefinition' });

            logger.debug(`[presentationController] matchCredentialsForPresentation => ${JSON.stringify(presentationDefinition, null, 2)}`);
            const data = await matchCredentialsForPresentation(presentationDefinition);
            logger.debug(`[presentationController] data => ${JSON.stringify(data, null, 2)}`);
            res.status(200).json(data);
        } catch (error) {
            logger.error('Error matching credentials:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    async usePresentationRequest(req, res) {
        try {
            const { did, presentationRequest, selectedCredentials, disclosures } = req.body;
            if (!did || !presentationRequest || !selectedCredentials) {
                return res.status(400).json({ error: 'Missing did, presentationRequest or selectedCredentials' });
            }

            logger.debug(`[presentationController] usePresentationRequest => did=${did}, creds=${JSON.stringify(selectedCredentials)}`);
            const data = await usePresentationRequest(did, presentationRequest, selectedCredentials, disclosures);
            logger.debug(`[presentationController] data => ${JSON.stringify(data, null, 2)}`);
            res.status(200).json(data);
        } catch (error) {
            logger.error('Error using presentation request:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
