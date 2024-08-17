import { StateType } from "../types/pipeline.types";

// generic data pipeline DTOs
export interface SimConfigDTO {
    id?: number;
    simSet?: SimSetDTO;
    simSetId?: number;
    orgConfigId: number;
    orgConfig?: OrgConfigDTO;
    runCount: number,
    days: number,
    randomStreamType: "static" | "random";
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

export interface SimSetDTO {
    id?: number;
    description: string;
    simConfigs: SimConfigDTO[];
    type: string;
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
    configuratorParams: ConfiguratorParamsDTO;
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
    configuratorParams?: ConfiguratorParamsDTO;
}

// Configurator DTOs
export interface ConfiguratorSignatureDTO {
    name: string;
    modelType: string;
    description: string;
}

export interface ConfiguratorParamsDTO {
    configuratorName: string;
    data: any;
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
