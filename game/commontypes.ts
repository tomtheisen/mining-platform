import { Subscriptions } from "util";

export interface MachineMetadata {
    basePrice: number;
    label: string;
}

export interface IMachineConstructorState {
    readonly type: MachineMetadata;
    readonly affordable: boolean;
    readonly props: Subscriptions<IMachineConstructorState>;
}

export interface IGameState {
    money: number;
    readonly year: number;
    readonly day: number;
    readonly hour: number;
    readonly machineTypes: ReadonlyArray<IMachineConstructorState>;
}

export interface ICell {
    power: number;

    addResource(type: ResourceType, amount: number): void;
    getResource(type: ResourceType): number;
    removeResource(type: ResourceType, amount: number): boolean;
}

export class ResourceType {
    code: string;
    name: string;
    symbol: string;

    constructor(code: string, name: string, symbol: string) {
        this.code = code;
        this.name = name;
        this.symbol = symbol;
    }

    public static readonly dirt = new ResourceType("dirt", "Dirt", "drt");
    public static readonly junk = new ResourceType("junk", "Junk", "jnk");

    public static readonly allTypes: ResourceType[] = [ResourceType.dirt, ResourceType.junk];
}

