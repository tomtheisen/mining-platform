import GameState from "gamestate";

let state = new GameState;
state.reset();
state.tick();
setInterval(() => state.tick(), 500);


