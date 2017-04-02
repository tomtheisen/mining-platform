import { IGameState, ICell, IMachine, ResourceType, MachineMetadata } from "commontypes";
import { value, returnOf } from "util";
import { setText, div, span, input, label, button, fa, text } from "domutil";

export interface MachineConstructor extends Function, MachineMetadata {
    new(state: IGameState, cell: ICell, element: HTMLElement): Machine;
}

export function getMachineTypeCode(ctor: MachineMetadata): string {
    for(let code of Object.keys(allMachines)) {
        if (allMachines[code] === ctor) return code;
    }
    console.error(this);
    throw "machine constructor not found";
}

export abstract class Machine implements IMachine {
    protected readonly cell: ICell;
    protected readonly state: IGameState;

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
            let percent = this.elapsed / value(this.totalHours) * 100;
            this.progressElement.style.width = percent + "%";
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

        element.addEventListener("click", ev => this.handleClick(ev));
    }

    private handleClick(ev: MouseEvent) {
        let target: HTMLElement | null = ev.target as HTMLElement;

        let classes: string[] = [];
        while (target && target !== this.element) {
            classes = classes.concat([].map.call(target.classList, (e: string) => e))
            target = target.parentElement;
        }

        if (classes.indexOf("delete-button") >= 0) this.cell.removeMachine(this);
    }

    getMachineTypeCode(): string {
        return getMachineTypeCode(this.constructor as MachineConstructor);
    }

    protected disposed = false;
    dispose(): void {
        this.element.remove();
        this.disposed = true;
    }

    private static unique = 0;
    protected addMachineLink() {
        var ctor = allMachines[this.getMachineTypeCode()];
        this.element.appendChild(input({class: "machine-selector", type: "checkbox", id: "ms" + ++Machine.unique}));
        this.element.appendChild(label({for: "ms" + Machine.unique}, ctor.label));
        this.element.appendChild(text(" "));
    }

    protected addProgressBar() {
        this.element.appendChild(div({class: "progress"}));
    }

    protected addDetails(...contents: HTMLElement[]) {
        let del = button({class: "delete-button", title: "remove"}, fa("fa-times"));
        let details = div({class: "machine-details"}, del, ...contents);
        this.element.appendChild(details);
    }
}

type ResourceAmount = {
    type: ResourceType;
    amount: number;
};

abstract class PoweredCrafter extends Machine {
    powerUse: number;
    amountOut: number;
    resourceOut: ResourceType;
    inputs: ResourceAmount[];

    constructor(state: IGameState, cell: ICell, element: HTMLElement, resourceOut: ResourceType, amountOut: number, powerUse: number, hours: number, ...inputs: ResourceAmount[]) {
        super(state, cell, element);
        this.resourceOut = resourceOut;
        this.amountOut = amountOut;
        this.powerUse = powerUse;
        this.totalHours = hours;
        this.inputs = inputs;

        this.addProgressBar();
        this.addMachineLink();
        this.element.appendChild(span({}, `-${this.powerUse}🗲 +${this.amountOut}${this.resourceOut.symbol} (${this.totalHours}h)`));
        this.addDetails();
    }

    power() {}

    run() {
        if (this.running && typeof this.elapsed === "number") {
            if (++this.elapsed >= value(this.totalHours)) {
                let success = this.cell.addResource(this.resourceOut, this.amountOut);

                if (success) {
                    this.running = false;
                    this.elapsed = 0;
                }
            }
        } else {
            let sufficient = this.inputs.reduce((acc, { type, amount }) => acc && this.cell.getResource(type) >= amount, true);
            if (sufficient && this.cell.power >= this.powerUse) {
                this.inputs.forEach(({type, amount}) => this.cell.removeResource(type, amount));
                this.cell.power -= this.powerUse;
                this.running = true;
                this.elapsed = 0;
            }
        }
    }

