// src/models/User.js
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const UserSchema = new mongoose.Schema({
    firstName: String,
    familyName: String,
    documentNumber: { type: String, unique: true },
    currentAddress: [String],

    gender: String,
    nationality: String,
    birthDate: Date,
    nss: String,
    personalNumber: String,
    dniIssueDate: Date,
    canNumber: String,
    sex: String,
    placeOfBirth: {
        locality: String,
        province: String,
        country: String
    },
    ascendants: [
        {
            givenName: String,
            familyName: String
        }
    ],
    hasAltaCredential: { type: Boolean, default: false },
    altaIssueDate: { type: Date, default: null },
    altaCredentialJti: { type: String, default: null }
}, { timestamps: true });

// Claves desde variables de entorno
// ENCRYPTION_KEY y SIGNING_KEY deben ser claves en base64
const encKey = process.env.ENCRYPTION_KEY; // Por ejemplo una clave base64 de 32 bytes
const sigKey = process.env.SIGNING_KEY;    // Por ejemplo una clave base64 de 64 bytes

// Convertir a Buffer
const encKeyBuf = Buffer.from(encKey, 'base64');
const sigKeyBuf = Buffer.from(sigKey, 'base64');

// Configurar plugin de cifrado
UserSchema.plugin(encrypt, {
    encryptionKey: encKeyBuf,
    signingKey: sigKeyBuf,
    // Campos a cifrar
    encryptedFields: [
        'nss',
        'personalNumber',
        'dniIssueDate',
        'canNumber',
        'sex',
        'placeOfBirth',
        'ascendants'
    ]
});

module.exports = mongoose.model('User', UserSchema);
