export interface IPlan {
  id: string;
  name: string;
  content: any;
  query: string;
  createdOn: Date;
  planStats: IPlanStats;
  formattedQuery?: string;
}

export interface ITrigger {
  'Trigger Name': string;
  Relation: string;
  Time: number;
  Calls: number;
}

export interface IPlanStats {
  executionTime?: number;
  planningTime?: number;
  maxRows?: number;
  maxCost?: number;
  maxDuration?: number;
  triggers?: ITrigger[];
}
