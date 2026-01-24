export function convertDoubleDashToHyphen(str : string) : string {
    if (typeof str !== 'string') return str;
    return str.replace(/--+/g, '-');
  }

export function convertDoubleHyphenToHyphen(str : string) : string {
    if (typeof str !== 'string') return str;
    return str.replace(/--+/g, '-');
  }