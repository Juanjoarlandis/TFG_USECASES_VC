/**
 * @file validations.js
 * @description Provides utility functions for extracting user data from credentials,
 * checking credential revocation, and creating or updating user records.
 * Also exports an in-memory sessions store.
 * @module utils/validations
 */

const User = require('../models/User');
const RevokedCredential = require('../models/RevokedCredential');
const jwt = require('jsonwebtoken');
const { sessions } = require('./sessionStore');

/**
 * Extracts user data from the decoded credential subject.
 *
 * This function extracts key user information from a credential's subject.
 * It expects the credential subject to have a "dni" property with specific fields.
 *
 * @function extractUserDataFromDecodedCredentialSubject
 * @param {Object} cs - The credential subject.
 * @returns {Object} An object containing extracted user data:
 *                   firstName, familyName, documentNumber, gender, nationality, birthDate, nss, and photo.
 */
function extractUserDataFromDecodedCredentialSubject(cs) {
    let firstName = '';
    let familyName = '';
    let documentNumber = '';
    let gender = '';
    let nationality = '';
    let birthDate = null;
    let nss = '';
    let photo = '';

    if (cs.dni) {
        documentNumber = cs.dni.identifier || '';
        firstName = cs.dni.givenName || '';
        familyName = cs.dni.familyName || '';
        gender = cs.dni.gender || '';
        nationality = cs.dni.nationality || '';
        nss = cs.dni.nss || '';
        if (cs.dni.birthDate) {
            birthDate = new Date(cs.dni.birthDate);
        }
        photo = cs.dni.photo || '';
    }

    return {
        firstName,
        familyName,
        documentNumber,
        gender,
        nationality,
        birthDate,
        nss,
        photo
    };
}

/**
 * Decodes a JWT credential without verifying its signature.
 *
 * This function is used to decode a JWT that is assumed to have been verified externally.
 *
 * @function decodeVC
 * @param {string} jwtCredential - The JWT credential to decode.
 * @returns {Object|null} The decoded JWT payload, or null if decoding fails.
 */
function decodeVC(jwtCredential) {
    return jwt.decode(jwtCredential);
}

/**
 * Checks if a credential is revoked by querying the RevokedCredential model.
 *
 * @async
 * @function isCredentialRevoked
 * @param {string} credentialId - The credential identifier.
 * @returns {Promise<boolean>} True if the credential is revoked; otherwise, false.
 */
async function isCredentialRevoked(credentialId) {
    const revoked = await RevokedCredential.findOne({ credentialId });
    return !!revoked;
}

/**
 * Checks if any credential in the provided array is revoked.
 *
 * Iterates through an array of credential JWTs, decodes each, extracts the credential identifier,
 * and checks if it exists in the revoked credentials store.
 *
 * @async
 * @function checkCredentialsRevocation
 * @param {Array<string>} credentialsJwtArray - Array of credential JWT strings.
 * @returns {Promise<boolean>} True if any credential is revoked or invalid; otherwise, false.
 */
async function checkCredentialsRevocation(credentialsJwtArray) {
    for (let jwtCred of credentialsJwtArray) {
        const vcDecoded = decodeVC(jwtCred);
        if (!vcDecoded) {
            return true;
        }
        let credId = vcDecoded.jti || (vcDecoded.vc && vcDecoded.vc.id ? vcDecoded.vc.id : null);
        if (!credId) {
            return true;
        }
        const revoked = await isCredentialRevoked(credId);
        if (revoked) return true;
    }
    return false;
}

/**
 * Finds a user by document number or creates a new user if one does not exist.
 * Updates the user's data with the provided information and sets the flow.
 *
 * @async
 * @function findOrCreateOrUpdateUser
 * @param {Object} userData - An object containing user data (e.g., firstName, familyName, documentNumber, etc.).
 * @param {string} flow - The current flow type ('manual' or 'automatic').
 * @returns {Promise<Object>} The created or updated user document.
 */
async function findOrCreateOrUpdateUser(userData, flow) {
    let user = await User.findOne({ documentNumber: userData.documentNumber });
    if (!user) {
        user = new User({
            firstName: userData.firstName,
            familyName: userData.familyName,
            documentNumber: userData.documentNumber,
            gender: userData.gender,
            nationality: userData.nationality,
            birthDate: userData.birthDate,
            nss: userData.nss,
            photo: userData.photo || '',
            hasAltaCredential: false,
            altaIssueDate: null,
            altaCredentialJti: null,
            altaCredentialData: null,
            flow: flow  // Set the current flow (default is 'manual')
        });
    } else {
        // Update existing user with relevant data.
        user.firstName = userData.firstName;
        user.familyName = userData.familyName;
        user.gender = userData.gender;
        user.nationality = userData.nationality;
        user.birthDate = userData.birthDate;
        user.nss = userData.nss;
        user.photo = userData.photo || user.photo;

        if (flow === 'manual') {
            user.flow = 'manual';
        } else if (flow === 'automatic') {
            user.flow = 'automatic';
        }
    }
    await user.save();
    return user;
}

module.exports = {
    extractUserDataFromDecodedCredentialSubject,
    checkCredentialsRevocation,
    findOrCreateOrUpdateUser,
    sessions
};
