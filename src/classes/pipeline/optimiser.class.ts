import { ConfiguratorParamData, OptimiserData } from "../../types/pipeline.types";

export abstract class Optimiser<T extends ConfiguratorParamData, U extends OptimiserData> {
    protected _name: string;

    constructor(name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    abstract next(configuratorParamData: T): U;
    abstract testConvergence(optimiserData: U[]): boolean;
}
