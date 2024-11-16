import { ConfiguratorParamData } from "../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../interfaces/dto.interfaces";

export abstract class Configurator<T extends Model> {
    name: string;
    protected model: T;

    constructor(model: T, name: string) {
        this.model = model;
        this.name = name;
    }

    abstract generate(configuratorParamData: ConfiguratorParamData): OrgConfigDTO;

    getModel(): T {
        return this.model;
    }
}
