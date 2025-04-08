const axios = require("axios");
const jwt = require("jsonwebtoken");
const logger = require("../../logger");

class HolderSessionManager {
  static instance;
  token = null;
  tokenExpiry = null;
  isRefreshing = false;
  refreshPromise = null;

  accountId = null;
  walletId = null;

  email = null;
  password = null;

  static getInstance() {
    if (!HolderSessionManager.instance) {
      HolderSessionManager.instance = new HolderSessionManager();
    }
    return HolderSessionManager.instance;
  }

  async loginHolderWithCredentials(email, password) {
    this.email = email;
    this.password = password;

    logger.debug(
      "HolderSessionManager: loginHolderWithCredentials - Datos de login:",
      { email },
    );

    const loginData = {
      type: "email",
      email: email,
      password: password,
    };

    const WALLET_COORD_URL = process.env.WALLET_COORD_URL;
    try {
      const response = await axios.post(
        `${WALLET_COORD_URL}/wallet-api/auth/login`,
        loginData,
        { headers: { "Content-Type": "application/json" } },
      );

      if (response.data && response.data.token) {
        this.token = response.data.token;
        this.setTokenExpiry(this.token);
        logger.info("User logged in successfully with WaltId.");
        await this.loadWalletInfo();
      } else {
        logger.error("No token received in login response.");
        throw new Error("No token in login response.");
      }
    } catch (error) {
      logger.error("Error loginHolderWithCredentials:", error.message);
      throw error;
    }
  }

  async loadWalletInfo() {
    const token = await this.getToken();
    const WALLET_COORD_URL =
      process.env.WALLET_COORD_URL || "http://localhost:7001";
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const response = await axios.get(
      `${WALLET_COORD_URL}/wallet-api/wallet/accounts/wallets`,
      config,
    );

    this.accountId = response.data.account;
    if (response.data.wallets && response.data.wallets.length > 0) {
      this.walletId = response.data.wallets[0].id;
    } else {
      throw new Error("No wallets found for this account.");
    }
    logger.info(
      `Loaded accountId: ${this.accountId}, walletId: ${this.walletId}`,
    );
  }

  setTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        this.tokenExpiry = decoded.exp * 1000;
      } else {
        logger.warn("Unable to determine expiry from token.");
        this.tokenExpiry = null;
      }
    } catch (error) {
      logger.error("Error parsing JWT:", error.message);
      this.tokenExpiry = null;
    }
  }

  async getToken() {
    if (!this.token) {
      logger.warn("No token available. User not logged in.");
      throw new Error("User not logged in.");
    }

    const currentTime = Date.now();
    const bufferTime = 60 * 1000;

    if (this.tokenExpiry && currentTime > this.tokenExpiry - bufferTime) {
      logger.warn("Token about to expire. Renewing token.");
      if (this.isRefreshing) {
        await this.refreshPromise;
        return this.token;
      }

      this.isRefreshing = true;
      this.refreshPromise = this.loginHolderWithCredentials(
        this.email,
        this.password,
      )
        .then(() => {
          this.isRefreshing = false;
        })
        .catch((error) => {
          this.isRefreshing = false;
          logger.error("Error renewing token:", error.message);
          throw error;
        });

      await this.refreshPromise;
      return this.token;
    }

    return this.token;
  }

  getAccountId() {
    return this.accountId;
  }

  getWalletId() {
    return this.walletId;
  }
}

module.exports = HolderSessionManager.getInstance();
