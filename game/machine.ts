import { IGameState, ICell, ResourceType } from "commontypes";
import { value, returnOf } from "util";

abstract class Machine {
    protected readonly cell: ICell;
    protected readonly state: IGameState;

    protected readonly progressTemplate = "<div class=progress></div>";

    public readonly element: HTMLElement;
    private progressElement?: HTMLElement;

    public totalHours?: number;
    public running = false;
    private _elapsed = 0;
    public get elapsed() { return this._elapsed; } 
    public set elapsed(value: number) {
        this._elapsed = value;
        this.setProgress();
    }

    private setProgress() {
        if (!this.progressElement) this.progressElement = this.element.querySelector(".progress") as HTMLElement;
        if (this.progressElement) {
            // progress bar is animated, so calculate where we want to end up by *next* tick
            // assuming consistent + 1 progress
            let percent = (this.elapsed + (this.running ? 1 : 0)) / value(this.totalHours) * 100;
            this.progressElement.style.width = percent + "%";
            this.progressElement.style.visibility = this.running ? "visible" : "hidden";
        } else {
            console.warn("tried to set progress without a bar", this)
        }
    }

    abstract power(): void;
    abstract run(): void;
    abstract serialize(): any;
    abstract deserialize(state: any): void;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        this.state = state;
        this.cell = cell;
        this.element = element;
    }

    getMachineTypeCode(): MachineCode {
        for(let name of Object.keys(allMachines) as MachineCode[]) {
            if (allMachines[name] === this.constructor) return name;
        }
        console.error(this);
        throw "machine constructor not found";
    }
}

export class SolarPanel extends Machine {
    static readonly basePrice = 100;
    static readonly label = "Solar Panel";
    public generationRate = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.element.innerHTML = `${SolarPanel.label} +${this.generationRate}🗲`;
    }

    power() {
        if (this.state.hour >= 6 && this.state.hour < 18) {
            this.cell.power += this.generationRate;
        }
    }

    run() { }

    serialize() { return null; }
    deserialize(state: any) { }
}

export class Digger extends Machine {
    static readonly basePrice = 10;
    static readonly label = "Dirt Digger";
    public powerUse = 10;
    public dirtDug = 2;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.totalHours = 24;
        this.element.innerHTML = this.progressTemplate + `${Digger.label} -${this.powerUse}🗲 +${this.dirtDug}${ResourceType.dirt.symbol} (${this.totalHours}h)`;
    }

    power() {}

    run() {
        if (this.running && typeof this.elapsed === "number") {
            if (++this.elapsed >= value(this.totalHours)) {
                this.running = false;
                this.elapsed = 0;
                this.cell.addResource(ResourceType.dirt, this.dirtDug);
            }
        } else if (this.cell.power >= this.powerUse) {
            this.cell.power -= this.powerUse;
            this.running = true;
            this.elapsed = 0;
        }
    }

    serialize() {
        return {
            running: this.running,
            elapsed: this.elapsed,
        };
    }
    deserialize(serialized: any) {
        const serializeType = returnOf(this.serialize);
        let s = serialized as typeof serializeType;
        this.running = s.running;
        this.elapsed = s.elapsed;
    }
}

export class Shovel extends Machine {
    public static basePrice = 1;

    static readonly label = "Shovel";
    public dirtDug = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.totalHours = 3;

        this.element.innerHTML = this.progressTemplate + `${Shovel.label} <button>+${this.dirtDug}${ResourceType.dirt.symbol}</button>`;
        this.element.querySelector("button")!.addEventListener("click", ev => {
            if (!this.running) {
                this.running = true;
                this.elapsed = 0;
            }
        });
    }

    power(): void {}
    run(): void {
        if (this.running && ++this.elapsed >= value(this.totalHours)) {
            this.running = false;
            this.elapsed = 0;
            this.cell.addResource(ResourceType.dirt, this.dirtDug);
        }
    }
    serialize() { return null; }
    deserialize(state: any) { }
}

export class AutoDirtSeller extends Machine {
    static readonly basePrice = 5;
    static readonly label = "Auto Dirt Seller";
    powerUse = 1;
    salePrice = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.element.innerHTML = `${AutoDirtSeller.label} -1${ResourceType.dirt.symbol} -${this.powerUse}🗲 +§${this.salePrice}`;
    }

    power() {}

    run() {
        if (this.cell.power >= this.powerUse && this.cell.removeResource(ResourceType.dirt, 1)) {
            this.state.money += this.salePrice;
            this.cell.power -= this.powerUse;
        }
    }

    serialize() { return null; }
    deserialize(state: any) { }
}

export class DirtSeller extends Machine {
    public static basePrice = 1;
    static readonly label = "Dirt Seller";
    salePrice = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.element.innerHTML = `${DirtSeller.label} <button>-1${ResourceType.dirt.symbol} +§${this.salePrice}</button>`;
        this.element.querySelector("button")!.addEventListener("click", ev => {
            if (!this.running && this.cell.removeResource(ResourceType.dirt, 1)) {
                this.running = true;
                this.state.money += this.salePrice;
            }
        })
    }

    power() { }
    run() {
        this.running = false;
    }

    serialize() { return null; }
    deserialize(state: any): void { }
}

export class CrankGenerator extends Machine {
    static readonly label = "Crank Generator";
    public static basePrice = 10;
    public generationRate = 1;
    private crankedThisTick = false;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.element.innerHTML = `${CrankGenerator.label} <button>+${this.generationRate}🗲</button>`;
        this.element.querySelector("button")!.addEventListener("click", (ev) => {
            if (this.crankedThisTick) return;
            this.cell.power += this.generationRate;
            this.crankedThisTick = true;
        })
    }
    
    power() { }

    run() { 
        this.crankedThisTick = false;
    }

    serialize() { return null; }
    deserialize(state: any) {}
}

// lookup for constructors by name
// also runs a bunch of type shenanigans
export const allMachines = {
    SolarPanel: SolarPanel,
    Digger: Digger, 
    AutoDirtSeller: AutoDirtSeller,
    DirtSeller: DirtSeller,
    CrankGenerator: CrankGenerator,
    Shovel: Shovel,
};

export type SpecificMachine = SolarPanel | Digger | AutoDirtSeller | CrankGenerator | Shovel | DirtSeller;

export type MachineCode = keyof typeof allMachines;
