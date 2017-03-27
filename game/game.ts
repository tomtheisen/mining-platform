import GameState from "gamestate";

const saveKey = "mp_save";

let state = new GameState;

function save() {
    localStorage.setItem(saveKey, btoa(JSON.stringify(state.serialize())));
}

function load() {
    let saved = localStorage.getItem(saveKey);
    if (saved) {
        state.deserialize(JSON.parse(atob(saved)));
        state.tick();
    } else {
        state.reset();
    }
}

document.getElementById("save-button")!.addEventListener("click", save);
document.getElementById("load-button")!.addEventListener("click", load);
document.getElementById("reset-button")!.addEventListener("click", ev => { state.reset() });

window.addEventListener("beforeunload", save);

load();
setInterval(() => state.tick(), 500);
