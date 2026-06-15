<script lang="ts" setup>
import { keysToString, formatKilobytes } from "@/filters"
import type { SortGroups } from "@/interfaces"

interface Props {
  sortGroup: SortGroups
}
defineProps<Props>()
</script>

<template>
  <div>
    Count: {{ sortGroup["Group Count"] }}
    <br />
    <table class="table-borderless">
      <tbody>
        <tr>
          <td class="text-nowrap p-0">
            Sort Method<template
              v-if="sortGroup['Sort Methods Used'].length > 1"
              >s</template
            >:
          </td>
          <td class="p-0 ps-1">
            {{ keysToString(sortGroup["Sort Methods Used"]) }}
          </td>
        </tr>
      </tbody>
    </table>
    <table class="table-borderless">
      <tbody>
        <tr>
          <td class="p-0">Memory:</td>
          <td class="p-0 ps-1">
            Average:
            {{
              formatKilobytes(
                sortGroup["Sort Space Memory"]["Average Sort Space Used"],
              )
            }}
            <br />
            Peak:
            {{
              formatKilobytes(
                sortGroup["Sort Space Memory"]["Peak Sort Space Used"],
              )
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
