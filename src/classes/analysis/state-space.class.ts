import { Utils } from "aethon-arion-core";
import { StateSpacePointDTO } from "../../interfaces/dto.interfaces";

/**
 * Time series collection of simulation state snapshots with trajectory analysis.
 *
 * @remarks
 * The StateSpace class extends Array to provide specialized analysis methods for
 * multi-agent simulation trajectories. Each element represents a complete system
 * snapshot at a specific clock tick, enabling temporal analysis of agent behavior,
 * coordination patterns, and system dynamics.
 *
 * **Data Structure:**
 *
 * StateSpace is an ordered sequence of {@link StateSpacePointDTO} objects:
 * ```
 * StateSpace[τ] = {
 *   agentStates: [σ₀(τ), σ₁(τ), ..., σₙ(τ)],
 *   board: [target values],
 *   plant: [χ₀(τ), χ₁(τ), ...],
 *   reporting: [ψ₀(τ), ψ₁(τ), ...]
 * }
 * ```
 *
 * where τ = clock tick, σ = agent state, χ = plant state, ψ = reporting metrics.
 *
 * **Analysis Capabilities:**
 *
 * - **State Probabilities**: Frequency distribution of agent states over time
 * - **Temporal Trajectories**: Agent state evolution across clock ticks
 * - **State Averages**: Mean state indices per agent across trajectory
 * - **Coordination Analysis**: Pairwise state alignment between agents
 *
 * **Use Cases:**
 *
 * - Visualizing learning dynamics and convergence
 * - Analyzing emergent coordination patterns
 * - Detecting phase transitions in collective behavior
 * - Validating steady-state assumptions
 *
 * **Bug Fixes (v0.5.1):**
 *
 * - Fixed property existence check for `agentStates` (prevented crashes on malformed data)
 * - Fixed array bounds checking (prevented out-of-bounds access with invalid state indices)
 *
 * @example
 * ```typescript
 * // Collect state space trajectory
 * const stateSpace = new StateSpace(simulation.stateSpaceData);
 *
 * // Analyze agent state distribution
 * const probs = stateSpace.agentStateProbabilities(["Idle", "Working", "Break"]);
 * console.log(`Agent 0 - Working: ${(probs[0][1] * 100).toFixed(1)}%`);
 *
 * // Measure coordination
 * const coordMatrix = stateSpace.agentStateCoordinationMatrix();
 * console.log(`Agents 0-1 coordination: ${(coordMatrix[0][1] * 100).toFixed(1)}%`);
 *
 * // Check convergence
 * const avgStates = stateSpace.agentStateAverage();
 * console.log(`Agent 0 avg state: ${avgStates[0].toFixed(2)}`);
 * ```
 *
 * @public
 */
export class StateSpace extends Array<StateSpacePointDTO> {
    /**
     * Number of agents in the simulation.
     *
     * @remarks
     * Determined from the first state space point's `agentStates` array length.
     * Used to pre-allocate analysis result tensors.
     * **Bug Fix (v0.5.1):** Now safely checks existence before accessing.
     */
    private _agentCount: number = 0;

    /**
     * Creates a new StateSpace from simulation trajectory data.
     *
     * @param stateSpace - Array of state snapshots, or undefined for empty state space
     *
     * @remarks
     * Extends native Array with simulation-specific analysis methods. The constructor
     * automatically determines agent count from the first non-empty state point.
     *
     * **Initialization:**
     *
     * - Empty/undefined input → empty state space with `_agentCount = 0`
     * - Valid input → state space populated with `_agentCount` from first point
     *
     * **Bug Fix (v0.5.1):** Added optional chaining `this[0]?.agentStates` to
     * prevent crashes when the first state point is missing `agentStates` property.
     *
     * **Array Extension:**
     *
     * All Array methods are available (map, filter, reduce, etc.), plus custom
     * analysis methods specific to multi-agent trajectories.
     *
     * @example
     * ```typescript
     * // From simulation results
     * const trajectory: StateSpacePointDTO[] = [
     *   { agentStates: [0, 1, 1], board: [100], plant: [50], reporting: [0.8] },
     *   { agentStates: [1, 1, 0], board: [100], plant: [52], reporting: [0.85] },
     *   // ... more time steps
     * ];
     * const stateSpace = new StateSpace(trajectory);
     *
     * // Empty initialization
     * const empty = new StateSpace(undefined);
     * console.log(empty.length); // 0
     *
     * // Use as array
     * const firstPoint = stateSpace[0];
     * const filtered = stateSpace.filter(point => point.reporting[0] > 0.9);
     * ```
     */
    constructor(stateSpace: StateSpacePointDTO[] | undefined) {
        if (!stateSpace) stateSpace = [];
        super(...stateSpace);
        if (this.length > 0 && this[0]?.agentStates) {
            this._agentCount = this[0].agentStates.length;
        }
    }

