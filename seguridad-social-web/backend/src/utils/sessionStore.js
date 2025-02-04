/**
 * @file sessionStore.js
 * @description Provides a simple in-memory session store for holding verification session data.
 * This store is used to maintain session information (such as verification status and metadata)
 * during the lifecycle of the application.
 * @module utils/sessionStore
 */

/**
 * In-memory session store object.
 * Keys are session identifiers, and values contain session data.
 *
 * @type {Object<string, any>}
 */
const sessions = {};

module.exports = { sessions };
