import { RandomStreamType, StateType } from "../types/pipeline.types";

// generic data pipeline DTOs
export interface SimConfigDTO<T> {
    id?: number;
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

export interface SimSetDTO<T> {
    id?: number;
    description: string;
    simConfigs: SimConfigDTO<T>[];
    type: string;
    state?: StateType;
    simConfigCount?: number;
    completedRunCount?: number;
    completedSimConfigCount?: number;
}

export interface OrgConfigDTO<T> {
    id?: number;
    type: string;
    clockTickSeconds: number;
    agentCount: number;
    board: BoardDTO<T>;
    agentSet: AgentSetTensorsDTO;
    plant: PlantDTO<T>;
    reporting: ReportingDTO<T>;
    priorityIntensity: number;
    influenceIntensity: number;
    judgmentIntensity: number;
    incentiveIntensity: number;
    configuratorParams: ConfiguratorParamsDTO<T>;
    simConfigs?: SimConfigDTO<T>[];
    configuratorName?: string;
}

export interface BoardDTO<T> {}

export interface PlantDTO<T> {}

export interface ReportingDTO<T> {}

export interface AgentSetTensorsDTO {
    priorityTensor: number[][][];
    influenceTensor: number[][][][];
    judgmentTensor: number[][][][];
    incentiveTensor: number[][][][];
}

export interface StateSpacePointDTO<T> {
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

export interface ResultDTO<T> {
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

// Configurator DTOs
export interface ConfiguratorSignatureDTO {
    name: string;
    modelType: string;
    description: string;
}

export interface ConfiguratorParamsDTO<T> {
    configuratorName: string;
    data: T;
}

// report DTOs
export interface VariableDTO {
    name: string;
    reporting: number;
    plan: number;
}

export interface ReportLineItemDTO {
    class: string;
    operator: string;
    values: VariableDTO;
}

export interface ReportDTO {
    name: string;
    lineItems: ReportLineItemDTO[];
}
