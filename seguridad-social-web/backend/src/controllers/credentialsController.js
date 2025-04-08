// src/controllers/credentialsController.js
const logger = require("../../logger");
const credentialsService = require("../services/credentialsService");

module.exports = {
  async listCredentials(_req, res, next) {
    try {
      const creds = await credentialsService.listCredentials();
      return res.status(200).json(creds);
    } catch (error) {
      logger.error(
        "[credentialsController] Error listing credentials:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  async getCredentialById(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const credential =
        await credentialsService.getCredentialById(credentialId);
      return res.status(200).json(credential);
    } catch (error) {
      logger.error(
        "[credentialsController] Error getting credential by ID:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  async deleteCredential(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      await credentialsService.deleteCredential(credentialId);
      return res.status(200).json("Credential deleted successfully");
    } catch (error) {
      logger.error(
        "[credentialsController] Error deleting credential:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  async acceptCredential(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const result = await credentialsService.acceptCredential(credentialId);
      return res.status(200).json(result);
    } catch (error) {
      logger.error(
        "[credentialsController] Error accepting credential:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  async rejectCredential(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const result = await credentialsService.rejectCredential(credentialId);
      return res.status(200).json(result);
    } catch (error) {
      logger.error(
        "[credentialsController] Error rejecting credential:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  async getCredentialStatus(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const statusObj =
        await credentialsService.getCredentialStatus(credentialId);
      return res.status(200).json(statusObj);
    } catch (error) {
      logger.error(
        "[credentialsController] Error getting credential status:",
        error.message,
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
