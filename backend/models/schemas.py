from typing import Optional
from pydantic import BaseModel


class SourceData(BaseModel):
    src_type    : str = "youtube"
    url         : str

class InfoData(BaseModel):
    title       : str
    artist      : str
    album       : Optional[str] = None

class DestinationData(BaseModel):
    path        : str = "data/"
    filename    : str

class Info(BaseModel):
    data: InfoData
    checksum: str

class Source(BaseModel):
    data: SourceData
    checksum: str

class Destination(BaseModel):
    data: DestinationData
    checksum: str

class SongData(BaseModel):
    info: Info
    src: Source
    dest: Destination

class Song(BaseModel):
    data: SongData
    checksum: str
