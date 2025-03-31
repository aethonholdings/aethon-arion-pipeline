import { ConvergenceTestDTO, OptimiserStateDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData, OptimiserData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";

export abstract class Optimiser<
    T extends ConfiguratorParamData,
    U extends OptimiserParameters,
    V extends OptimiserData
> {
    protected _name: string;
    protected _model: Model<T, U, V>;
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

    updateParameters(parameters: U): void {
        this._parameters = parameters;
    }

    abstract initialise(): OptimiserStateDTO<V>;
    abstract update(state: OptimiserStateDTO<V>, results?: ConvergenceTestDTO[]): OptimiserStateDTO<V>;
    abstract step(state: OptimiserStateDTO<V>): OptimiserStateDTO<V>;

    // get the required configurator parameters for the current state; will returned array of structured objects
    // holding the ConfiguratorParameterData that will be required for all simulations the results of which will be
    // needed as inputs to asses the gradient and x values for the optimiser
    abstract getStateRequiredConfiguratorParams(state: OptimiserStateDTO<V>): {
        multipleOrgConfigs: boolean;
        configuratorParams: { configuratorParamData: ConfiguratorParamData; hash: string };
    }[];
}
