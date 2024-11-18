import { ConfiguratorParamData, RandomStreamType, StateType } from "../types/pipeline.types";

// generic data pipeline DTOs
export interface SimConfigDTO<T extends ConfiguratorParamData> {
    id?: number;
    simConfigParamsDTO?: SimConfigParamsDTO<T>;
    simSet?: SimSetDTO<T>;
    simSetId?: number;
    orgConfigId: number;
    orgConfig?: OrgConfigDTO<T>;
    runCount: number;
    days: number;
    randomStreamType: RandomStreamType;
    start?: Date;
    end?: Date;
    durationSec?: number;
    avgPerformance?: number;
    stdDevPerformance?: number;
    entropy?: number;
    results?: ResultDTO<T>[];
    debug?: string[];
    state?: StateType;
}

export interface SimConfigParamsDTO<T extends ConfiguratorParamData> {
    id?: number;
    convergenceTests: ConvergenceTestDTO<T>[];
    simConfigs: SimConfigDTO<T>[];
    days: number;
    randomStreamType: RandomStreamType;
}

export interface SimSetDTO<T extends ConfiguratorParamData> {
    id?: number;
    description: string;
    simConfigs: SimConfigDTO<T>[];
    type: string;
    state?: StateType;
    simConfigCount?: number;
    completedRunCount?: number;
    completedSimConfigCount?: number;
}

export interface OrgConfigDTO<T extends ConfiguratorParamData> {
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
    configuratorParams: ConfiguratorParamsDTO<T>;
    simConfigs?: SimConfigDTO<T>[];
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

export interface StateSpacePointDTO<T extends ConfiguratorParamData> {
    id?: number;
    resultId?: number;
    result?: ResultDTO<T>;
    clockTick: number;
    board: number[];
    agentStates: number[];
    priorityTensor: number[][][];
    plant: number[];
    reporting: number[];
}

export interface ResultDTO<T extends ConfiguratorParamData> {
    id?: number;
    simConfigId?: number;
    orgConfigId?: number;
    simSetId?: number;
    simConfig?: SimConfigDTO<T>;
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
    stateSpace?: StateSpacePointDTO<T>[];
    agentCount?: number;
    orgConfigType?: string;
    configuratorName?: string;
    configuratorParams?: ConfiguratorParamsDTO<T>;
}

export interface ConvergenceTestDTO<T extends ConfiguratorParamData> {
    id?: number;
    simConfigParams: SimConfigParamsDTO<T>;
    configuratorParams: ConfiguratorParamsDTO<T>;
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
