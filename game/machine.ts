import { IGameState, IPlatform, ResourceType } from "commontypes";

abstract class Machine {
    protected readonly platform: IPlatform;
    protected readonly state: IGameState;

    public readonly abstract name: string;

    abstract power(): void;
    abstract run(): void;
    abstract serialize(): any;
    abstract deserialize(state: any): void;

    constructor(state: IGameState, platform: IPlatform) {
        this.state = state;
        this.platform = platform;
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
    public digHours = 24;
    public digging = false;
    public elapsed = 0;

    progressElement: HTMLElement;

    
    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        let el = platform.getMachineElement();
        el.innerHTML = `<div class=progress></div>${this.name} -${this.powerUse}🗲 +${this.dirtDug}${ResourceType.dirt.symbol} (${this.digHours}h)`;
        this.progressElement = el.querySelector(".progress") as HTMLDivElement;
    }

    power() {}

    run() {
        if (this.digging) {
            if (++this.elapsed >= this.digHours) {
                this.digging = false;
                this.platform.addResource(ResourceType.dirt, this.dirtDug);
            }
        } else if (this.platform.power >= this.powerUse) {
            this.platform.power -= this.powerUse;
            this.digging = true;
            this.elapsed = 0;
        }

        this.progressElement.style.width = this.digging ? (this.elapsed / this.digHours * 100) + "%" : "0";
    }

    serialize() {
        return {
            powerUser: this.powerUse,
            dirtDug: this.dirtDug,
            digHours: this.digHours,
            digging: this.digging,
            elapsed: this.elapsed,
        };
    }
    deserialize() {}
}

export class DirtSeller extends Machine {
    static readonly basePrice = 5;
    public readonly name = "Dirt Seller";
    public powerUse = 1;
    public price = 2;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        let el = platform.getMachineElement();
        el.innerHTML = `${this.name} -1${ResourceType.dirt.symbol} -${this.powerUse}🗲 +§${this.price}`;
    }

    power() {}

    run() {
        if (this.platform.power >= this.powerUse && this.platform.getResource(ResourceType.dirt) >= 1) {
            this.platform.power -= this.powerUse;
            if (this.platform.removeResource(ResourceType.dirt, 1)) {
                this.state.money += this.price;
            }
        }
    }

    serialize() {
        return {};
    }
    deserialize() {}
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
    DirtSeller: DirtSeller,
    CrankGenerator: CrankGenerator,
};

export type SpecificMachine = SolarPanel | Digger | DirtSeller | CrankGenerator;

export function getMachineTypeName(machine: Machine): keyof typeof allMachines {
    for(let name of Object.keys(allMachines) as (keyof typeof allMachines)[]) {
        if (allMachines[name] === machine.constructor) return name;
    }
    throw machine.name + " not found";
}