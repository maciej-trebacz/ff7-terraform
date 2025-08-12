# Landscaper - FF7 Worldmap Editor

## TODO

in system_13 there's a wrong type coercion (2nd param is angle offset, not model id):
Entity.rotate_to_model(Entities.wild_chocobo, Entities.cloud)
also this should use the direction component

Export mode is broken

Add "Open Script" button next to Script ID in the Triangle sidebar

System.call_function has wrong sidebar ui

System.set_field_entry_by_id(51) in chocobo_29 model script - wrong opcode?



Map
* changes are lost when changing current map, switching to a different tab or changing Alternatives
* saving changes to alternative sections doesn't work
V improve camera orbiting/panning
V importing from .obj does not work properly - sometimes a vertex position will be set to 0, 0, 0

Scripts
V Make sure scripts are properly compiled and saved into the game data files
* Adding a new script (tried highwind - touched and a mesh script) crashes the game
* Undo/redo support for script editing
* Reset the script to what's in the game files
* Show which scripts were modified after loading/saving
* Prompt "You will lose unsaved changes" if there are any
* Search feature in the script editor
* Search across all scripts