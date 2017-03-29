import Cell from "cell";
import { setText } from "domutil";
import { IGameState, IMachineConstructorState } from "commontypes";
import { MachineConstructor, allMachines } from "machine";
import { returnOf, Subscriptions } from "util";

class MachineConstructorState implements IMachineConstructorState {
    readonly props = new Subscriptions<MachineConstructorState>(this);
    
    readonly type: MachineConstructor;
    private _affordable: boolean;
    get affordable() { return this._affordable; }
    set affordable(value: boolean) { 
        let notify = this._affordable !== value;
        this._affordable = value;
        if (notify) this.props.publish("affordable", value);
    }

    constructor(state: GameState, ctor: MachineConstructor) {
        this.type = ctor;
        state.props.subscribe("money", money => {
            this.affordable = money >= ctor.basePrice;
            return true;
        });
    }
}

export default class GameState implements IGameState {
    readonly props = new Subscriptions<GameState>(this);

    cells: Cell[][] = [];
    moneyHistory: number[] = [];
    private readonly historyLength = 24;

    year: number;
    day: number;
    hour: number;

    private _money: number;
    get money() { return this._money; }
    set money(value: number) {
        let notify = this._money !== value;
        this._money = value;
        setText("#money", value);
        if (notify) this.props.publish("money", value);
    }

    machineTypes: ReadonlyArray<MachineConstructorState>;
    constructor() {
        let codes = Object.keys(allMachines) as string[];
        this.machineTypes = codes
            .map(c => new MachineConstructorState(this, allMachines[c]))
            .sort((a, b) => a.type.basePrice - b.type.basePrice);
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

        const hist = this.moneyHistory;
        hist.push(this.money);
        if (hist.length > this.historyLength) hist.shift();
        let rate = (hist[hist.length - 1] - hist[0]) / (this.historyLength - 1);
        let rateFormatted = (rate >= 0 ? "+" : "-") + Math.abs(rate).toFixed(2);
        setText("#money-rate", rateFormatted);
    }

    reset() {
        this.allCells().forEach(c => c.dispose());

        this.year = this.day = this.hour = 0;
        this.money = 1;
        document.getElementById("cells")!.innerHTML = "";

        let cell1 = new Cell(this, 5);
        cell1.addMachine("Shovel");
        //cell1.addMachine("DirtSeller");

        // let cell2 = new Cell(this);
        // cell2.addMachine("Shovel");

        this.cells = [
            [cell1],
            // [cell2],
        ];
        this.renumberCells();
    }
}