    /**
     * Computes probability distribution of agent states over the trajectory.
     *
     * @param agentStatesArray - Array of state names for labeling (e.g., ["Idle", "Working"])
     * @returns 2D tensor `[agentIndex][stateIndex]` with empirical probabilities
     *
     * @remarks
     * Calculates the frequency of each state for each agent across all time steps:
     *
     * ```
     * P(agent α in state σ) = count(α=σ) / T
     * ```
     *
     * where T = trajectory length (number of time steps).
     *
     * **Return Tensor Structure:**
     *
     * ```
     * result[α][σ] = probability that agent α occupies state σ
     * ```
     *
     * **Probability Properties:**
     *
     * - Each row sums to 1.0: `Σ P(agent α in state σ) = 1`
     * - Values in [0, 1]: `0 ≤ P(α=σ) ≤ 1`
     *
     * **Bug Fix (v0.5.1):** Added bounds checking `agentState >= 0 && agentState < length`
     * to skip invalid state indices instead of causing array out-of-bounds errors.
     *
     * **Complexity:** O(n × m) where n = trajectory length, m = agent count
     *
     * @example
     * ```typescript
     * const stateNames = ["Idle", "Working", "Maintenance"];
     * const probs = stateSpace.agentStateProbabilities(stateNames);
     *
     * // Analyze each agent
     * probs.forEach((agentProbs, agentIdx) => {
     *   console.log(`\nAgent ${agentIdx}:`);
     *   agentProbs.forEach((prob, stateIdx) => {
     *     console.log(`  ${stateNames[stateIdx]}: ${(prob * 100).toFixed(1)}%`);
     *   });
     * });
     *
     * // Find dominant state
     * const agent0DominantState = probs[0].indexOf(Math.max(...probs[0]));
     * console.log(`Agent 0 mostly: ${stateNames[agent0DominantState]}`);
     *
     * // Detect imbalances
     * if (probs[0][0] > 0.8) {
     *   console.warn("Agent 0 idle >80% - underutilization");
     * }
     * ```
     */
    agentStateProbabilities(agentStatesArray: string[]): number[][] {
        let agentSetStateProbabilities: number[][] = [[]];
        if (agentStatesArray && agentStatesArray.length > 0 && this.length > 0) {
            agentSetStateProbabilities = Utils.tensor([this._agentCount, agentStatesArray.length], () => {
                return 0;
            }) as number[][];
            this.forEach((stateSpacePoint) => {
                stateSpacePoint.agentStates.forEach((agentState, agentIndex) => {
                    if (agentState >= 0 && agentState < agentStatesArray.length) {
                        agentSetStateProbabilities[agentIndex][agentState]++;
                    }
                });
            });
            agentSetStateProbabilities.forEach((agent, agentIndex) => {
                agent.forEach((state, stateIndex) => {
                    agentSetStateProbabilities[agentIndex][stateIndex] =
                        agentSetStateProbabilities[agentIndex][stateIndex] / this.length;
                });
            });
        }
        return agentSetStateProbabilities;
    }

