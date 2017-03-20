import * as Resource from "resources";
import {Module} from "module";

export default class Platform {
    size: number;
    private resources: {
        resource: Resource.Type,
        quantity: number,
     }[] = [];
     private modules: Module[] = [];

    constructor() {
        Resource
    }

    tick() {
        this.modules.forEach(m => m.tick());
    }
}