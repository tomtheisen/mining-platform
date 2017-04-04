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
    readonly money: number;
    readonly year: number;
    readonly day: number;
    readonly hour: number;
    readonly machineTypes: ReadonlyArray<IMachineConstructorState>;
    readonly cellPrice: number;

    addMoney(value: number): void;
    removeMoney(value: number): boolean;
    addEmptyCell(row: number, col: number): void;
    removeCell(cell: ICell): void;
}

export interface ICell {
    power: number;

    addResource(type: ResourceType, amount: number): boolean;
    getResource(type: ResourceType): number;
    removeResource(type: ResourceType, amount: number): boolean;
    removeMachine(machine: IMachine): void;
}

export interface IMachine {
    readonly running: boolean;
    readonly elapsed: number;
    getMachineTypeCode(): string;
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

    public static readonly water = new ResourceType("water", "Water", "wr");
    public static readonly dirt = new ResourceType("dirt", "Dirt", "dt");
    public static readonly mud = new ResourceType("mud", "Mud", "md");
    public static readonly brick = new ResourceType("brick", "Brick", "bk");
    public static readonly junk = new ResourceType("junk", "Junk", "jk");

    public static readonly allTypes: ResourceType[] = [ResourceType.dirt, ResourceType.junk, ResourceType.water, ResourceType.mud, ResourceType.brick];
}

