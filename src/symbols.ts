import type { InjectionKey, Ref } from "vue"

export const SelectedNodeIdKey: InjectionKey<Ref<number>> =
  Symbol("selectedNodeId")
export const HighlightedNodeIdKey: InjectionKey<Ref<number>> =
  Symbol("highlightedNodeId")

export const SelectNodeKey: InjectionKey<
  (nodeId: number, center: boolean) => void
> = Symbol("selectNode")
