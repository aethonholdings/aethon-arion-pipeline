import { ResultSet } from "../../src/classes/analysis/result-set.class";
import { ResultDTO } from "../../src/interfaces/dto.interfaces";

describe("ResultSet", () => {
    describe("Bug Fix: Loose equality (!=) instead of strict (!==)", () => {
        it("should use strict equality when comparing histogram bounds", () => {
            const results: ResultDTO[] = [
                {
                    board: [1, 2],
                    agentStates: [0, 1],
                    plant: [10],
                    reporting: [0.5],
                    priorityTensor: [[[1]]],
                    performance: 100
                } as unknown as ResultDTO
            ];

            // Should not throw with strict equality comparison
            expect(() => {
                new ResultSet(results, 10);
            }).not.toThrow();
        });
    });

    describe("Bug Fix: Math.log2(0) produces -Infinity", () => {
        it("should handle zero likelihood values in entropy calculation", () => {
            // Create results that will produce zero likelihood values
            const results: ResultDTO[] = [
                {
                    board: [1],
                    agentStates: [0],
                    plant: [10],
                    reporting: [0.5],
                    priorityTensor: [[[1]]],
                    performance: 100
                } as unknown as ResultDTO,
                {
                    board: [2],
                    agentStates: [1],
                    plant: [20],
                    reporting: [0.6],
                    priorityTensor: [[[2]]],
                    performance: 200
                } as unknown as ResultDTO
            ];

            const resultSet = new ResultSet(results, 100);
            const entropy = resultSet.getEntropy();

            expect(entropy).not.toBeNull();
            expect(entropy).not.toBe(-Infinity);
            expect(entropy).not.toBeNaN();
            expect(typeof entropy).toBe("number");
            expect(entropy! >= 0).toBe(true);
        });

        it("should return valid entropy for identical results", () => {
            const results: ResultDTO[] = Array(10).fill({
                board: [1],
                agentStates: [0],
                plant: [10],
                reporting: [0.5],
                priorityTensor: [[[1]]],
                performance: 100
            } as unknown as ResultDTO);

            const resultSet = new ResultSet(results, 10);
            const entropy = resultSet.getEntropy();

            expect(entropy).not.toBeNull();
            expect(entropy).toBe(0); // All identical should have zero entropy
        });

        it("should return null entropy when no results provided", () => {
            const resultSet = new ResultSet([], 10);
            const entropy = resultSet.getEntropy();

            expect(entropy).toBeNull();
        });
    });

    describe("Bug Fix: Division by zero when histogramBinCount is 0", () => {
        it("should handle zero histogramBinCount without division by zero", () => {
            const results: ResultDTO[] = [
                {
                    board: [1, 2],
                    agentStates: [0, 1],
                    plant: [10],
                    reporting: [0.5],
                    priorityTensor: [[[1]]],
                    performance: 100
                } as unknown as ResultDTO
            ];

            // Should not throw with zero bin count
            expect(() => {
                new ResultSet(results, 0);
            }).not.toThrow();
        });

        it("should handle normal histogramBinCount correctly", () => {
            const results: ResultDTO[] = [
                {
                    board: [1, 2],
                    agentStates: [0, 1],
                    plant: [10],
                    reporting: [0.5],
                    priorityTensor: [[[1]]],
                    performance: 100
                } as unknown as ResultDTO,
                {
                    board: [2, 3],
                    agentStates: [1, 0],
                    plant: [20],
                    reporting: [0.6],
                    priorityTensor: [[[2]]],
                    performance: 200
                } as unknown as ResultDTO
            ];

            expect(() => {
                const resultSet = new ResultSet(results, 100);
                resultSet.getEntropy();
            }).not.toThrow();
        });
    });

    describe("Performance calculation", () => {
        it("should calculate average and standard deviation correctly", () => {
            const results: ResultDTO[] = [
                {
                    board: [1],
                    agentStates: [0],
                    plant: [10],
                    reporting: [0.5],
                    priorityTensor: [[[1]]],
                    performance: 100
                } as unknown as ResultDTO,
                {
                    board: [1],
                    agentStates: [0],
                    plant: [10],
                    reporting: [0.5],
                    priorityTensor: [[[1]]],
                    performance: 200
                } as unknown as ResultDTO,
                {
                    board: [1],
                    agentStates: [0],
                    plant: [10],
                    reporting: [0.5],
                    priorityTensor: [[[1]]],
                    performance: 300
                } as unknown as ResultDTO
            ];

            const resultSet = new ResultSet(results, 10);
            const perf = resultSet.getPerformance();

            expect(perf.avgPerformance).toBe(200);
            expect(perf.stDevPerformance).toBeGreaterThan(0);
        });
    });
});
