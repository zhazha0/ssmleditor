import { pinyin } from 'pinyin-pro';

export const isNumberText = (value) => /^\d+(?:\.\d+)?$/.test(value);
export const isEnglishText = (value) => /^[a-zA-Z]+$/.test(value);
export const isSingleChineseChar = (value) => /^[\u4e00-\u9fff]$/.test(value);
export const isChineseChar = (value) => /^[\u4e00-\u9fff]$/.test(value);

export const getPolyphoneOptions = (value) => {
  if (!isSingleChineseChar(value)) return [];

  const withToneMarks = pinyin(value, { type: 'array', multiple: true });
  const withToneNums = pinyin(value, {
    type: 'array',
    multiple: true,
    toneType: 'num',
  });

  const merged = withToneMarks
    .map((label, index) => ({
      label,
      ph: withToneNums[index] || '',
    }))
    .filter((item) => item.ph);

  const unique = [];
  const seen = new Set();
  merged.forEach((item) => {
    if (seen.has(item.ph)) return;
    seen.add(item.ph);
    unique.push(item);
  });

  return unique;
};

export const inferSelectionType = (value) => {
  if (!value) return null;
  if (isNumberText(value)) return 'number';
  if (isEnglishText(value)) return 'english';
  if (getPolyphoneOptions(value).length > 1) return 'polyphone';
  return null;
};
