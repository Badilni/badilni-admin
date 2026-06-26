import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return '—';
    }

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 0) {
      return 'just now';
    }
    if (seconds < 60) {
      return 'just now';
    }

    const intervals: { label: string; secondsInUnit: number }[] = [
      { label: 'year',   secondsInUnit: 31536000 },
      { label: 'month',  secondsInUnit: 2592000  },
      { label: 'week',   secondsInUnit: 604800   },
      { label: 'day',    secondsInUnit: 86400    },
      { label: 'hour',   secondsInUnit: 3600     },
      { label: 'minute', secondsInUnit: 60       },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.secondsInUnit);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }
}
