import { OptimiserData } from "../../types/pipeline.types";

export abstract class Optimiser<T, U extends OptimiserData> {
    protected _name: string;

    constructor(name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    abstract next(optimisationInput: T): U;
    abstract testConvergence(optimiserData: U[]): boolean;
}
