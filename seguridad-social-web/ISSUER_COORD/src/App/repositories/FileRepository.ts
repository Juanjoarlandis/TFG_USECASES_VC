import fs from 'fs';
import path from 'path';
import { NotFoundError } from '../errors/errors';
import logger from '../../logger';

/**
 * Repositorio para operar sobre el sistema de ficheros,
 * permitiendo leer, escribir, listar y borrar ficheros JSON.
 */
export class FileRepository {

/**
 * Lee un fichero JSON y lo parsea a objeto.
 * @param filePath Ruta completa del fichero.
 * @returns El objeto leído.
 * @throws NotFoundError si no se encuentra el fichero.
 */
  public readJSON(filePath: string): any {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      throw new NotFoundError(`${filePath} has not been found`);
    }
  }

  /**
 * Escribe un objeto como JSON en el fichero especificado.
 * Sobrescribe el contenido existente.
 * @param filePath Ruta del fichero.
 * @param data Datos a escribir.
 */
  public writeJSON(filePath: string, data: any): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.debug(`File ${filePath} written successfully`);
  }

  /**
 * Elimina un fichero del sistema de ficheros.
 * @param filePath Ruta del fichero a eliminar.
 * @throws NotFoundError si no se encuentra el fichero.
 */
  public deleteFile(filePath: string): void {
    try {
      fs.unlinkSync(filePath);
      logger.debug(`File ${filePath} deleted successfully`);
    } catch (err) {
      throw new NotFoundError(`${filePath} has not been found`);
    }
  }

  /**
 * Lista todos los ficheros en un directorio dado.
 * @param dirPath Ruta del directorio.
 * @returns Array de nombres de ficheros.
 * @throws NotFoundError si no se encuentra el directorio.
 */
  public listFiles(dirPath: string): string[] {
    try {
      return fs.readdirSync(dirPath);
    } catch (err) {
      throw new NotFoundError(`Directory ${dirPath} not found`);
    }
  }

  /**
 * Verifica si existe el directorio, y si no, lo crea recursivamente.
 * @param dirPath Ruta del directorio.
 */
  public ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Directory created: ${dirPath}`);
    }
  }

  /**
 * Comprueba si un fichero existe en el sistema.
 * @param filePath Ruta del fichero.
 * @returns true si existe, false si no.
 */
  public fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
