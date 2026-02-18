export const escapeXml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const serializeEditorNode = (node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeXml(node.nodeValue || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node;
  const { tokenType, value, time, ph, interpretAs } = element.dataset || {};

  if (tokenType === 'pause') {
    return `<break time="${escapeXml(time || '1s')}" />`;
  }

  if (tokenType === 'number' || tokenType === 'english') {
    const sayAsType = interpretAs || (tokenType === 'english' ? 'characters' : 'cardinal');
    return `<say-as interpret-as="${escapeXml(sayAsType)}">${escapeXml(
      value || element.innerText || ''
    )}</say-as>`;
  }

  if (tokenType === 'polyphone') {
    return `<phoneme alphabet="py" ph="${escapeXml(ph || '')}">${escapeXml(
      value || element.innerText || ''
    )}</phoneme>`;
  }

  if (element.tagName === 'BR') {
    return '';
  }

  return Array.from(element.childNodes)
    .map((child) => serializeEditorNode(child))
    .join('');
};
