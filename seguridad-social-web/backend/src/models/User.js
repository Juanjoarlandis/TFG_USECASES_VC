/**
 * @module src/models/User
 * @description Modelo de Mongoose para almacenar la información de usuarios,
 *              incluyendo datos personales, credenciales de alta y tokens de refresco.
 *
 * @requires mongoose
 * @requires mongoose-encryption
 */

const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

/**
 * @typedef {import('mongoose').Document & {
 *   firstName?: string,
 *   familyName?: string,
 *   documentNumber: string,
 *   gender?: string,
 *   nationality?: string,
 *   birthDate?: Date,
 *   nss?: string,
 *   photo?: string,
 *   hasAltaCredential: boolean,
 *   altaIssueDate: Date|null,
 *   altaCredentialJti: string|null,
 *   altaCredentialData: Object|null,
 *   refreshTokens: string[],
 *   flow: string,
 *   createdAt: Date,
 *   updatedAt: Date
 * }} UserDocument
 */

/**
 * Esquema de Mongoose para la colección de usuarios.
 *
 * @type {import('mongoose').Schema<UserDocument>}
 */
const UserSchema = new mongoose.Schema(
  {
    /**
     * Nombre de pila del usuario.
     * @type {String}
     */
    firstName: String,

    /**
     * Apellido o apellidos del usuario.
     * @type {String}
     */
    familyName: String,

    /**
     * Número de documento de identidad (único).
     * @type {{ type: StringConstructor, unique: boolean }}
     */
    documentNumber: { type: String, unique: true },

    /**
     * Género del usuario.
     * @type {String}
     */
    gender: String,

    /**
     * Nacionalidad del usuario.
     * @type {String}
     */
    nationality: String,

    /**
     * Fecha de nacimiento del usuario.
     * @type {Date}
     */
    birthDate: Date,

    /**
     * Número de la Seguridad Social (encrypted).
     * @type {String}
     */
    nss: String,

    /**
     * URL o nombre de fichero de la foto de perfil.
     * @type {String}
     */
    photo: String,

    /**
     * Indica si el usuario ha obtenido la credencial de alta.
     * @type {{ type: BooleanConstructor, default: boolean }}
     */
    hasAltaCredential: { type: Boolean, default: false },

    /**
     * Fecha de emisión de la credencial de alta, o null si no se ha emitido.
     * @type {{ type: DateConstructor, default: null }}
     */
    altaIssueDate: { type: Date, default: null },

    /**
     * JTI (JWT ID) de la credencial de alta, o null si no aplica.
     * @type {{ type: StringConstructor, default: null }}
     */
    altaCredentialJti: { type: String, default: null },

    /**
     * Datos adicionales de la credencial de alta, o null.
     * @type {{ type: ObjectConstructor, default: null }}
     */
    altaCredentialData: { type: Object, default: null },

    /**
     * Lista de tokens de refresco válidos para el usuario.
     * @type {String[]}
     */
    refreshTokens: [String],

    /**
     * Modo de flujo de emisión de credenciales (e.g., 'manual', 'automatic').
     * @type {{ type: StringConstructor, default: string }}
     */
    flow: { type: String, default: "manual" },
  },
  {
    // Añade automáticamente campos createdAt y updatedAt
    timestamps: true,
  }
);

// Claves de encriptación sacadas de variables de entorno
const encKey = process.env.ENCRYPTION_KEY;
const sigKey = process.env.SIGNING_KEY;
const encKeyBuf = Buffer.from(encKey, "base64");
const sigKeyBuf = Buffer.from(sigKey, "base64");

/**
 * Plugin de encriptación de campos sensibles.
 * - <code>encryptionKey</code>: clave simétrica para cifrado.
 * - <code>signingKey</code>: clave para firma HMAC.
 * - <code>encryptedFields</code>: lista de campos a cifrar.
 *
 * @see {@link https://github.com/mongoose-encryption/mongoose-encryption|mongoose-encryption}
 */
UserSchema.plugin(encrypt, {
  encryptionKey: encKeyBuf,
  signingKey: sigKeyBuf,
  encryptedFields: ["nss"],
});

/**
 * Modelo de Mongoose para los documentos de usuario.
 *
 * @name User
 * @type {import('mongoose').Model<UserDocument>}
 */
module.exports = mongoose.model("User", UserSchema);
