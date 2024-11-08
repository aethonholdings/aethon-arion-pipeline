import { ResultDTO } from "../interfaces/pipeline.interfaces.dto";

export class ResultSet {
    protected results: ResultDTO[];
    protected histogramBinCount: number;
    private histogram: Map<string, number> | null;
    private histogramMin: number[];
    private histogramMax: number[];
    private histogramBinSizes: number[];

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
                    this.histogramBinSizes[i] = (this.histogramMax[i] - this.histogramMin[i]) / this.histogramBinCount;
                }
            }

            // count frequency of each state vector when quantised
            if (JSON.stringify(this.histogramMax) != JSON.stringify(this.histogramMin)) {
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

    getResults(): ResultDTO[] {
        return this.results;
    }

    getHistogramBinCount(): number {
        return this.histogramBinCount;
    }

    getSummary(): { avgPerformance: number | null; stDevPerformance: number | null; entropy: number | null } {
        const performance: { avgPerformance: number | null; stDevPerformance: number | null } = this.getPerformance();
        return {
            avgPerformance: performance.avgPerformance,
            stDevPerformance: performance.stDevPerformance,
            entropy: this.getEntropy()
        };
    }

    getEntropy(): number | null {
        if (this.histogram) {
            let entropy: number = 0;
            for (const likelihood of this.histogram.values()) {
                entropy += likelihood * Math.log2(likelihood);
            }
            return -entropy;
        }
        return null;
    }

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

    // function to quantise a state vector into the histogram bins
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
