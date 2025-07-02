/**
 * @module src/utils/validations
 * @description Funciones auxiliares de validación y extracción de datos para:
 *              - Decodificación de Presentation Credentials (VC)
 *              - Extracción de datos de usuario del credentialSubject
 *              - Comprobación de revocación de credenciales
 *              - Creación, búsqueda y actualización de usuarios en MongoDB
 *
 * @requires ../models/User
 * @requires ../models/RevokedCredential
 * @requires jsonwebtoken
 * @requires ../utils/sessionStore~sessions
 */

const User = require("../models/User");
const RevokedCredential = require("../models/RevokedCredential");
const jwt = require("jsonwebtoken");
const { sessions } = require("./sessionStore");

/**
 * Extrae los datos personales de un objeto credentialSubject decodificado.
 *
 * @function extractUserDataFromDecodedCredentialSubject
 * @param {object} cs - El objeto credentialSubject decodificado de un VC.
 * @param {object} [cs.dni] - Subobjeto con información de DNI y datos personales.
 * @param {string} [cs.dni.identifier] - Número de documento (DNI).
 * @param {string} [cs.dni.givenName] - Nombre de pila.
 * @param {string} [cs.dni.familyName] - Apellidos.
 * @param {string} [cs.dni.gender] - Género.
 * @param {string} [cs.dni.nationality] - Nacionalidad.
 * @param {string} [cs.dni.nss] - Número de la Seguridad Social.
 * @param {string} [cs.dni.birthDate] - Fecha de nacimiento (ISO string).
 * @param {string} [cs.dni.photo] - URL o base64 de la foto.
 * @returns {object} Datos de usuario con propiedades:
 *                   { firstName, familyName, documentNumber, gender,
 *                     nationality, birthDate, nss, photo }
 */
function extractUserDataFromDecodedCredentialSubject(cs) {
  let firstName = "";
  let familyName = "";
  let documentNumber = "";
  let gender = "";
  let nationality = "";
  let birthDate = null;
  let nss = "";
  let photo = "";

  if (cs.dni) {
    documentNumber = cs.dni.identifier || "";
    firstName = cs.dni.givenName || "";
    familyName = cs.dni.familyName || "";
    gender = cs.dni.gender || "";
    nationality = cs.dni.nationality || "";
    nss = cs.dni.nss || "";
    if (cs.dni.birthDate) {
      birthDate = new Date(cs.dni.birthDate);
    }
    photo = cs.dni.photo || "";
  }

  return {
    firstName,
    familyName,
    documentNumber,
    gender,
    nationality,
    birthDate,
    nss,
    photo,
  };
}

/**
 * Decodifica un JWT de credencial sin verificar la firma.
 *
 * @function decodeVC
 * @param {string} jwtCredential - JWT de la credencial a decodificar.
 * @returns {object|null} Payload decodificado, o null si no pudo decodificarse.
 */
function decodeVC(jwtCredential) {
  return jwt.decode(jwtCredential);
}

/**
 * Consulta si una credencial (por su ID o JTI) está en la lista negra de revocaciones.
 *
 * @async
 * @function isCredentialRevoked
 * @param {string} credentialId - Identificador (JTI o vc.id) de la credencial.
 * @returns {Promise<boolean>} `true` si la credencial ha sido revocada, `false` en caso contrario.
 */
async function isCredentialRevoked(credentialId) {
  const revoked = await RevokedCredential.findOne({ credentialId });
  return !!revoked;
}

/**
 * Comprueba si alguna de las credenciales en el array de JWT está revocada.
 *
 * @async
 * @function checkCredentialsRevocation
 * @param {string[]} credentialsJwtArray - Array de JWTs de credenciales a comprobar.
 * @returns {Promise<boolean>} `true` si al menos una credencial está revocada o inválida; `false` si todas son válidas.
 */
async function checkCredentialsRevocation(credentialsJwtArray) {
  for (let jwtCred of credentialsJwtArray) {
    const vcDecoded = decodeVC(jwtCred);
    if (!vcDecoded) {
      return true;
    }
    let credId =
      vcDecoded.jti ||
      (vcDecoded.vc && vcDecoded.vc.id ? vcDecoded.vc.id : null);
    if (!credId) {
      return true;
    }
    if (await isCredentialRevoked(credId)) {
      return true;
    }
  }
  return false;
}

/**
 * Busca un usuario por DNI en MongoDB, o lo crea/actualiza con los datos proporcionados.
 *
 * @async
 * @function findOrCreateOrUpdateUser
 * @param {object} userData - Datos extraídos de la credencial: { firstName, familyName, documentNumber, gender, nationality, birthDate, nss, photo }.
 * @param {string} flow     - Flujo de verificación: `'manual'` o `'automatic'`.
 * @returns {Promise<import('../models/User')>} Documento de usuario creado o actualizado.
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
      photo: userData.photo || "",
      hasAltaCredential: false,
      altaIssueDate: null,
      altaCredentialJti: null,
      altaCredentialData: null,
      flow: flow,
    });
  } else {
    user.firstName = userData.firstName;
    user.familyName = userData.familyName;
    user.gender = userData.gender;
    user.nationality = userData.nationality;
    user.birthDate = userData.birthDate;
    user.nss = userData.nss;
    user.photo = userData.photo || user.photo;
    user.flow = flow === "automatic" ? "automatic" : "manual";
  }
  await user.save();
  return user;
}

module.exports = {
  extractUserDataFromDecodedCredentialSubject,
  decodeVC,
  isCredentialRevoked,
  checkCredentialsRevocation,
  findOrCreateOrUpdateUser,
  sessions,
};
