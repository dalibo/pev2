<template>
  <div class="">
    <div class="flex-shrink-0">
      <div class="form-group text-center my-1">
        <div class="btn-group btn-group-xs">
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.metric === metrics.time}" v-on:click="viewOptions.metric = metrics.time">time</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.metric === metrics.rows}" v-on:click="viewOptions.metric = metrics.rows">rows</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.metric === metrics.estimate_factor}" v-on:click="viewOptions.metric = metrics.estimate_factor">estimation</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.metric === metrics.cost}" v-on:click="viewOptions.metric = metrics.cost">cost</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.metric === metrics.buffers}" v-on:click="viewOptions.metric = metrics.buffers">buffers</button>
        </div>
      </div>
      <div class="form-group text-center my-1" v-if="viewOptions.metric == metrics.buffers">
        <div class="btn-group btn-group-xs">
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.buffersMetric === bufferLocations.shared}" v-on:click="viewOptions.buffersMetric = bufferLocations.shared"
            :disabled="!plan.planStats.maxBlocks[bufferLocations.shared]"
          >
            shared</button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.buffersMetric === bufferLocations.temp}" v-on:click="viewOptions.buffersMetric = bufferLocations.temp"
            :disabled="!plan.planStats.maxBlocks[bufferLocations.temp]"
          >
            temp
          </button>
          <button class="btn btn-outline-secondary" :class="{'active': viewOptions.buffersMetric === bufferLocations.local}" v-on:click="viewOptions.buffersMetric = bufferLocations.local"
            :disabled="!plan.planStats.maxBlocks[bufferLocations.local]"
          >
            local
          </button>
        </div>
      </div>
      <div class="legend text-center">
        <ul class="list-unstyled list-inline mb-0" v-if="viewOptions.metric == metrics.buffers">
          <li class="list-inline-item" v-if="viewOptions.buffersMetric != bufferLocations.temp">
            <span class="bg-hit rounded"></span>
            Hit
          </li>
          <li class="list-inline-item">
            <span class="bg-read"></span>
            Read
          </li>
          <li class="list-inline-item" v-if="viewOptions.buffersMetric != bufferLocations.temp">
            <span class="bg-dirtied"></span>
            Dirtied
          </li>
          <li class="list-inline-item">
            <span class="bg-written"></span>
            Written
          </li>
        </ul>
      </div>
    </div>
    <div class="overflow-auto flex-grow-1">
      <table class="m-1" v-if="dataAvailable">
        <tbody v-for="flat, index in plans">
          <tr v-if="index === 0 && plans.length > 1">
            <th colspan="3" class="subplan">
              Main Query Plan
            </th>
          </tr>
          <template v-for="row, index in flat">
            <tr v-if="row[1][nodeProps.SUBPLAN_NAME]">
              <td></td>
              <td
                class="subplan pr-2"
                :class="{'font-weight-bold': lodash.startsWith(row[1][nodeProps.SUBPLAN_NAME], 'CTE')}"
                colspan="2"
                @click.prevent="eventBus.$emit('clickcte', row[1][nodeProps.SUBPLAN_NAME])"
                >
                <span class="tree-lines">
                  <template v-for="i in lodash.range(row[0])">
                    <template v-if="lodash.indexOf(row[3], i) != -1">│</template><template v-else-if="i !== 0">⠀</template>
                  </template>
                  <template v-if="index !== 0">{{ row[2] ? '└' : '├' }}</template>
                </span>
                <span class="font-italic">
                  {{ row[1][nodeProps.SUBPLAN_NAME] }}
                </span>
              </td>
            </tr>
            <tr
              class="no-focus-outline"
              :class="{'highlight': row[1].nodeId === highlightedNode}"
              :content="tooltip(row[1])"
              v-tippy="{arrow: true, animation: 'fade', delay: [200, 0]}"
              @click.prevent="eventBus.$emit('clicknode', row[1].nodeId)"
              @mouseenter="eventBus.$emit('mouseovernode', row[1].nodeId)"
              @mouseleave="eventBus.$emit('mouseoutnode', row[1].nodeId)"
              >

              <td class="node-index">
                <slot name="nodeindex" v-bind:node="row[1]">
                  <span class="small text-muted">
                    #{{ row[1].nodeId }}
                  </span>
                </slot>
              </td>
              <td class="node-type pr-2">
                <span class="tree-lines">
                  <template v-for="i in lodash.range(row[0])">
                    <template v-if="lodash.indexOf(row[3], i) != -1">│</template><template v-else-if="i !== 0">⠀</template>
                  </template>
                  <template v-if="index !== 0">
                    <template v-if="!row[1][nodeProps.SUBPLAN_NAME]">{{ row[2] ? '└' : '├' }}</template>
                    <template v-else>
                      <template v-if="!row[2]">│</template><template v-else>⠀</template>
                    </template>
                  </template>
                </span>
                {{ nodeType(row) }}
              </td>
              <td>
                <div class="progress rounded-0 align-items-center bg-transparent" style="height: 5px;" v-if="viewOptions.metric == metrics.time">
                  <div class="progress-bar border-left bg-secondary" role="progressbar" :style="'width: ' + row[1][nodeProps.EXCLUSIVE_DURATION] / (plan.planStats.executionTime || plan.content.Plan[nodeProps.ACTUAL_TOTAL_TIME]) * 100 + '%; height:5px;'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>
                  <div class="progress-bar border-left bg-secondary-light" role="progressbar" :style="'width: ' + (row[1][nodeProps.ACTUAL_TOTAL_TIME] - row[1][nodeProps.EXCLUSIVE_DURATION]) / (plan.planStats.executionTime || plan.content.Plan[nodeProps.ACTUAL_TOTAL_TIME]) * 100 + '%; height:5px;'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="progress rounded-0 align-items-center bg-transparent" style="height: 5px;" v-else-if="viewOptions.metric == metrics.rows">
                  <div class="bg-secondary" role="progressbar" :style="'width: ' + Math.round(row[1][nodeProps.ACTUAL_ROWS] / plan.planStats.maxRows * 100) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                </div>
                <div class="progress rounded-0 align-items-center bg-transparent justify-content-center" style="height: 10px;" v-if="viewOptions.metric == metrics.estimate_factor">
                  <span class="text-muted small">
                    <i class="fa fa-fw" :class="{'fa-arrow-down': row[1][nodeProps.PLANNER_ESTIMATE_DIRECTION] === estimateDirections.under}"></i>
                  </span>
                  <div class="progress-bar" :class="[row[1][nodeProps.PLANNER_ESTIMATE_DIRECTION] === estimateDirections.under ? 'bg-secondary' : 'bg-transparent']" role="progressbar" :style="'width: ' + (row[1][nodeProps.PLANNER_ESTIMATE_FACTOR] || 0) / maxEstimateFactor * 100 + '%; height:5px;'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>
                  <div class="progress-bar border-left" role="progressbar" style="width: 1px; height: 5px;" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>
                  <div class="progress-bar" :class="[row[1][nodeProps.PLANNER_ESTIMATE_DIRECTION] === estimateDirections.over ? 'bg-secondary' : 'bg-transparent']" role="progressbar" :style="'width: ' + (row[1][nodeProps.PLANNER_ESTIMATE_FACTOR] || 0) / maxEstimateFactor * 100 + '%; height:5px;'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100"></div>
                  <span class="text-muted small">
                    <i class="fa fa-fw" :class="{'fa-arrow-up': row[1][nodeProps.PLANNER_ESTIMATE_DIRECTION] === estimateDirections.over}"></i>
                  </span>
                </div>
                <div class="progress rounded-0 align-items-center bg-transparent" style="height: 5px;" v-else-if="viewOptions.metric == metrics.cost">
                  <div class="bg-secondary" role="progressbar" :style="'width: ' + Math.round(row[1][nodeProps.EXCLUSIVE_COST] / plan.planStats.maxCost * 100) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                </div>
                <div class="progress rounded-0 align-items-center bg-transparent" style="height: 5px;" v-else-if="viewOptions.metric == metrics.buffers && viewOptions.buffersMetric == bufferLocations.shared && plan.planStats.maxBlocks[bufferLocations.shared]">
                  <div class="bg-hit" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_SHARED_HIT_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.shared] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                  <div class="bg-read" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_SHARED_READ_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.shared] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                  <div class="bg-dirtied" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_SHARED_DIRTIED_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.shared] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                  <div class="bg-written" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_SHARED_WRITTEN_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.shared] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                </div>
                <div class="progress rounded-0 align-items-center bg-transparent" style="height: 5px;" v-else-if="viewOptions.metric == metrics.buffers && viewOptions.buffersMetric == bufferLocations.temp && plan.planStats.maxBlocks[bufferLocations.temp]">
                  <div class="bg-read" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_TEMP_READ_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.temp] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                  <div class="bg-written" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_TEMP_WRITTEN_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.temp] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                </div>
                <div class="progress rounded-0 align-items-center bg-transparent" style="height: 5px;" v-else-if="viewOptions.metric == metrics.buffers && viewOptions.buffersMetric == bufferLocations.local && plan.planStats.maxBlocks[bufferLocations.local]">
                  <div class="bg-hit" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_LOCAL_HIT_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.local] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                  <div class="bg-read" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_LOCAL_READ_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.local] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                  <div class="bg-dirtied" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.local] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                  <div class="bg-written" role="progressbar" :style="'width: ' + (Math.round(row[1][nodeProps.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS] / plan.planStats.maxBlocks[bufferLocations.local] * 100) || 0) + '%'" aria-valuenow="15" aria-valuemin="0" aria-valuemax="100" style="height: 5px;"></div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div class="p-2 text-center text-muted" v-else>
        <em>
          No data available
        </em>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { blocks, duration, durationClass, rows, factor } from '@/filters';
