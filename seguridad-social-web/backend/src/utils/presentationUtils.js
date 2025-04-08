// src/utils/presentationUtils.js

/**
 * Extrae la "presentationDefinition" de un string con query params
 * (por ejemplo: 'openid4vp://...?presentation_definition=...') o de un objeto
 * que tenga la propiedad `presentation_definition`.
 * @param {string|object} resolvedPresentationRequest - String con esquema openid4vp:// o un objeto
 * @returns {object} - El objeto presentationDefinition
 * @throws {Error} Si no se encuentra la definición
 */
function extractPresentationDefinition(resolvedPresentationRequest) {
  // Caso 1: es string con query params
  if (typeof resolvedPresentationRequest === "string") {
    const urlObj = new URL(resolvedPresentationRequest);
    const presDef = urlObj.searchParams.get("presentation_definition");
    if (!presDef) {
      throw new Error(
        "No presentation_definition in resolvedPresentationRequest",
      );
    }
    return JSON.parse(decodeURIComponent(presDef));
  }

  // Caso 2: es objeto con { presentation_definition }
  if (typeof resolvedPresentationRequest === "object") {
    if (resolvedPresentationRequest.presentation_definition) {
      return resolvedPresentationRequest.presentation_definition;
    }
  }

  throw new Error("Could not extract presentationDefinition");
}

module.exports = {
  extractPresentationDefinition,
};
