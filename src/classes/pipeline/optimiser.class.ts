import { ConfiguratorParamsDTO, ConvergenceTestDTO, OptimiserStateDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData, OptimiserData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";

export abstract class Optimiser<
    T extends ConfiguratorParamData,
    U extends OptimiserParameters,
    V extends OptimiserData
> {
    protected _name: string;
    protected _model: Model;

    constructor(name: string, model: Model) {
        this._name = name;
        this._model = model;
    }

    get name(): string {
        return this._name;
    }

    get model(): Model {
        return this._model;
    }

    abstract initialise(parameters?: U, initData?: any): OptimiserStateDTO<V>;
    abstract update(parameters?: U, state?: OptimiserStateDTO<V>, results?: ConvergenceTestDTO[]): OptimiserStateDTO<V>;
    abstract step(parameters?: U, state?: OptimiserStateDTO<V>, results?: ConvergenceTestDTO[]): OptimiserStateDTO<V>;

    // get the required configurator parameters for the current state; will returned array of structured objects
    // holding the ConfiguratorParameterData that will be required for all simulations the results of which will be
    // needed as inputs to asses the gradient and x values for the optimiser
    abstract getStateRequiredConfiguratorParams(state: OptimiserStateDTO<V>): ConfiguratorParamsDTO<T>[];
}
