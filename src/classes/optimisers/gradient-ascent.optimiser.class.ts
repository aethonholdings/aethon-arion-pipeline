import { GradientAscentParameterDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData, OptimiserData } from "../../types/pipeline.types";
import { Model } from "../pipeline/model.class";
import { Optimiser } from "../pipeline/optimiser.class";

export abstract class GradientAscentOptimiser<
    T extends ConfiguratorParamData,
    U extends GradientAscentParameterDTO<any, any>,
    V extends OptimiserData
> extends Optimiser<T, U, V> {
    protected _boundIndices = {
        MAX: 1,
        MIN: 0
    };
    
    constructor(name: string, model: Model<T, U, V>, parameters: U) {
        super(name, model, parameters);
        this._checkBounds();
    }

    protected abstract _checkBounds(): void;
    protected abstract _validateConfiguratorParamData(configuratorParamData: any): void;
}
