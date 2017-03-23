import Platform from "platform";
import { setText } from "domutil";
import { IGameState } from "commontypes";
import * as Machine from "machine";
import {returnOf} from "util";

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

    serialize() {
        return { top: this.top, left: this.left, platformId: "todo" };
    }
    deserialize() {}
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

    serialize() {
        return {
            year: this.year, 
            day: this.day, 
            hour: this.hour,
            money: this.money,
            platforms: this.platforms.map(p => p.serialize()),
            cells: this.cells.map(row => row.map(c => c.serialize()))
        };
    }
    static readonly serializeType = returnOf((g: GameState) => g.serialize());
    deserialize(serialized: typeof GameState.serializeType) {
        this.year = serialized.year;
        this.day = serialized.day;
        this.hour = serialized.hour;
        this.money = serialized.money;
        this.platforms.forEach(p => p.removeElement());
        this.platforms = serialized.platforms.map(p => {
            let newP = new Platform(this, p.capacity);
            newP.deserialize(p);
            return newP;
        });
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
        platform.addMachine(new Machine.Shovel(this, platform));
        platform.addMachine(new Machine.DirtSeller(this, platform));
        this.platforms = [ platform ];
        this.cells = [[new Cell(platform)]];
        this.money = 1000;
    }
}
