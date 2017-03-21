export interface IGameState {
    money: number;
    readonly year: number;
    readonly day: number;
    readonly hour: number;
}

export interface IPlatform {
    power: number;

    addResource(type: ResourceType, amount: number): void;
    getResource(type: ResourceType): number;
    removeResource(type: ResourceType, amount: number): boolean;
    getMachineElement(): HTMLElement;
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

    public static readonly dirt = new ResourceType("dirt", "Dirt", "🝙");
    public static readonly junk = new ResourceType("junk", "Junk", "🝩");

    public static readonly allTypes: ResourceType[] = [ResourceType.dirt, ResourceType.junk];
}