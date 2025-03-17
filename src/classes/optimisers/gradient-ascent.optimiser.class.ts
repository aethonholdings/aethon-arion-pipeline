import { GradientAscentOptimiserData } from '../../interfaces/dto.interfaces';
import { ConfiguratorParamData, ParamSpaceDefinition } from '../../types/pipeline.types';
import { Model } from '../pipeline/model.class';
import { Optimiser } from '../pipeline/optimiser.class';

export abstract class GradientAscentOptimiser<T extends ConfiguratorParamData, U extends ParamSpaceDefinition> extends Optimiser<T> {
    protected _learningRate: number;
    protected _tolerance: number;
    protected _parameterSpaceDefinition: U;

    constructor(
        name: string,
        learningRate: number,
        tolerance: number,
        parameterSpaceDefinition: U,
        model: Model<T>
    ) {
        super(name, model);
        this._learningRate = learningRate;
        this._tolerance = tolerance;
        this._parameterSpaceDefinition = parameterSpaceDefinition;
        this._checkBounds();
    }

    public abstract getNextPoint(configuratorParamData: T): GradientAscentOptimiserData;
    protected abstract _checkBounds(): void;
    protected abstract _validateConfiguratorParamData(configuratorParamData: any): void;
}