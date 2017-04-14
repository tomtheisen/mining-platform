import { Cell, BuyPlaceHolder } from "cell";
import { setText } from "domutil";
import { IGameState, IMachineConstructorState, ResourceType } from "commontypes";
import { MachineConstructor, allMachines } from "machine";
import { returnOf, Subscriptions, clone } from "util";

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

class Objective {
    name: string;
    description: string;
    props = new Subscriptions(this);
    private test: (state: IGameState) => boolean;
    private complete: (state: IGameState) => void;

    private _achieved = false;
    get achieved() { return this._achieved; }
    set achieved(value: boolean) {
        this.props.publish("achieved", this._achieved = value);
    }

    private _visible = false;
    get visible() { return this._visible; }
    set visible(value: boolean) {
        this.props.publish("visible", this._visible = value);
    }

    constructor(name: string, description: string, test: (state: GameState) => boolean, complete: (state: GameState) => void = s => {}) {
        this.name = name;
        this.description = description;
        this.test = test;
        this.complete = complete;
    }

    check(state: GameState) {
        if (this.achieved) return true;
        if (this.test(state)) {
            if (this.complete) this.complete(state);
            return this.achieved = true;  
        } 
        return false;
    }
}

const unlocks = {
    newCell: false,
};

export default class GameState implements IGameState {
    readonly props = new Subscriptions<GameState>(this);

    newCellCapacity = 5;
    newCellResourceSlots = 3;
    newCellMaxPower = 10;
    cellPrice: number = 250;
    cells: Cell[][] = [];
    moneyHistory: number[] = [];
    objectives: Objective[] = [];
    currentObjective: number;
    unlocks = clone(unlocks);

    private readonly historyLength = 24;
    private buyPlaceHolders: BuyPlaceHolder[] = [];

    year: number;
    day: number;
    hour: number;

    private _effectiveIncomeRate = 1;
    get effectiveIncomeRate() { return this._effectiveIncomeRate; }
    set effectiveIncomeRate(value: number) {
        this._effectiveIncomeRate = value;
        this.props.publish("effectiveIncomeRate", value);
        setText("#income-rate", value.toFixed(3));
    }

    private _money: number;
    get money() { return this._money; }
    private setMoney(value: number) {
        let notify = this._money !== value;
        this._money = value;
        setText("#money", value);
        if (notify) this.props.publish("money", value);
    }

    addMoney(value: number) {
        this.setMoney(this.money + this.effectiveIncomeRate * value);
    }

    removeMoney(value: number): boolean {
        if (this.money < value) return false;
        this.setMoney(this.money - value);
        return true;
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
        let objectivesComplete: {[name: string]: boolean} = {};
        this.objectives.forEach(o => o.achieved && (objectivesComplete[o.name] = true));

        return {
            year: this.year, 
            day: this.day, 
            hour: this.hour,
            money: this.money,
            cellPrice: this.cellPrice,
            cells: this.cells.map(row => row.map(c => c && c.serialize())),
            objectivesComplete,
            unlocks: this.unlocks,
        };
    }
    deserialize(s: any) {
        const serializeType = returnOf(this.serialize);
        let serialized = s as typeof serializeType
        this.year = serialized.year;
        this.day = serialized.day;
        this.hour = serialized.hour;
        this.cellPrice = serialized.cellPrice;
        this.setMoney(serialized.money);
        this.unlocks = serialized.unlocks;

        this.resetObjectives();
        this.currentObjective = -1;
        this.objectives.forEach((obj, i) => {
            obj.achieved = obj.name in serialized.objectivesComplete;
            if (!obj.achieved && this.currentObjective < 0) this.currentObjective = i;
        });

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

    addEmptyCell(row: number, col: number): void {
        if (!this.cells[row]) this.cells[row] = [];
        this.cells[row][col] = new Cell(this, this.newCellCapacity);
        this.cells[row][col].maxPower = this.newCellMaxPower;
        this.cells[row][col].resourceSlots = this.newCellResourceSlots;
        this.renumberCells();
    }

    removeCell(cell: Cell): void {
        let {row, col} = cell;
        delete this.cells[row][col];
        this.renumberCells();
    }

    renumberCells() {
        this.buyPlaceHolders.forEach(bp => bp.dispose());
        this.buyPlaceHolders.splice(0);

        let consider = (i: number, j: number) => {
            if (!this.unlocks.newCell) return;
            if (i >= 0 && j >= 0 && (!this.cells[i] || !this.cells[i][j])) {
                if (this.buyPlaceHolders.filter(bp => bp.row === i && bp.col === j).length == 0) {
                    this.buyPlaceHolders.push(new BuyPlaceHolder(this, i, j));
                }
            }
        };

        let totalCells = 0;
        this.cells.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (!cell) return;

                totalCells += 1;
                cell.row = i;
                cell.col = j;
                consider(i - 1, j);
                consider(i + 1, j);
                consider(i, j - 1);
                consider(i, j + 1);
            });
        });

        this.effectiveIncomeRate = 20 / (totalCells + 19);
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
        rate = rate || 0;
        let rateFormatted = (rate >= 0 ? "+" : "-") + Math.abs(rate).toFixed(2);
        setText("#money-rate", rateFormatted);

        let objective = this.objectives[this.currentObjective];
        if (objective && objective.check(this)) {
            console.log("completed", objective);
            ++this.currentObjective;
        }
    }

    resetObjectives() {
        this.objectives = [];
        this.objectives.push(new Objective("Digger", "Have at least 10 dirt.", 
            state => state.cells[0][0].getResource(ResourceType.dirt) >= 10,
            state => {
                state.unlocks.newCell = true;
                state.renumberCells();
             }));
        this.currentObjective = 0;
    }

    reset() {
        this.unlocks = clone(unlocks);

        this.resetObjectives();

        this.year = this.day = this.hour = 0;
        this.setMoney(1);

        this.allCells().forEach(c => c.dispose());
        document.getElementById("cells")!.innerHTML = "";

        let cell1 = new Cell(this, this.newCellCapacity);
        cell1.maxPower = this.newCellMaxPower;
        cell1.resourceSlots = this.newCellResourceSlots;
        cell1.addMachine("Shovel");

        this.cells = [
            [cell1],
        ];
        this.renumberCells();
    }
}
