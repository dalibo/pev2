export interface IPlan {
  id: string;
  name: string;
  content: any;
  query: string;
  createdOn: Date;
  planStats: any;
  formattedQuery: string;
}
