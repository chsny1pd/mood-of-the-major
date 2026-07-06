export class AggregationThresholdPolicy {
  constructor(private readonly minimum: number) {}

  meetsThreshold(count: number): boolean {
    return count >= this.minimum;
  }

  get minimumThreshold(): number {
    return this.minimum;
  }
}