import { EstimateDirection, CenterMode, BufferLocation, HighlightMode, NodeProp, Metric } from '../enums';
import Node from '@/inode';
import { IPlan } from '../iplan';

@Component({
  filters: {
    durationClass,
  },
})
export default class Diagram extends Vue {
  @Prop() private plan!: IPlan;
  @Prop() private eventBus!: InstanceType<typeof Vue>;

  // The main plan + init plans (all flatten)
  private plans: any[][] = [[]];
  private lodash = _;
  private nodeProps = NodeProp;
  private metrics = Metric;
  private bufferLocations = BufferLocation;
  private estimateDirections = EstimateDirection;
  private centerModes = CenterMode;
  private highlightModes = HighlightMode;
  private highlightedNode: Node | null = null;

  private viewOptions: any = {
    metric: Metric.time,
    buffersMetric: BufferLocation.shared,
  };

  private created(): void {
    const savedOptions = localStorage.getItem('diagramViewOptions');
    if (savedOptions) {
      _.assignIn(this.viewOptions, JSON.parse(savedOptions));
    }
    this.flatten(this.plans[0], 0, this.plan.content.Plan, true, []);

    _.each(this.plan.ctes, (cte) => {
      const flat = [] as any[];
      this.flatten(flat, 0, cte, true, []);
      this.plans.push(flat);
    });
    this.eventBus.$on('mouseovernode', (node: Node) => { this.highlightedNode = node; });
    this.eventBus.$on('mouseoutnode', () => { this.highlightedNode = null; });

    // switch to the first buffers tab if data not available for the currently
    // chosen one
    const planBufferLocations = _.keys(this.plan.planStats.maxBlocks);
    if (_.indexOf(planBufferLocations, this.viewOptions.buffersMetric) === -1) {
      this.viewOptions.buffersMetric = _.min(planBufferLocations);
    }
  }

