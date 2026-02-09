import { ConfiguratorParamsDTO } from "../../interfaces/dto.interfaces";
import {
    ConfiguratorParamData,
    DataPoint,
    Domain,
    OptimiserData,
    OptimiserParameters,
    ParameterSpace
} from "../../types/pipeline.types";
import { Model } from "../pipeline/model.class";
import { Optimiser } from "../pipeline/optimiser.class";
import { DomainTypes } from "../../constants/pipeline.constants";

const flatten = require("flat");

/**
 * Optimiser state data specific to gradient ascent algorithm.
 *
 * @remarks
 * Extends {@link OptimiserData} with gradient ascent-specific trajectory tracking.
 * Stores the complete optimization history including all evaluated parameter configurations
 * and their corresponding performance gradients.
 *
 * @typeParam T - Configuration parameter data type
 *
 * @public
 */
export interface GradientAscentOptimiserData<T extends ConfiguratorParamData> extends OptimiserData {
    /**
     * Complete trajectory of evaluated parameter points and gradient information.
     *
     * @remarks
     * Each data point contains:
     * - Input: {@link ConfiguratorParamsDTO} defining the configuration tested
     * - Output: {@link GradientAscentOutput} with performance and gradient data
     *
     * Used for convergence analysis, trajectory visualization, and restart capability.
     */
    dataPoints: DataPoint<ConfiguratorParamsDTO<T>, GradientAscentOutput>[];

    /**
     * Modulo delta parameter for finite difference approximation.
     *
     * @remarks
     * Used to compute numerical gradients via central/forward differences.
     * Undefined during initialization, set during first iteration.
     *
     * **Finite Difference:**
     * ```
     * ∂f/∂x ≈ (f(x + δ) - f(x)) / δ
     * ```
     * where δ = moduloDel
     */
    moduloDel: number | undefined;
}

/**
 * Output data for a single parameter's gradient evaluation.
 *
 * @remarks
 * Contains all information about a parameter's contribution to the optimization step,
 * including its current value, perturbation, resulting performance change, and computed gradient.
 *
 * **Gradient Computation:**
 *
 * The slope (gradient) is calculated via finite differences:
 * ```
 * slope = performanceDelta / xDelta
 *       = (performance(x + δ) - performance(x)) / δ
 * ```
 *
 * **Parameter Update:**
 *
 * Next iteration uses:
 * ```
 * x_new = x + learningRate × slope
 * ```
 *
 * @example
 * ```typescript
 * const output: GradientAscentOutput = {
 *   id: "learningRate",
 *   domain: { type: "continuous", min: 0.001, max: 0.1, optimise: true },
 *   configuratorParameterValue: 0.01,      // Current value
 *   xPlusDelta: 0.011,                     // Perturbed value (x + δ)
 *   xDelta: 0.001,                         // Perturbation size (δ)
 *   performance: 95.2,                     // f(x)
 *   performanceDelta: 2.3,                 // f(x+δ) - f(x)
 *   slope: 2300                            // ∂f/∂x = 2.3 / 0.001
 * };
 * ```
 *
 * @public
 */
export interface GradientAscentOutput {
    /**
     * Unique identifier for the parameter being optimized.
     *
     * @remarks
     * Corresponds to the parameter name in {@link ConfiguratorParamsDTO}.
     * Used to map gradient information back to configuration parameters.
     */
    id: string;

    /**
     * Domain constraints for this parameter.
     *
     * @remarks
     * Defines the valid range and type (continuous, categorical, boolean).
     * Used to enforce bounds and validate parameter updates.
     */
    domain: Domain;

    /**
     * Current value of the configuration parameter.
     *
     * @remarks
     * Type varies by domain:
     * - Continuous: `number`
     * - Categorical: `string`
     * - Boolean: `boolean`
     */
    configuratorParameterValue: number | string | boolean;

    /**
     * Perturbed parameter value for gradient estimation.
     *
     * @remarks
     * Computed as: `x + xDelta`
     *
     * Used to evaluate performance at a nearby point for finite difference calculation.
     * Undefined during first evaluation when no perturbation has been applied.
     */
    xPlusDelta: number | undefined;

    /**
     * Perturbation magnitude used for gradient estimation.
     *
     * @remarks
     * The finite difference step size (δ). Typically computed as:
     * ```
     * xDelta = moduloDel × parameterScale
     * ```
     *
     * Smaller values improve accuracy but may suffer from numerical instability.
     * Larger values are more stable but less accurate.
     *
     * Undefined during initialization.
     */
    xDelta: number | undefined;

    /**
     * Performance metric at the current parameter value.
     *
     * @remarks
     * Obtained from simulation results at the current configuration.
     * The objective function value we're trying to maximize.
     *
     * Undefined before first simulation completes.
     */
    performance: number | undefined;

    /**
     * Change in performance due to parameter perturbation.
     *
     * @remarks
     * Computed as:
     * ```
     * performanceDelta = performance(x + δ) - performance(x)
     * ```
     *
     * Positive values indicate the perturbation improved performance.
     * Used as the numerator in gradient calculation.
     *
     * Undefined until perturbation evaluation completes.
     */
    performanceDelta: number | undefined;

