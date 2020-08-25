<template>
  <div class="p-2 small">
    <h6 class="mt-2">Per table stats</h6>
    <table class="table table-nonfluid table-sm table-bordered align-top">
      <thead class="thead-dark">
        <tr>
          <th>Relation Name</th>
          <th class="text-right">Count</th>
          <th class="text-right" colspan="2">Time</th>
        </tr>
      </thead>
      <template
        v-for="nodesPerTable, relationName in lodash.groupBy(lodash.sortBy(lodash.filter(nodes, function(n) { return n[nodeProps.RELATION_NAME] != undefined }), nodeProps.RELATION_NAME), nodeProps.RELATION_NAME)"
      >
        <thead class="thead-light">
          <tr>
            <th>
              {{ relationName }}
            </th>
            <th class="text-right">{{ nodesPerTable.length }}</th>
            <th class="text-right">
              <span class="alert p-0 px-1" :class="$options.filters.durationClass(durationPercent(nodesPerTable) * 100)">
                {{ lodash.sumBy(nodesPerTable, nodeProps.EXCLUSIVE_DURATION) | duration(true) }}
              </span>
            </th>
            <th class="text-right">
              {{ durationPercent(nodesPerTable) | percent }}
            </th>
          </tr>
        </thead>
        <tr
          v-for="nodesPerType, nodeType in lodash.groupBy(lodash.sortBy(nodesPerTable, nodeProps.NODE_TYPE), nodeProps.NODE_TYPE)"
          class="font-italic text-muted"
          style="font-size: smaller"
        >
          <td class="pl-3">{{ nodeType.toUpperCase() }}</td>
          <td class="text-right">{{ nodesPerType.length }}</td>
          <td class="text-right">
            <span class="px-1">
              {{ lodash.sumBy(nodesPerType, nodeProps.EXCLUSIVE_DURATION) | duration(true) }}
            </span>
          </td>
          <td class="text-right">
            {{ lodash.sumBy(nodesPerType, nodeProps.EXCLUSIVE_DURATION) / lodash.sumBy(nodesPerTable, nodeProps.EXCLUSIVE_DURATION) | percent  }}
          </td>
        </tr>
      </template>
    </table>
    <h6>Per node type stats</h6>
    <table class="table table-nonfluid table-sm table-bordered">
      <thead class="thead-dark">
        <tr>
          <th>Node Type</th>
          <th class="text-right">Count</th>
          <th class="text-right" colspan="2">Time</th>
        </tr>
      </thead>
      <tr v-for="nodesPerType, nodeType in lodash.groupBy(lodash.sortBy(nodes, nodeProps.NODE_TYPE), nodeProps.NODE_TYPE)">
        <td>{{ nodeType.toUpperCase() }}</td>
        <td class="text-right">{{ nodesPerType.length }}</td>
        <td class="text-right">
          <span class="alert p-0 px-1" :class="$options.filters.durationClass(durationPercent(nodesPerType) * 100)">
            {{ lodash.sumBy(nodesPerType, nodeProps.EXCLUSIVE_DURATION) | duration(true) }}
          </span>
        </td>
        <td class="text-right">
          {{ durationPercent(nodesPerType) | percent }}
        </td>
      </tr>
    </table>
    <h6>Per index stats</h6>
    <table class="table table-nonfluid table-sm table-bordered">
      <thead class="thead-dark">
        <tr>
          <th>Index Name</th>
          <th class="text-right">Count</th>
          <th class="text-right" colspan="2">Time</th>
        </tr>
      </thead>
      <tr v-for="nodesPerIndex, indexName in lodash.groupBy(lodash.sortBy(lodash.filter(nodes, function(n) { return n[nodeProps.INDEX_NAME] != undefined }), nodeProps.INDEX_NAME), nodeProps.INDEX_NAME)">
        <td>{{ indexName }}</td>
        <td class="text-right">{{ nodesPerIndex.length }}</td>
        <td class="text-right">
          <span class="alert p-0 px-1" :class="$options.filters.durationClass(durationPercent(nodesPerIndex) * 100)">
            {{ lodash.sumBy(nodesPerIndex, nodeProps.EXCLUSIVE_DURATION) | duration(true) }}
          </span>
        </td>
        <td class="text-right">
          {{ durationPercent(nodesPerIndex) | percent }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { Component, Prop, Vue } from 'vue-property-decorator';
import Node from '@/inode';
import { IPlan } from '../iplan';
import { NodeProp } from '../enums';
import { duration, durationClass, percent } from '@/filters';

@Component({
  filters: {
    duration,
    durationClass,
    percent,
  },
})
export default class Stats extends Vue {
  @Prop() private plan!: IPlan;

  private nodes = [] as Node[];

  private lodash = _;
  private nodeProps = NodeProp;
  private executionTime: number = 0;

  private created(): void {
    this.executionTime = this.plan.planStats.executionTime || this.plan.content.Plan[NodeProp.ACTUAL_TOTAL_TIME];
    const root = this.plan.content.Plan;
    this.flatten(this.nodes, root);
    _.each(this.plan.ctes, (cte) => {
      this.flatten(this.nodes, cte);
    });
  }

  private flatten(output: Node[], node: any) {
    // [level, node, isLastSibbling, branches]
    output.push(node);
    _.each(node.Plans, (subnode) => {
      this.flatten(
        output,
        subnode,
      );
    });
  }

  private durationPercent(nodes: Node[]) {
    return _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION) / this.executionTime;
  }
}
</script>
