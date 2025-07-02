/**
 * @module src/utils/validations
 * @description Funciones de validación y extracción de datos para el procesamiento
 *              de credenciales verificables (VC) y gestión de usuarios:
 *              - Extracción de datos de credentialSubject
 *              - Decodificación de JWT de credenciales
 *              - Comprobación de revocación de credenciales
 *              - Creación o actualización de usuarios en MongoDB
 *              - Exposición de sesiones de Redis (importado como `sessions`)
 *
 * @requires ../models/User
 * @requires ../models/RevokedCredential
 * @requires jsonwebtoken
 * @requires ./sessionStore~sessions
 */

const User = require("../models/User");
const RevokedCredential = require("../models/RevokedCredential");
const jwt = require("jsonwebtoken");
const { sessions } = require("./sessionStore");

/**
 * Extrae datos de usuario desde el objeto `credentialSubject` decodificado de un VC.
 *
 * @function extractUserDataFromDecodedCredentialSubject
 * @param {object} cs - Objeto `credentialSubject` decodificado.
 * @param {object} [cs.dni] - Subobjeto con datos de identidad.
 * @param {string} [cs.dni.identifier] - Número de documento.
 * @param {string} [cs.dni.givenName] - Nombre de pila.
 * @param {string} [cs.dni.familyName] - Apellidos.
 * @param {string} [cs.dni.gender] - Género.
 * @param {string} [cs.dni.nationality] - Nacionalidad.
 * @param {string} [cs.dni.birthDate] - Fecha de nacimiento (ISO string).
 * @param {string} [cs.dni.nss] - Número de la Seguridad Social.
 * @param {string} [cs.dni.photo] - URL o Base64 de la foto.
 * @returns {object} Objeto con las propiedades:
 *                   { firstName, familyName, documentNumber,
 *                     gender, nationality, birthDate, nss, photo }
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
 * Decodifica sin verificar la firma un JWT de credencial.
 *
 * @function decodeVC
 * @param {string} jwtCredential - JWT de la credencial.
 * @returns {object|null} Payload decodificado del JWT, o `null` si no es válido.
 */
function decodeVC(jwtCredential) {
  return jwt.decode(jwtCredential);
}

/**
 * Comprueba si una credencial identificada por `credentialId` está en la lista de revocaciones.
 *
 * @async
 * @function isCredentialRevoked
 * @param {string} credentialId - Identificador (JTI o vc.id) de la credencial.
 * @returns {Promise<boolean>} `true` si la credencial está revocada, `false` en caso contrario.
 */
async function isCredentialRevoked(credentialId) {
  const revoked = await RevokedCredential.findOne({ credentialId });
  return !!revoked;
}

/**
 * Verifica si alguna de las credenciales en el array de JWT está revocada o es inválida.
 *
 * @async
 * @function checkCredentialsRevocation
 * @param {string[]} credentialsJwtArray - Array de JWTs de credenciales.
 * @returns {Promise<boolean>}
 *   - `true` si al menos una credencial no pudo decodificarse o está revocada.
 *   - `false` si todas las credenciales son válidas y no están revocadas.
 */
async function checkCredentialsRevocation(credentialsJwtArray) {
  for (let jwtCred of credentialsJwtArray) {
    const vcDecoded = decodeVC(jwtCred);
    if (!vcDecoded) {
      return true;
    }
    const credId =
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
 * Busca un usuario en MongoDB por su número de documento o lo crea/actualiza con los datos proporcionados.
 *
 * @async
 * @function findOrCreateOrUpdateUser
 * @param {object} userData - Datos de usuario extraídos de un VC:
 *                            { firstName, familyName, documentNumber,
 *                              gender, nationality, birthDate, nss, photo }.
 * @param {string} flow - Flujo de verificación: `"manual"` o `"automatic"`.
 * @returns {Promise<import('../models/User')>}
 *   Documento de usuario creado o actualizado con los datos y flujo especificados.
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
  checkCredentialsRevocation,
  findOrCreateOrUpdateUser,
  sessions,
};
