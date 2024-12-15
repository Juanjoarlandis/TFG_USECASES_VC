// src/utils/validation.js
import { z } from 'zod';

export const userSchema = z.object({
    firstName: z.string().nonempty(),
    familyName: z.string().nonempty(),
    documentNumber: z.string().nonempty(),
    currentAddress: z.array(z.string()).optional()
});
