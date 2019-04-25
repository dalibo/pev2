export class HighlightType {
    public static NONE: string = 'none';
    public static DURATION: string = 'duration';
    public static ROWS: string = 'rows';
    public static COST: string = 'cost';
}

export enum EstimateDirection {
    over,
    under,
}

export class ViewMode {
    public static FULL: string = 'full';
    public static COMPACT: string = 'compact';
    public static DOT: string = 'dot';
}
