import os
import json

def gather_file_contents(source_dirs, exclude_dirs=None, exclude_files=None, output_txt=None, output_json=None):
    """
    Recorre las carpetas fuente, excluye ciertas subcarpetas y archivos, y extrae el contenido de los archivos.
    Guarda el resultado en un archivo de texto plano o en un archivo JSON.
    
    :param source_dirs: Lista de rutas a directorios fuente.
    :param exclude_dirs: Lista de nombres de directorios a excluir (ej: ["node_modules", "build", "dist"]).
    :param exclude_files: Lista de nombres de archivos a excluir (ej: ["package-lock.json", "logs.log"]).
    :param output_txt: Ruta del archivo .txt de salida (opcional).
    :param output_json: Ruta del archivo .json de salida (opcional).
    """
    if exclude_dirs is None:
        exclude_dirs = []
    if exclude_files is None:
        exclude_files = []

    file_contents = {}

    for source_dir in source_dirs:
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

    # Guardar en formato TXT
    if output_txt:
        with open(output_txt, 'w', encoding='utf-8') as f:
            for path, content in file_contents.items():
                f.write(f"--- {path} ---\n{content}\n\n")

    # Guardar en formato JSON
    if output_json:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(file_contents, f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    # Ejemplo de uso
    source_dirs = [
        "/home/juanjo/seguridad-social-web"
    ]
    exclude_dirs = ["node_modules", "build", "dist", "data",".git"]
    exclude_files = ["package-lock.json", "logs.log","verifier_logs.log", "copiar.py", "App.css" , "Register.css", "Dashboard.css", "todo_junto.json", "todo_junto.txt"]  # Añade aquí los archivos a excluir

    # Opcional: define a dónde quieres guardar el contenido
    output_txt_path = "todo_junto.txt"
    output_json_path = "todo_junto.json"

    gather_file_contents(
        source_dirs,
        exclude_dirs=exclude_dirs,
        exclude_files=exclude_files,
        output_txt=output_txt_path,
        output_json=output_json_path
    )

    print("Proceso completado. Revisa los archivos 'todo_junto.txt' o 'todo_junto.json'.")
