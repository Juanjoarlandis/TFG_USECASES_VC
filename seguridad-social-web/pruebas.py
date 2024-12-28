import base64
import gzip
from io import BytesIO

encoded_list = "H4sIAAAAAAAAA+3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAIC3AYbSVKsAQAAA"

# Decodificar Base64
decoded_base64 = base64.b64decode(encoded_list)

# Descomprimir GZIP
with gzip.GzipFile(fileobj=BytesIO(decoded_base64)) as f:
    decompressed_data = f.read()

print("Datos descomprimidos (hex):", decompressed_data.hex())