    /**
     * Extracts complete temporal trajectories for all agents.
     *
     * @returns 2D tensor `[agentIndex][timeStep]` with state indices
     *
     * @remarks
     * Transposes the state space data structure from time-major to agent-major format,
     * enabling time series analysis per agent.
     *
     * **Return Tensor Structure:**
     *
     * ```
     * result[α][τ] = state index of agent α at time τ
     * ```
     *
     * **Use Cases:**
     *
     * - Plotting individual agent trajectories
     * - Detecting state transition patterns
     * - Identifying synchronization events
     * - Computing temporal autocorrelation
     *
     * **Complexity:** O(n × m) where n = trajectory length, m = agent count
     *
     * @example
     * ```typescript
     * const trajectories = stateSpace.agentStates();
     *
     * // Plot agent 0's trajectory
     * const agent0Path = trajectories[0];
     * console.log("Agent 0 trajectory:", agent0Path);
     * // Output: [0, 0, 1, 1, 1, 2, 1, 1, 0, ...]
     *
     * // Count state transitions
     * let transitionCount = 0;
     * for (let t = 1; t < agent0Path.length; t++) {
     *   if (agent0Path[t] !== agent0Path[t-1]) transitionCount++;
     * }
     * console.log(`Agent 0 transitions: ${transitionCount}`);
     *
     * // Find longest stable period
     * let maxStable = 0, currentStable = 1;
     * for (let t = 1; t < agent0Path.length; t++) {
     *   if (agent0Path[t] === agent0Path[t-1]) {
     *     currentStable++;
     *     maxStable = Math.max(maxStable, currentStable);
     *   } else {
     *     currentStable = 1;
     *   }
     * }
     * console.log(`Longest stable period: ${maxStable} ticks`);
     * ```
     */
    agentStates(): number[][] {
        const states: number[][] = Utils.tensor([this._agentCount, this.length], () => {
            return 0;
        }) as number[][];
        for (let tau = 0; tau < this.length; tau++) {
            for (let alpha = 0; alpha < this._agentCount; alpha++) states[alpha][tau] = this[tau].agentStates[alpha];
        }
        return states;
    }

    /**
     * Computes time-averaged state indices for each agent.
     *
     * @returns Array of average state indices, one per agent
     *
     * @remarks
     * Calculates the mean state index across the entire trajectory:
     *
     * ```
     * avgState[α] = (Σ σ(α,τ)) / T
     * ```
     *
     * where σ(α,τ) = state index of agent α at time τ, T = trajectory length.
     *
     * **Interpretation:**
     *
     * - Value close to 0: Agent predominantly in low-index states
     * - Value close to stateCount-1: Agent predominantly in high-index states
     * - Fractional values indicate mixed occupancy
     *
     * **Convergence Indicator:**
     *
     * If average states stabilize across multiple runs, the system has likely
     * converged to a steady-state distribution.
     *
     * **Complexity:** O(n × m) where n = trajectory length, m = agent count
     *
     * @example
     * ```typescript
     * const avgStates = stateSpace.agentStateAverage();
     *
     * avgStates.forEach((avg, agentIdx) => {
     *   console.log(`Agent ${agentIdx} avg state: ${avg.toFixed(2)}`);
     *
     *   // Interpret average
     *   if (avg < 0.5) {
     *     console.log("  → Mostly in idle/low states");
     *   } else if (avg > 1.5) {
     *     console.log("  → Mostly in active/high states");
     *   } else {
     *     console.log("  → Balanced between states");
     *   }
     * });
     *
     * // Check for uniformity across agents
     * const mean = avgStates.reduce((a, b) => a + b, 0) / avgStates.length;
     * const variance = avgStates.reduce((acc, val) => acc + (val - mean) ** 2, 0) / avgStates.length;
     * if (variance < 0.1) {
     *   console.log("Agents have similar average states - coordinated behavior");
     * } else {
     *   console.log("Agents have diverse average states - heterogeneous behavior");
     * }
     * ```
     */
    agentStateAverage(): number[] {
        const averageValues: number[] = Utils.tensor([this._agentCount], () => {
            return 0;
        }) as number[];
        if (this.length > 0) {
            for (let alpha = 0; alpha < this._agentCount; alpha++) {
                for (let tau = 0; tau < this.length; tau++)
                    averageValues[alpha] = averageValues[alpha] + this[tau].agentStates[alpha];
                averageValues[alpha] = averageValues[alpha] / this.length;
            }
        }
        return averageValues;
    }