    /**
     * Estimated gradient (partial derivative) of performance with respect to this parameter.
     *
     * @remarks
     * Computed as:
     * ```
     * slope = performanceDelta / xDelta = ∂(performance)/∂x
     * ```
     *
     * **Interpretation:**
     * - Positive: Increasing parameter improves performance
     * - Negative: Decreasing parameter improves performance
     * - Large magnitude: Parameter has strong influence
     * - Near zero: Parameter has weak influence
     *
     * Used to determine the direction and magnitude of parameter updates:
     * ```
     * x_new = x + learningRate × slope
     * ```
     *
     * Undefined until gradient can be calculated.
     */
    slope: number | undefined;
}

/**
 * Configuration parameters for gradient ascent optimization.
 *
 * @remarks
 * Defines the complete setup for gradient ascent including learning dynamics,
 * convergence criteria, parameter space, and initialization strategy.
 *
 * **Algorithm Overview:**
 *
 * Gradient ascent iteratively improves parameters by following the gradient:
 * ```
 * θ_new = θ_old + α × ∇f(θ)
 * ```
 * where α = learning rate, ∇f = gradient vector
 *
 * @example
 * ```typescript
 * const params: GradientAscentParameters = {
 *   iterations: {
 *     learningRate: 0.01,    // Step size
 *     tolerance: 0.001,      // Convergence threshold
 *     max: 100               // Maximum iterations
 *   },
 *   parameterSpace: {
 *     learningRate: {
 *       type: "continuous",
 *       min: 0.001,
 *       max: 0.1,
 *       optimise: true
 *     },
 *     agentCount: {
 *       type: "discrete",
 *       min: 5,
 *       max: 50,
 *       optimise: true
 *     }
 *   },
 *   init: { type: "random" }  // Random initialization
 * };
 * ```
 *
 * @public
 */
export interface GradientAscentParameters extends OptimiserParameters {
    /**
     * Iteration control parameters for optimization dynamics.
     *
     * @remarks
     * **Learning Rate (α):**
     * - Controls step size in gradient direction
     * - Too large: Oscillation or divergence
     * - Too small: Slow convergence
     * - Typical range: 0.001 - 0.1
     *
     * **Tolerance (ε):**
     * - Convergence threshold for gradient magnitude
     * - Stops when `||∇f|| < ε`
     * - Smaller values: Tighter convergence
     * - Typical range: 0.0001 - 0.01
     *
     * **Max Iterations:**
     * - Safety limit to prevent infinite loops
     * - Optional; continues until convergence if omitted
     */
    iterations: {
        /**
         * Step size multiplier for gradient updates.
         *
         * @remarks
         * Controls the magnitude of parameter updates:
         * ```
         * Δθ = learningRate × ∇f(θ)
         * ```
         */
        learningRate: number;

        /**
         * Convergence threshold for gradient magnitude.
         *
         * @remarks
         * Optimization terminates when:
         * ```
         * ||∇f(θ)|| < tolerance
         * ```
         */
        tolerance: number;

        /**
         * Maximum number of optimization iterations.
         *
         * @remarks
         * Optional safety limit. If omitted, runs until convergence.
         */
        max?: number;
    };

    /**
     * Definition of the parameter search space.
     *
     * @remarks
     * Maps parameter names to their domain constraints.
     * Only parameters with `optimise: true` are adjusted.
     *
     * **Parameter Types:**
     * - **Continuous**: Real-valued with min/max bounds
     * - **Discrete**: Integer-valued with min/max bounds
     * - **Categorical**: Enumerated set of options
     * - **Boolean**: Binary true/false
     */
    parameterSpace: ParameterSpace;

    /**
     * Initialization strategy for optimization starting point.
     *
     * @remarks
     * **Random Initialization:**
     * - Samples uniformly from parameter space
     * - Good for exploration
     * - May require multiple runs
     *
     * **Defined Initialization:**
     * - Starts from a specific configuration
     * - Useful for warm starts
     * - Ensures reproducibility
     */
    init: { type: "random" } | { type: "defined"; config: ConfiguratorParamData };
}

