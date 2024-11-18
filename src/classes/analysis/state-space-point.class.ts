import { StateSpacePointDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData } from "../../types/pipeline.types";

export class StateSpacePoint<T extends ConfiguratorParamData> implements StateSpacePointDTO<T> {
    clockTick: number;
    plant: number[];
    agentStates: number[];
    priorityTensor: number[][][];
    board: number[];
    reporting: number[];

    constructor(stateSpacePointDTO: StateSpacePointDTO<T>) {
        this.clockTick = stateSpacePointDTO.clockTick;
        this.plant = stateSpacePointDTO.plant;
        this.agentStates = stateSpacePointDTO.agentStates;
        this.priorityTensor = stateSpacePointDTO.priorityTensor;
        this.board = stateSpacePointDTO.board;
        this.reporting = stateSpacePointDTO.reporting;
    }

    toJSON(): any {
        return JSON.parse(JSON.stringify(this));
    }

    toDTO(): StateSpacePointDTO<T> {
        return this as StateSpacePointDTO<T>;
    }
}
