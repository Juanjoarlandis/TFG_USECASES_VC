const jwt = require('jsonwebtoken');

function verifyJwtToken(token, publicKey) {
    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['Ed25519'] });
        return decoded;
    } catch (err) {
        throw new Error('Token inválido o firma no verificada');
    }
}

module.exports = { verifyJwtToken };