  @Watch('viewOptions', {deep: true})
  private onViewOptionsChanged(val: any, oldVal: any) {
    localStorage.setItem('diagramViewOptions', JSON.stringify(this.viewOptions));
  }

  private tooltip(node: Node): string {
    let content = '';
    switch (this.viewOptions.metric) {
      case Metric.time:
        content += this.timeTooltip(node);
        break;
      case Metric.rows:
        content += this.rowsTooltip(node);
        break;
      case Metric.estimate_factor:
        content += this.estimateFactorTooltip(node);
        break;
      case Metric.cost:
        content += this.costTooltip(node);
        break;
      case Metric.buffers:
        content += this.buffersTooltip(node);
        break;
    }
    if (node[NodeProp.CTE_NAME]) {
      content +=  '<br><em>CTE ' + node[NodeProp.CTE_NAME] + '</em>';
    }
    return content;
  }

  private timeTooltip(node: Node): string {
    return [
      'Duration: <br>Exclusive: ',
      duration(node[NodeProp.EXCLUSIVE_DURATION], true),
      ', Total: ',
      duration(node[NodeProp.ACTUAL_TOTAL_TIME], true),
    ].join('');
  }

  private rowsTooltip(node: Node): string {
    return [
      'Rows: ',
      rows(node[NodeProp.ACTUAL_ROWS]),
    ].join('');
  }

