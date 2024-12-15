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
    let currentAddress = [];

    let gender = '';
    let nationality = '';
    let birthDate = null;
    let nss = '';

    let personalNumber = '';
    let laserEngravedSerial = '';
    let dniIssueDate = null;
    let canNumber = '';
    let sex = '';

    let placeOfBirth = {};
    let ascendants = [];
    let issuingTeamCode = '';

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

        if (cs.dni.frontSide) {
            personalNumber = cs.dni.frontSide.personalNumber || '';
            laserEngravedSerial = cs.dni.frontSide.laserEngravedSerial || '';
            canNumber = cs.dni.frontSide.canNumber || '';
            sex = cs.dni.frontSide.sex || '';
            if (cs.dni.frontSide.issueDate) {
                dniIssueDate = new Date(cs.dni.frontSide.issueDate);
            }
        }

        if (cs.dni.backSide) {
            if (cs.dni.backSide.address) {
                const addr = cs.dni.backSide.address;
                currentAddress = [
                    addr.street || '',
                    addr.locality || '',
                    addr.province || '',
                    addr.country || '',
                    addr.postalCode || ''
                ].filter(Boolean);
            }
            if (cs.dni.backSide.placeOfBirth) {
                placeOfBirth = {
                    locality: cs.dni.backSide.placeOfBirth.locality || '',
                    province: cs.dni.backSide.placeOfBirth.province || '',
                    country: cs.dni.backSide.placeOfBirth.country || ''
                };
            }
            if (Array.isArray(cs.dni.backSide.ascendants)) {
                ascendants = cs.dni.backSide.ascendants.map(a => ({
                    givenName: a.givenName || '',
                    familyName: a.familyName || ''
                }));
            }
            issuingTeamCode = cs.dni.backSide.issuingTeamCode || '';
        }
    }

    return {
        firstName,
        familyName,
        documentNumber,
        currentAddress,
        gender,
        nationality,
        birthDate,
        nss,
        personalNumber,
        laserEngravedSerial,
        dniIssueDate,
        canNumber,
        sex,
        placeOfBirth,
        ascendants,
        issuingTeamCode
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

async function findOrCreateOrUpdateUser(userData) {
    let user = await User.findOne({ documentNumber: userData.documentNumber });
    if (!user) {
        user = new User({
            firstName: userData.firstName,
            familyName: userData.familyName,
            documentNumber: userData.documentNumber,
            currentAddress: userData.currentAddress || [],
            gender: userData.gender,
            nationality: userData.nationality,
            birthDate: userData.birthDate,
            nss: userData.nss,
            personalNumber: userData.personalNumber,
            laserEngravedSerial: userData.laserEngravedSerial,
            dniIssueDate: userData.dniIssueDate,
            canNumber: userData.canNumber,
            sex: userData.sex,
            placeOfBirth: userData.placeOfBirth,
            ascendants: userData.ascendants,
            issuingTeamCode: userData.issuingTeamCode,
            hasAltaCredential: false,
            altaIssueDate: null,
            altaCredentialJti: null,
            altaCredentialData: null
        });
    } else {
        user.firstName = userData.firstName;
        user.familyName = userData.familyName;
        user.currentAddress = userData.currentAddress || user.currentAddress;
        user.gender = userData.gender;
        user.nationality = userData.nationality;
        user.birthDate = userData.birthDate;
        user.nss = userData.nss;
        user.personalNumber = userData.personalNumber;
        user.laserEngravedSerial = userData.laserEngravedSerial;
        user.dniIssueDate = userData.dniIssueDate;
        user.canNumber = userData.canNumber;
        user.sex = userData.sex;
        user.placeOfBirth = userData.placeOfBirth;
        user.ascendants = userData.ascendants;
        user.issuingTeamCode = userData.issuingTeamCode;
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
