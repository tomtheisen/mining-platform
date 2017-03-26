import Cell from "cell";
import { setText } from "domutil";
import { IGameState } from "commontypes";
import { MachineConstructor, allMachines } from "machine";
import {returnOf} from "util";

export default class GameState implements IGameState {
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

    getAffordableMachines(): MachineConstructor[] {
        for (var i = 0; i < this._machineTypes.length; i++) {
            if (this._machineTypes[i].basePrice > this.money) break;
        }
        return this._machineTypes.slice(0, i);
    }

    private _machineTypes: MachineConstructor[];
    constructor() {
        let codes = Object.keys(allMachines) as string[];
        this._machineTypes = codes.map(c => allMachines[c]);
        this._machineTypes.sort((a, b) => a.basePrice - b.basePrice);
    }

    allCells() {
        let result: Cell[] = [];
        result = result.concat(...this.cells).filter(c => c);
        return result;
    }

    serialize() {
        return {
            year: this.year, 
            day: this.day, 
            hour: this.hour,
            money: this.money,
            cells: this.cells.map(row => row.map(c => c.serialize()))
        };
    }
    deserialize(s: any) {
        const serializeType = returnOf(this.serialize);
        let serialized = s as typeof serializeType
        this.year = serialized.year;
        this.day = serialized.day;
        this.hour = serialized.hour;
        this.money = serialized.money;

        this.allCells().forEach(c => c.dispose());
        this.cells = serialized.cells.map(row => 
            row.map(cell => {
                if (!cell) return cell;
                let newCell = new Cell(this, cell.capacity);
                newCell.deserialize(cell);
                return newCell;
            })
        );
        this.renumberCells();
    }

    renumberCells() {
        this.cells.forEach((row, i) => {
            row.forEach((cell, j) => {
                cell.row = i;
                cell.col = j;
            })
        })
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

        this.allCells().forEach(p => p.tick());
    }

    reset() {
        this.year = this.day = this.hour = 0;
        this.money = 1000;
        document.getElementById("cells")!.innerHTML = "";

        let cell1 = new Cell(this);
        cell1.addMachine("Shovel");
        cell1.addMachine("DirtSeller");

        let cell2 = new Cell(this);
        cell2.addMachine("Shovel");

        this.cells = [
            [cell1],
            [cell2],
        ];
        this.renumberCells();
    }
}
