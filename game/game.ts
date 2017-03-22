import GameState from "gamestate";

document.getElementById("save-button")!.addEventListener("click", ev => {
    localStorage.setItem("mp_save", JSON.stringify(state.serialize()));
});

let state = new GameState;
state.reset();
state.tick();
setInterval(() => state.tick(), 500);


