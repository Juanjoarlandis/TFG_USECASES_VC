import os
import json

def build_directory_structure(root_dir, exclude_dirs=None, exclude_files=None):
    """
    Crea una estructura recursiva que representa el contenido de un directorio,
    excluyendo los directorios y archivos especificados.
    La estructura es un diccionario con el siguiente formato:
    {
        "name": <nombre_del_directorio>,
        "dirs": [ ... ],
        "files": [ ... ]
    }

    donde "dirs" es una lista de directorios, cada uno con la misma estructura,
    y "files" es una lista de nombres de archivos.
    """
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_files is None:
        exclude_files = []

    structure = {
        "name": os.path.basename(root_dir),
        "dirs": [],
        "files": []
    }

    # Listar el contenido del directorio
    try:
        with os.scandir(root_dir) as entries:
            for entry in entries:
                # Filtrar directorios y archivos excluidos
                if entry.is_dir() and entry.name not in exclude_dirs:
                    subdir_structure = build_directory_structure(
                        os.path.join(root_dir, entry.name),
                        exclude_dirs=exclude_dirs,
                        exclude_files=exclude_files
                    )
                    structure["dirs"].append(subdir_structure)
                elif entry.is_file() and entry.name not in exclude_files:
                    structure["files"].append(entry.name)
    except Exception as e:
        print(f"No se pudo acceder a {root_dir}: {e}")
    return structure

def gather_file_contents(
    source_dirs, 
    exclude_dirs=None, 
    exclude_files=None, 
    output_txt=None, 
    output_json=None, 
    output_structure_json=None
):
    """
    Recorre las carpetas fuente, excluye ciertas subcarpetas y archivos, y extrae el contenido de los archivos.
    Guarda el resultado en un archivo de texto plano o en un archivo JSON.
    Además, genera un archivo de estructura de directorios en JSON si se especifica.

    :param source_dirs: Lista de rutas a directorios fuente.
    :param exclude_dirs: Lista de nombres de directorios a excluir (ej: ["node_modules", "build", "dist"]).
    :param exclude_files: Lista de nombres de archivos a excluir (ej: ["package-lock.json", "logs.log"]).
    :param output_txt: Ruta del archivo .txt de salida (opcional).
    :param output_json: Ruta del archivo .json de salida (opcional).
    :param output_structure_json: Ruta del archivo .json que guardará la estructura de directorios (opcional).
    """
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_files is None:
        exclude_files = []

    file_contents = {}
    structures = []

    for source_dir in source_dirs:
        # Recolectamos el contenido de los archivos
        for root, dirs, files in os.walk(source_dir, topdown=True):
            # Filtrar los directorios que se excluyen
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file_name in files:
                # Si el archivo está en la lista de archivos a excluir, pasamos al siguiente
                if file_name in exclude_files:
                    continue

                file_path = os.path.join(root, file_name)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    # Crear una ruta relativa para identificar el archivo
                    relative_path = os.path.relpath(file_path, source_dir)
                    # Agregar el contenido al diccionario
                    file_contents[os.path.join(os.path.basename(source_dir), relative_path)] = content
                except Exception as e:
                    print(f"No se pudo leer el archivo {file_path}: {e}")

        # Recolectamos la estructura de este directorio fuente
        dir_structure = build_directory_structure(source_dir, exclude_dirs=exclude_dirs, exclude_files=exclude_files)
        structures.append(dir_structure)

    # Guardar en formato TXT
    if output_txt:
        with open(output_txt, 'w', encoding='utf-8') as f:
            for path, content in file_contents.items():
                f.write(f"--- {path} ---\n{content}\n\n")

    # Guardar en formato JSON con el contenido de archivos
    if output_json:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(file_contents, f, indent=4, ensure_ascii=False)
    
    # Guardar en formato JSON la estructura de directorios
    if output_structure_json:
        with open(output_structure_json, 'w', encoding='utf-8') as f:
            json.dump(structures, f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    # Ejemplo de uso
    source_dirs = [
        "/home/juanjo/Escritorio/TFG_USECASES_VC/seguridad-social-web/ISSUER_COORD"
    ]
    exclude_dirs = ["node_modules", "build", "dist", "data",".git", "waltid-identity","server"]
    exclude_files = ["package-lock.json", "logs.log","verifier_logs.log", "copiar.py", "App.css" , "Register.css", "Dashboard.css", "todo_junto.json", "todo_junto.txt"]  # Añade aquí los archivos a excluir

    # Opcional: define a dónde quieres guardar el contenido
    output_txt_path = "todo_junto.txt"
    output_json_path = "todo_junto.json"
    output_structure_json_path = "estructura_directorios.json"

    gather_file_contents(
        source_dirs,
        exclude_dirs=exclude_dirs,
        exclude_files=exclude_files,
        output_txt=output_txt_path,
        output_json=output_json_path,
        output_structure_json=output_structure_json_path
    )

    print("Proceso completado. Revisa los archivos 'todo_junto.txt', 'todo_junto.json' y 'estructura_directorios.json'.")
