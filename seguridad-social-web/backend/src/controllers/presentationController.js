/**
 * @file presentationController.js
 * @description Controller for handling presentation request operations.
 * Provides endpoints for resolving a presentation request, matching credentials for a presentation,
 * and using a presentation request.
 * @module controllers/presentationController
 */

const logger = require('../../logger');
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest
} = require('../services/presentationService');

module.exports = {
    /**
     * Resolves a presentation request.
     *
     * This function receives a presentationRequestUrl in the request body, validates its presence,
     * and calls the presentation service to resolve the presentation request.
     * On success, it returns the resolved data.
     *
     * @async
     * @function resolvePresentationRequest
     * @param {import('express').Request} req - Express request object with a `presentationRequestUrl` property in its body.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>} Sends a JSON response with the resolved presentation request data.
     */
    async resolvePresentationRequest(req, res) {
        try {
            const { presentationRequestUrl } = req.body;
            if (!presentationRequestUrl) {
                return res.status(400).json({ error: 'Missing presentationRequestUrl' });
            }

            logger.debug(`[presentationController] resolvePresentationRequest => ${presentationRequestUrl}`);
            const data = await resolvePresentationRequest(presentationRequestUrl);
            logger.debug(`[presentationController] data => ${JSON.stringify(data, null, 2)}`);
            res.status(200).json(data);
        } catch (error) {
            logger.error('Error resolving presentation request:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    /**
     * Matches credentials for a presentation.
     *
     * This function receives a presentationDefinition in the request body, validates its presence,
     * and calls the presentation service to match credentials that satisfy the definition.
     * On success, it returns the matched credentials data.
     *
     * @async
     * @function matchCredentialsForPresentation
     * @param {import('express').Request} req - Express request object with a `presentationDefinition` property in its body.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>} Sends a JSON response with the matched credentials.
     */
    async matchCredentialsForPresentation(req, res) {
        try {
            const { presentationDefinition } = req.body;
            if (!presentationDefinition) {
                return res.status(400).json({ error: 'Missing presentationDefinition' });
            }

            logger.debug(
                `[presentationController] matchCredentialsForPresentation => ${JSON.stringify(presentationDefinition, null, 2)}`
            );
            const data = await matchCredentialsForPresentation(presentationDefinition);
            logger.debug(`[presentationController] data => ${JSON.stringify(data, null, 2)}`);
            res.status(200).json(data);
        } catch (error) {
            logger.error('Error matching credentials:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    /**
     * Uses a presentation request.
     *
     * This function receives the DID, presentationRequest, selectedCredentials, and optional disclosures
     * in the request body. It validates that the required fields are present, then calls the presentation service
     * to use the presentation request with the provided parameters.
     * On success, it returns the resulting data.
     *
     * @async
     * @function usePresentationRequest
     * @param {import('express').Request} req - Express request object with `did`, `presentationRequest`, `selectedCredentials`, and optional `disclosures` in its body.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>} Sends a JSON response with the result of using the presentation request.
     */
    async usePresentationRequest(req, res) {
        try {
            const { did, presentationRequest, selectedCredentials, disclosures } = req.body;
            if (!did || !presentationRequest || !selectedCredentials) {
                return res.status(400).json({ error: 'Missing did, presentationRequest or selectedCredentials' });
            }

            logger.debug(
                `[presentationController] usePresentationRequest => did=${did}, creds=${JSON.stringify(selectedCredentials)}`
            );
            const data = await usePresentationRequest(did, presentationRequest, selectedCredentials, disclosures);
            logger.debug(`[presentationController] data => ${JSON.stringify(data, null, 2)}`);
            res.status(200).json(data);
        } catch (error) {
            logger.error('Error using presentation request:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
