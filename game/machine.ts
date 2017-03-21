import { IGameState, IPlatform, ResourceType } from "commontypes";

export abstract class Machine {
    protected readonly platform: IPlatform;
    protected readonly state: IGameState;

    public readonly abstract name: string;

    abstract power(): void;
    abstract run(): void;

    constructor(state: IGameState, platform: IPlatform) {
        this.state = state;
        this.platform = platform;
    }
}

export class SolarPanel extends Machine {
    public readonly name = "Solar Panel";
    public generationRate = 1;

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        let el = platform.getMachineElement();
        el.innerHTML = `${this.name} +${this.generationRate}🗲`;
    }

    power() {
        this.platform.power += this.generationRate;
    }

    run() { }
}

export class Digger extends Machine {
    public readonly name = "Dirt Digger";
    public powerUse = 10;
    public dirtDug = 2;
    
    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
        let el = platform.getMachineElement();
        el.innerHTML = `${this.name} -${this.powerUse}🗲 +${this.dirtDug}${ResourceType.dirt.symbol}`;
    }

    power() {}

    run() {
        // todo ⌚
        if (this.platform.power >= 10) {
            this.platform.power -= 10;
            this.platform.addResource(ResourceType.dirt, 2);
        }
    }
}

export class DirtSeller extends Machine {
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
}