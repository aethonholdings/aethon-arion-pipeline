import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";
import {
    ConfiguratorParamData,
    DataPoint,
    Domain,
    OptimiserData,
    OptimiserParameters,
    ParameterSpace
} from "../../types/pipeline.types";
import { Model } from "../pipeline/model.class";
import { Optimiser } from "../pipeline/optimiser.class";
import { DomainTypes } from "../../constants/pipeline.constants";

const flatten = require("flat");

// optimiser data structures specific to gradient ascent optimiser
export interface GradientAscentOptimiserData<T extends ConfiguratorParamData> extends OptimiserData {
    dataPoints: DataPoint<ConfiguratorParamsDTO<T>, GradientAscentOutput>[];
    moduloDel: number | undefined;
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
    id: string;
    domain: Domain;
    configuratorParameterValue: number | string | boolean;
    xPlusDelta: number | undefined;
    xDelta: number | undefined;
    performance: number | undefined;
    performanceDelta: number | undefined;
    slope: number | undefined;
}

export interface GradientAscentParameters extends OptimiserParameters {
    iterations: { learningRate: number; tolerance: number; max?: number };
    parameterSpace: ParameterSpace;
    init: { type: "random" } |  {type: "defined", config: ConfiguratorParamData }
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

    constructor(name: string, model: Model) {
        super(name, model);
    }

    protected _checkDomains(domains: Domain[]): void {
        domains.forEach((domain: Domain) => {
            if (domain.type !== DomainTypes.CATEGORICAL && domain.type !== DomainTypes.BOOLEAN && domain.optimise) {
                if (domain.min > domain.max) {
                    throw new Error(`The parameter space definition max must be higher than min for ${domain}`);
                }
            }
        });
    }

    protected _initError(): Error {
        return new Error("The optimiser has not been initialised");
    }
}