    serialize() {
        return {
            running: this.running,
            elapsed: this.elapsed,
            resourceCode: this.resourceOut.code,
            amountMined: this.amountOut,
            powerUse: this.powerUse,
            totalHours: this.totalHours,
        };
    }
    deserialize(serialized: any) {
        const serializeType = returnOf(this.serialize);
        let s = serialized as typeof serializeType;
        this.running = s.running;
        this.elapsed = s.elapsed;
        this.resourceOut = ResourceType.allTypes.filter(r => r.code == s.resourceCode)[0];
        this.amountOut = s.amountMined;
        this.powerUse = s.powerUse;
        this.totalHours = s.totalHours;
    }
}



class SolarPanel extends Machine {
    static readonly basePrice = 100;
    static readonly label = "Solar Panel";
    public generationRate = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.addMachineLink();
        this.element.appendChild(span({}, `+${this.generationRate}🗲`));
        this.addDetails();
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

class Digger extends PoweredCrafter {
    static readonly basePrice = 10;
    static readonly label = "Dirt Digger";

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element, ResourceType.dirt, 2, 4, 24);
    }
}

class Shovel extends Machine {
    public static basePrice = 2;

    static readonly label = "Shovel";
    public dirtDug = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);
        this.totalHours = 3;

        this.addProgressBar();
        this.addMachineLink();
        this.element.appendChild(button({}, `+${this.dirtDug}${ResourceType.dirt.symbol}`));
        this.addDetails();

        this.element.querySelector("button")!.addEventListener("click", ev => this.activate());
    }

    activate() {
        if (!this.running) {
            this.running = true;
            this.elapsed = 0;
        }
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

class AutoDirtSeller extends Machine {
    static readonly basePrice = 5;
    static readonly label = "Auto Dirt Seller";
    powerUse = 1;
    salePrice = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);

        this.addMachineLink();
        this.element.appendChild(span({}, `-1${ResourceType.dirt.symbol} -${this.powerUse}🗲 +§${this.salePrice}`));
        this.addDetails();
    }

    power() {}

    run() {
        if (this.cell.power >= this.powerUse && this.cell.removeResource(ResourceType.dirt, 1)) {
            this.state.addMoney(this.salePrice);
            this.cell.power -= this.powerUse;
        }
    }

    serialize() { return null; }
    deserialize(state: any) { }
}

class DirtSeller extends Machine {
    public static basePrice = 1;
    static readonly label = "Dirt Seller";
    salePrice = 1;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);

        this.addMachineLink();
        this.element.appendChild(button({}, `-1${ResourceType.dirt.symbol} +§${this.salePrice}`));
        this.addDetails();

        this.element.querySelector("button")!.addEventListener("click", ev => {
            if (!this.running && this.cell.removeResource(ResourceType.dirt, 1)) {
                this.running = true;
                this.state.addMoney(this.salePrice);
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

class CrankGenerator extends Machine {
    static readonly label = "Crank Generator";
    static basePrice = 10;

    generationRate = 1;
    private crankedThisTick = false;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element);

        this.addMachineLink();
        this.element.appendChild(button({}, `+${this.generationRate}🗲`));
        this.addDetails();

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

class Well extends PoweredCrafter {
    static readonly label = "Well";
    static basePrice = 150;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element, ResourceType.water, 2, 4, 24);
    }
}

class MudMixer extends PoweredCrafter {
    static readonly label = "Mud Mixer";
    static basePrice = 200;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element, ResourceType.mud, 1, 2, 1, 
            {type: ResourceType.dirt, amount: 1},
            {type: ResourceType.water, amount: 1});
    }
}

class ElectricBrickKiln extends PoweredCrafter {
    static readonly label = "Electric Brick Kiln";
    static basePrice = 300;

    constructor(state: IGameState, cell: ICell, element: HTMLElement) {
        super(state, cell, element, ResourceType.brick, 1, 10, 24, 
            {type: ResourceType.mud, amount: 2});
    }
}

// lookup for constructors by name
// also runs a bunch of type shenanigans
export const allMachines: {
    readonly [code: string]: MachineConstructor
} = {
    SolarPanel: SolarPanel,
    Digger: Digger, 
    AutoDirtSeller: AutoDirtSeller,
    DirtSeller: DirtSeller,
    CrankGenerator: CrankGenerator,
    Shovel: Shovel,
    Well: Well,
    MudMixer: MudMixer,
    ElectricBrickKiln: ElectricBrickKiln,
};