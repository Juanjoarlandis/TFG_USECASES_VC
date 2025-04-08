// src/controllers/presentationController.js
const logger = require("../../logger");
const {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
} = require("../services/presentationService");

module.exports = {
  async resolvePresentationRequest(req, res, next) {
    try {
      const { presentationRequestUrl } = req.body;
      if (!presentationRequestUrl) {
        return res
          .status(400)
          .json({ error: "Missing presentationRequestUrl" });
      }

      logger.debug(
        `[presentationController] resolvePresentationRequest => ${presentationRequestUrl}`,
      );
      const data = await resolvePresentationRequest(presentationRequestUrl);
      logger.debug(
        `[presentationController] data => ${JSON.stringify(data, null, 2)}`,
      );
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[presentationController] Error resolving presentation request:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  async matchCredentialsForPresentation(req, res, next) {
    try {
      const { presentationDefinition } = req.body;
      if (!presentationDefinition) {
        return res
          .status(400)
          .json({ error: "Missing presentationDefinition" });
      }

      logger.debug(
        `[presentationController] matchCredentialsForPresentation => ${JSON.stringify(presentationDefinition)}`,
      );
      const data = await matchCredentialsForPresentation(
        presentationDefinition,
      );
      logger.debug(
        `[presentationController] data => ${JSON.stringify(data, null, 2)}`,
      );
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[presentationController] Error matching credentials:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  async usePresentationRequest(req, res, next) {
    try {
      const { did, presentationRequest, selectedCredentials, disclosures } =
        req.body;
      if (!did || !presentationRequest || !selectedCredentials) {
        return res
          .status(400)
          .json({
            error: "Missing did, presentationRequest or selectedCredentials",
          });
      }

      logger.debug(
        `[presentationController] usePresentationRequest => did=${did}, creds=${JSON.stringify(selectedCredentials)}`,
      );
      const data = await usePresentationRequest(
        did,
        presentationRequest,
        selectedCredentials,
        disclosures,
      );
      logger.debug(
        `[presentationController] data => ${JSON.stringify(data, null, 2)}`,
      );
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[presentationController] Error using presentation request:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
