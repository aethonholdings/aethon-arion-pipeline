import { ConfiguratorParamData } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../../interfaces/dto.interfaces";

export abstract class Configurator {
    name: string;
    protected model: Model;

    constructor(model: Model, name: string) {
        this.model = model;
        this.name = name;
    }

    getModel(): Model {
        return this.model;
    }

    abstract generate(configuratorParamData: ConfiguratorParamData): OrgConfigDTO;
}
