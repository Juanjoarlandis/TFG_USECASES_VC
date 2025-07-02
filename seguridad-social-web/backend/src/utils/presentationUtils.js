/**
 * @module src/utils/presentationUtils
 * @description Utilidades para extraer la definición de presentación (Presentation Definition)
 *              de una Presentation Request ya resuelta, ya sea expresada como URL con query params
 *              o como objeto con la propiedad `presentation_definition`.
 */

/**
 * Extrae el objeto Presentation Definition de una Presentation Request resuelta.
 *
 * @function extractPresentationDefinition
 * @param {string|object} resolvedPresentationRequest
 *   - Si es <code>string</code>, debe ser una URL de esquema <code>openid4vp://</code> que contenga
 *     el parámetro de query <code>presentation_definition</code> con el JSON codificado.
 *   - Si es <code>object</code>, debe tener la propiedad <code>presentation_definition</code> ya parseada.
 * @throws {Error} Si no se encuentra el parámetro <code>presentation_definition</code> o no logra extraerse.
 * @returns {object} El objeto Presentation Definition extraído.
 *
 * @example
 * // A partir de una URL:
 * const url = "openid4vp://...?presentation_definition=%7B%22id%22%3A%22123%22%7D";
 * const def = extractPresentationDefinition(url);
 * // def -> { id: "123" }
 *
 * @example
 * // A partir de un objeto resuelto:
 * const reqObj = { presentation_definition: { id: "abc", input_descriptors: [...] } };
 * const def = extractPresentationDefinition(reqObj);
 * // def -> { id: "abc", input_descriptors: [...] }
 */
function extractPresentationDefinition(resolvedPresentationRequest) {
  // Caso 1: recibe una cadena con query params
  if (typeof resolvedPresentationRequest === "string") {
    const urlObj = new URL(resolvedPresentationRequest);
    const presDef = urlObj.searchParams.get("presentation_definition");
    if (!presDef) {
      throw new Error(
        "No se encontró el parámetro 'presentation_definition' en la URL"
      );
    }
    return JSON.parse(decodeURIComponent(presDef));
  }

  // Caso 2: recibe un objeto con la propiedad presentation_definition
  if (
    typeof resolvedPresentationRequest === "object" &&
    resolvedPresentationRequest.presentation_definition
  ) {
    return resolvedPresentationRequest.presentation_definition;
  }

  // Si no cumple ninguno de los dos formatos, lanzamos error
  throw new Error(
    "No fue posible extraer 'presentation_definition' del input proporcionado"
  );
}

module.exports = {
  extractPresentationDefinition,
};
