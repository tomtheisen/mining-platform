import * as Resource from "resources";
import { Machine } from "machine";
import { IGameState, IPlatform } from "commontypes";
import { setText } from "domutil";

export default class Platform implements IPlatform {
    private readonly state: IGameState;
    capacity: number;
    rows = 1;
    columns = 1;
    modules: Machine[] = [];
    
    private _power = 0;
    get power() { return this._power; }
    set power(value: number) {
        setText(".power", this._power = value, this.element);
    }

    private element: HTMLElement;
    private resources: {
        resource: Resource.Type,
        quantity: number,
    }[] = [];

    constructor(state: IGameState, capacity: number, ui: HTMLElement) {
        this.state = state;
        this.capacity = capacity;
        this.element = ui;
    }

    tick() {
        this.modules.forEach(m => m.power());
        this.modules.forEach(m => m.run());
    }
}