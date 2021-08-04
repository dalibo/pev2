import {NodeProp} from '@/enums';
// Class to create nodes when parsing text
export default class Node {
  [k: string]: any;
  constructor(type: string) {
    this[NodeProp.NODE_TYPE] = type;
    // tslint:disable-next-line:max-line-length
    const scanMatches = /^((?:Parallel\s+)?(?:Seq\sScan|Tid.*Scan|Bitmap\s+Heap\s+Scan|(?:Async\s+)?Foreign\s+Scan|Update|Insert|Delete))\son\s(\S+)(?:\s+(\S+))?$/.exec(type);
    const bitmapMatches = /^(Bitmap\s+Index\s+Scan)\son\s(\S+)$/.exec(type);
    // tslint:disable-next-line:max-line-length
    const indexMatches = /^((?:Parallel\s+)?Index(?:\sOnly)?\sScan(?:\sBackward)?)\susing\s(\S+)\son\s(\S+)(?:\s+(\S+))?$/.exec(type);
    const cteMatches = /^(CTE\sScan)\son\s(\S+)(?:\s+(\S+))?$/.exec(type);
    const functionMatches = /^(Function\sScan)\son\s(\S+)(?:\s+(\S+))?$/.exec(type);
    const subqueryMatches = /^(Subquery\sScan)\son\s(.+)$/.exec(type);
    if (scanMatches) {
      this[NodeProp.NODE_TYPE] = scanMatches[1];
      this[NodeProp.RELATION_NAME] = scanMatches[2];
      if (scanMatches[3]) {
        this[NodeProp.ALIAS] = scanMatches[3];
      }
    } else if (bitmapMatches) {
      this[NodeProp.NODE_TYPE] = bitmapMatches[1];
      this[NodeProp.INDEX_NAME] = bitmapMatches[2];
    } else if (indexMatches) {
      this[NodeProp.NODE_TYPE] = indexMatches[1];
      this[NodeProp.INDEX_NAME] = indexMatches[2];
      this[NodeProp.RELATION_NAME] = indexMatches[3];
      if (indexMatches[4]) {
        this[NodeProp.ALIAS] = indexMatches[4];
      }
    } else if (cteMatches) {
      this[NodeProp.NODE_TYPE] = cteMatches[1];
      this[NodeProp.CTE_NAME] = cteMatches[2];
      if (cteMatches[3]) {
        this[NodeProp.ALIAS] = cteMatches[3];
      }
    } else if (functionMatches) {
      this[NodeProp.NODE_TYPE] = functionMatches[1];
      this[NodeProp.FUNCTION_NAME] = functionMatches[2];
      if (functionMatches[3]) {
        this[NodeProp.ALIAS] = functionMatches[3];
      }
    } else if (subqueryMatches) {
      this[NodeProp.NODE_TYPE] = subqueryMatches[1];
      // this[NodeProp.SUBQUERY_NAME] = subqueryMatches[2].replace
    }
    const parallelMatches = /^(Parallel\s+)(.*)/.exec(this[NodeProp.NODE_TYPE]);
    if (parallelMatches) {
      this[NodeProp.NODE_TYPE] = parallelMatches[2];
      this[NodeProp.PARALLEL_AWARE] = true;
    }

    const joinMatches = /(.*)\sJoin$/.exec(this[NodeProp.NODE_TYPE]);
    const joinModifierMatches = /(.*)\s+(Full|Left|Right|Anti)/.exec(this[NodeProp.NODE_TYPE]);
    if (joinMatches) {
      this[NodeProp.NODE_TYPE] = joinMatches[1];
      if (joinModifierMatches) {
        this[NodeProp.NODE_TYPE] = joinModifierMatches[1];
        this[NodeProp.JOIN_TYPE] = joinModifierMatches[2];
      }
      this[NodeProp.NODE_TYPE] += ' Join';
    }

  }
}
