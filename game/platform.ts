import { Machine } from "machine";
import { IGameState, IPlatform, ResourceType } from "commontypes";
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
        resource: ResourceType,
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

    addResource(type: ResourceType, quantity: number) {
        for (let r of this.resources) {
            if (r.resource === type) {
                r.quantity += quantity;
                return;
            }
        }
        this.resources.push({ resource: type, quantity });
    }

    getResource(type: ResourceType): number {
        for (let r of this.resources) {
            if (r.resource === type) return r.quantity;
        }
        return 0;
    }

    removeResource(type: ResourceType, quantity: number) {
        for (let r of this.resources) {
            if (r.resource === type) {
                if (r.quantity >= quantity) {
                    r.quantity -= quantity;
                    return true;
                }
                return false;
            }
        }
        return false;
    }
}