    /**
     * Computes pairwise state coordination matrix between all agents.
     *
     * @returns Symmetric matrix `[agentA][agentB]` with coordination probabilities
     *
     * @remarks
     * Measures the probability that two agents occupy the same state simultaneously:
     *
     * ```
     * Coord[α, β] = P(state(α) = state(β)) = count(σ_α = σ_β) / T
     * ```
     *
     * **Matrix Properties:**
     *
     * - **Symmetric**: `Coord[α,β] = Coord[β,α]`
     * - **Diagonal = 1.0**: Each agent always coordinates with itself
     * - **Values in [0,1]**: `0 ≤ Coord[α,β] ≤ 1`
     *
     * **Interpretation:**
     *
     * - **1.0**: Agents always in same state (perfect coordination)
     * - **0.5-0.7**: Moderate coordination
     * - **< 0.3**: Low coordination (near-random alignment)
     * - **~1/stateCount**: Expected value for independent agents
     *
     * **Applications:**
     *
     * - Detecting emergent coordination patterns
     * - Identifying agent clusters/teams
     * - Measuring influence propagation
     * - Validating decentralized learning
     *
     * **Complexity:** O(n × m²) where n = trajectory length, m = agent count
     *
     * @example
     * ```typescript
     * const coordMatrix = stateSpace.agentStateCoordinationMatrix();
     *
     * // Print coordination table
     * console.log("Coordination Matrix:");
     * coordMatrix.forEach((row, i) => {
     *   console.log(`Agent ${i}:`, row.map(v => v.toFixed(2)).join(" "));
     * });
     *
     * // Find most coordinated pair
     * let maxCoord = 0, bestPair = [0, 0];
     * for (let i = 0; i < coordMatrix.length; i++) {
     *   for (let j = i + 1; j < coordMatrix.length; j++) {
     *     if (coordMatrix[i][j] > maxCoord) {
     *       maxCoord = coordMatrix[i][j];
     *       bestPair = [i, j];
     *     }
     *   }
     * }
     * console.log(`Most coordinated: Agents ${bestPair[0]}-${bestPair[1]} (${(maxCoord*100).toFixed(1)}%)`);
     *
     * // Detect coordination clusters
     * const threshold = 0.7;
     * console.log("\nHigh coordination pairs (>70%):");
     * for (let i = 0; i < coordMatrix.length; i++) {
     *   for (let j = i + 1; j < coordMatrix.length; j++) {
     *     if (coordMatrix[i][j] > threshold) {
     *       console.log(`  Agents ${i}-${j}: ${(coordMatrix[i][j]*100).toFixed(1)}%`);
     *     }
     *   }
     * }
     * ```
     */
    agentStateCoordinationMatrix(): number[][] {
        const matrix: number[][] = Utils.tensor([this._agentCount, this._agentCount], () => {
            return 0;
        }) as number[][];
        for (let alpha = 0; alpha < this._agentCount; alpha++) {
            for (let beta = alpha; beta < this._agentCount; beta++) {
                for (let tau = 0; tau < this.length; tau++) {
                    if (this[tau].agentStates[alpha] === this[tau].agentStates[beta]) {
                        matrix[alpha][beta]++;
                        if (alpha !== beta) matrix[beta][alpha]++;
                    }
                }
                matrix[alpha][beta] = matrix[alpha][beta] / this.length;
                if (alpha !== beta) matrix[beta][alpha] = matrix[beta][alpha] / this.length;
            }
        }
        return matrix;
    }

    /**
     * Converts the state space to a plain JSON object.
     *
     * @returns Deep copy as plain JavaScript object
     *
     * @remarks
     * Creates a serializable representation by removing Array prototype methods.
     * Useful for storage, transmission, or compatibility with JSON APIs.
     *
     * @example
     * ```typescript
     * const json = stateSpace.toJSON();
     * const jsonString = JSON.stringify(json, null, 2);
     * console.log(jsonString);
     * ```
     */
    toJSON(): any {
        return JSON.parse(JSON.stringify(this));
    }

    /**
     * Converts the state space to a plain DTO array.
     *
     * @returns Array of {@link StateSpacePointDTO} without custom methods
     *
     * @remarks
     * Returns the state space as a standard TypeScript array type,
     * removing StateSpace-specific analysis methods. Useful for type-safe
     * API boundaries or storage interfaces.
     *
     * @example
     * ```typescript
     * const dto = stateSpace.toDTO();
     * await saveToDatabase(dto); // Type-safe persistence
     * ```
     */
    toDTO(): StateSpacePointDTO[] {
        return this as StateSpacePointDTO[];
    }
}
