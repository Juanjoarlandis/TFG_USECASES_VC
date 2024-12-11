export class MissingParameterError extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.name = 'MissingParameterError';
    this.code = 400;
    this.message = message; 
  }
}

export class WrongFormatError extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.name = 'WrongFormatError';
    this.code = 400;
  }
}

export class ForbiddenError extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
    this.code = 403;
  }
}

export class NotFoundError extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.code = 404;
  }
}

export class CredentialIDError extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.name = 'CredentialIDError';
    this.code = 404;
  }
}

export class IssuerCoordError extends Error {
  code: number;

  constructor(message: string) {
    super(message);
    this.name = 'IssuerCoordError';
    this.code = 500;
  }
}
