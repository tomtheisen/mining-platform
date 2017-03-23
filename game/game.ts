import GameState from "gamestate";

const saveKey = "mp_save";

document.getElementById("save-button")!.addEventListener("click", ev => {
    localStorage.setItem(saveKey, btoa(JSON.stringify(state.serialize())));
});

document.getElementById("load-button")!.addEventListener("click", ev => {
    let saved = localStorage.getItem(saveKey);
    if (saved) state.deserialize(JSON.parse(atob(saved)));
})

let state = new GameState;
state.reset();
state.tick();
setInterval(() => state.tick(), 500);
