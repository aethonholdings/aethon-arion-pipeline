import { StateSpacePointDTO } from "../interfaces/pipeline.interfaces.dto";

export class StateSpacePoint implements StateSpacePointDTO {
    clockTick: number;
    plant: number[];
    agentStates: number[];
    priorityTensor: number[][][];
    board: number[];
    reporting: number[];

    constructor(stateSpacePointDTO: StateSpacePointDTO) {
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

    toDTO(): StateSpacePointDTO {
        return this as unknown as StateSpacePointDTO;
    }
}
