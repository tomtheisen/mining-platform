import GameState from "gamestate";
import * as Machine from "machine";

const saveKey = "mp_save";

let state = new GameState;

function save() {
    localStorage.setItem(saveKey, /* btoa */(JSON.stringify(state.serialize())));
}

function load() {
    let saved = localStorage.getItem(saveKey);
    if (saved) {
        state.deserialize(JSON.parse( /* atob */ (saved)));
        state.tick();
    } else {
        state.reset();
    }
}

// debug mode - free
Object.keys(Machine.allMachines).forEach(k => Machine.allMachines[k].basePrice = 0);

document.getElementById("save-button")!.addEventListener("click", save);
document.getElementById("load-button")!.addEventListener("click", load);
document.getElementById("reset-button")!.addEventListener("click", ev => state.reset() );

setInterval(() => state.tick(), 500);

load();

window.addEventListener("beforeunload", save);
setInterval(save, 60000);
