import { SpecificMachine, allMachines, getMachineTypeName } from "machine";
import { IGameState, IPlatform, ResourceType } from "commontypes";
import { setText } from "domutil";
import { returnOf } from "util";

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

    serialize() {
        return {
            type: this.type.code,
            quantity: this.quantity,
        };
    }
    deserialize(state: any) {}
}

export default class Platform implements IPlatform {
    private readonly state: IGameState;
    capacity: number;
    rows = 1;
    columns = 1;
    private _machines: SpecificMachine[] = [];
    machines: ReadonlyArray<SpecificMachine> = this._machines;
    
    private _power = 0;
    get power() { return this._power; }
    set power(value: number) {
        setText(".power", this._power = value, this.element);
    }

    private element: HTMLElement;
    private resources: PlatformResource[] = [];

    constructor(state: IGameState, capacity: number) {
        const template = `
            <div class=platform>
                Power: <span class=power></span>🗲
                <div class=buy-menu>
                    buy
                    <div class=buy-dropdown>
                        ${Object.keys(allMachines)
                            .map((k: keyof typeof allMachines) => `<a href="javascript:" data-buy-machine="${k}">${k} - §${ allMachines[k].basePrice }</a><br>`)
                            .join('')}
                    </div>
                </div>
                <ul class=machines></ul>
                <ul class=resources></ul>
            </div>`;
        this.element = document.createElement("div");
        this.element.innerHTML = template;
        document.getElementById("platforms")!.appendChild(this.element);
        this.element.addEventListener("click", ev => {
            let target = ev.target;
            if (target instanceof HTMLElement) {
                let buyMachine = target.getAttribute("data-buy-machine");
                if (buyMachine && buyMachine in allMachines) {
                    let ctor = allMachines[buyMachine as keyof typeof allMachines];
                    if (this.state.money >= ctor.basePrice) {
                        this.addMachine(new ctor(this. state, this));
                        this.state.money -= ctor.basePrice;
                    }
                }
            }
        });

        this.state = state;
        this.capacity = capacity;
        this.power = this.power; // invoke setter
    }

    serialize() {
        return {
            power: this.power,
            rows: this.rows,
            capacity: this.capacity,
            columns: this.columns,
            resources: this.resources.map(r => r.serialize()),
            machines: this.machines.map(m => ({ type: getMachineTypeName(m), state: m.serialize() }))
        };
    }
    static readonly serializeType = returnOf((p: Platform) => p.serialize());
    deserialize(serialized: typeof Platform.serializeType) {
        this.power = serialized.power;
        this.rows = serialized.rows;
        this.columns = serialized.columns;
        this.capacity = serialized.capacity;

        this.resources.splice(0);
        serialized.resources.forEach(r => {
            let type = ResourceType.allTypes.filter(t => t.code === r.type)[0];
            this.addResource(type, r.quantity);
        });

        this._machines.splice(0);
        serialized.machines.forEach(m => {
            let ctor = allMachines[m.type];
            let machine = new ctor(this.state, this);
            machine.deserialize(m.state);
            this.addMachine(machine);
        });
    }

    removeElement() {
        this.element.parentNode!.removeChild(this.element);
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

    addMachine(m: SpecificMachine) {
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