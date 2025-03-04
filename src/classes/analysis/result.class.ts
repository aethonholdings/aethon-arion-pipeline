import { ConfiguratorParamsDTO, ResultDTO, SimConfigDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData } from "../../types/pipeline.types";
import { StateSpace } from "./state-space.class";

export abstract class Result<T extends ConfiguratorParamData> implements ResultDTO {
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
    stateSpace?: StateSpace<T>;
    agentCount?: number;
    orgConfigType?: string;
    configuratorName?: string;
    configuratorParams?: ConfiguratorParamsDTO<T>;

    constructor(resultDTO: ResultDTO) {
        this.id = resultDTO.id;
        this.simConfigId = resultDTO.simConfigId;
        this.orgConfigId = resultDTO.orgConfigId;
        this.simSetId = resultDTO.simSetId;
        this.simConfig = resultDTO.simConfig;
        this.runCount = resultDTO.runCount;
        this.nodeId = resultDTO.nodeId;
        this.start = new Date(resultDTO.start);
        this.end = new Date(resultDTO.end);
        this.durationSec = resultDTO.durationSec;
        this.board = resultDTO.board;
        this.agentStates = resultDTO.agentStates;
        this.priorityTensor = resultDTO.priorityTensor;
        this.plant = resultDTO.plant;
        this.reporting = resultDTO.reporting;
        this.priorityIntensity = resultDTO.priorityIntensity;
        this.performance = resultDTO.performance;
        this.stateSpace = new StateSpace(resultDTO.stateSpace);
        this.agentCount = resultDTO.agentCount;
        this.configuratorParams = resultDTO.configuratorParams;
    }

    toJSON(): any {
        return JSON.parse(JSON.stringify(this));
    }

    toDTO(): ResultDTO {
        return this;
    }

    abstract getPerformance(params?: any): number;
}
