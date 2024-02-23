<script lang="ts" setup>
import _ from "lodash"
interface Props {
  level: number
  isSubplan: boolean
  isNode?: boolean
  isLastChild: boolean
  branches: number[]
  index: number
  dense?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  dense: false,
})

const spacer = props.dense ? "" : " "
</script>
<template>
  <span class="tree-lines">
    <template v-for="i in _.range(level)">
      <template v-if="_.indexOf(branches, i) != -1">{{ spacer }}│</template
      ><template v-else-if="i !== 0">{{ spacer }}&emsp;</template></template
    ><template v-if="index !== 0">
      <template v-if="!(isSubplan && isNode)"
        >{{ spacer }}{{ isLastChild ? "└" : "├" }}</template
      ><template v-else>
        <template v-if="!isLastChild">{{ spacer }}│</template
        ><template v-else>{{ spacer }}&emsp;</template>
      </template>
    </template>
  </span>
</template>
