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
          <thead class="thead-light">
            <tr>
              <th class="text-monospace font-weight-normal">{{ value.name }}</th>
              <th class="text-right">{{ value.count }}</th>
              <th class="text-right">
                <span class="alert p-0 px-1" :class="$options.filters.durationClass(value.timePercent * 100)">
                  {{ value.time | duration(true) }}
                </span>
              </th>
              <th class="text-right">{{ value.timePercent | percent }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="node in lodash.reverse(lodash.sortBy(value.nodes, nodeProps.EXCLUSIVE_DURATION))"
              class="text-muted"
              style="font-size: smaller"
              >
              <td class="pl-3">
                <a :href="'#plan/node/' + node.nodeId" class="mr-1">#{{node.nodeId}}</a> {{ node[nodeProps.NODE_TYPE] }}
              </td>
              <td class="text-right"></td>
              <td class="text-right">
                <span class="px-1">
                  {{ node[nodeProps.EXCLUSIVE_DURATION] | duration(true) }}
                </span>
              </td>
              <td class="text-right">
                {{ durationPercent([node]) | percent  }}
              </td>
            </tr>
          </tbody>
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
          <tbody>
            <tr>
              <td>{{ value.name }}</td>
              <td class="text-right">{{ value.count }}</td>
              <td class="text-right">
                <span class="alert p-0 px-1" :class="$options.filters.durationClass(value.timePercent * 100)">
                  {{ value.time | duration(true) }}
                </span>
              </td>
              <td class="text-right">{{ value.timePercent | percent }}</td>
            </tr>
          </tbody>
          <tbody>
            <tr
              v-for="node in lodash.reverse(lodash.sortBy(value.nodes, nodeProps.EXCLUSIVE_DURATION))"
              class="text-muted"
              style="font-size: smaller"
              >
              <td class="pl-3">
                <a :href="'#plan/node/' + node.nodeId" class="mr-1">#{{node.nodeId}}</a>
              </td>
              <td class="text-right"></td>
              <td class="text-right">
                <span class="px-1">
                  {{ node[nodeProps.EXCLUSIVE_DURATION] | duration(true) }}
                </span>
              </td>
              <td class="text-right">
                {{ durationPercent([node]) | percent  }}
              </td>
            </tr>
          </tbody>
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
          <tbody>
            <tr v-for="value in sort.values" :key="value.name">
              <td class="text-monospace">{{ value.name }}</td>
              <td class="text-right">{{ value.count }}</td>
              <td class="text-right">
                <span class="alert p-0 px-1" :class="$options.filters.durationClass(value.timePercent * 100)">
                  {{ value.time | duration(true) }}
                </span>
              </td>
              <td class="text-right">{{ value.timePercent | percent }}</td>
            </tr>
          </tbody>
          <tbody>
            <tr
              v-for="node in lodash.reverse(lodash.sortBy(value.nodes, nodeProps.EXCLUSIVE_DURATION))"
              class="text-muted"
              style="font-size: smaller"
              >
              <td class="pl-3">
                <a :href="'#plan/node/' + node.nodeId" class="mr-1">#{{node.nodeId}}</a> {{ node[nodeProps.NODE_TYPE] }}
              </td>
              <td class="text-right"></td>
              <td class="text-right">
                <span class="px-1">
                  {{ node[nodeProps.EXCLUSIVE_DURATION] | duration(true) }}
                </span>
              </td>
              <td class="text-right">
                {{ durationPercent([node]) | percent  }}
              </td>
            </tr>
          </tbody>
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
import { duration, durationClass, percent } from '@/filters';
import { SortedTable, SortLink } from 'vue-sorted-table';

@Component({
  filters: {
    duration,
    durationClass,
    percent,
  },
  components: {
    SortedTable,
    SortLink,
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
