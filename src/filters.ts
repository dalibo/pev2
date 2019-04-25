import * as _ from 'lodash'

export function duration(value: number): string {
  var duration: string = '';

  if (value < 1) {
    duration = '<1';
  } else if (value > 1 && value < 1000) {
    duration = _.round(value, 2).toString();
  } else if (value >= 1000 && value < 60000) {
    duration = _.round(value / 1000, 2).toString();
  } else if (value >= 60000) {
    duration = _.round(value / 60000, 2).toString();
  }
  return duration;
}

export function durationUnit(value: number): string {
  var unit: string = '';

  if (value < 1) {
    unit = 'ms';
  } else if (value > 1 && value < 1000) {
    unit = 'ms';
  } else if (value >= 1000 && value < 60000) {
    unit = 's';
  } else if (value >= 60000) {
    unit = 'min';
  }
  return unit;
}
