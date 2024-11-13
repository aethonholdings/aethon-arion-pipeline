import { OrgConfigDTO } from "../interfaces/dto.interfaces";
import { ConfiguratorParamData } from "../types/pipeline.types";
import { Model } from "./model.class";

export abstract class Configurator<T extends Model> {
    protected name: string;
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
