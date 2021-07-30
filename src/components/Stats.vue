<template>
  <div class="p-2 small stats">
    <h6 class="mt-2">Per table stats</h6>
    <sorted-table
      :values="perTable"
      ascIcon="<span> ▲</span>"
      descIcon="<span> ▼</span>"
      class="table table-nonfluid table-sm table-bordered align-top"
      sort="time"
      dir="desc"
      ref="table"
    >
      <thead class="thead-dark">
        <tr>
          <th scope="col">
            <sort-link name="name" class="text-white">Table</sort-link>
          </th>
          <th scope="col" class="text-right">
            <sort-link name="count" class="text-white">Count</sort-link>
          </th>
          <th scope="col" colspan="2" class="text-right">
            <sort-link name="time" class="text-white">Time</sort-link>
          </th>
        </tr>
      </thead>
      <template slot="body" slot-scope="sort">
        <template v-for="value in sort.values">
          <stats-table-item :value="value" :executionTime="executionTime"></stats-table-item>
        </template>
      </template>
      <tbody v-if="!perTable.length">
        <tr>
          <td colspan="3" class="text-center font-italic">No tables used</td>
        </tr>
      </tbody>
    </sorted-table>
    <h6>Per node type stats</h6>
    <sorted-table
      :values="perNodeType"
      ascIcon="<span> ▲</span>"
      descIcon="<span> ▼</span>"
      class="table table-nonfluid table-sm table-bordered align-top"
      sort="time"
      dir="desc"
    >
      <thead class="thead-dark">
        <tr>
          <th scope="col">
            <sort-link name="name" class="text-white">Node Type</sort-link>
          </th>
          <th scope="col" class="text-right">
            <sort-link name="count" class="text-white">Count</sort-link>
          </th>
          <th scope="col" colspan="2" class="text-right">
            <sort-link name="time" class="text-white">Time</sort-link>
          </th>
        </tr>
      </thead>
      <template slot="body" slot-scope="sort">
        <template v-for="value in sort.values">
          <stats-table-item :value="value" :executionTime="executionTime"></stats-table-item>
        </template>
      </template>
    </sorted-table>
    <h6>Per index stats</h6>
    <sorted-table
      :values="perIndex"
      ascIcon="<span> ▲</span>"
      descIcon="<span> ▼</span>"
      class="table table-nonfluid table-sm table-bordered align-top"
      sort="time"
      dir="desc"
    >
      <thead class="thead-dark">
        <tr>
          <th scope="col">
            <sort-link name="name" class="text-white">Index Name</sort-link>
          </th>
          <th scope="col" class="text-right">
            <sort-link name="count" class="text-white">Count</sort-link>
          </th>
          <th scope="col" colspan="2" class="text-right">
            <sort-link name="time" class="text-white">Time</sort-link>
          </th>
        </tr>
      </thead>
      <template slot="body" slot-scope="sort">
        <template v-for="value in sort.values">
          <stats-table-item :value="value" :executionTime="executionTime"></stats-table-item>
        </template>
      </template>
      <tbody v-if="!perIndex.length">
        <tr>
          <td colspan="3" class="text-center font-italic">No index used</td>
        </tr>
      </tbody>
    </sorted-table>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { Component, Prop, Vue } from 'vue-property-decorator';
import Node from '@/inode';
import { IPlan } from '../iplan';
import { NodeProp } from '../enums';
import { SortedTable, SortLink } from 'vue-sorted-table';
import StatsTableItem from '@/components/StatsTableItem.vue';

@Component({
  components: {
    SortedTable,
    SortLink,
    StatsTableItem,
  },
})
export default class Stats extends Vue {
  @Prop() private plan!: IPlan;

  private nodes = [] as Node[];

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

  private get perTable() {
    const tables: {[key: string]: Node[]} = _.groupBy(
      _.filter(this.nodes, (n) => n[NodeProp.RELATION_NAME] !== undefined),
      NodeProp.RELATION_NAME,
    );
    const values: any[] = [];
    _.each(tables, (nodes, tableName) => {
      values.push({
        name: tableName,
        count: nodes.length,
        time: _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION),
        timePercent: this.durationPercent(nodes),
        nodes,
      });
    });
    return values;
  }

  private get perNodeType() {
    const nodeTypes: {[key: string]: Node[]} = _.groupBy(this.nodes, NodeProp.NODE_TYPE);
    const values: any[] = [];
    _.each(nodeTypes, (nodes, nodeType) => {
      values.push({
        name: nodeType,
        count: nodes.length,
        time: _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION),
        timePercent: this.durationPercent(nodes),
        nodes,
      });
    });
    return values;
  }

  private get perIndex() {
    const indexes: {[key: string]: Node[]} = _.groupBy(
      _.filter(this.nodes, (n) => n[NodeProp.INDEX_NAME] !== undefined),
      NodeProp.INDEX_NAME,
    );
    const values: any[] = [];
    _.each(indexes, (nodes, indexName) => {
      values.push({
        name: indexName,
        count: nodes.length,
        time: _.sumBy(nodes, NodeProp.EXCLUSIVE_DURATION),
        timePercent: this.durationPercent(nodes),
        nodes,
      });
    });
    return values;
  }
}
</script>
