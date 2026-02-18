import { fireEvent, render } from '@testing-library/react';
import App, { getPolyphoneOptions, inferSelectionType } from './App';

test('infers selected text type', () => {
  expect(inferSelectionType('123')).toBe('number');
  expect(inferSelectionType('hello')).toBe('english');
  expect(inferSelectionType('\u884c')).toBe('polyphone');
  expect(inferSelectionType('\u6d4b')).toBe(null);
});

test('returns polyphone options from pinyin-pro', () => {
  const options = getPolyphoneOptions('\u884c');
  expect(options.length).toBeGreaterThan(1);
  expect(options.map((item) => item.ph)).toContain('xing2');
});

test('renders editor shell', () => {
  render(<App />);
  expect(document.querySelector('.page-title')).toBeInTheDocument();
  expect(document.querySelector('.submit-btn')).toBeInTheDocument();
});

test('serializes editor content into expected ssml payload', () => {
  render(<App />);

  fireEvent.click(document.querySelector('.submit-btn'));
  const output = document.querySelector('.result-panel pre');

  expect(output).toBeInTheDocument();
  const parsed = JSON.parse(output.textContent);

  expect(parsed.voice).toBe('xiaoyun');
  expect(parsed.backgroundMusicVolume).toBe(50);
  expect(parsed.text).toContain('<speak bgm="https://oss.tjtmsoft.com/audioUpload/');
  expect(parsed.text).toContain('<break time="1s" />');
  expect(parsed.text).toContain('<say-as interpret-as="cardinal">123</say-as>');
  expect(parsed.text).toContain('<say-as interpret-as="characters">hello</say-as>');
  expect(parsed.text).toContain('<phoneme alphabet="py" ph="xing2">');
});

test('clicking token removes token but keeps content', () => {
  render(<App />);

  const numberTokenLabel = document.querySelector('.tag-chip--number .tag-chip__label');
  fireEvent.click(numberTokenLabel);

  fireEvent.click(document.querySelector('.submit-btn'));
  const output = document.querySelector('.result-panel pre');
  const parsed = JSON.parse(output.textContent);

  expect(parsed.text).not.toContain('<say-as interpret-as="cardinal">123</say-as>');
  expect(parsed.text).toContain('123');
});
