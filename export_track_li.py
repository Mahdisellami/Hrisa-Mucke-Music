import json

# load the database
database_file = "music.json"
with open(database_file) as file:
    db = json.loads(file.read())

track_li = []

for item in db:
    track = {
            "title" : item["track"]["info"]["title"],
            "url"   : item["track"]["src"]["url"]
            }
    track_li.append(track)

file = open("track_li.py", "w")

file.write('track_li = [\n')
for track in track_li:
    file.write('    ' + str(track) + ',\n')
file.write(']')

file.close()



    