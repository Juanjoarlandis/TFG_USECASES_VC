"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuerCoordError = exports.CredentialIDError = exports.NotFoundError = exports.ForbiddenError = exports.WrongFormatError = exports.MissingParameterError = void 0;
class MissingParameterError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MissingParameterError';
        this.code = 400;
        this.message = message;
    }
}
exports.MissingParameterError = MissingParameterError;
class WrongFormatError extends Error {
    constructor(message) {
        super(message);
        this.name = 'WrongFormatError';
        this.code = 400;
    }
}
exports.WrongFormatError = WrongFormatError;
class ForbiddenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
        this.code = 403;
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.code = 404;
    }
}
exports.NotFoundError = NotFoundError;
class CredentialIDError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CredentialIDError';
        this.code = 404;
    }
}
exports.CredentialIDError = CredentialIDError;
class IssuerCoordError extends Error {
    constructor(message) {
        super(message);
        this.name = 'IssuerCoordError';
        this.code = 500;
    }
}
exports.IssuerCoordError = IssuerCoordError;
