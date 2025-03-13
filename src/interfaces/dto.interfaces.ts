import { ConfiguratorParamData, OptimiserData, RandomStreamType, StateType } from "../types/pipeline.types";

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

// -- OPTIMISER ----------------------------------
// model state encapsulating optimser state
export interface OptimiserStateDTO<T extends ConfiguratorParamData> {
    id?: number;
    simSet: SimSetDTO,
    stepCount: number;
    start: Date;
    end: Date;
    modelName: string;
    optimiserName: string;
    durationSec: number;
    percentComplete: number;
    state: StateType;
    configurator: ConfiguratorParamsDTO<T>,
    step: {
        optimiserData: OptimiserData[],
    },
}

// -- CORE MODEL OBJECT DTOs -------------------------------

export interface SimConfigDTO {
    id?: number;
    simConfigParamsDTO?: SimConfigParamsDTO;
    simSet?: SimSetDTO;
    simSetId?: number;
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
    type: string;
    simConfigs?: SimConfigDTO[];
    state?: StateType;
    simConfigCount?: number;
    completedRunCount?: number;
    completedSimConfigCount?: number;
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
    simSetId?: number;
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
