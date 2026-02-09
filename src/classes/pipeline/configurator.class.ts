import { ConfiguratorParamData, OptimiserParameters } from "../../types/pipeline.types";
import { Model } from "./model.class";
import { OrgConfigDTO } from "../../interfaces/dto.interfaces";
import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";

/**
 * Abstract base class for generating organisation configurations from parameter data.
 *
 * @remarks
 * Configurators are responsible for converting high-level parameter data into complete
 * {@link OrgConfigDTO} objects that define the structure and behavior of multi-agent
 * organisational simulations. Each configurator implements a specific strategy for
 * translating conceptual parameters into executable simulation configurations.
 *
 * **Design Pattern:**
 *
 * Configurators follow the Factory Method pattern, where concrete implementations
 * provide specific generation logic while sharing common infrastructure through
 * this abstract base class.
 *
 * **Usage Flow:**
 *
 * 1. User provides high-level parameters via {@link ConfiguratorParamsDTO}
 * 2. Configurator generates complete {@link OrgConfigDTO} via {@link generate}
 * 3. OrgConfigDTO is used to instantiate {@link Organisation} for simulation
 *
 * **Type Safety:**
 *
 * The generic parameter `T extends ConfiguratorParamData` ensures type-safe
 * parameter handling across different configurator implementations.
 *
 * @typeParam T - Parameter data type extending {@link ConfiguratorParamData}
 *
 * @example
 * ```typescript
 * // Concrete implementation
 * class ProductionConfigurator extends Configurator<ProductionParams> {
 *   generate(params: ConfiguratorParamsDTO<ProductionParams>): OrgConfigDTO {
 *     return {
 *       agentCount: params.data.workerCount,
 *       stateCount: 3, // Idle, Working, Break
 *       clockTickSeconds: 0.1,
 *       // ... other configuration
 *     };
 *   }
 *
 *   getDefaultParams(): ConfiguratorParamsDTO<ProductionParams> {
 *     return {
 *       data: {
 *         workerCount: 10,
 *         shiftDuration: 8,
 *         productionRate: 5
 *       }
 *     };
 *   }
 * }
 *
 * // Usage
 * const configurator = new ProductionConfigurator(model, "production");
 * const orgConfig = configurator.generate(params);
 * ```
 *
 * @public
 */
export abstract class Configurator<T extends ConfiguratorParamData> {
    /**
     * Human-readable identifier for this configurator.
     *
     * @remarks
     * Used to select specific configurators from a model's collection
     * via {@link Model.getConfigurator}.
     */
    name: string;

    /**
     * Reference to the parent model containing this configurator.
     *
     * @remarks
     * Provides access to model-level configuration and metadata.
     * Fixed in v0.5.1 to prevent infinite recursion bug in getter.
     */
    protected _model: Model;

    /**
     * Creates a new Configurator instance.
     *
     * @param model - Parent model that owns this configurator
     * @param name - Unique identifier for this configurator
     *
     * @remarks
     * The name should be descriptive and unique within the model's
     * configurator collection to enable selection via {@link Model.getConfigurator}.
     *
     * @example
     * ```typescript
     * class CustomConfigurator extends Configurator<CustomParams> {
     *   constructor(model: Model) {
     *     super(model, "custom-v1");
     *   }
     * }
     * ```
     */
    constructor(model: Model, name: string) {
        this._model = model;
        this.name = name;
    }

    /**
     * Returns the parent model instance.
     *
     * @returns Model that owns this configurator
     *
     * @remarks
     * **Bug Fix (v0.5.1):** Previously caused infinite recursion by calling
     * itself instead of returning `_model`. Now correctly returns the
     * model reference.
     *
     * @example
     * ```typescript
     * const configurator = model.getConfigurator("default");
     * const parentModel = configurator.model;
     * console.log(parentModel.name); // "ProductionModel"
     * ```
     */
    get model(): Model {
        return this._model;
    }

    /**
     * Generates a complete organisation configuration from parameter data.
     *
     * @param configuratorParamData - High-level configuration parameters
     * @returns Complete organisation configuration ready for simulation
     *
     * @remarks
     * This abstract method must be implemented by concrete configurators.
     * It transforms user-friendly parameters into the detailed {@link OrgConfigDTO}
     * structure required to instantiate an {@link Organisation}.
     *
     * **Implementation Guidelines:**
     *
     * - Validate input parameters for consistency and feasibility
     * - Apply model-specific defaults where parameters are omitted
     * - Ensure tensor dimensions are consistent (agent count, state count)
     * - Generate initial behavioral tensors (priority, influence, judgment, incentive)
     * - Define state transition rules and control mappings
     *
     * @throws {Error} If parameters are invalid or inconsistent
     *
     * @example
     * ```typescript
     * class ServiceConfigurator extends Configurator<ServiceParams> {
     *   generate(params: ConfiguratorParamsDTO<ServiceParams>): OrgConfigDTO {
     *     const agentCount = params.data.serverCount;
     *     const stateCount = 2; // Idle, Serving
     *
     *     return {
     *       agentCount,
     *       stateCount,
     *       clockTickSeconds: 0.1,
     *       plantDOF: 2, // Queue length, Service capacity
     *       reportingDOF: 2, // Throughput, Wait time
     *       initialAgentStates: Array(agentCount).fill(0), // All start idle
     *       priorityTensor: this.generatePriorityTensor(agentCount, stateCount),
     *       influenceTensor: this.generateInfluenceTensor(agentCount, stateCount),
     *       judgmentTensor: this.generateJudgmentTensor(agentCount, stateCount),
     *       incentiveTensor: this.generateIncentiveTensor(agentCount, stateCount),
     *       learningRate: params.data.learningRate || 0.01
     *     };
     *   }
     * }
     * ```
     */
    abstract generate(configuratorParamData: ConfiguratorParamsDTO<T>): OrgConfigDTO;

    /**
     * Returns default parameter values for this configurator.
     *
     * @returns Default configuration parameters
     *
     * @remarks
     * This abstract method must be implemented by concrete configurators.
     * It provides sensible defaults that produce valid configurations without
     * requiring user input.
     *
     * **Use Cases:**
     *
     * - Initial UI state before user customization
     * - Fallback when parameter validation fails
     * - Template for user to modify
     * - Baseline for parameter sensitivity analysis
     *
     * **Best Practices:**
     *
     * - Choose conservative, safe defaults
     * - Document assumptions in parameter descriptions
     * - Ensure defaults produce stable, convergent simulations
     * - Use industry-standard or literature-based values where applicable
     *
     * @example
     * ```typescript
     * class WarehouseConfigurator extends Configurator<WarehouseParams> {
     *   getDefaultParams(): ConfiguratorParamsDTO<WarehouseParams> {
     *     return {
     *       data: {
     *         workerCount: 10,        // Typical small warehouse
     *         stationCount: 5,        // 2:1 worker-to-station ratio
     *         shiftHours: 8,          // Standard work day
     *         throughputTarget: 100,  // Units per day
     *         learningRate: 0.01      // Conservative learning
     *       }
     *     };
     *   }
     * }
     * ```
     */
    abstract getDefaultParams(): ConfiguratorParamsDTO<T>;
}
