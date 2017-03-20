import Platform from "platform";

export default class GameState {
    platforms: Platform[] = [];
    money = 0;

    tick() {
        this.platforms.forEach(p => p.tick());
    }
}
