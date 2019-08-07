import * as _ from 'lodash';
import numeral from 'numeral';
import 'numeral/locales';
numeral.locale(navigator.language || 'en');
import { EstimateDirection, NodeProp, nodePropTypes, PropType } from '@/enums';

export function duration(value: number): string {
  let dur: string = '';
  let unit: string = '';

  if (value < 1) {
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
    dur = numeral(value.toPrecision(3)).format('0[.]0');
  }
  const compiled = _.template('${dur}<span class="text-muted">${unit}</span>');
  return compiled({dur, unit});
}

export function cost(value: number): string {
  value = parseFloat(value.toPrecision(3));
  return numeral(value).format('0,0[.]00');
}

export function rows(value: number): string {
  return numeral(value).format('0,0[.]00');
}

export function factor(value: number): string {
  const f: string = numeral(value.toPrecision(2)).format('0[.]0');
  const compiled = _.template('${f}<span class="text-muted">&times;</span>');
  return compiled({f});
}

export function keysToString(value: any): string {
  if (!(value instanceof Array)) {
    value = [value];
  }
  value = _.map(value, (v) => v.replace(/(^\(|\)$)/g, ''));
  return value.join(', ');
}

export function numeral_(value: number, format: string): string {
  return numeral(value).format(format);
}

export function truncate(text: string, length: number, clamp: string): string {
    clamp = clamp || '...';
    return text.length > length ? text.slice(0, length) + clamp : text;
}

export function formatNodeProp(key: string, value: any): string {
  if (_.has(nodePropTypes, key)) {
    if (nodePropTypes[key] === PropType.duration) {
      return duration(value);
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
    }
  }
  return value;
}
