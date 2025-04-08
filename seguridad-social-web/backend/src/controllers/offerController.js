// src/controllers/offerController.js
const offerService = require("../services/offerService");
const logger = require("../../logger");

module.exports = {
  async useCredentialOffer(req, res, next) {
    try {
      const { offerUrl, did } = req.body;
      logger.debug("[offerController] useCredentialOffer - body:", req.body);

      if (!offerUrl || !did) {
        return res.status(400).json({ error: "Missing offerUrl or did" });
      }

      const data = await offerService.useCredentialOffer(offerUrl, did);
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[offerController] Error using credential offer:",
        error.message,
      );

      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
