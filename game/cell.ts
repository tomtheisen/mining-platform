import { Machine, allMachines, getMachineTypeCode } from "machine";
import { IGameState, ICell, ResourceType } from "commontypes";
import { setText } from "domutil";
import { returnOf } from "util";

const width = 13;
const height = 16;

class CellResource {
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

export default class Cell implements ICell {
    readonly state: IGameState;
    capacity: number;

    private _machines: Machine[] = [];
    machines: ReadonlyArray<Machine> = this._machines;
    
    private _power = 0;
    get power() { return this._power; }
    set power(value: number) {
        setText(".power", this._power = value, this.element);
    }

    private _row: number;
    set row(value: number) {
        this.element.style.top = value * height + 1 + "em";
        this._row = value;
    }

    private _col: number;
    set col(value: number) {
        this.element.style.left = value * width + 1 + "em";
        this._col = value;
    }

    private element: HTMLElement;
    private resources: CellResource[] = [];

    static uniqueId = 0;
    constructor(state: IGameState, capacity = 10) {
        let id = ++Cell.uniqueId;

        this.state = state;
        this.capacity = capacity;

        const template = `
            <div class=cell>
                <input id=mc${id} type=radio checked name=${id} data-show=machines>
                <label for=mc${id} title=machines><i class="fa fa-industry"></i></label>
                <input id=rs${id} type=radio name=${id} data-show=resources>
                <label for=rs${id} title=inventory><i class="fa fa-cubes"></i></label>
                <input id=buy${id} type=radio name=${id} data-show=buy>
                <label for=buy${id} title=add><i class="fa fa-plus-circle"></i></label>
                <input id=out${id} type=radio name=${id} data-show=out>
                <label for=out${id} title=output><i class="fa fa-exchange"></i></label>

                <div class=machine-section>
                    Power: <span class=power>0</span>🗲
                    <ul class=machines></ul>
                </div>
                <div class=resource-section>
                    <ul class=resources></ul>
                </div>
                <div class=out-section>
                    out lol
                </div>
                <div class=buy-section>
                    ${
                        this.state.machineTypes.map(machine => {{
                            let ctor = machine.type;
                            let code = getMachineTypeCode(ctor);
                            return `<a href="javascript:" data-buy-machine="${ code }">${ ctor.label } - §${ ctor.basePrice }</a><br>`;
                        }}).join('')
                    }
                </div>
            </div>`;
        let container = document.createElement("div");
        container.innerHTML = template;
        this.element = container.querySelector("*") as HTMLElement;

        let anchors = this.element.querySelector(".buy-section")!.querySelectorAll("a");
        let i = 0;
        for (let machine of this.state.machineTypes) {
            let anchor = anchors.item(i++);
            machine.props.subscribe("affordable", isAffordable => {
                anchor.style.display = isAffordable ? "initial" : "none";
                return true;
            });
        }

        document.getElementById("cells")!.appendChild(this.element);
        this.element.addEventListener("click", ({ target }) => {
            if (!(target instanceof HTMLElement)) return;

            let buyMachine = target.getAttribute("data-buy-machine");
            if (buyMachine && buyMachine in allMachines) {
                let basePrice = allMachines[buyMachine].basePrice;
                if (this.state.money >= basePrice) {
                    this.state.money -= basePrice;
                    this.addMachine(buyMachine);
                }
            }
        });
    }

    serialize() {
        return {
            power: this.power,
            capacity: this.capacity,
            resources: this.resources.map(r => r.serialize()),
            machines: this.machines.map(m => ({ type: m.getMachineTypeCode(), state: m.serialize() }))
        };
    }
    deserialize(s: any) {
        const serializeType = returnOf(this.serialize);
        let serialized = s as typeof serializeType;

        this.power = serialized.power;
        this.capacity = serialized.capacity;

        this.resources.splice(0);
        serialized.resources.forEach(r => {
            let type = ResourceType.allTypes.filter(t => t.code === r.type)[0];
            this.addResource(type, r.quantity);
        });

        this._machines.splice(0);
        serialized.machines.forEach(m => {
            this.addMachine(m.type).deserialize(m.state);
        });
    }

    dispose() {
        this.element.parentNode!.removeChild(this.element);
    }

    private getMachineElement(): HTMLElement {
        let li = document.createElement("li");
        this.element.querySelector(".machines")!.appendChild(li);
        return li;
    }

    tick() {
        this.machines.forEach(m => m.power());
        this.machines.forEach(m => m.run());
    }

    addMachine(code: string): Machine {
        let ctor = allMachines[code];
        let machine = new ctor(this.state, this, this.getMachineElement());
        this._machines.push(machine);
        return machine;
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
        let newResource = new CellResource(type, li, quantity);
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