import { ResultDTO } from "../../interfaces/dto.interfaces";

/**
 * Statistical analysis and aggregation of simulation results.
 *
 * @remarks
 * The ResultSet class processes collections of {@link ResultDTO} objects to compute
 * aggregate statistics, probability distributions, and information-theoretic metrics.
 * It provides histogram-based quantization for analyzing state space trajectories
 * and calculating entropy measures of system behavior.
 *
 * **Analysis Capabilities:**
 *
 * - **Performance Statistics**: Average and standard deviation of performance metrics
 * - **Entropy Calculation**: Shannon entropy of quantized state distributions
 * - **Histogram Analysis**: Discretized probability distributions over state space
 *
 * **State Space Quantization:**
 *
 * Results are quantized into histogram bins for density estimation:
 * ```
 * binSize = (max - min) / histogramBinCount
 * binIndex = floor((value - min) / binSize)
 * ```
 *
 * Each result is represented as a concatenated state vector:
 * ```
 * stateVector = [board, agentStates, plant, reporting, priorityTensor]
 * ```
 *
 * **Entropy Computation:**
 *
 * Shannon entropy measures uncertainty in state distribution:
 * ```
 * H = -Σ p(x) × log₂(p(x))
 * ```
 *
 * Higher entropy indicates more diverse/exploratory behavior, while lower
 * entropy suggests convergence to specific states.
 *
 * **Bug Fixes (v0.5.1):**
 *
 * - Fixed `Math.log2(0)` producing `-Infinity` in entropy calculation
 * - Fixed division by zero when `histogramBinCount = 0`
 * - Changed loose equality `!=` to strict `!==` for type safety
 *
 * @example
 * ```typescript
 * // Analyze simulation results
 * const results: ResultDTO[] = await runSimulations(config, 100);
 * const resultSet = new ResultSet(results, 50); // 50 histogram bins
 *
 * // Get summary statistics
 * const summary = resultSet.getSummary();
 * console.log(`Avg Performance: ${summary.avgPerformance}`);
 * console.log(`Std Dev: ${summary.stDevPerformance}`);
 * console.log(`Entropy: ${summary.entropy} bits`);
 *
 * // Check for convergence
 * if (summary.stDevPerformance! < 0.01) {
 *   console.log("Converged to stable performance");
 * }
 *
 * // High entropy indicates exploration
 * if (summary.entropy! > 5.0) {
 *   console.log("System exploring diverse states");
 * }
 * ```
 *
 * @public
 */
export class ResultSet {
    /**
     * Collection of simulation results to analyze.
     *
     * @remarks
     * Each {@link ResultDTO} contains the final state of a single simulation run,
     * including board targets, agent states, plant state, reporting metrics,
     * and behavioral tensors.
     */
    protected results: ResultDTO[];

    /**
     * Number of bins for histogram quantization.
     *
     * @remarks
     * Higher bin counts provide finer granularity but may suffer from
     * sparse sampling with limited data. Typical values: 50-100.
     */
    protected histogramBinCount: number;

    /**
     * Probability distribution map from quantized state vectors to likelihoods.
     *
     * @remarks
     * Keys are JSON-stringified quantized state vectors.
     * Values are normalized probabilities (sum to 1.0).
     * Null when no results provided.
     */
    private histogram: Map<string, number> | null;

    /**
     * Minimum values for each dimension of the state vector.
     *
     * @remarks
     * Used to define histogram bin boundaries for quantization.
     */
    private histogramMin: number[];

    /**
     * Maximum values for each dimension of the state vector.
     *
     * @remarks
     * Used to define histogram bin boundaries for quantization.
     */
    private histogramMax: number[];

    /**
     * Bin sizes for each dimension of the state vector.
     *
     * @remarks
     * Calculated as `(max - min) / histogramBinCount`.
     * **Bug Fix (v0.5.1):** Now guards against division by zero.
     */
    private histogramBinSizes: number[];

