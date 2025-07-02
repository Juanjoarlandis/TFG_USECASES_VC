/**
 * @module routes/main
 * @description
 * Express router defining all HTTP endpoints for the Issuer Coordinator service,
 * including DID management, credential issuance, status callbacks, bitstring operations,
 * webhook handling, and miscellaneous utilities (ping, schema, easter egg).
 */

import express from 'express';
import {
  getscredx,
  upstatus,
  getcred,
  delcred,
  issue,
  ping,
  cr_did,
  didweb,
  schema,
  statusCallback,
  easterEgg,
  getIssuersDidsEndpoint,
} from '../controllers/maincontroller';
import { BitstringController } from '../controllers/BitstringController';
import { WebhookController } from '../controllers/WebhookController';

const router = express.Router();

/**
 * Health check endpoint.
 * @route GET /ping
 * @returns {string} 'pong' if the service is alive.
 */
router.get('/ping', ping);

/**
 * Creates DIDs for three issuers using ROLE_ID and SECRET_ID from environment.
 * @route GET /did
 * @returns {object} JSON with the three created issuer DIDs.
 */
router.get('/did', cr_did);

/**
 * Serves the DID Document for a given issuer.
 * @route GET /.well-known/did.json
 * @query {string} [issuer=issuer1] - Label of the issuer (issuer1|issuer2|issuer3).
 * @returns {object} DID Document JSON.
 */
router.get('/.well-known/did.json', didweb);

/**
 * Alternate endpoint for same DID Document.
 * @route GET /issuer/entity/did.json
 * @see {@link /.well-known/did.json}
 */
router.get('/issuer/entity/did.json', didweb);

/**
 * Provides a sample JSON schema for client-side validation.
 * @route GET /schema
 * @returns {object} JSON Schema Draft-07 example.
 */
router.get('/schema', schema);

/**
 * Retrieves all stored issuer DIDs.
 * @route GET /did/issuers
 * @returns {object} { issuers: string[][, warning: string] }
 */
router.get('/did/issuers', getIssuersDidsEndpoint);

/* ────────────────────────────────────────────────────── */
/*   Verifiable Credentials (VC) Issuance & Management   */
/* ────────────────────────────────────────────────────── */

/**
 * Issues a new verifiable credential of the specified type.
 * @route POST /credentials/issue
 * @body {string} type - Credential type ('identity', 'identity2', 'passport', 'work').
 * @returns {object} Issuance response (URL or signed VC).
 * @throws {400} Missing or unsupported `type` parameter.
 */
router.post('/credentials/issue', issue);

/**
 * Handles issuance status callbacks from the issuer service.
 * @route POST /statusCallback/:sessionId
 * @param {string} sessionId - Session identifier for the issuance flow.
 * @body {object} callback payload from issuer.
 * @returns {string} Success message.
 */
router.post('/statusCallback/:sessionId', statusCallback);

/**
 * Lists all issued credentials stored locally.
 * @route GET /credentials
 * @returns {object[]} Array of credential objects.
 */
router.get('/credentials', getcred);

/**
 * Retrieves a specific credential by its numeric ID.
 * @route GET /credentials/:id(\\d+)
 * @param {number} id - Numeric identifier of the credential.
 * @returns {object} Credential object.
 */
router.get('/credentials/:id(\\d+)', getscredx);

/**
 * Updates the status of a credential (e.g., 'issued', 'revoked').
 * @route POST /credentials/status
 * @body {string} credentialId - Full identifier of the credential.
 * @body {string} credentialStatus - New status value.
 * @returns {string} Confirmation message.
 */
router.post('/credentials/status', upstatus);

/**
 * Deletes a credential by its numeric ID from local storage.
 * @route DELETE /credentials/:id(\\d+)
 * @param {number} id - Numeric identifier of the credential.
 * @returns {string} Confirmation message.
 */
router.delete('/credentials/:id(\\d+)', delcred);

/**
 * Hidden easter egg endpoint returning a fun random message.
 * @route GET /.hidden-easter-egg
 * @returns {object} { message: string } random easter-egg text.
 */
router.get('/.hidden-easter-egg', easterEgg);

/* ────────────────────────────────────────────────────── */
/*    Bitstring Status List & Revocation Endpoints       */
/* ────────────────────────────────────────────────────── */

/**
 * Retrieves the compressed bitstring status list credential.
 * @route GET /bitstring-status-list
 * @query {string} [issuerDid] - DID of the issuer (default: 'did:example:issuerCoord').
 * @returns {object} BitstringStatusListCredential JSON.
 */
router.get(
  '/bitstring-status-list',
  BitstringController.getBitstringStatusList
);

/**
 * Revokes a credential by setting its bit to 1 in the status list.
 * @route POST /bitstring-status-list/revoke
 * @body {number} index - Index of the credential to revoke.
 * @returns {object} Confirmation message.
 */
router.post(
  '/bitstring-status-list/revoke',
  BitstringController.revokeIndex
);

/**
 * Reactivates (unrevokes) a credential by setting its bit to 0.
 * @route POST /bitstring-status-list/activate
 * @body {number} index - Index of the credential to reactivate.
 * @returns {object} Confirmation message.
 */
router.post(
  '/bitstring-status-list/activate',
  BitstringController.activateIndex
);

/* ────────────────────────────────────────────────────── */
/*        Webhook Endpoint for Revocation Policy         */
/* ────────────────────────────────────────────────────── */

/**
 * Webhook for checking credential revocation status.
 * Invoked by the OpenID4VC 'webhook' policy.
 * @route POST /webhook-verify
 * @body {object} vc - Verifiable Credential payload, must include credentialStatus.statusListIndex.
 * @returns {200|400} Active (bit=0) returns 200; revoked (bit=1) returns 400.
 */
router.post('/webhook-verify', WebhookController.verifyCredential);

export default router;
