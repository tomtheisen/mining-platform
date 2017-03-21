import Platform from "platform";
import { setText } from "domutil";
import { IGameState } from "commontypes";
import * as Machine from "machine";

class CellConnection {
    first: Cell;
    second: Cell;
}

class Cell {
    top: CellConnection;
    left: CellConnection;
    platform: Platform;

    constructor(platform: Platform) {
        this.platform = platform;
    }
}

export default class GameState implements IGameState {
    platforms: Platform[] = [];
    cells: Cell[][] = [];

    year: number;
    day: number;
    hour: number;

    private _money: number;
    get money() { return this._money; }
    set money(newMoney: number) {
        this._money = newMoney;
        setText("#money", newMoney);
    }

    tick() {
        if (++this.hour >= 24) {
            this.hour -= 24;
            if (++this.day >= 365) {
                this.day -= 365;
                ++this.year;
            }
        }
        setText("#year", this.year);
        setText("#day", this.day);
        setText("#hour", this.hour);

        this.platforms.forEach(p => p.tick());
    }

    reset() {
        this.year = this.day = this.hour = 0;
        document.getElementById("platforms")!.innerHTML = "";

        let platform = new Platform(this, 10);
        platform.addMachine(new Machine.SolarPanel(this, platform));
        platform.addMachine(new Machine.Digger(this, platform));
        platform.addMachine(new Machine.DirtSeller(this, platform));
        this.platforms = [ platform ];
        this.cells = [[new Cell(platform)]];
        this.money = 10;
    }
}
