<template>
  <div>
    Count: {{ sortGroup['Group Count'] }}
    <br>
    <table class="table-borderless">
      <tr>
        <td class="text-nowrap p-0">
          Sort Method<template v-if="sortGroup['Sort Methods Used'].length > 1">s</template>:
        </td>
        <td class="p-0 pl-1">
          {{ sortGroup['Sort Methods Used'] | keysToString }}
        </td>
      </tr>
    </table>
    <table class="table-borderless">
      <tr>
        <td class="p-0">
          Memory:
        </td>
        <td class="p-0 pl-1">
          Average: {{ sortGroup['Sort Space Memory']['Average Sort Space Used'] | kilobytes }}
          <br>
          Peak: {{ sortGroup['Sort Space Memory']['Peak Sort Space Used'] | kilobytes }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
// Can't use vue-component-decorator here for some reason
// Got "Failed to mount component: template or render function not defined." errors
import { keysToString, kilobytes } from '@/filters';
export default {
  props: ['sortGroup'],
  filters: {
    keysToString,
    kilobytes,
  },
};
</script>