  private estimateFactorTooltip(node: Node): string {
    const estimateFactor = node[NodeProp.PLANNER_ESTIMATE_FACTOR];
    const estimateDirection = node[NodeProp.PLANNER_ESTIMATE_DIRECTION];
    let text = '';
    switch (estimateDirection) {
      case EstimateDirection.over:
        text += '<i class="fa fa-arrow-up"></i> over';
        break;
      case EstimateDirection.under:
        text += '<i class="fa fa-arrow-down"></i> under';
        break;
      default:
        text += 'Correctly';
    }
    text += ' estimated';
    text += estimateFactor ? ' by <b>' + factor(estimateFactor) + '</b>' : '';
    return text;
  }

  private costTooltip(node: Node): string {
    return [
      'Cost: ',
      rows(node[NodeProp.EXCLUSIVE_COST]),
    ].join('');
  }

  private buffersTooltip(node: Node): string {
    let text = '';
    let hit;
    let read;
    let written;
    let dirtied;
    switch (this.viewOptions.buffersMetric) {
      case BufferLocation.shared:
        hit = node[NodeProp.EXCLUSIVE_SHARED_HIT_BLOCKS];
        read = node[NodeProp.EXCLUSIVE_SHARED_READ_BLOCKS];
        dirtied = node[NodeProp.EXCLUSIVE_SHARED_DIRTIED_BLOCKS];
        written = node[NodeProp.EXCLUSIVE_SHARED_WRITTEN_BLOCKS];
        break;
      case BufferLocation.temp:
        read = node[NodeProp.EXCLUSIVE_TEMP_READ_BLOCKS];
        written = node[NodeProp.EXCLUSIVE_TEMP_WRITTEN_BLOCKS];
        break;
      case BufferLocation.local:
        hit = node[NodeProp.EXCLUSIVE_LOCAL_HIT_BLOCKS];
        read = node[NodeProp.EXCLUSIVE_LOCAL_READ_BLOCKS];
        dirtied = node[NodeProp.EXCLUSIVE_LOCAL_DIRTIED_BLOCKS];
        written = node[NodeProp.EXCLUSIVE_LOCAL_WRITTEN_BLOCKS];
        break;
    }
    text += '<table class="table text-white table-sm table-borderless mb-0">';
    text += hit ? '<tr><td>Hit:</td><td class="text-right">' + blocks(hit) + '</td></tr>' : '';
    text += read ? '<tr><td>Read:</td><td class="text-right">' + blocks(read) + '</td></tr>' : '';
    text += dirtied ? '<tr><td>Dirtied:</td><td class="text-right">' + blocks(dirtied) + '</td></tr>' : '';
    text += written ? '<tr><td>Written:</td><td class="text-right">' + blocks(written) + '</td></tr>' : '';
    text += '</table>';

    if (!hit && !read && !dirtied && ! written) {
      text = ' N/A';
    }

    switch (this.viewOptions.buffersMetric) {
      case BufferLocation.shared:
        text = 'Shared Blocks:' + text;
        break;
      case BufferLocation.temp:
        text = 'Temp Blocks:' + text;
        break;
      case BufferLocation.local:
        text = 'Local Blocks:' + text;
        break;
    }
    return text;
  }

  private nodeType(row: any[]): string {
    return row[1][NodeProp.NODE_TYPE];
  }

  private flatten(output: any[], level: number, node: any, isLast: boolean,
                  branches: number[]) {
    // [level, node, isLastSibbling, branches]
    output.push([level, node, isLast, _.concat([], branches)]);
    if (!isLast) {
      branches.push(level);
    }

    _.each(node.Plans, (subnode) => {
      this.flatten(
        output,
        level + 1,
        subnode,
        subnode === _.last(node.Plans),
        branches,
      );
    });
    if (!isLast) {
      branches.pop();
    }
  }

  private get maxEstimateFactor(): number {
    const max = _.max(_.map(this.plans, (plan) => {
      return _.max(_.map(plan, (row) => {
        return row[1][NodeProp.PLANNER_ESTIMATE_FACTOR];
      }));
    }));
    return max * 2 || 1;
  }

  private get dataAvailable(): boolean {
    if (this.viewOptions.metric === this.metrics.buffers) {
      // if current metrics is buffers, view options for buffers should be
      // undefined if there's no buffer data
      return this.viewOptions.buffersMetric;
    }
    return true;
  }
}
</script>
