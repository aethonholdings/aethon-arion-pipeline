import hash from "object-hash";

/**
 * Content hash that identifies an object by its properties rather than its database id.
 *
 * @remarks
 * - `id` and `hash` fields at the top level are ignored.
 * - The hash is independent of object key order but preserves value types and structure, so for example
 *   `{a: 1}` and `{a: "1"}`, or `{a: {b: 1}}` and `{"a.b": 1}`, hash differently. (The previous implementation
 *   flattened the object to `key:value` strings, which collided in these cases, and sorted with the
 *   locale-dependent `localeCompare`.)
 * - Values are normalised through JSON first, so `undefined` fields are ignored and dates hash as ISO strings.
 */
export class ObjectHash extends String {
    constructor(object: any) {
        const tmp: any = object === undefined ? null : JSON.parse(JSON.stringify(object));
        if (tmp && typeof tmp === "object" && !Array.isArray(tmp)) {
            delete tmp.id;
            delete tmp.hash;
        }
        super(hash(tmp, { algorithm: "sha1", unorderedObjects: true, unorderedArrays: false }));
        return this;
    }
}
