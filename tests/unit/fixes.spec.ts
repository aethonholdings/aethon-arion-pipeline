import { ResultSet } from "../../src/classes/analysis/result-set.class";
import { StateSpace } from "../../src/classes/analysis/state-space.class";
import { ObjectHash } from "../../src/classes/pipeline/object-hash.class";
import { GradientAscentOptimiser } from "../../src/classes/optimisers/gradient-ascent.optimiser.class";
import { DomainTypes } from "../../src/constants/pipeline.constants";
import { ResultDTO, StateSpacePointDTO } from "../../src/interfaces/dto.interfaces";

const point = (states: number[]): StateSpacePointDTO =>
    ({ clockTick: 0, board: [0], agentStates: states, priorityTensor: [[[1]]], plant: [0], reporting: [0] }) as any;
const result = (v: number | undefined, performance?: number): ResultDTO =>
    ({ board: [0], agentStates: [0], plant: [0], reporting: [v], priorityTensor: [[[1]]], performance }) as any;

describe("Pipeline fixes", () => {
    describe("StateSpace", () => {
        it("serialises without recursing", () => {
            const s = new StateSpace([point([0, 1]), point([1, 1])]);
            expect(JSON.parse(JSON.stringify(s)).length).toBe(2);
            expect(s.toJSON().length).toBe(2);
        });
        it("accepts large inputs and supports array methods", () => {
            const s = new StateSpace(Array.from({ length: 200000 }, () => point([0])));
            expect(s.length).toBe(200000);
            expect(s.map((p) => p.agentStates[0]).length).toBe(200000);
            expect(s.slice(0, 2).length).toBe(2);
        });
        it("returns zeros, not NaN, for an empty coordination matrix", () => {
            expect(new StateSpace([]).agentStateCoordinationMatrix()).toEqual([]);
        });
    });

    describe("ResultSet", () => {
        it("puts the maximum value in the last bin", () => {
            const rs = new ResultSet([result(0, 1), result(1, 1)], 1);
            expect(rs.getEntropy()).toBe(0);
        });
        it("computes a sample stdev for two results and excludes missing performance", () => {
            const rs = new ResultSet([result(0, 1), result(1, 3), result(2, undefined)], 10);
            const perf = rs.getPerformance();
            expect(perf.avgPerformance).toBe(2);
            expect(perf.stDevPerformance).toBeCloseTo(Math.SQRT2, 10);
            expect(rs.getExcludedCount()).toBe(1);
        });
    });

    describe("ObjectHash", () => {
        it("distinguishes types and structure", () => {
            const h = (o: any) => new ObjectHash(o).toString();
            expect(h({ a: 1 })).not.toBe(h({ a: "1" }));
            expect(h({ a: null })).not.toBe(h({ a: "null" }));
            expect(h({ a: [] })).not.toBe(h({ a: "" }));
            expect(h({ a: { b: 1 } })).not.toBe(h({ "a.b": 1 }));
            expect(h({ "a:b": "c" })).not.toBe(h({ a: "b:c" }));
        });
        it("ignores key order, id and hash", () => {
            expect(new ObjectHash({ a: 1, b: { c: 2, d: 3 } }).toString()).toBe(
                new ObjectHash({ b: { d: 3, c: 2 }, a: 1, id: 5, hash: "x" }).toString()
            );
        });
    });

    describe("GradientAscentOptimiser.validateDomains", () => {
        class TestOptimiser extends (GradientAscentOptimiser as any) {}
        const optimiser: any = new (TestOptimiser as any)("test", {} as any);
        it("reports invalid numerical and categorical domains", () => {
            const errors: string[] = optimiser.validateDomains([
                { id: "a", domain: { type: DomainTypes.CONTINUOUS, optimise: true, min: 2, max: 1, derivativeStepSize: 0.1 } },
                { id: "b", domain: { type: DomainTypes.CONTINUOUS, optimise: true, min: 0, max: 1, derivativeStepSize: 0 } },
                { id: "c", domain: { type: DomainTypes.DISCRETE, optimise: true, min: 0, max: 1, derivativeStepSize: 2 } },
                { id: "d", domain: { type: DomainTypes.CATEGORICAL, optimise: true, categories: [] } },
                { id: "e", domain: { type: DomainTypes.CONTINUOUS, optimise: false } }
            ]);
            expect(errors.length).toBe(5);
        });
        it("accepts valid and zero-width domains", () => {
            expect(
                optimiser.validateDomains([
                    { id: "a", domain: { type: DomainTypes.CONTINUOUS, optimise: true, min: 0, max: 1, derivativeStepSize: 0.1 } },
                    { id: "b", domain: { type: DomainTypes.CONTINUOUS, optimise: true, min: 1, max: 1, derivativeStepSize: 0.1 } },
                    { id: "c", domain: { type: DomainTypes.CATEGORICAL, optimise: true, categories: ["x"] } },
                    { id: "d", domain: { type: DomainTypes.BOOLEAN, optimise: false, default: true } }
                ])
            ).toEqual([]);
        });
    });
});
