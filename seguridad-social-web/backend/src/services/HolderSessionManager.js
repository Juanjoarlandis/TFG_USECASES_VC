/**
 * @module src/services/HolderSessionManager
 * @description Gestor de sesión singleton para el Holder que maneja:
 *              - Autenticación con email/password en Wallet API
 *              - Carga de información de cuenta y wallet
 *              - Renovación automática de token JWT antes de expirar
 *
 * @requires axios
 * @requires jsonwebtoken
 * @requires ../../logger
 */

const axios = require("axios");
const jwt = require("jsonwebtoken");
const logger = require("../../logger");

/**
 * Clase que gestiona la sesión del Holder en la Wallet API.
 * Implementa patrón singleton para compartir token, accountId y walletId.
 * 
 * @example
 * const session = require('./services/HolderSessionManager');
 * await session.loginHolderWithCredentials(email, password);
 * const token = await session.getToken();
 * const walletId = session.getWalletId();
 */
class HolderSessionManager {
  /** @type {string|null} JWT de acceso actual */
  token = null;
  /** @type {number|null} Timestamp de expiración en ms */
  tokenExpiry = null;
  /** @type {boolean} Indicador de renovación en curso */
  isRefreshing = false;
  /** @type {Promise<void>|null} Promesa de renovación del token */
  refreshPromise = null;

  /** @type {string|null} ID de cuenta obtenido tras login */
  accountId = null;
  /** @type {string|null} ID de wallet obtenido tras login */
  walletId = null;

  /** @type {string|null} Email usado para login */
  email = null;
  /** @type {string|null} Password usado para login */
  password = null;

  /** @type {HolderSessionManager} Instancia singleton */
  static instance;

  /**
   * Obtiene la instancia singleton de HolderSessionManager.
   *
   * @returns {HolderSessionManager} Instancia compartida.
   */
  static getInstance() {
    if (!HolderSessionManager.instance) {
      HolderSessionManager.instance = new HolderSessionManager();
    }
    return HolderSessionManager.instance;
  }

  /**
   * Autentica al Holder contra la Wallet API usando email y password.
   * Guarda token JWT y carga accountId y walletId.
   *
   * @async
   * @function loginHolderWithCredentials
   * @param {string} email    - Email del Holder.
   * @param {string} password - Contraseña del Holder.
   * @throws {Error} Si no se recibe token o falla la petición de login.
   */
  async loginHolderWithCredentials(email, password) {
    this.email = email;
    this.password = password;

    logger.debug(
      "HolderSessionManager: loginHolderWithCredentials - Datos de login:",
      { email }
    );

    const loginData = { type: "email", email, password };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/auth/login`;

    try {
      const response = await axios.post(url, loginData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data?.token) {
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

  /**
   * Carga el accountId y walletId asociados al Holder usando la Wallet API.
   *
   * @async
   * @function loadWalletInfo
   * @throws {Error} Si no se encuentran wallets en la cuenta.
   */
  async loadWalletInfo() {
    const token = await this.getToken();
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/accounts/wallets`;
    const config = {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    };

    const response = await axios.get(url, config);
    this.accountId = response.data.account;
    if (response.data.wallets?.length > 0) {
      this.walletId = response.data.wallets[0].id;
    } else {
      throw new Error("No wallets found for this account.");
    }
    logger.info(
      `Loaded accountId: ${this.accountId}, walletId: ${this.walletId}`
    );
  }

  /**
   * Decodifica el JWT y configura la propiedad tokenExpiry con el tiempo de expiración.
   *
   * @function setTokenExpiry
   * @param {string} token - JWT de acceso.
   */
  setTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      this.tokenExpiry = decoded?.exp ? decoded.exp * 1000 : null;
    } catch (error) {
      logger.error("Error parsing JWT:", error.message);
      this.tokenExpiry = null;
    }
  }

  /**
   * Obtiene el token JWT válido, renovándolo si está próximo a expirar.
   *
   * @async
   * @function getToken
   * @returns {Promise<string>} JWT de acceso.
   * @throws {Error} Si no existe token o falla la renovación.
   */
  async getToken() {
    if (!this.token) {
      logger.warn("No token available. User not logged in.");
      throw new Error("User not logged in.");
    }

    const now = Date.now();
    const buffer = 60 * 1000;
    if (this.tokenExpiry && now > this.tokenExpiry - buffer) {
      logger.warn("Token about to expire. Renewing token.");
      if (this.isRefreshing) {
        await this.refreshPromise;
        return this.token;
      }

      this.isRefreshing = true;
      this.refreshPromise = this.loginHolderWithCredentials(
        this.email,
        this.password
      )
        .then(() => {
          this.isRefreshing = false;
        })
        .catch((err) => {
          this.isRefreshing = false;
          logger.error("Error renewing token:", err.message);
          throw err;
        });

      await this.refreshPromise;
    }

    return this.token;
  }

  /**
   * Devuelve el accountId cargado tras el login.
   *
   * @function getAccountId
   * @returns {string|null} ID de cuenta del Holder.
   */
  getAccountId() {
    return this.accountId;
  }

  /**
   * Devuelve el walletId cargado tras el login.
   *
   * @function getWalletId
   * @returns {string|null} ID de wallet del Holder.
   */
  getWalletId() {
    return this.walletId;
  }
}

module.exports = HolderSessionManager.getInstance();
