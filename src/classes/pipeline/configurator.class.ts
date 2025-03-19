import { ConfiguratorParamData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";
import { OptimiserData } from '../../types/pipeline.types';

export abstract class Configurator<T extends ConfiguratorParamData, U extends OptimiserParameters, V extends OptimiserData> {
    name: string;
    protected _model: Model<T, U, V>;

    constructor(model: Model<T, U, V>, name: string) {
        this._model = model;
        this.name = name;
    }

    get model(): Model<T, U, V> {
        return this.model;
    }

    abstract generate(configuratorParamData: ConfiguratorParamsDTO<T>): OrgConfigDTO;
    abstract getDefaultParams(): ConfiguratorParamsDTO<T>;
}
