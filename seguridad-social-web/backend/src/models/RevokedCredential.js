const mongoose = require("mongoose");

const RevokedCredentialSchema = new mongoose.Schema({
  credentialId: { type: String, unique: true, required: true },
});

module.exports = mongoose.model("RevokedCredential", RevokedCredentialSchema);
