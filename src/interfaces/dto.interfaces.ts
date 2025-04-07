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
    configurators: { list: string[]; default: string };
    optimisers: { list: string[]; default: string; };
    kpiFactories: string[];
}

// -- OPTIMISER ----------------------------------
// DTO encapsulating optimiser state
export interface OptimiserStateDTO<U extends OptimiserData> {
    id?: number;
    simSet: SimSetDTO;
    stepCount: number;
    start?: Date;
    end?: Date;
    durationSec?: number;
    percentComplete?: number;
    status: StateType;
    optimiserData: U;
    modelName?: string;
    optimiserName?: string;
    configuratorName?: string;
    converged: boolean;
    convergenceTests?: ConvergenceTestDTO[];
    performance?: number;
}

// -- CORE MODEL OBJECT DTOs -------------------------------
export interface SimConfigDTO {
    id?: number;
    simConfigParamsDTO?: SimConfigParamsDTO;
    orgConfigId: number;
    orgConfig?: OrgConfigDTO;
    convergenceTestId: number;
    convergenceTest?: ConvergenceTestDTO;
    runCount: number;
    days: number;
    randomStreamType: RandomStreamType;
    start?: Date;
    end?: Date;
    durationSec?: number;
    avgPerformance?: number;
    stdDevPerformance?: number;
    entropy?: number;
    saveStateSpace?: boolean;
    results?: ResultDTO[];
    debug?: string[];
    state?: StateType;
    converged?: boolean;
}

export interface SimConfigParamsDTO {
    id?: number;
    simConfigs: SimConfigDTO[];
    days: number;
    randomStreamType: RandomStreamType;
    simSets?: SimSetDTO[];
    convergenceTests?: ConvergenceTestDTO[];
}

export interface SimSetDTO {
    id?: number;
    description: string;
    modelName: string;
    optimiserParams?: OptimiserParameters;
    configuratorName?: string;
    optimiserName?: string;
    optimiserStates?: OptimiserStateDTO<OptimiserData>[];
    simConfigParams: SimConfigParamsDTO;
    state?: StateType;
    convergenceTestIds?: number[];
    currentOptimiserStateId?: number;
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
    modelName?: string;
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
    state: StateType;
    simConfigs?: SimConfigDTO[];
    converged: boolean;
    optimiserStates: OptimiserStateDTO<OptimiserData>[];
}

export interface ConfiguratorParamsDTO<T extends ConfiguratorParamData> {
    id?: number;
    modelName: string;
    configuratorName: string;
    multipleOrgConfigs: boolean;
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
