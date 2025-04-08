// src/controllers/userController.js
const userService = require("../services/userService");
const logger = require("../../logger");

module.exports = {
  async getUserByDni(req, res, next) {
    try {
      const { dni } = req.params;
      if (!dni) {
        return res.status(400).json({ error: "Missing dni param" });
      }

      const user = await userService.findUserByDni(dni);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const userResponse = userService.buildUserResponse(user);
      return res.status(200).json({ user: userResponse });
    } catch (error) {
      logger.error("[userController] Error getUserByDni:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
