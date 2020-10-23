import * as _ from 'lodash';
import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);
import { EstimateDirection, NodeProp, nodePropTypes, PropType } from '@/enums';
import hljs from 'highlight.js/lib/core';
import 'highlight.js/styles/github.css';
import * as langPgsql from 'highlight.js/lib/languages/pgsql';
hljs.registerLanguage('pgsql', langPgsql);

import * as langJson from 'highlight.js/lib/languages/json';
hljs.registerLanguage('json', langJson);

export function duration(value: number, detail: boolean): string {
  if (value === undefined) {
    return 'N/A';
  }
  detail = !!detail;

  if (value < 1 && !detail) {
    return '<1 ms';
  } else if (value < 1000) {
    return parseFloat(value.toPrecision(3)).toLocaleString()  + 'ms';
  }
  const options = detail ? {} : { largest: 2 };
  return moment.duration(value).format('w[w] d[d] h[h] m[m] s[s] SSS[ms]', options);
}

export function cost(value: number): string {
  if (!value) {
    return 'N/A';
  }
  value = parseFloat(value.toPrecision(3));
  return value.toLocaleString();
}

export function rows(value: number): string {
  if (value === undefined) {
    return 'N/A';
  }
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

export function kilobytes(value: number): string {
  return formatBytes(value * 1024);
}

export function bytes(value: number): string {
  return formatBytes(value);
}

export function formatBytes(value: number, decimals = 2) {
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const units = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(value) / Math.log(k));
  const compiled = _.template('${value} ${unit}');
  const valueString = parseFloat((value / Math.pow(k, i)).toFixed(dm)).toLocaleString();
  return compiled({value: valueString, unit: units[i]});
}

export function blocks(value: number): string {
  if (!value) {
    return '';
  }
  return value.toLocaleString() + '<br><small>' +
    formatBytes(value * 8 * 1024) + '</small>';
}

export function percent(value: number): string {
  if (isNaN(value)) {
    return '-';
  }
  return _.round(value * 100) + '%';
}

export function list(value: string[] | string): string {
  if (typeof value === 'string') {
    value = value.split(/\s*,\s*/);
  }
  const compiled = _.template('<% _.forEach(lines, function(line) { %><li><%- line %></li><% }); %>');
  return '<ul class="list-unstyled">' + compiled({lines: value}) + '</ul>';
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
    } else if (nodePropTypes[key] === PropType.bytes) {
      return bytes(value);
    } else if (nodePropTypes[key] === PropType.kilobytes) {
      return kilobytes(value);
    } else if (nodePropTypes[key] === PropType.blocks) {
      return blocks(value);
    } else if (nodePropTypes[key] === PropType.list) {
      return list(value);
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
  }
  if (c) {
    return 'c-' + c;
  }
  return '';
}

export function pgsql(text: string) {
  return hljs.highlight('pgsql', text).value;
}

export function json(text: string) {
  return hljs.highlight('json', text).value;
}
