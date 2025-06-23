declare module "d3-flextree" {
  import * as d3 from "d3"
  export function flextree<Datum>(opts: {
    nodeSize?: (node: FlexHierarchyPointNode<Datum>) => [number, number]
    spacing?:
      | number
      | ((
          nodeA: FlexHierarchyPointNode<Datum>,
          nodeB: FlexHierarchyPointNode<Datum>,
        ) => number)
  }): FlexTreeLayout<Datum>

  export interface FlexHierarchyPointLink<Datum> {
    /**
     * The source of the link.
     */
    source: FlexHierarchyPointNode<Datum>

    /**
     * The target of the link.
     */
    target: FlexHierarchyPointNode<Datum>
  }

  export interface FlexHierarchyPointNode<Datum>
    extends d3.HierarchyPointNode<Datum> {
    /**
     * The horizontal size
     */
    xSize: number

    /**
     * The vertical size
     */
    ySize: number

    links(): Array<FlexHierarchyPointLink<Datum>>
  }

  export interface FlexTreeLayout<Datum> extends d3.TreeLayout<Datum> {
    /**
     * Lays out the specified root hierarchy.
     * You may want to call `root.sort` before passing the hierarchy to the tree layout.
     *
     * @param root The specified root hierarchy.
     */
    (root: FlexHierarchiePointNode<Datum>): FlexHierarchyPointNode<Datum>

    hierarchy<Datum>(
      data: Datum,
      children?: (d: Datum) => Iterable<Datum> | null | undefined,
    ): FlexHierarchiePointNode<Datum>
  }
}
