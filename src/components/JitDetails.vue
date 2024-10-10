<script lang="ts" setup>
import type { JIT } from "@/interfaces"
interface Props {
  jit: JIT
}
const props = defineProps<Props>()
</script>

<template>
  <table class="table table-sm table-borderless">
    <tbody>
      <tr>
        <th>Functions</th>
        <td class="text-end">{{ props.jit.Functions }}</td>
      </tr>
      <tr>
        <th colspan="2">Options</th>
      </tr>
      <tr v-for="(option, index) in props.jit.Options" :key="index">
        <td>&nbsp;&nbsp;{{ index }}</td>
        <td class="text-end">
          {{ option ? "✓" : "✗" }} <small>({{ option }})</small>
        </td>
      </tr>
      <tr>
        <th colspan="2">Timing</th>
      </tr>
      <tr v-for="(timing, index) in props.jit.Timing" :key="index">
        <td>&nbsp;&nbsp;{{ index }}</td>
        <td class="text-end">{{ timing }} ms</td>
      </tr>
    </tbody>
  </table>
</template>
