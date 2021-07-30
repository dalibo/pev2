<template>
  <fragment>
    <thead class="thead-light">
      <tr v-on:click.prevent="expanded = !expanded" role="button" class="user-select-none">
        <th>
          <i class="fa fa-fw" :class="{'fa-chevron-right': !expanded, 'fa-chevron-down': expanded}"></i>
          {{ value.name }}
        </th>
        <th class="text-right">{{ value.count }}</th>
        <th class="text-right">
          <span class="alert p-0 px-1" :class="$options.filters.durationClass(value.timePercent * 100)">
            {{ value.time | duration(true) }}
          </span>
        </th>
        <th class="text-right">{{ value.timePercent | percent }}</th>
      </tr>
    </thead>
    <tbody :class="expanded ? '' : 'd-none'">
      <tr
        v-for="node in lodash.reverse(lodash.sortBy(value.nodes, nodeProps.EXCLUSIVE_DURATION))"
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
          {{ durationPercent(node) | percent  }}
        </td>
      </tr>
    </tbody>
  </fragment>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { Component, Prop, Vue } from 'vue-property-decorator';
import Node from '@/inode';
import { NodeProp } from '../enums';
import { duration, durationClass, percent } from '@/filters';
import { Fragment } from 'vue-fragment';

@Component({
  filters: {
    duration,
    durationClass,
    percent,
  },
  components: {
    Fragment,
  },
})
export default class StatsTableItem extends Vue {
  @Prop() private value: any;
  @Prop() private executionTime!: number;

  private expanded: boolean = false;

  private lodash = _;
  private nodeProps = NodeProp;

  private durationPercent(node: Node) {
    return node[NodeProp.EXCLUSIVE_DURATION] / this.executionTime;
  }
}
</script>
