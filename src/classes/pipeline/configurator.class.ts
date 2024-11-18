import { ConfiguratorParamData } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../../interfaces/dto.interfaces";

export abstract class Configurator<T extends ConfiguratorParamData> {
    name: string;
    protected model: Model<T>;

    constructor(model: Model<T>, name: string) {
        this.model = model;
        this.name = name;
    }

    getModel(): Model<T> {
        return this.model;
    }

    abstract generate(configuratorParamData: ConfiguratorParamData): OrgConfigDTO<T>;

    abstract getDefaultParams(): ConfiguratorParamData;
}
