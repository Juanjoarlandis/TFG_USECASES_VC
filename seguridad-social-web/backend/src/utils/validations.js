// src/utils/validations.js
const User = require('../models/User');
const RevokedCredential = require('../models/RevokedCredential');
const jwt = require('jsonwebtoken');
const { sessions } = require('./sessionStore');

// Extraer datos del subject de la credencial
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


// Decodificar un JWT sin verificar, ya que se asume verificación externa
function decodeVC(jwtCredential) {
    return jwt.decode(jwtCredential);
}

async function isCredentialRevoked(credentialId) {
    const revoked = await RevokedCredential.findOne({ credentialId });
    return !!revoked;
}

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
            flow: flow  // Establecemos el flujo actual (manual si no se especifica otro)
        });
    } else {
        // Usuario ya existente. Actualizamos datos relevantes
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
