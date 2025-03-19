import {
    ConfiguratorParamData,
    OptimiserData,
    OptimiserParameters,
    RandomStreamType,
    StateType
} from "../types/pipeline.types";

// -- MODEL ----------------------------------
// Index of all model variables
export interface ModelIndexDTO {
    reporting?: {
        variableNames: string[];
        arrayIndex: { [key: string]: number };
    };
    plant?: {
        variableNames: string[];
        arrayIndex: { [key: string]: number };
    };
    agentSet?: {
        states: {
            variableNames: string[];
            arrayIndex: { [key: string]: number };
        };
    };
    board?: {
        variableNames: string[];
        arrayIndex: { [key: string]: number };
    };
}

export interface ModelParamsDTO {
    name: string;
    configurators: string[];
    optimisers: {
        name: string;
        parameters: OptimiserParameters;
    }[];
    kpiFactories: string[];
}

// -- OPTIMISER ----------------------------------
// DTO encapsulating optimiser state
export interface OptimiserStateDTO<T extends ConfiguratorParamData, U extends OptimiserData> {
    id?: number;
    simSet: SimSetDTO;
    stepCount: number;
    start: Date;
    end: Date;
    modelName: string;
    optimiserName: string;
    durationSec: number;
    percentComplete: number;
    status: StateType;
    configuratorParams: ConfiguratorParamsDTO<T>;
    optimiserData: U;
}

// optimiser data structure specific to gradient ascent optimiser
// ----------------------------------
// configuratorParameterValueName: a string ID of the configurator param used as an input to the simulations
// configuratorParameterValue: the configurator param used as an input to the simulations
// x: the mapped value of the param
// xDelta: the change in the param value for this iteration of the optimisation
// performance: the output of the simulation
// performanceDelta: the change in the output for this iteration of the optimisation
// slope: the gradient of the performance
// configuratorId: the id of the configurator used as the current point of the optimisation
export interface GradientAscentPartialDerivativeDTO<T extends ConfiguratorParamData> {
    configuratorParameterValueName: any;
    configuratorParameterValue: any;
    x: number;
    xDelta: number;
    performance: number | undefined;
    performanceDelta: number | undefined;
    slope: number | undefined;
    configuratorParams: ConfiguratorParamsDTO<T>;
    status: StateType;
}

export type Gradient<T extends ConfiguratorParamData> = GradientAscentPartialDerivativeDTO<T>[];

export interface GradientAscentParameterDTO<T> extends OptimiserParameters {
    learningRate: number;
    tolerance: number;
    parameterSpaceDefinition: T;
}

// -- CORE MODEL OBJECT DTOs -------------------------------
export interface SimConfigDTO {
    id?: number;
    simConfigParamsDTO?: SimConfigParamsDTO;
    orgConfigId: number;
    orgConfig?: OrgConfigDTO;
    runCount: number;
    days: number;
    randomStreamType: RandomStreamType;
    start?: Date;
    end?: Date;
    durationSec?: number;
    avgPerformance?: number;
    stdDevPerformance?: number;
    entropy?: number;
    results?: ResultDTO[];
    debug?: string[];
    state?: StateType;
}

export interface SimConfigParamsDTO {
    id?: number;
    convergenceTests: ConvergenceTestDTO[];
    simConfigs: SimConfigDTO[];
    days: number;
    randomStreamType: RandomStreamType;
}

export interface SimSetDTO {
    id?: number;
    description: string;
    modelName: string;
    modelParams?: ModelParamsDTO;
}

export interface OrgConfigDTO {
    id?: number;
    type: string;
    clockTickSeconds: number;
    agentCount: number;
    board: BoardDTO;
    agentSet: AgentSetTensorsDTO;
    plant: PlantDTO;
    reporting: ReportingDTO;
    priorityIntensity: number;
    influenceIntensity: number;
    judgmentIntensity: number;
    incentiveIntensity: number;
    configuratorParams: ConfiguratorParamsDTO<ConfiguratorParamData>;
    simConfigs?: SimConfigDTO[];
    configuratorName?: string;
}

export interface BoardDTO {}

export interface PlantDTO {}

export interface ReportingDTO {}

export interface AgentSetTensorsDTO {
    priorityTensor: number[][][];
    influenceTensor: number[][][][];
    judgmentTensor: number[][][][];
    incentiveTensor: number[][][][];
}

export interface StateSpacePointDTO {
    id?: number;
    resultId?: number;
    result?: ResultDTO;
    clockTick: number;
    board: number[];
    agentStates: number[];
    priorityTensor: number[][][];
    plant: number[];
    reporting: number[];
}

export interface ResultDTO {
    id?: number;
    simConfigId?: number;
    orgConfigId?: number;
    simConfig?: SimConfigDTO;
    runCount: number;
    nodeId: string;
    start: Date;
    end: Date;
    durationSec: number;
    board: number[];
    agentStates: number[];
    priorityTensor: number[][][];
    plant: number[];
    reporting: number[];
    priorityIntensity?: number;
    performance?: number;
    stateSpace?: StateSpacePointDTO[];
    agentCount?: number;
    orgConfigType?: string;
    configuratorName?: string;
    configuratorParams?: ConfiguratorParamsDTO<ConfiguratorParamData>;
}

export interface ConvergenceTestDTO {
    id?: number;
    simConfigParams: SimConfigParamsDTO;
    configuratorParams: ConfiguratorParamsDTO<ConfiguratorParamData>;
    orgConfigCount: number;
    simConfigCount: number;
    completedSimConfigCount: number;
    resultCount: number;
    dispatchedRuns: number;
    avgPerformance: number;
    stdDevPerformance: number;
    processingTimeSec: number;
    state: StateType;
}

export interface ConfiguratorParamsDTO<T extends ConfiguratorParamData> {
    id?: number;
    modelName: string;
    configuratorName: string;
    data: T;
    hash?: string;
}

// -- KPIs ----------------------------------
export interface KPIDTO<KPIs> {
    id?: number;
    name?: string;
    modelName?: string;
    timestamp?: Date;
    data: KPIs;
}

export type KPIs = any;
