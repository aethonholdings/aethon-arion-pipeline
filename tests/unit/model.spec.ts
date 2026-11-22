import { lastValueFrom } from "rxjs";
import { AgentSet, Board, Logger, Organisation, Plant, RandomStreamFactory, Reporting, State, Targets } from "aethon-arion-core";
import { Model } from "../../src/classes/pipeline/model.class";
import { Configurator } from "../../src/classes/pipeline/configurator.class";
import { KPIFactory } from "../../src/classes/pipeline/kpi-factory.class";
import { ResultDTO, SimConfigDTO } from "../../src/interfaces/dto.interfaces";

class On extends State { emit() { return [1]; } }
class Off extends State { emit() { return [0]; } }
class B extends Board { transitionState(): Targets { return this.plan; } }
class P extends Plant { transitionState(i: number[][]) { this.stateTensor = [i.reduce((a, r) => a * r[0], 1)]; return this.stateTensor; } }
class R extends Reporting { transitionState(s: number[]) { this.reportingTensor = [this.reportingTensor[0] + s[0]]; return this.reportingTensor; } }

// a minimal model: two agents, reporting counts the ticks on which both act; performance = that count
class TestModel extends Model {
    constructor() {
        super("Test", {}, "7");
        this._configurators.push(new TestConfigurator(this));
        this._kpiFactories.push(new TestKPI(this));
    }
    getPerformance(r: ResultDTO) { return r.reporting[0]; }
    protected _instantiateModelOrgConfig(sim: any, rsf: RandomStreamFactory, logger: Logger): Organisation {
        const oc = sim.orgConfig;
        const agents = new AgentSet(oc.agentSet, [new On(), new Off()], rsf.newStream(), logger, oc.clockTickSeconds);
        return new Organisation(new B({ plantState: [1], reporting: [0] }, logger), agents, new P([0], logger), new R([0], logger), logger);
    }
}
class TestConfigurator extends Configurator<any> {
    constructor(m: Model) { super(m, "TestConfigurator"); }
    generate(): any { return {}; }
    getDefaultParams(): any { return { modelName: "Test", configuratorName: "TestConfigurator", multipleOrgConfigs: false, data: {} }; }
}
class TestKPI extends KPIFactory<any> {
    constructor(m: Model) { super("TestKPI", m); }
    generate(r: any) { return this._package({ value: r.reporting[0] }); }
}
const simConfig = (): SimConfigDTO => ({
    id: 3, runId: 30, runCount: 0, days: 1, randomStreamType: "static",
    orgConfig: {
        clockTickSeconds: 3600,
        agentSet: {
            priorityTensor: [[[0.9, 0.1], [0.9, 0.1]], [[0.9, 0.1], [0.9, 0.1]]],
            influenceTensor: [[[[0, 0], [0, 0]], [[0, 0], [0, 0]]], [[[0, 0], [0, 0]], [[0, 0], [0, 0]]]],
            judgmentTensor: [[[[0], [0]], [[0], [0]]], [[[0], [0]], [[0], [0]]]],
            incentiveTensor: [[[[0], [0]], [[0], [0]]], [[[0], [0]], [[0], [0]]]]
        }
    } as any
} as SimConfigDTO);

describe("Model", () => {
    const model = new TestModel();

    it("runs a simulation into a result DTO", async () => {
        const r = await lastValueFrom(model.run$(simConfig(), RandomStreamFactory.seeded(1, 1), new Logger(), "node", true));
        expect(r.simConfigId).toBe(3);
        expect(r.runId).toBe(30);
        expect((r as any).clockTick).toBe(8); // tick count, 1 day of 8 hours at 3600 s
        expect(r.stateSpace!.length).toBe(8);
        expect(r.performance).toBe(r.reporting[0]);
    });

    it("is reproducible from seeded streams and leaves the input untouched", async () => {
        const input = simConfig();
        const before = JSON.stringify(input);
        const a = await lastValueFrom(model.run$(input, RandomStreamFactory.seeded(5, 1), new Logger(), "node"));
        const b = await lastValueFrom(model.run$(input, RandomStreamFactory.seeded(5, 1), new Logger(), "node"));
        expect(b.agentStates).toEqual(a.agentStates);
        expect(b.reporting).toEqual(a.reporting);
        expect(JSON.stringify(input)).toBe(before);
        expect(a.stateSpace).toEqual([]); // not recorded unless requested
    });

    it("rejects a sim config without an org config", () => {
        expect(() => model.createSimulation({ id: 1, days: 1 } as any, new Logger(), new RandomStreamFactory())).toThrow();
    });

    it("exposes its configurators, KPI factories, version and parameters", () => {
        expect(model.version).toBe("7");
        expect(model.getConfigurator("TestConfigurator").name).toBe("TestConfigurator");
        expect(() => model.getConfigurator("x")).toThrow();
        expect(() => model.getKPIFactory("x")).toThrow();
        expect(() => model.getDefaultOptimiser()).toThrow();
        const kpi = model.getKPIFactory("TestKPI").generate({ reporting: [4] } as any);
        expect(kpi.name).toBe("TestKPI");
        expect(kpi.modelName).toBe("Test");
        expect(kpi.data).toEqual({ value: 4 });
    });

    it("hashes configurator params by model version", () => {
        const h = model.hashConfiguratorParams("TestConfigurator", { a: 1 });
        expect(h).toBe(model.hashConfiguratorParams("TestConfigurator", { a: 1 }));
        expect(h).not.toBe(model.hashConfiguratorParams("TestConfigurator", { a: 2 }));
    });
});