/**
 * Abstract base class for gradient ascent parameter optimization.
 *
 * @remarks
 * Implements gradient ascent optimization for multi-agent system configurations.
 * Uses finite differences to estimate gradients when analytical derivatives are unavailable.
 *
 * **Algorithm:**
 *
 * 1. **Initialize**: Sample or use provided starting point
 * 2. **Evaluate**: Run simulation at current parameters
 * 3. **Perturb**: For each parameter, compute f(x + δ)
 * 4. **Gradient**: Calculate ∂f/∂x via finite differences
 * 5. **Update**: Move in gradient direction: x ← x + α·∇f
 * 6. **Converge**: Repeat until ||∇f|| < tolerance or max iterations
 *
 * **Finite Difference Gradient:**
 *
 * For parameter xᵢ:
 * ```
 * ∂f/∂xᵢ ≈ (f(x₁,...,xᵢ+δ,...,xₙ) - f(x₁,...,xᵢ,...,xₙ)) / δ
 * ```
 *
 * **Update Rule:**
 *
 * ```
 * θ_new = θ_old + α × ∇f(θ)
 * ```
 * where:
 * - θ = parameter vector
 * - α = learning rate
 * - ∇f = gradient vector
 *
 * **Convergence Criteria:**
 *
 * Stops when:
 * - Gradient magnitude: `||∇f|| < tolerance`, or
 * - Max iterations reached
 *
 * **Domain Handling:**
 *
 * - **Continuous**: Gradient ascent with bounds checking
 * - **Discrete**: Rounded gradients with integer constraints
 * - **Categorical**: Not optimized (fixed during search)
 * - **Boolean**: Not optimized (fixed during search)
 *
 * @typeParam T - Configuration parameter data type
 * @typeParam U - Optimization parameters extending {@link GradientAscentParameters}
 * @typeParam V - Optimiser state data extending {@link OptimiserData}
 *
 * @example
 * ```typescript
 * // Concrete implementation
 * class MyGradientOptimiser extends GradientAscentOptimiser<
 *   MyParams,
 *   GradientAscentParameters,
 *   GradientAscentOptimiserData<MyParams>
 * > {
 *   // Implement abstract methods...
 * }
 *
 * // Usage
 * const optimiser = new MyGradientOptimiser("gradient-opt", model);
 * const initialState = optimiser.initialise(parameters);
 *
 * // Optimization loop
 * let state = initialState;
 * while (!state.converged) {
 *   const configs = optimiser.getStateRequiredConfiguratorParams(state);
 *   const results = await runSimulations(configs);
 *   state = optimiser.step(parameters, state, results);
 *   console.log(`Iteration ${state.iteration}: Performance ${state.currentBest}`);
 * }
 * ```
 *
 * @public
 */
export abstract class GradientAscentOptimiser<
    T extends ConfiguratorParamData,
    U extends GradientAscentParameters,
    V extends OptimiserData
> extends Optimiser<T, U, V> {
    /**
     * Indices for accessing min/max bounds in domain arrays.
     *
     * @remarks
     * Used to extract boundary values from parameter domain definitions.
     * Simplifies bound checking during parameter updates.
     *
     * @internal
     */
    protected _boundIndices = {
        /** Index for maximum bound value in domain array */
        MAX: 1,
        /** Index for minimum bound value in domain array */
        MIN: 0
    };

    /**
     * Creates a new GradientAscentOptimiser instance.
     *
     * @param name - Unique identifier for this optimiser
     * @param model - Parent model containing this optimiser
     *
     * @remarks
     * Initializes the optimiser with a name and model reference.
     * The model provides access to simulation infrastructure and configuration.
     *
     * @example
     * ```typescript
     * class ProductionOptimiser extends GradientAscentOptimiser<...> {
     *   constructor(model: Model) {
     *     super("production-gradient-ascent", model);
     *   }
     * }
     * ```
     */
    constructor(name: string, model: Model) {
        super(name, model);
    }

    /**
     * Validates parameter domain constraints.
     *
     * @param domains - Array of domain definitions to validate
     * @throws {Error} If min > max for any continuous or discrete domain
     *
     * @remarks
     * Ensures that parameter bounds are logically consistent before optimization begins.
     * Only validates domains marked for optimization (`optimise: true`).
     *
     * **Validation Rules:**
     *
     * - **Continuous/Discrete**: Must have `min ≤ max`
     * - **Categorical/Boolean**: No bound validation (discrete sets)
     *
     * **Error Prevention:**
     *
     * Catches configuration errors early to prevent:
     * - Invalid parameter sampling
     * - Impossible constraint satisfaction
     * - Runtime errors during optimization
     *
     * @example
     * ```typescript
     * const domains: Domain[] = [
     *   { type: "continuous", min: 0.1, max: 1.0, optimise: true },  // Valid
     *   { type: "continuous", min: 5.0, max: 1.0, optimise: true }   // Invalid - throws!
     * ];
     *
     * try {
     *   this._checkDomains(domains);
     * } catch (err) {
     *   console.error("Invalid domain:", err.message);
     *   // "The parameter space definition max must be higher than min for ..."
     * }
     * ```
     *
     * @protected
     */
    protected _checkDomains(domains: Domain[]): void {
        domains.forEach((domain: Domain) => {
            if (domain.type !== DomainTypes.CATEGORICAL && domain.type !== DomainTypes.BOOLEAN && domain.optimise) {
                if (domain.min > domain.max) {
                    throw new Error(`The parameter space definition max must be higher than min for ${domain}`);
                }
            }
        });
    }

    /**
     * Creates a standardized error for uninitialized optimiser access.
     *
     * @returns Error object with descriptive message
     *
     * @remarks
     * Used by subclasses to provide consistent error messages when operations
     * are attempted before {@link initialise} has been called.
     *
     * **Usage Pattern:**
     *
     * ```typescript
     * step(params, state, results) {
     *   if (!state) {
     *     throw this._initError();
     *   }
     *   // ... optimization logic
     * }
     * ```
     *
     * @protected
     */
    protected _initError(): Error {
        return new Error("The optimiser has not been initialised");
    }
}
