import { Utils } from "@arion/core";
import { StateSpacePointDTO } from "../interfaces/pipeline.interfaces.dto";
import { StateSpacePoint } from "./class.state.space.point";

export class StateSpace extends Array<StateSpacePoint> {
    private _agentCount: number = 0;

    constructor(stateSpace: StateSpacePoint[] | StateSpacePointDTO[]) {
        let tmp: StateSpacePoint[] = [];
        stateSpace.forEach((stateSpacePoint) => {
            tmp.push(new StateSpacePoint(stateSpacePoint));
        });
        super(...tmp);
        if (this.length > 0) this._agentCount = this[0].agentStates.length;
    }

    agentStateProbabilities(agentStatesArray: string[]): number[][] {
        let agentSetStateProbabilities: number[][] = [[]];
        if (agentStatesArray && agentStatesArray.length > 0 && this.length > 0) {
            agentSetStateProbabilities = Utils.tensor([this._agentCount, agentStatesArray.length], () => {
                return 0;
            }) as number[][];
            this.forEach((stateSpacePoint, stateSpacePointIndex) => {
                stateSpacePoint.agentStates.forEach((agentState, agentIndex) => {
                    agentSetStateProbabilities[agentIndex][agentState]++;
                });
            });
            agentSetStateProbabilities.forEach((agent, agentIndex) => {
                agent.forEach((state, stateIndex) => {
                    agentSetStateProbabilities[agentIndex][stateIndex] =
                        agentSetStateProbabilities[agentIndex][stateIndex] / this.length;
                });
            });
        }
        return agentSetStateProbabilities;
    }

    agentStates(): number[][] {
        const states: number[][] = Utils.tensor([this._agentCount, this.length], () => {
            return 0;
        }) as number[][];
        for (let tau = 0; tau < this.length; tau++) {
            for (let alpha = 0; alpha < this._agentCount; alpha++) states[alpha][tau] = this[tau].agentStates[alpha];
        }
        return states;
    }

    agentStateAverage(): number[] {
        const averageValues: number[] = Utils.tensor([this._agentCount], () => {
            return 0;
        }) as number[];
        if (this.length > 0) {
            for (let alpha = 0; alpha < this._agentCount; alpha++) {
                for (let tau = 0; tau < this.length; tau++)
                    averageValues[alpha] = averageValues[alpha] + this[tau].agentStates[alpha];
                averageValues[alpha] = averageValues[alpha] / this.length;
            }
        }
        return averageValues;
    }

    agentStateCoordinationMatrix(): number[][] {
        const matrix: number[][] = Utils.tensor([this._agentCount, this._agentCount], () => {
            return 0;
        }) as number[][];
        for (let alpha = 0; alpha < this._agentCount; alpha++) {
            for (let beta = alpha; beta < this._agentCount; beta++) {
                for (let tau = 0; tau < this.length; tau++) {
                    if (this[tau].agentStates[alpha] === this[tau].agentStates[beta]) {
                        matrix[alpha][beta]++;
                        if (alpha !== beta) matrix[beta][alpha]++;
                    }
                }
                matrix[alpha][beta] = matrix[alpha][beta] / this.length;
                if (alpha !== beta) matrix[beta][alpha] = matrix[beta][alpha] / this.length;
            }
        }
        return matrix;
    }

    toJSON(): any {
        return JSON.parse(JSON.stringify(this));
    }

    toDTO(): StateSpacePointDTO {
        return this as unknown as StateSpacePointDTO;
    }
}
