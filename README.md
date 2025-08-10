# Landscaper - FF7 Worldmap Editor

## TODO

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