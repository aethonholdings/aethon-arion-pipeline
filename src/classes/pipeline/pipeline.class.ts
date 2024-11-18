import { Presentation } from "./presentation.class";
import { Configurator } from "./configurator.class";
import { Model } from "./model.class";
import { ConfiguratorParamData } from "../../types/pipeline.types";
import hash from "object-hash";

export class Pipeline {
    protected _configurators: Configurator<ConfiguratorParamData>[] = [];
    protected _presentations: Presentation<ConfiguratorParamData>[] = [];
    protected _models: Model<ConfiguratorParamData>[] = [];

    constructor(
        configurators: Configurator<ConfiguratorParamData>[],
        presentations: Presentation<ConfiguratorParamData>[],
        models: Model<ConfiguratorParamData>[]
    ) {
        this._configurators = configurators;
        this._presentations = presentations;
        this._models = models;
    }

    getConfigurators(): Configurator<ConfiguratorParamData>[] {
        return this._configurators;
    }

    getConfigurator(configuratorName: string): Configurator<ConfiguratorParamData> | undefined {
        return this._configurators.find(
            (configurator: Configurator<ConfiguratorParamData>) => configurator.name === configuratorName
        );
    }

    getPresentations(): Presentation<ConfiguratorParamData>[] {
        return this._presentations;
    }

    getPresentation(presentationName: string): Presentation<ConfiguratorParamData> | undefined {
        return this._presentations.find(
            (presentation: Presentation<ConfiguratorParamData>) => presentation.getName() === presentationName
        );
    }

    getModel(modelName: string): Model<ConfiguratorParamData> | undefined {
        return this._models.find((model: Model<ConfiguratorParamData>) => model.getName() === modelName);
    }

    getModels(): Model<ConfiguratorParamData>[] {
        return this._models;
    }

    hashObject(object: any): string {
        return hash(object);
    }
}
