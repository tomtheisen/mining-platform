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
    public readonly name = "Solar Module";

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
    }

    power() {
        this.platform.power += 1;
    }

    run() { }
}

export class Digger extends Machine {
    public readonly name = "Digger";
    
    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
    }

    power() {}

    run() {
        if (this.platform.power >= 10) {
            this.platform.power -= 10;
            this.platform.addResource(ResourceType.dirt, 2);
        }
    }
}

export class DirtSeller extends Machine {
    public readonly name = "Dirt Seller";

    constructor(state: IGameState, platform: IPlatform) {
        super(state, platform);
    }

    power() {}

    run() {
        if (this.platform.power >= 2 && this.platform.getResource(ResourceType.dirt) >= 1) {
            this.platform.power -= 2;
            if (this.platform.removeResource(ResourceType.dirt, 1)) {
                this.state.money += 2;
            }
        }
    }
}