    /**
     * Creates a new ResultSet and computes histogram statistics.
     *
     * @param results - Array of simulation results to analyze
     * @param histogramBinCount - Number of histogram bins (default: 100)
     *
     * @remarks
     * The constructor performs the complete histogram analysis pipeline:
     *
     * 1. **State Vector Construction**: Concatenates all result fields into unified vectors
     * 2. **Range Calculation**: Finds min/max for each dimension across all results
     * 3. **Bin Size Computation**: Divides each dimension into `histogramBinCount` bins
     * 4. **Quantization**: Maps each result to its nearest bin center
     * 5. **Frequency Counting**: Counts occurrences of each quantized state
     * 6. **Normalization**: Converts counts to probabilities (sum = 1.0)
     *
     * **Complexity:** O(n × m) where n = result count, m = state vector dimensionality
     *
     * **Edge Cases:**
     *
     * - Empty results: `histogram = null`
     * - Zero bin count: `binSizes = 0` (fixed in v0.5.1)
     * - Identical states: All probability mass at single point
     *
     * @example
     * ```typescript
     * const results: ResultDTO[] = [
     *   { performance: 95.3, agentStates: [0, 1, 1], ... },
     *   { performance: 97.1, agentStates: [1, 1, 0], ... },
     *   { performance: 96.2, agentStates: [1, 0, 1], ... }
     * ];
     *
     * const resultSet = new ResultSet(results, 50);
     * // Histogram computed with 50 bins per dimension
     * ```
     */
    constructor(results: ResultDTO[], histogramBinCount: number = 100) {
        this.results = results;
        this.histogramBinCount = histogramBinCount;
        this.histogramMax = [];
        this.histogramMin = [];
        this.histogramBinSizes = [];

        if (this.results.length === 0) {
            this.histogram = null;
        } else {
            this.histogram = new Map<string, number>();
            const stateVectors: number[][] = [];
            for (const result of this.results) {
                let stateVector = JSON.parse(JSON.stringify(result.board));
                stateVector = stateVector.concat(result.agentStates);
                stateVector = stateVector.concat(result.plant);
                stateVector = stateVector.concat(result.reporting);
                stateVector = stateVector.concat(result.priorityTensor.flat().flat());
                stateVectors.push(stateVector);
            }

            // find the min and max values for each state vector element
            this.histogramMax = JSON.parse(JSON.stringify(stateVectors[0]));
            this.histogramMin = JSON.parse(JSON.stringify(stateVectors[0]));
            for (const stateVector of stateVectors) {
                for (let i = 0; i < stateVector.length; i++) {
                    if (stateVector[i] < this.histogramMin[i]) this.histogramMin[i] = stateVector[i];
                    if (stateVector[i] > this.histogramMax[i]) this.histogramMax[i] = stateVector[i];
                    this.histogramBinSizes[i] = this.histogramBinCount > 0
                        ? (this.histogramMax[i] - this.histogramMin[i]) / this.histogramBinCount
                        : 0;
                }
            }

            // count frequency of each state vector when quantised
            if (JSON.stringify(this.histogramMax) !== JSON.stringify(this.histogramMin)) {
                for (const stateVector of stateVectors) {
                    const indexVectorKey = JSON.stringify(this._quantiseStateVector(stateVector));
                    if (this.histogram.has(indexVectorKey)) {
                        this.histogram.set(indexVectorKey, (this.histogram.get(indexVectorKey) as number) + 1);
                    } else {
                        this.histogram.set(indexVectorKey, 1);
                    }
                }
            } else {
                const indexVectorKey = JSON.stringify(this.histogramMax);
                this.histogram.set(indexVectorKey, stateVectors.length);
            }

            // normalise to likelihood
            for (const key of this.histogram.keys()) {
                this.histogram.set(key, (this.histogram.get(key) as number) / stateVectors.length);
            }
        }
        return this;
    }

    /**
     * Returns the raw simulation results.
     *
     * @returns Array of {@link ResultDTO} objects
     *
     * @remarks
     * Provides access to individual results for custom analysis beyond
     * the built-in histogram and performance statistics.
     */
    getResults(): ResultDTO[] {
        return this.results;
    }

    /**
     * Returns the histogram bin count.
     *
     * @returns Number of bins used for quantization
     *
     * @remarks
     * This value determines the granularity of the probability distribution
     * computed from the results.
     */
    getHistogramBinCount(): number {
        return this.histogramBinCount;
    }

    /**
     * Returns aggregated statistics including performance and entropy.
     *
     * @returns Object containing average performance, standard deviation, and entropy
     *
     * @remarks
     * Convenience method that combines {@link getPerformance} and {@link getEntropy}
     * into a single summary object.
     *
     * **Return Fields:**
     *
     * - `avgPerformance`: Mean performance across all results (null if no results)
     * - `stDevPerformance`: Sample standard deviation (null if < 3 results)
     * - `entropy`: Shannon entropy in bits (null if no results)
     *
     * @example
     * ```typescript
     * const summary = resultSet.getSummary();
     * console.log(`Performance: ${summary.avgPerformance} ± ${summary.stDevPerformance}`);
     * console.log(`State diversity: ${summary.entropy} bits`);
     *
     * // Interpret entropy
     * if (summary.entropy! < 1.0) {
     *   console.log("Low entropy - converged to few states");
     * } else if (summary.entropy! > 5.0) {
     *   console.log("High entropy - exploring state space");
     * }
     * ```
     */
    getSummary(): { avgPerformance: number | null; stDevPerformance: number | null; entropy: number | null } {
        const performance: { avgPerformance: number | null; stDevPerformance: number | null } = this.getPerformance();
        return {
            avgPerformance: performance.avgPerformance,
            stDevPerformance: performance.stDevPerformance,
            entropy: this.getEntropy()
        };
    }

