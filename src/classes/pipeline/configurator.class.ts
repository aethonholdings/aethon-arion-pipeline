import { ConfiguratorParamData, OptimiserData } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";

export abstract class Configurator<T extends ConfiguratorParamData, U extends OptimiserData> {
    name: string;
    protected model: Model<T, U>;

    constructor(model: Model<T, U>, name: string) {
        this.model = model;
        this.name = name;
    }

    getModel(): Model<T, U> {
        return this.model;
    }

    abstract generate(configuratorParamData: ConfiguratorParamsDTO<T>): OrgConfigDTO;

    abstract getDefaultParams(): ConfiguratorParamsDTO<T>;
}
