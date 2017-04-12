import { Machine, allMachines, getMachineTypeCode } from "machine";
import { IGameState, ICell, ResourceType } from "commontypes";
import { setText, div, span, text, li, fa, option, img } from "domutil";
import { returnOf, Subscriptions } from "util";

const width = 16;
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
        element.appendChild(span({ title: type.name },
            span({ class: "quantity" }, "0"),
            type.img
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
        return (this.quantityHistory.length === this.historyTicks
            && this.quantityHistory.reduce((a, b) => a + b, 0) === 0);
    }

    averageRate() {
        const hist = this.quantityHistory;
        return (hist[hist.length - 1] - hist[0]) / (hist.length - 1);
    }

    dispose() {
        this.element.remove();
    }

    serialize() {
        return {
            type: this.type.code,
            quantity: this.quantity,
        };
    }
    deserialize(state: any) { }
}

export class Cell implements ICell {
    readonly props = new Subscriptions<Cell>(this);
    readonly state: IGameState;
    private disposed = false;

    private _capacity: number;
    get capacity() { return this._capacity; }
    set capacity(value: number) {
        let el = this.element.querySelector(".machines")!;
        while (el.childNodes.length < value) el.appendChild(li({}));
        while (el.childNodes.length > value) el.removeChild(el.lastChild!);

        this.props.publish("capacity", this._capacity = value);
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
        while (el.childNodes.length < value) el.appendChild(span({}));
        while (el.childNodes.length > value) el.removeChild(el.lastChild!);
        this._resourceSlots = value;
        this.props.publish("resourceSlots", value);
    }

    private _row: number;
    set row(value: number) {
        this.element.style.top = value * height + 5 + "em";
        this._row = value;
    }
    get row() { return this._row; }

    private _col: number;
    set col(value: number) {
        this.element.style.left = value * width + 1 + "em";
        this._col = value;
    }
    get col() { return this._col; }

    private element: HTMLElement;
    private resources: CellResource[] = [];

    static uniqueId = 0;
    constructor(state: IGameState, capacity: number) {
        let id = ++Cell.uniqueId;

        this.state = state;

        const template = `
            <div class=cell style="width: ${width - 1}em; height: ${height - 1}em;">
                <input id=mc${id} type=radio checked name=${id} data-show=machines>
                <label for=mc${id} title=machines><i class="fa fa-industry"></i></label>
                <!--
                <input id=rs${id} type=radio name=${id} data-show=resources>
                <label for=rs${id} title=inventory><i class="fa fa-cubes"></i></label>
                -->
                <input id=buy${id} type=radio name=${id} data-show=buy>
                <label for=buy${id} title=add><i class="fa fa-plus-circle"></i></label>
                <input id=set${id} type=radio name=${id} data-show=set>
                <label for=set${id} title=settings><i class="fa fa-gear"></i></label>

                <div class=machine-section>
                    <span class=power></span>🗲/<span class=max-power></span>
                    <div class=resources></div>
                    <ul class=machines></ul>
                </div>
                <div class=resource-section>
                    
                </div>
                <div class=buy-section>
                    ${
                        this.state.machineTypes.map(machine => {
                            {
                                let ctor = machine.type;
                                let code = getMachineTypeCode(ctor);
                                return `<button href="javascript:" data-buy-machine="${code}">${ctor.label} - §${ctor.basePrice}</button><br>`;
                            }
                        }).join('')
                    }
                </div>
                <div class=settings-section>
                    <button class=dispose-cell>
                        <i class="fa fa-times"></i>
                        scrap cell
                    </button>

                </div>
            </div>`;
        let container = document.createElement("div");
        container.innerHTML = template;
        this.element = container.querySelector("*") as HTMLElement;
        this.capacity = capacity;

        let anchors = this.element.querySelectorAll(".buy-section [data-buy-machine]");
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
                if (this.state.removeMoney(basePrice)) this.addMachine(buyMachine);
            }

            if (target.classList.contains("dispose-cell")) {
                this.dispose();
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
            if (!type) throw "attempted to load unknown resource code " + r.type;
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
        this.machines.forEach(m => m.dispose());
        this.resources.forEach(r => r.dispose());
        this.element.parentNode!.removeChild(this.element);
        this.disposed = true;
        this.state.removeCell(this);
    }

    tick() {
        this.machines.forEach(m => m.power());
        this.machines.forEach(m => m.run());

        // drop orphaned resource slots
        for (let i = 0; i < this.resources.length; i++) {
            let resource = this.resources[i];
            resource.tick();
            if (resource.historyEmpty()) {
                resource.dispose();
                this.resourceSlots = this.resourceSlots;

                [].forEach.call(
                    this.element.querySelectorAll(".output-chooser"),
                    (select: HTMLSelectElement) => select.options.remove(i + 1));

                this.resources.splice(i--, 1);
            }
        }
    }

    addMachine(code: string): Machine | null {
        if (this.machines.length >= this.capacity) return null;

        let ctor = allMachines[code];
        // first empty slot <li>
        let el = this.element.querySelectorAll(".machines > *")[this.machines.length] as HTMLElement;
        let machine = new ctor(this.state, this, el);
        this._machines.push(machine);

        return machine;
    }

    removeMachine(machine: Machine): void {
        let index = this.machines.indexOf(machine);
        if (index < 0) throw "machine not found to remove";
        if (!machine) throw `no machine at [${index}] to remove`;

        machine.dispose();
        this._machines.splice(index, 1);
        this.capacity = this.capacity;
    }

    addResource(type: ResourceType, quantity: number): boolean {
        for (let r of this.resources) {
            if (r.type === type) {
                r.quantity += quantity;
                return true;
            }
        }

        if (this.resources.length >= this.resourceSlots) return false;

        let el = this.element.querySelector(".resources > *:empty") as HTMLElement;
        let newResource = new CellResource(type, el, quantity);
        this.resources.push(newResource);

        [].forEach.call(
            this.element.querySelectorAll(".output-chooser"),
            (select: HTMLSelectElement) => select.options.add(option(type.code, type.name)));

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

export class BuyPlaceHolder {
    state: IGameState;
    row: number;
    col: number;
    disposed = false;
    element: HTMLElement;

    constructor(state: IGameState, row: number, col: number) {
        this.state = state;
        this.row = row;
        this.col = col;

        let style = `top: ${row * height + 5}em; left: ${col * height + 1}em; width: ${width - 1}em; height: ${height - 1}em;`;
        this.element = div({ class: "buy-placeholder", style },
            span({ class: "label" },
                "Buy for §",
                span({ class: "buy-cell-price" }, state.cellPrice)),
            div({ class: "watermark" }, fa("fa-plus-circle"))
        );
        document.getElementById("cells")!.appendChild(this.element);

        this.element.addEventListener("click", ev => this.buy());
    }

    buy() {
        this.dispose();
        this.state.addEmptyCell(this.row, this.col);
    }

    dispose() {
        this.element.remove();
        this.disposed = true;
    }
}