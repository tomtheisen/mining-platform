import Platform from "platform";

export abstract class Module {
    readonly platform: Platform;
    abstract readonly name: string;
    abstract tick(): void;

    constructor(platform: Platform) {
        this.platform = platform;
    }

}