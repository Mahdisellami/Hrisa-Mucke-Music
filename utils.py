import hashlib
import json

def checksum(track_di : dict) -> str :
    return hashlib.md5(json.dumps(track_di).encode('utf-8')).hexdigest()