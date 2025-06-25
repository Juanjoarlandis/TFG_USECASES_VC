/**
 * Alias de compatibilidad: muchos tests importaban "../test-utils".
 * Exportamos el mismo API pero apuntando a customRender.
 */

export * from './testUtils';
import { customRender } from './testUtils';
export const render = customRender;
