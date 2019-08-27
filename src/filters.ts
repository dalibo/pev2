import * as _ from 'lodash';
import { EstimateDirection, NodeProp, nodePropTypes, PropType } from '@/enums';

export function duration(value: number, detail: boolean): string {
  let dur: string = '';
  let unit: string = '';
  detail = !!detail;

  if (!detail && value < 1) {
    dur = '<1';
    unit = 'ms';
  } else {
    if (value < 1000) {
      unit = 'ms';
    } else if (value < 60000) {
      value = value / 1000;
      unit = 's';
    } else {
      value = value / 60000;
      unit = 'min';
    }
    dur = parseFloat(value.toPrecision(3)).toLocaleString();
  }
  const compiled = _.template('${dur}&nbsp;<span class="text-muted">${unit}</span>');
  return compiled({dur, unit});
}

export function cost(value: number): string {
  value = parseFloat(value.toPrecision(3));
  return value.toLocaleString();
}

export function rows(value: number): string {
  return value.toLocaleString();
}

export function factor(value: number): string {
  const f: string = parseFloat(value.toPrecision(2)).toLocaleString();
  const compiled = _.template('${f}&nbsp;<span class="text-muted">&times;</span>');
  return compiled({f});
}

export function keysToString(value: any): string {
  if (!(value instanceof Array)) {
    value = [value];
  }
  value = _.map(value, (v) => v.replace(/(^\(|\)$)/g, ''));
  return value.join(', ');
}

export function truncate(text: string, length: number, clamp: string): string {
    clamp = clamp || '...';
    return text.length > length ? text.slice(0, length) + clamp : text;
}

export function space(value: number): string {
  return formatBytes(value * 1024);
}

export function formatBytes(bytes: number, decimals = 2) {
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const units = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const compiled = _.template('${value}&nbsp;<span class="text-muted">${unit}</span>');
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toLocaleString();
  return compiled({value, unit: units[i]});
}

export function formatNodeProp(key: string, value: any, detail: boolean): string {
  if (_.has(nodePropTypes, key)) {
    if (nodePropTypes[key] === PropType.duration) {
      return duration(value, detail);
    } else if (nodePropTypes[key] === PropType.boolean) {
      return value ? 'yes' : 'no';
    } else if (nodePropTypes[key] === PropType.cost) {
      return cost(value);
    } else if (nodePropTypes[key] === PropType.rows) {
      return rows(value);
    } else if (nodePropTypes[key] === PropType.factor) {
      return factor(value);
    } else if (nodePropTypes[key] === PropType.estimateDirection) {
      switch (value) {
        case EstimateDirection.over:
          return '<i class="fa fa-arrow-up"></i> over';
        case EstimateDirection.under:
          return '<i class="fa fa-arrow-down"></i> under';
        default:
          return '-';
      }
    } else if (nodePropTypes[key] === PropType.json) {
      return JSON.stringify(value, null, 2);
    } else if (nodePropTypes[key] === PropType.space) {
      return space(value);
    }
  }
  return value;
}

export function durationClass(i: number): string {
  let c;
  if (i > 90) {
    c = 4;
  } else if (i > 40) {
    c = 3;
  } else if (i > 10) {
    c = 2;
  } else {
    c = 1;
  }
  if (c) {
    return 'c-' + c;
  }
  return '';
}
