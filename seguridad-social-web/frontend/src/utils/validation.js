/**
 * @module src/utils/validation
 * @description
 * Validation utilities using Zod schemas to enforce input correctness.
 * Currently defines a schema for user data.
 *
 * @requires zod~z
 */

import { z } from 'zod';

/**
 * User data schema.
 *
 * Validates that the user object contains required personal details:
 * - <code>firstName</code>: non-empty string
 * - <code>familyName</code>: non-empty string
 * - <code>documentNumber</code>: non-empty string
 * - <code>currentAddress</code>: optional array of strings (e.g. lines of address)
 *
 * @typedef {object} UserInput
 * @property {string} firstName       - User's given name; must not be empty.
 * @property {string} familyName      - User's family name; must not be empty.
 * @property {string} documentNumber  - Official document identifier (e.g. DNI); must not be empty.
 * @property {string[]} [currentAddress] - Optional array of address lines.
 */
export const userSchema = z.object({
    /** User's given name; required, non-empty string. */
    firstName: z.string().nonempty(),

    /** User's family name; required, non-empty string. */
    familyName: z.string().nonempty(),

    /** Official document identifier; required, non-empty string. */
    documentNumber: z.string().nonempty(),

    /** Optional array of address lines for the user's current address. */
    currentAddress: z.array(z.string()).optional()
});
