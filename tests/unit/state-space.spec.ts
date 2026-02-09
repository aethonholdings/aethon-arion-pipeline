import { StateSpace } from "../../src/classes/analysis/state-space.class";
import { StateSpacePointDTO } from "../../src/interfaces/dto.interfaces";

describe("StateSpace", () => {
    describe("Bug Fix: Missing property existence check", () => {
        it("should handle undefined stateSpace array", () => {
            expect(() => {
                new StateSpace(undefined);
            }).not.toThrow();
        });

        it("should handle empty stateSpace array", () => {
            expect(() => {
                new StateSpace([]);
            }).not.toThrow();
        });

        it("should handle stateSpace with missing agentStates property", () => {
            const malformedData = [{}] as StateSpacePointDTO[];

            expect(() => {
                new StateSpace(malformedData);
            }).not.toThrow();
        });

        it("should correctly initialize agentCount when agentStates exists", () => {
            const validData: StateSpacePointDTO[] = [
                {
                    agentStates: [0, 1, 2],
                    board: [1, 2],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO
            ];

            const stateSpace = new StateSpace(validData);
            const probs = stateSpace.agentStateProbabilities(["state0", "state1", "state2"]);

            expect(probs.length).toBe(3); // 3 agents
        });
    });

    describe("Bug Fix: Array bounds checking", () => {
        it("should handle out-of-bounds agent state indices", () => {
            const data: StateSpacePointDTO[] = [
                {
                    agentStates: [0, 5, 1], // 5 is out of bounds for 3 states
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO
            ];

            const stateSpace = new StateSpace(data);

            // Should not throw when agent state index is out of bounds
            expect(() => {
                stateSpace.agentStateProbabilities(["state0", "state1", "state2"]);
            }).not.toThrow();
        });

        it("should handle negative agent state indices", () => {
            const data: StateSpacePointDTO[] = [
                {
                    agentStates: [0, -1, 1], // -1 is invalid
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO
            ];

            const stateSpace = new StateSpace(data);

            expect(() => {
                stateSpace.agentStateProbabilities(["state0", "state1"]);
            }).not.toThrow();
        });

        it("should correctly calculate probabilities for valid indices only", () => {
            const data: StateSpacePointDTO[] = [
                {
                    agentStates: [0, 0, 0],
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO,
                {
                    agentStates: [1, 1, 10], // 10 is out of bounds
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO
            ];

            const stateSpace = new StateSpace(data);
            const probs = stateSpace.agentStateProbabilities(["state0", "state1"]);

            // Agent 0: state 0 once, state 1 once -> 50% each
            expect(probs[0][0]).toBe(0.5);
            expect(probs[0][1]).toBe(0.5);

            // Agent 1: state 0 once, state 1 once -> 50% each
            expect(probs[1][0]).toBe(0.5);
            expect(probs[1][1]).toBe(0.5);

            // Agent 2: state 0 once, invalid state once -> 50% state 0, 0% others
            expect(probs[2][0]).toBe(0.5);
            expect(probs[2][1]).toBe(0);
        });
    });

    describe("Agent state calculations", () => {
        it("should calculate agent state averages correctly", () => {
            const data: StateSpacePointDTO[] = [
                {
                    agentStates: [0, 1],
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO,
                {
                    agentStates: [2, 3],
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO
            ];

            const stateSpace = new StateSpace(data);
            const averages = stateSpace.agentStateAverage();

            expect(averages[0]).toBe(1); // (0 + 2) / 2
            expect(averages[1]).toBe(2); // (1 + 3) / 2
        });

        it("should calculate coordination matrix correctly", () => {
            const data: StateSpacePointDTO[] = [
                {
                    agentStates: [0, 0],
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO,
                {
                    agentStates: [0, 1],
                    board: [1],
                    plant: [10],
                    reporting: [0.5]
                } as StateSpacePointDTO
            ];

            const stateSpace = new StateSpace(data);
            const matrix = stateSpace.agentStateCoordinationMatrix();

            // Agent 0 with itself: always coordinated
            expect(matrix[0][0]).toBe(1);

            // Agent 0 with Agent 1: coordinated once out of twice
            expect(matrix[0][1]).toBe(0.5);
            expect(matrix[1][0]).toBe(0.5);
        });
    });
});
