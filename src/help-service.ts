export class HelpService {
  public getNodeTypeDescription(nodeType: string) {
    return NODE_DESCRIPTIONS[nodeType.toUpperCase()];
  }
}

interface INodeDescription {
  [key: string]: string;
}

export const NODE_DESCRIPTIONS: INodeDescription = {
  'LIMIT': 'returns a specified number of rows from a record set.',
  'SORT': 'sorts a record set based on the specified sort key.',
  'NESTED LOOP': `merges two record sets by looping through every record in the first set and
   trying to find a match in the second set. All matching records are returned.`,
  'MERGE JOIN': `merges two record sets by first sorting them on a <strong>join key</strong>.`,
  'HASH': `generates a hash table from the records in the input recordset. Hash is used by
   <strong>Hash Join</strong>.`,
  'HASH JOIN': `joins to record sets by hashing one of them (using a <strong>Hash Scan</scan>).`,
  'AGGREGATE': `groups records together based on a GROUP BY or aggregate function (like <code>sum()</code>).`,
  'HASHAGGREGATE': `groups records together based on a GROUP BY or aggregate function (like sum()). Hash Aggregate uses
   a hash to first organize the records by a key.`,
  'SEQ SCAN': `finds relevant records by sequentially scanning the input record set. When reading from a table,
   Seq Scans (unlike Index Scans) perform a single read operation (only the table is read).`,
  'INDEX SCAN': `finds relevant records based on an <strong>Index</strong>.
    Index Scans perform 2 read operations: one to
    read the index and another to read the actual value from the table.`,
  'INDEX ONLY SCAN': `finds relevant records based on an <strong>Index</strong>.
    Index Only Scans perform a single read operation
    from the index and do not read from the corresponding table.`,
  'BITMAP HEAP SCAN': `searches through the pages returned by the <strong>Bitmap Index Scan</strong>
    for relevant rows.`,
  'BITMAP INDEX SCAN': `uses a <strong>Bitmap Index</strong> (index which uses 1 bit per page)
    to find all relevant pages.
    Results of this node are fed to the <strong>Bitmap Heap Scan</strong>.`,
    'CTE SCAN': `performs a sequential scan of <strong>Common Table Expression (CTE) query</strong> results. Note that
    results of a CTE are materialized (calculated and temporarily stored).`,
};
