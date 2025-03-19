import { KPIDTO, KPIs, ResultDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamData, OptimiserData, OptimiserParameters } from "../../types/pipeline.types";
import { KPIFactory } from "../pipeline/kpi-factory.class";
import { Model } from "../pipeline/model.class";

export abstract class PlanVsActualsKPIFactory<
    T extends ConfiguratorParamData,
    U extends OptimiserParameters,
    V extends OptimiserData
> extends KPIFactory<T, U, V> {
    constructor(name: string, model: Model<T, U, V>) {
        super(name, model);
    }
    abstract generate(inputData: ResultDTO): KPIDTO<PlanVsActualsKPIs>;
}

export interface PlanVsActualsKPIs extends KPIs {
    proFormas: PlanVsActualsKPIsProForma[];
    priorityTensor: {
        actual: number[][][];
        plan: number[][][];
        delta: number[][][];
    };
}

export interface PlanVsActualsKPIsProForma {
    name: string;
    lineItems: PlanVsActualsKPIsProFormaRow[];
}

export type PlanVsActualsKPIsProFormaRow = {
    class: string | null;
    operator?: string | null;
    data?: PlanVsActualsKPIsProFormaVariable;
};

export type PlanVsActualsKPIsProFormaVariable = { name: string; actual: number; plan: number; delta?: number };
