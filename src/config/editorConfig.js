export const TOOLBAR_ITEMS = [
  { key: 'pause', label: '插入停顿', hasCaret: true },
  { key: 'number', label: '数字读音', hasCaret: true },
  { key: 'english', label: '英文读音', hasCaret: true },
  { key: 'polyphone', label: '多音字', hasCaret: true },
  { key: 'bgm', label: '背景音乐', hasCaret: false },
];

export const PAUSE_OPTIONS = [
  { label: '0.5s', time: '0.5s' },
  { label: '1s', time: '1s' },
  { label: '2s', time: '2s' },
  { label: '自定义', custom: true },
];

export const NUMBER_OPTIONS = [
  {
    label: '读数值',
    interpretAs: 'cardinal',
    dotClass: 'tool-menu__dot--number-value',
  },
  {
    label: '读数字',
    interpretAs: 'digits',
    dotClass: 'tool-menu__dot--number-digits',
  },
  {
    label: '读手机号',
    interpretAs: 'telephone',
    dotClass: 'tool-menu__dot--number-phone',
  },
];

export const ENGLISH_OPTIONS = [{ label: '读字母', interpretAs: 'characters' }];

export const DEFAULT_BGM = {
  url: 'https://oss.tjtmsoft.com/audioUpload/69706635-b394-4cb3-bd1c-df89096c6dd6_20260215162439.wav',
  label: 'relaxing-guitar-loop-v...',
};

export const DEFAULT_BGM_VOLUME = 50;

export const BGM_PRESETS = [
  { id: 'none', label: '无背景音乐', url: '' },
  { id: 'light', label: '轻音乐', url: DEFAULT_BGM.url },
  { id: 'classical', label: '古典音乐', url: DEFAULT_BGM.url },
  { id: 'calm', label: '平静音乐', url: DEFAULT_BGM.url },
  { id: 'default', label: DEFAULT_BGM.label, url: DEFAULT_BGM.url },
];

export const EMPTY_SELECTION_META = {
  text: '',
  normalizedText: '',
  detectedType: null,
  polyphoneOptions: [],
};
