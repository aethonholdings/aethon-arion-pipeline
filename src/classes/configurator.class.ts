import { ConfiguratorSignatureDTO, OrgConfigDTO } from "../interfaces/pipeline.interfaces.dto";

export abstract class Configurator {
    name: string;
    modelType: string;
    description: string = "";

    constructor(configuratorSignature: ConfiguratorSignatureDTO) {
        this.name = configuratorSignature.name;
        this.modelType = configuratorSignature.modelType;
        this.description = configuratorSignature.description;
    }

    abstract generate(params: any): OrgConfigDTO;

    getSignature(): ConfiguratorSignatureDTO {
        return {
            name: this.name,
            modelType: this.modelType,
            description: this.description
        };
    }
}
