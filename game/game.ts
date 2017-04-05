import GameState from "gamestate";
import * as Machine from "machine";

const saveKey = "mp_save";
const backupKey = "mp_backup"
const tickTime = 500;
const autoSaveTime = 60000;

let state = new GameState;

function save(key: string) {
    localStorage.setItem(key, /* btoa */(JSON.stringify(state.serialize())));
}

function load(key: string) {
    let saved = localStorage.getItem(key);
    if (saved) {
        state.deserialize(JSON.parse( /* atob */ (saved)));
        state.tick();
    }
}

// debug mode - free
Object.keys(Machine.allMachines).forEach(k => Machine.allMachines[k].basePrice = 0);

function clickHandler(id: string, handler: EventListener) {
    let el = document.getElementById(id);
    if (el) el.addEventListener("click", handler);
}

clickHandler("save-button", () => save(saveKey));
clickHandler("load-button", () => load(saveKey));
clickHandler("backup-save-button", () => save(backupKey));
clickHandler("backup-load-button", () => load(backupKey));
clickHandler("reset-button", () => state.reset());

setInterval(() => state.tick(), tickTime);

load(saveKey);

window.addEventListener("beforeunload", () => save(saveKey));
setInterval(save, autoSaveTime);
