import * as Resource from "resources";
import { Machine } from "machine";
import { IGameState, IPlatform } from "commontypes";

export default class Platform implements IPlatform {
    private readonly state: IGameState;
    capacity: number;
    rows = 1;
    columns = 1;
    modules: Machine[] = [];
    power = 0;
    private resources: {
        resource: Resource.Type,
        quantity: number,
    }[] = [];

    constructor(state: IGameState, capacity: number) {
        this.state = state;
        this.capacity = capacity;
    }

    tick() {
        this.modules.forEach(m => m.power());
        this.modules.forEach(m => m.run());
    }
}