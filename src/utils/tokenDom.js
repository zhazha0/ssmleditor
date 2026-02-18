export const createTokenElement = ({ type, label, value, time, ph, interpretAs }) => {
  const chip = document.createElement('span');
  chip.className = `tag-chip tag-chip--${type}`;
  chip.contentEditable = 'false';
  chip.dataset.tokenType = type;

  if (value) chip.dataset.value = value;
  if (time) chip.dataset.time = time;
  if (ph) chip.dataset.ph = ph;
  if (interpretAs) chip.dataset.interpretAs = interpretAs;

  const text = document.createElement('span');
  text.className = 'tag-chip__label';
  text.textContent = label;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'tag-chip__remove';
  remove.setAttribute('aria-label', '删除标签');
  remove.textContent = '×';

  chip.appendChild(text);
  chip.appendChild(remove);
  return chip;
};

export const getTokenPlainText = (chip) => {
  const { tokenType, value, time } = chip.dataset || {};
  if (tokenType === 'pause') return time || '';
  if (value) return value;
  return chip.querySelector('.tag-chip__label')?.textContent || '';
};
