import { IGameState, IPlatform, ResourceType } from "commontypes";
import { value } from "util";

abstract class Machine {
    protected readonly platform: IPlatform;
    protected readonly state: IGameState;

    public readonly abstract name: string;
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

    constructor(state: IGameState, platform: IPlatform) {
        this.state = state;
        this.platform = platform;
        this.element = platform.getMachineElement();
    }
}

export class SolarPanel extends Machine {
    static readonly basePrice = 100;
    public readonly name = "Solar Panel";
    public generationRate = 1;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        let el = platform.getMachineElement();
        el.innerHTML = `${this.name} +${this.generationRate}🗲`;
    }

    power() {
        if (this.state.hour >= 6 && this.state.hour < 18) {
            this.platform.power += this.generationRate;
        }
    }

    run() { }

    serialize() {
        return {};
    }
    deserialize() {}
}

export class Digger extends Machine {
    static readonly basePrice = 10;
    public readonly name = "Dirt Digger";
    public powerUse = 10;
    public dirtDug = 2;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        this.totalHours = 24;
        this.element.innerHTML = this.progressTemplate + `${this.name} -${this.powerUse}🗲 +${this.dirtDug}${ResourceType.dirt.symbol} (${this.totalHours}h)`;
    }

    power() {}

    run() {
        if (this.running && typeof this.elapsed === "number") {
            if (++this.elapsed >= value(this.totalHours)) {
                this.running = false;
                this.platform.addResource(ResourceType.dirt, this.dirtDug);
            }
        } else if (this.platform.power >= this.powerUse) {
            this.platform.power -= this.powerUse;
            this.running = true;
            this.elapsed = 0;
        }
    }

    serialize() {
        return {
            powerUser: this.powerUse,
            dirtDug: this.dirtDug,
            totalHours: this.totalHours,
            running: this.running,
            elapsed: this.elapsed,
        };
    }
    deserialize() {}
}

export class Shovel extends Machine {
    public static basePrice = 1;

    public name: string = "Shovel";
    public dirtDug = 1;
    public digging = false;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        this.element.innerHTML = `${this.name} <button>+${this.dirtDug}${ResourceType.dirt.symbol}</button>`;
        this.element.querySelector("button")!.addEventListener("click", ev => {
            if (!this.digging) {
                this.digging = true;
                this.platform.addResource(ResourceType.dirt, this.dirtDug);
            }
        });
    }

    power(): void {}
    run(): void {
        this.digging = false;
    }
    serialize() {}
    deserialize(state: any): void {}
}

export class AutoDirtSeller extends Machine {
    static readonly basePrice = 5;
    public readonly name = "Auto Dirt Seller";
    public powerUse = 1;
    public price = 2;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        this.element.innerHTML = `${this.name} -1${ResourceType.dirt.symbol} -${this.powerUse}🗲 +§${this.price}`;
    }

    power() {}

    run() {
        if (this.platform.power >= this.powerUse && this.platform.removeResource(ResourceType.dirt, 1)) {
            this.state.money += this.price;
            this.platform.power -= this.powerUse;
        }
    }

    serialize() {
        return {};
    }
    deserialize() {}
}

export class DirtSeller extends Machine {
    public static basePrice = 1;

    public name: string = "Dirt Seller";
    public price = 2;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        this.element.innerHTML = `${this.name} <button>-1${ResourceType.dirt.symbol} +§${this.price}</button>`;
        this.element.querySelector("button")!.addEventListener("click", ev => {
            if (!this.running && this.platform.removeResource(ResourceType.dirt, 1)) {
                this.running = true;
                this.state.money += this.price;
            }
        })
    }

    power() { }
    run() {
        this.running = false;
    }

    serialize() {
        return {};
    }
    deserialize(state: any): void { }
}

export class CrankGenerator extends Machine {
    public name = "Crank Generator";
    public static basePrice = 10;
    public generationRate = 1;
    private crankedThisTick = false;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        let el = platform.getMachineElement();
        el.innerHTML = `${this.name} <button>+${this.generationRate}🗲</button>`;
        el.addEventListener("click", (ev) => {
            let target = ev.target;
            if (target instanceof HTMLButtonElement) {
                if (this.crankedThisTick) return;
                this.platform.power += this.generationRate;
                this.crankedThisTick = true;
            }
        })
    }
    
    power() { }

    run() { 
        this.crankedThisTick = false;
    }

    serialize() { return null; }
    deserialize() {}
}

export const allMachines = {
    SolarPanel: SolarPanel,
    Digger: Digger, 
    AutoDirtSeller: AutoDirtSeller,
    DirtSeller: DirtSeller,
    CrankGenerator: CrankGenerator,
    Shovel: Shovel,
};

export type SpecificMachine = SolarPanel | Digger | AutoDirtSeller | CrankGenerator | Shovel | DirtSeller;

export function getMachineTypeName(machine: Machine): keyof typeof allMachines {
    for(let name of Object.keys(allMachines) as (keyof typeof allMachines)[]) {
        if (allMachines[name] === machine.constructor) return name;
    }
    throw machine.name + " not found";
}
