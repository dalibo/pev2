import type { InjectionKey } from "vue"

export const SelectNodeKey: InjectionKey<
  (nodeId: number, center: boolean) => void
> = Symbol("selectNode")
