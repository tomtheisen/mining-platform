import { Machine, allMachines, getMachineTypeCode } from "machine";
import { IGameState, ICell, ResourceType } from "commontypes";
import { setText, div, span, text } from "domutil";
import { returnOf, Subscriptions } from "util";

const width = 13;
const height = 16;

class CellResource {
    private readonly historyTicks = 24;

    type: ResourceType;

    private _quantity: number = 0;
    get quantity() { return this._quantity; }
    set quantity(value: number) {
        setText(".quantity", this._quantity = value, this.element);
    }

    private quantityHistory: number[] = [];

    element: HTMLElement;

    constructor(type: ResourceType, element: HTMLElement, quantity: number = 0) {
        element.appendChild(span({title: type.name}, 
            span({class: "quantity"}, "0"),
            type.symbol
        ));

        this.type = type;
        this.element = element;
        this.quantity = quantity;
    }

    tick() {
        this.quantityHistory.push(this.quantity);
        if (this.quantityHistory.length > this.historyTicks) {
            this.quantityHistory.shift();
        }
    }

    historyEmpty() {
        return this.quantityHistory.reduce((empty, item) => empty && item === 0, true);
    }

    averageRate() {
        const hist = this.quantityHistory;
        return (hist[hist.length - 1] - hist[0]) / (hist.length - 1);
    }

    dispose() {
        this.element.innerHTML = "";
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
    readonly props = new Subscriptions<Cell>(this);

    readonly state: IGameState;

    private _capacity: number;
    get capacity() { return this._capacity; }
    set capacity(value: number) {
        setText(".capacity", this._capacity = value, this.element);
        this.props.publish("capacity", value);
    }

    private _machines: Machine[] = [];
    machines: ReadonlyArray<Machine> = this._machines;
    
    private _power = 0;
    get power() { return this._power; }
    set power(value: number) {
        setText(".power", this._power = Math.min(value, this.maxPower), this.element);
    }

    private _maxPower = 0;
    get maxPower() { return this._maxPower; }
    set maxPower(value: number) {
        this.power = this.power;
        setText(".max-power", this._maxPower = value, this.element);
        this.props.publish("maxPower", value);
    }

    private _resourceSlots = 0;
    get resourceSlots() { return this._resourceSlots; }
    set resourceSlots(value: number) {
        let el = this.element.querySelector(".resources")!;
        while (el.querySelectorAll("*").length < value) el.appendChild(span({}));
        while (el.querySelectorAll("*").length > value) el.removeChild(el.lastChild!);
        this._resourceSlots = value;
        this.props.publish("resourceSlots", value);
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
    constructor(state: IGameState, capacity: number) {
        let id = ++Cell.uniqueId;

        this.state = state;

        const template = `
            <div class=cell>
                <input id=mc${id} type=radio checked name=${id} data-show=machines>
                <label for=mc${id} title=machines><i class="fa fa-industry"></i></label>
                <!--
                <input id=rs${id} type=radio name=${id} data-show=resources>
                <label for=rs${id} title=inventory><i class="fa fa-cubes"></i></label>
                -->
                <input id=buy${id} type=radio name=${id} data-show=buy>
                <label for=buy${id} title=add><i class="fa fa-plus-circle"></i></label>

                <div class=machine-section>
                    <span class=power></span>🗲/<span class=max-power></span>
                    <span class=machine-count>0</span>/<span class=capacity></span>
                    <div class=resources></div>
                    <ul class=machines></ul>
                </div>
                <div class=resource-section>
                    
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
        this.capacity = capacity;

        let anchors = this.element.querySelector(".buy-section")!.querySelectorAll("a");
        let i = 0;
        for (let machine of this.state.machineTypes) {
            let anchor = anchors.item(i++);
            machine.props.subscribe("affordable", isAffordable => {
                if (isAffordable) {
                    anchor.classList.remove("disabled");
                } else {
                    anchor.classList.add("disabled");
                }
                //anchor.style.display = isAffordable ? "initial" : "none";
                return true;
            });
        }

        document.getElementById("cells")!.appendChild(this.element);
        this.element.addEventListener("click", ({ target }) => {
            if (!(target instanceof HTMLElement)) return;

            let buyMachine = target.getAttribute("data-buy-machine");
            if (buyMachine && buyMachine in allMachines && this.machines.length < this.capacity) {
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
            maxPower: this.maxPower,
            resourceSlots: this.resourceSlots,
            capacity: this.capacity,
            resources: this.resources.map(r => r.serialize()),
            machines: this.machines.map(m => ({ type: m.getMachineTypeCode(), state: m.serialize() }))
        };
    }
    deserialize(s: any) {
        const serializeType = returnOf(this.serialize);
        let serialized = s as typeof serializeType;

        this.maxPower = serialized.maxPower;
        this.power = serialized.power;
        this.capacity = serialized.capacity;
        this.resourceSlots = serialized.resourceSlots;

        this.resources.splice(0);
        serialized.resources.forEach(r => {
            let type = ResourceType.allTypes.filter(t => t.code === r.type)[0];
            this.addResource(type, r.quantity);
        });

        this._machines.splice(0);
        serialized.machines.forEach(m => {
            let machine = this.addMachine(m.type);
            if (!machine) throw "can't deserialize machine because it failed to be added";
            machine.deserialize(m.state);
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

        for (let i=0; i<this.resources.length; i++) {
            let resource = this.resources[i];
            resource.tick();
            if (resource.historyEmpty()) {
                resource.dispose();
                this.resources.splice(i--, 1);
            }
        }
    }

    private updateMachineCount() {
        setText(".machine-count", this.machines.length, this.element);
    }

    addMachine(code: string): Machine | null {
        if (this.machines.length >= this.capacity) return null;

        let ctor = allMachines[code];
        let machine = new ctor(this.state, this, this.getMachineElement());
        this._machines.push(machine);
        this.updateMachineCount();
        return machine;
    }

    removeMachine(machine: Machine): void {
        let index = this.machines.indexOf(machine);
        if (index < 0) throw "machine not found to remove";
        if (!machine) throw `no machine at [${index}] to remove`;
        machine.dispose();
        this._machines.splice(index, 1);
        this.updateMachineCount();
    }

    addResource(type: ResourceType, quantity: number): boolean {
        for (let r of this.resources) {
            if (r.type === type) {
                r.quantity += quantity;
                return true;
            }
        }

        if (this.resources.length >= this.resourceSlots) return false;

        let el = this.element.querySelectorAll(".resources > *")[this.resources.length] as HTMLElement;
        let newResource = new CellResource(type, el, quantity);
        this.resources.push(newResource);
        return true;
    }

    getResource(type: ResourceType): number {
        for (let r of this.resources) {
            if (r.type === type) return r.quantity;
        }
        return 0;
    }

    removeResource(type: ResourceType, quantity: number): boolean {
        for (let r of this.resources) {
            if (r.type === type) {
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