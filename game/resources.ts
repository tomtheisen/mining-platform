export class Type {
    code: string;
    name: string;

    constructor(code: string, name: string) {
        this.code = code;
        this.name = name;
    }
}

export const dirt = new Type("dirt", "Dirt");
export const junk = new Type("junk", "Junk");

export const allTypes: Type[] = [dirt, junk];