    /**
     * Computes Shannon entropy of the quantized state distribution.
     *
     * @returns Entropy in bits, or null if no results
     *
     * @remarks
     * Shannon entropy measures the uncertainty/diversity of the state distribution:
     *
     * ```
     * H = -Σ p(x) × log₂(p(x))
     * ```
     *
     * **Interpretation:**
     *
     * - **0 bits**: All results in same state (deterministic)
     * - **1-3 bits**: Low diversity, convergence to few states
     * - **3-5 bits**: Moderate exploration
     * - **5+ bits**: High diversity, broad state space coverage
     *
     * **Bug Fix (v0.5.1):** Now guards against `Math.log2(0)` which produced
     * `-Infinity`. Uses the convention that `0 × log(0) = 0` per information theory.
     *
     * **Complexity:** O(k) where k = number of unique quantized states
     *
     * @example
     * ```typescript
     * const entropy = resultSet.getEntropy();
     *
     * if (entropy === null) {
     *   console.log("No results to analyze");
     * } else if (entropy < 2.0) {
     *   console.log("Converged - low state diversity");
     *   console.log("Consider: Lower learning rate, longer simulation");
     * } else {
     *   console.log(`Exploring state space - entropy: ${entropy.toFixed(2)} bits`);
     * }
     * ```
     */
    getEntropy(): number | null {
        if (this.histogram) {
            let entropy: number = 0;
            for (const likelihood of this.histogram.values()) {
                if (likelihood > 0) {
                    entropy += likelihood * Math.log2(likelihood);
                }
            }
            return -entropy;
        }
        return null;
    }

    /**
     * Computes average and standard deviation of performance across results.
     *
     * @returns Object with average and standard deviation, both nullable
     *
     * @remarks
     * **Statistical Method:**
     *
     * - **Mean**: μ = (Σ xᵢ) / n
     * - **Sample StdDev**: σ = sqrt(Σ(xᵢ - μ)² / (n-1))
     *
     * **Return Conditions:**
     *
     * - `avgPerformance = null`: No results
     * - `stDevPerformance = null`: Fewer than 3 results (unreliable variance estimate)
     *
     * **Missing Performance Values:**
     *
     * Results without a `performance` field are treated as 0, which may skew
     * statistics. Ensure all results have performance values for accurate analysis.
     *
     * @example
     * ```typescript
     * const perf = resultSet.getPerformance();
     *
     * if (perf.avgPerformance !== null) {
     *   console.log(`Mean: ${perf.avgPerformance.toFixed(2)}`);
     *
     *   if (perf.stDevPerformance !== null) {
     *     const cv = perf.stDevPerformance / perf.avgPerformance;
     *     console.log(`Coefficient of Variation: ${(cv * 100).toFixed(1)}%`);
     *
     *     if (cv < 0.05) {
     *       console.log("Very consistent performance");
     *     } else if (cv > 0.2) {
     *       console.log("High variability - consider more runs");
     *     }
     *   } else {
     *     console.log("Too few samples for std dev");
     *   }
     * }
     * ```
     */
    getPerformance(): { avgPerformance: number | null; stDevPerformance: number | null } {
        const performanceVector: number[] = [];
        for (const result of this.results) {
            if (result?.performance) {
                performanceVector.push(result.performance);
            } else {
                performanceVector.push(0);
            }
        }
        let avgPerformance: number | null = null;
        let stDevPerformance: number | null = null;
        if (performanceVector.length > 0) {
            avgPerformance = performanceVector.reduce((acc, val) => acc + val, 0) / performanceVector.length;
            const tmp = avgPerformance;
            if (performanceVector.length > 2)
                stDevPerformance = Math.sqrt(
                    performanceVector
                        .reduce((acc: number[], val: number) => acc.concat((val - tmp) ** 2), [])
                        .reduce((acc: number, val: number) => acc + val, 0) /
                        (performanceVector.length - 1)
                );
        }
        return {
            avgPerformance: avgPerformance,
            stDevPerformance: stDevPerformance
        };
    }

    /**
     * Quantizes a continuous state vector into discrete histogram bins.
     *
     * @param stateVector - Continuous state vector to quantize
     * @returns Quantized state vector with bin center values
     *
     * @remarks
     * Maps each dimension independently to its nearest bin center:
     *
     * ```
     * binIndex = floor((value - min) / binSize)
     * quantized = binIndex × binSize + min
     * ```
     *
     * **Edge Cases:**
     *
     * - Zero bin size (when min = max): Returns min value
     * - Value exactly at max: Maps to highest bin
     *
     * The quantized vector represents the centroid of the bin containing
     * the original state, enabling discrete probability estimation.
     *
     * @internal
     *
     * @example
     * ```typescript
     * // Internal quantization example
     * // stateVector = [1.23, 4.56, 7.89]
     * // histogramMin = [0, 0, 0]
     * // histogramMax = [10, 10, 10]
     * // histogramBinCount = 10
     * // binSizes = [1.0, 1.0, 1.0]
     *
     * // Result:
     * // binIndices = [1, 4, 7]
     * // quantized = [1.0, 4.0, 7.0]
     * ```
     */
    private _quantiseStateVector(stateVector: number[]): number[] {
        const quantisedStateVector: number[] = [];
        for (let i = 0; i < stateVector.length; i++) {
            let binIndex: number = 0;
            if (this.histogramBinSizes[i] !== 0) {
                binIndex = Math.floor((stateVector[i] - this.histogramMin[i]) / this.histogramBinSizes[i]);
            }
            quantisedStateVector.push(binIndex * this.histogramBinSizes[i] + this.histogramMin[i]);
        }
        return quantisedStateVector;
    }
}
