import { ConfiguratorParamData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";

export abstract class Optimiser<T extends ConfiguratorParamData, U extends OptimiserParameters> {
    protected _name: string;
    protected _model: Model<T, U>
    protected _parameters: U;

    constructor(name: string, model: Model<T, U>, parameters: U) {
        this._name = name;
        this._model = model;
        this._parameters = parameters;
    }

    get name(): string {
        return this._name;
    }

    get model(): Model<T, U> {
        return this._model;
    }

    get parameters(): U {
        return this._parameters;
    }

    updateParameters(parameters: U): void {
        this._parameters = parameters;
    }
}
