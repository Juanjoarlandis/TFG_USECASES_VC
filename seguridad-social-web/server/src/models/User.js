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
    altaCredentialJti: { type: String, default: null },
    altaCredentialData: { type: Object, default: null }
}, { timestamps: true });

const encKey = process.env.ENCRYPTION_KEY;
const sigKey = process.env.SIGNING_KEY;

const encKeyBuf = Buffer.from(encKey, 'base64');
const sigKeyBuf = Buffer.from(sigKey, 'base64');

UserSchema.plugin(encrypt, {
    encryptionKey: encKeyBuf,
    signingKey: sigKeyBuf,
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
