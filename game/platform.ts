import { Machine } from "machine";
import { IGameState, IPlatform, ResourceType } from "commontypes";
import { setText } from "domutil";

class PlatformResource {
    type: ResourceType;
    private _quantity: number = 0;
    get quantity() { return this._quantity; }
    set quantity(value: number) {
        setText(".quantity", this._quantity = value, this.element);
    }
    element: HTMLElement;

    constructor(type: ResourceType, element: HTMLElement, quantity: number = 0) {
        element.innerHTML =  `<span class=quantity>0</span>${type.symbol} (${type.name})`;

        this.type = type;
        this.element = element;
        this.quantity = quantity;
    }

    remove() {
        this.element.remove();
    }
}

export default class Platform implements IPlatform {
    private readonly state: IGameState;
    capacity: number;
    rows = 1;
    columns = 1;
    private _machines: Machine[] = [];
    machines: ReadonlyArray<Machine> = this._machines;
    
    private _power = 0;
    get power() { return this._power; }
    set power(value: number) {
        setText(".power", this._power = value, this.element);
    }

    private element: HTMLElement;
    private resources: PlatformResource[] = [];

    constructor(state: IGameState, capacity: number) {
        const template = `\
            <div class=platform>\
                Power: <span class=power></span>🗲\
                <ul class=resources></ul>\
                <ul class=machines></ul>\
            </div>`;
        this.element = document.createElement("div");
        this.element.innerHTML = template;
        document.getElementById("platforms")!.appendChild(this.element);

        this.state = state;
        this.capacity = capacity;
    }

    getMachineElement(): HTMLElement {
        let li = document.createElement("li");
        this.element.querySelector(".machines")!.appendChild(li);
        return li;
    }

    tick() {
        this.machines.forEach(m => m.power());
        this.machines.forEach(m => m.run());
    }

    addMachine(m: Machine) {
        this._machines.push(m);
    }

    addResource(type: ResourceType, quantity: number) {
        for (let r of this.resources) {
            if (r.type === type) {
                r.quantity += quantity;
                return;
            }
        }
        let li = document.createElement("li");
        this.element.querySelector(".resources")!.appendChild(li);
        let newResource = new PlatformResource(type, li, quantity);
        this.resources.push(newResource);
    }

    getResource(type: ResourceType): number {
        for (let r of this.resources) {
            if (r.type === type) return r.quantity;
        }
        return 0;
    }

    removeResource(type: ResourceType, quantity: number) {
        let i = 0;
        for (let r of this.resources) {
            if (r.type === type) {
                if (r.quantity >= quantity) {
                    r.quantity -= quantity;
                    if (r.quantity === 0) {
                        r.remove();
                        this.resources.splice(i, 1);
                    }
                    return true;
                }
                return false;
            }
            i += 1;
        }
        return false;
    }
}