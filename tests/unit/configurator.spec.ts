import { Configurator } from "../../src/classes/pipeline/configurator.class";
import { Model } from "../../src/classes/pipeline/model.class";
import { ConfiguratorParamData } from "../../src/types/pipeline.types";
import { OrgConfigDTO, ConfiguratorParamsDTO } from "../../src/interfaces/dto.interfaces";

// Concrete implementation for testing
class TestConfigurator extends Configurator<ConfiguratorParamData> {
    generate(configuratorParamData: ConfiguratorParamsDTO<ConfiguratorParamData>): OrgConfigDTO {
        return {} as OrgConfigDTO;
    }

    getDefaultParams(): ConfiguratorParamsDTO<ConfiguratorParamData> {
        return {} as ConfiguratorParamsDTO<ConfiguratorParamData>;
    }
}

describe("Configurator", () => {
    let model: Model;
    let configurator: TestConfigurator;

    beforeEach(() => {
        model = {} as Model;
        configurator = new TestConfigurator(model, "TestConfigurator");
    });

    describe("Bug Fix: Infinite recursion in model getter", () => {
        it("should return the model instance without infinite recursion", () => {
            // This would previously cause a stack overflow
            expect(() => {
                const retrievedModel = configurator.model;
            }).not.toThrow();
        });

        it("should return the same model instance passed to constructor", () => {
            const retrievedModel = configurator.model;
            expect(retrievedModel).toBe(model);
        });

        it("should return consistent model reference on multiple calls", () => {
            const firstCall = configurator.model;
            const secondCall = configurator.model;
            const thirdCall = configurator.model;

            expect(firstCall).toBe(model);
            expect(secondCall).toBe(model);
            expect(thirdCall).toBe(model);
        });
    });
});
