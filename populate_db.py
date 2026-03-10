import json
import os
import copy

from pydantic import BaseModel
from typing import Optional

import utils

class Source(BaseModel):
    src_type    : str = "youtube"
    url         : str

class Info(BaseModel):
    title       : str
    artist      : str
    album       : Optional[str] = None

class Destination(BaseModel):
    path        : str = "data/"
    filename    : str

# setup
database_file = "music.json"
if not os.path.exists(database_file):
    with open(database_file, 'w') as file:
        json.dump([], file)

data_folder = "data/"
if not os.path.exists(data_folder):
    os.makedirs(data_folder)

track_li = [
    {'playlist' : 'music',   'u': 'https://youtu.be/kXYiU_JCYtU?si=foLoch4zAvlQ7Lk1', 't': 'Numb'                    , 'a' : 'linkin park'},
    {'playlist' : 'music',   'u': 'https://youtu.be/aU_TQcyGkvY?si=UE0ZdXRKxhStyu76', 't': 'derniere danse'          , 'a' : 'kyo'},
    {'playlist' : 'music',   'u': 'https://youtu.be/pibxlo2qOgo?si=SrO75_XOYga0pNTT', 't': 'Stygian'                 , 'a' : 'saah'},
    {'playlist' : 'music',   'u': 'https://youtu.be/8mGBaXPlri8?si=3S125Yddx5rqVNKY', 't': 'All The Things She Said' , 'a' : 'tatu'},
    {'playlist' : 'music',   'u': 'https://youtu.be/WBsIKQEGQ_A?si=IhnaITJRgy9j5Mv0', 't': 'Mop Mop'                 , 'a' : 'Kamakumba'},
    {'playlist' : 'music',   'u': 'https://youtu.be/3BvKCt8O6qw?si=ZNig7E0m66kKfCGl', 't': 'noname'                  , 'a' : 'Khudgharz'},
    {'playlist' : 'music',   'u': 'https://youtu.be/LAxCqlU-OAo?si=tq-KLqQNMZ51Fwog', 't': 'Eyes On Fire'            , 'a' : 'blue foundation'},
    {'playlist' : 'workout', 'u': 'https://youtu.be/6TggVgq6lVI?si=P5DwBpDGS8lJ8kMV', 't': 'next slowed'             , 'a' : 'ncts'},

    {'playlist' : 'music',   'u': 'https://youtu.be/OeU8IgQSW_c', 't': 'Laughing Ice Cream Got What It Deserved 💀🍦🔥'                    , 'a' : 'Lola LoL'},
    {'playlist' : 'music',   'u': 'https://youtu.be/dtICn2yOGp0', 't': 'بلا ولا شي'                    , 'a' : 'جورج نعمة'},
    {'playlist' : 'music',   'u': 'https://youtu.be/-M67Obk8bis', 't': '《歌手2024》第三期纯享版Faouzia《Desert Rose》"Singer 2024" #faouzia  "Desert Rose"'                    , 'a' : '湖南国际频道 Hunan TV International  Official Channel'},
    {'playlist' : 'music',   'u': 'https://youtu.be/M1dcmKIIVGw', 't': 'Sidi Mansour | سيدي منصور'                    , 'a' : 'Saber Rebai'},]

for track in track_li:
    # source
    source = {
        "url"   : track["u"],
    }
    new_source = Source(**source)

    # info
    info = {
        "title"  : track["t"],
        "artist" : track["a"],
    }
    new_info = Info(**info)

    # destination
    filename_li = []
    # if new_info.artist != None: filename_li.append(new_info.artist.lower().replace(' ', '_'))
    # if new_info.album  != None: filename_li.append(new_info.album.lower().replace(' ', '_'))
    filename_li.append(new_info.title.lower().replace(' ', '_'))
    destination = {
        "filename" : '-'.join(filename_li)
    }
    new_destination = Destination(**destination)
    new_destination.path = data_folder + track["playlist"] + '/'

    new_info_di         = new_info.model_dump()
    new_source_di       = new_source.model_dump()
    new_destination_di  = new_destination.model_dump()

    track_di = {
        "info" : { "data" : new_info_di         , "checksum" : utils.checksum(new_info_di)},
        "src"  : { "data" : new_source_di       , "checksum" : utils.checksum(new_source_di)},
        "dest" : { "data" : new_destination_di  , "checksum" : utils.checksum(new_destination_di)},
    }

    new_track = {"data" : track_di, "checksum" : utils.checksum(track_di)}
    #print(new_track)

    # load the database
    with open(database_file) as file:
        db = json.loads(file.read())

    # check if an identical track is already part of the database
    track_exists_in_db = False
    for track in db:
        if track["checksum"] == new_track["checksum"]:
            track_exists_in_db = True
            break

    # if not, ...
    if not track_exists_in_db:
        # check if an identical source is already part of the database
        # in case of editing the track information or destination
        source_exists_in_db = False
        idx = 0
        for track in db:
            if track["data"]["src"]["checksum"] == new_track["data"]["src"]["checksum"]:
                source_exists_in_db = True
                break
            idx = idx + 1
        
        # if so, replace the old track with the new track
        if source_exists_in_db:
            print("Editing existing track <" + new_track["data"]["info"]["data"]["title"] + ">")
            db[idx] = new_track
        else:
            # add the new track to the database
            print("Add a new track <" + new_track["data"]["info"]["data"]["title"] + ">")
            db.append(new_track)
    else:
        print("Track <" + new_track["data"]["info"]["data"]["title"] + "> already exists")

    # overwrite the database file
    with open(database_file, 'w') as file:
        json.dump(db, file, indent=4)