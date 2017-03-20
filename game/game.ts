import GameState from "gamestate";

let state = new GameState;
state.reset();
setInterval(() => state.tick(), 500);


