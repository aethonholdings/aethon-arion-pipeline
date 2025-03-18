import { Gradient } from '../../interfaces/dto.interfaces';
import { ConfiguratorParamData, ParamSpaceDefinition } from '../../types/pipeline.types';
import { Model } from '../pipeline/model.class';
import { Optimiser } from '../pipeline/optimiser.class';

export abstract class GradientAscentOptimiser<T extends ConfiguratorParamData, U extends ParamSpaceDefinition> extends Optimiser<T> {
    protected _init: boolean = false;
    protected _learningRate?: number;
    protected _tolerance?: number;
    protected _parameterSpaceDefinition?: U;

    constructor(
        name: string,
        model: Model<T>
    ) {
        super(name, model);
    }

    public init(learningRate: number, tolerance: number, parameterSpaceDefinition: U): void {
        this._learningRate = learningRate;
        this._tolerance = tolerance;
        this._parameterSpaceDefinition = parameterSpaceDefinition;
        this._checkBounds();
        this._init = true;
    }

    public abstract getGradient(configuratorParamData: T): Gradient<T>;
    public abstract getNextPoint(configuratorParamData: T, gradient: Gradient<T>): T;
    public abstract testConvergence(gradient: Gradient<T>): boolean;
    protected abstract _checkBounds(): void;
    protected abstract _validateConfiguratorParamData(configuratorParamData: any): void;
}