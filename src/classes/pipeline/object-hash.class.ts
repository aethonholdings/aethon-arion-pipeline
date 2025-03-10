import hash from "object-hash";

const flatten = require("flat");

// Generate a hash of the data to uniquely identify an object based on its properties, not ID
export class ObjectHash extends String {
    constructor(object: any) {
        // create a copy of the data to avoid modifying the original object
        let tmp: any = JSON.parse(JSON.stringify(object));

        // exclude the ID field as well as any existing hash field
        delete tmp?.id;
        delete tmp?.hash;

        // Flatten the data to ensure that the hash is consistent regardless of the structure of the data
        // then convert the object to an array and sort to ensure that the order of the keys does not affect the hash
        tmp = flatten(tmp);
        const array: string[] = [];
        for (let key in tmp) {
            array.push(`${key}:${tmp[key]}`);
        }
        super(hash(array.sort((a, b) => a.localeCompare(b))));
        return this;
    }
}
