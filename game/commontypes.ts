import { Subscriptions } from "util";
import * as domutil from "domutil";

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

    readonly cells: ICell[][]

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

    readonly props: Subscriptions<ICell>;
    readonly row: number;
    readonly col: number;
}

export interface IMachine {
    readonly running: boolean;
    readonly elapsed: number;
    getMachineTypeCode(): string;
}

export class ResourceType {
    code: string;
    name: string;
    imgUrl: string;

    constructor(code: string, name: string, imgUrl: string) {
        this.code = code;
        this.name = name;
        this.imgUrl = imgUrl;
    }

    get img() { return domutil.img({class: "resource"}, this.imgUrl); }

    public static readonly water = new ResourceType("water", "Water", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAuklEQVQ4T2NkQAMJmTn/0cWQ+QumT2FE5qNwQBJkGwDT+OTRI7AFX798BtPcPLwoDpKRkwPzYS6Bu4BsA2Aab167Cjb5kWkKmP7w9QeKzaKiomC+ytk5YBrmEkaKDXDx9gOHOszE1QyG+CKBIZThPFge5mJGqhkAsxbmElzOgNkMk4e7gGoGwAxCTwcwPrrLMFxAsgEwDbDAxGUzLEXC5I8f3A9OhPCUSLEBxLoEZjM8FtADhZBL0A0AAJNYhslSofbvAAAAAElFTkSuQmCC");
    public static readonly dirt = new ResourceType("dirt", "Dirt", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbUlEQVQ4T2NkoBAwUqifYdQABtxhMClI7T8ogI/deQ0O5xWX3mMNL5yBSLYBEXqCYJutVETBNsNc8ODjHzD/xMPPKJZiuIBsA2BOhiUsmM2EXAJ3AdkGoAcWLhsV+FnAjoOFBcyljBQbMOCZCQChw1bXPI4PmAAAAABJRU5ErkJggg==");
    public static readonly mud = new ResourceType("mud", "Mud", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAg0lEQVQ4T2NkoBAwUqifYRAYMNlH+T+yN+R0zcHcH6+fgGkOURkw/ejySTANk4fpYaTYgJUpdiguePXiKdZwhdmM7hJGig2AeUFMQhpsM8wFMD4sDHCFCTwMyDYA5gV0m2EBARMnGAYUG4BuI8xLuFwCCxOcsUCyAeheINZLcBeQawAAKWt8v8+oRp4AAAAASUVORK5CYII=");
    public static readonly brick = new ResourceType("brick", "Brick", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAATklEQVQ4T2NkoBAwUqifAcOASfb2/0kxlHoGkGrz+bt3wQ6Fu4BsA5rV1Ejy871v31CCiHHUAIaBC4P5T56AkwDZLoAbQEq6x6aW4twIAMxxNu/5r5eTAAAAAElFTkSuQmCC");
    //public static readonly junk = new ResourceType("junk", "Junk", "jk");

    public static readonly allTypes: ResourceType[] = [ResourceType.dirt, /* ResourceType.junk, */ ResourceType.water, ResourceType.mud, ResourceType.brick];
}

