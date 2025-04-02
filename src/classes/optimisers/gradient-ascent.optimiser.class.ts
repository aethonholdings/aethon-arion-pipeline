import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";
import {
    ConfiguratorParamData,
    DataPoint,
    Domain,
    OptimiserData,
    OptimiserParameters
} from "../../types/pipeline.types";
import { Model } from "../pipeline/model.class";
import { Optimiser } from "../pipeline/optimiser.class";
import { DomainTypes } from "../../constants/pipeline.constants";

const flatten = require("flat");

// optimiser data structures specific to gradient ascent optimiser
export interface GradientAscentOptimiserData<T extends ConfiguratorParamData> extends OptimiserData {
    dataPoints: DataPoint<ConfiguratorParamsDTO<T>, GradientAscentOutput>[];
}

// Gradient ascent partial derivative ----------------------------------
// configuratorParameterValueName: a string ID of the configurator param used as an input to the simulations
// configuratorParameterValue: the configurator param used as an input to the simulations
// x: the mapped value of the param
// xDelta: the change in the param value for this iteration of the optimisation
// performance: the output of the simulation
// performanceDelta: the change in the output for this iteration of the optimisation
// slope: the gradient of the performance
// configuratorId: the id of the configurator used as the current point of the optimisation
export interface GradientAscentOutput {
    configuratorParameterValue?: any;
    xPlusDelta?: number;
    xDelta?: number;
    performance?: number;
    performanceDelta?: number;
    slope?: number;
}

export interface GradientAscentParameters extends OptimiserParameters {
    iterations: { learningRate: number; tolerance: number; max?: number };
    parameterSpace: {
        id: string;
        domain: Domain;
    }[];
}

export abstract class GradientAscentOptimiser<
    T extends ConfiguratorParamData,
    U extends GradientAscentParameters,
    V extends OptimiserData
> extends Optimiser<T, U, V> {
    protected _boundIndices = {
        MAX: 1,
        MIN: 0
    };
    protected _parameterKeys: string[] = [];
    protected _parameterDomains: { [key: string]: Domain } = {};

    constructor(name: string, model: Model<T, U, V>, parameters: U) {
        super(name, model, parameters);
        for (let parameter of this._parameters.parameterSpace) {
            this._parameterKeys.push(parameter.id);
            if (parameter.domain) this._parameterDomains[parameter.id] = parameter.domain;
        }
        this._checkBounds();
    }

    protected _checkBounds(): void {
        if (this._parameters.parameterSpace) {
            this._parameterKeys.forEach((parameterKey: string) => {
                if (
                    this._parameterDomains[parameterKey].type !== DomainTypes.CATEGORICAL &&
                    this._parameterDomains[parameterKey].type !== DomainTypes.BOOLEAN
                ) {
                    if (
                        this._parameterDomains[`${parameterKey}.${this._boundIndices.MIN}`] >
                        this._parameterDomains[`${parameterKey}.${this._boundIndices.MAX}`]
                    ) {
                        throw new Error(
                            `The parameter space definition max must be higher than min for ${parameterKey}`
                        );
                    }
                }
            });
        } else {
            throw this._initError();
        }
    }

    protected _initError(): Error {
        return new Error("The optimiser has not been initialised");
    }

    protected abstract _validateConfiguratorParamData(configuratorParamData: any): void;
}
