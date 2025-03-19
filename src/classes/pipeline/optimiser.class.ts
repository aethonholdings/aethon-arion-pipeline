import { OptimiserStateDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData, OptimiserData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";

export abstract class Optimiser<T extends ConfiguratorParamData, U extends OptimiserParameters, V extends OptimiserData> {
    protected _name: string;
    protected _model: Model<T, U, V>
    protected _parameters: U;

    constructor(name: string, model: Model<T, U, V>, parameters: U) {
        this._name = name;
        this._model = model;
        this._parameters = parameters;
    }

    get name(): string {
        return this._name;
    }

    get model(): Model<T, U, V> {
        return this._model;
    }

    get parameters(): U {
        return this._parameters;
    }

    abstract step(state: OptimiserStateDTO<V>): OptimiserStateDTO<V>

    updateParameters(parameters: U): void {
        this._parameters = parameters;
    }
}
