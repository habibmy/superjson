import is from '@sindresorhus/is';

import { TypeAnnotation } from './serializer';

export const objectHasArrayLikeKeys = (object: object): boolean =>
  areKeysArrayLike(Object.keys(object));

/**
 * keys are expected to be sorted alphanumerically.
 */
export const areKeysArrayLike = (keys: string[]): boolean => {
  const numberKeys: number[] = [];

  for (const key of keys) {
    const keyAsInt = parseInt(key);

    if (is.nan(keyAsInt)) {
      return false;
    }

    numberKeys.push(keyAsInt);
  }

  return numberKeys.every((value, index) => value === index);
};

export const transformValue = (
  value: any
): { value: any; type: TypeAnnotation } | undefined => {
  if (is.undefined(value)) {
    return {
      value: undefined,
      type: 'undefined',
    };
  } else if (is.bigint(value)) {
    return {
      value: value.toString(),
      type: 'bigint',
    };
  } else if (is.date(value)) {
    return {
      value: value.toISOString(),
      type: 'Date',
    };
  } else if (is.nan(value)) {
    return {
      value: undefined,
      type: 'NaN',
    };
  } else if (is.infinite(value)) {
    return {
      value: undefined,
      type: value > 0 ? 'Infinity' : '-Infinity',
    };
  } else if (is.set(value)) {
    return {
      value: Array.from(value) as any[],
      type: 'set',
    };
  } else if (is.regExp(value)) {
    return {
      value: '' + value,
      type: 'regexp',
    };
  } else if (is.map(value)) {
    return {
      value: new Error('if you see this, smth bad happened'),
      type: 'map',
    };
  } else if (is.plainObject(value) && objectHasArrayLikeKeys(value)) {
    return {
      value: new Error('if you see this, smth bad happened'),
      type: 'object',
    };
  }

  return undefined;
};

export const untransformValue = (json: any, type: TypeAnnotation) => {
  switch (type) {
    case 'bigint':
      return BigInt(json);
    case 'undefined':
      return undefined;
    case 'Date':
      return new Date(json as string);
    case 'NaN':
      return Number.NaN;
    case 'Infinity':
      return Number.POSITIVE_INFINITY;
    case '-Infinity':
      return Number.NEGATIVE_INFINITY;
    case 'map':
      return new Map(Object.entries(json));
    case 'set':
      return new Set(json as unknown[]);
    case 'regexp': {
      const regex = json as string;
      const body = regex.slice(1, regex.lastIndexOf('/'));
      const flags = regex.slice(regex.lastIndexOf('/') + 1);
      return new RegExp(body, flags);
    }
    case 'object':
      return Object.fromEntries((json as unknown[]).map((v, i) => [i, v]));
    default:
      return json;
  }
};
