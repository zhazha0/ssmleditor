import { useEffect, useRef, useState } from 'react';
import { EMPTY_SELECTION_META } from '../config/editorConfig';

const EMPTY_MOBILE_SELECTION_UI = {
  mode: 'none',
  caret: null,
  start: null,
  end: null,
};

function useEditorSelection({
  inferSelectionType,
  getPolyphoneOptions,
  isChineseChar,
  onSelectionMetaChange,
}) {
  const editorRef = useRef(null);
  const mobileLayerRef = useRef(null);
  const savedRangeRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const dragHandleRef = useRef({
    active: false,
    handle: 'single',
    pointerId: null,
  });

  const [selectionMeta, setSelectionMeta] = useState(EMPTY_SELECTION_META);
  const [mobileSelectionUi, setMobileSelectionUi] = useState(EMPTY_MOBILE_SELECTION_UI);

  const onSelectionMetaChangeRef = useRef(onSelectionMetaChange);
  onSelectionMetaChangeRef.current = onSelectionMetaChange;

  const isRangeInsideEditor = (range) => {
    const editor = editorRef.current;
    if (!editor || !range) return false;
    return editor.contains(range.startContainer) && editor.contains(range.endContainer);
  };

  const getRangeFromPoint = (clientX, clientY) => {
    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(clientX, clientY);
      if (range) return range;
    }

    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(clientX, clientY);
      if (!position) return null;
      const range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
      return range;
    }

    return null;
  };

  const getEditorRange = ({ requireSelection = false } = {}) => {
    const editor = editorRef.current;
    if (!editor) return null;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      if (
        isRangeInsideEditor(currentRange) &&
        (!requireSelection || !currentRange.collapsed)
      ) {
        return currentRange.cloneRange();
      }
    }

    if (savedRangeRef.current) {
      const cloned = savedRangeRef.current.cloneRange();
      if (isRangeInsideEditor(cloned) && (!requireSelection || !cloned.collapsed)) {
        return cloned;
      }
    }

    if (requireSelection) return null;

    const fallback = document.createRange();
    fallback.selectNodeContents(editor);
    fallback.collapse(false);
    return fallback;
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!isRangeInsideEditor(range)) return;
    savedRangeRef.current = range.cloneRange();
  };

  const setCaretAfterNode = (node) => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const getCharClass = (char) => {
    if (!char) return null;
    if (/\d/.test(char)) return 'number';
    if (/[A-Za-z]/.test(char)) return 'english';
    if (isChineseChar(char)) return 'han';
    return null;
  };

  const getTextPositionFromRange = (range) => {
    const container = range.startContainer;
    const offset = range.startOffset;

    if (container.nodeType === Node.TEXT_NODE) {
      return {
        textNode: container,
        offset: Math.max(0, Math.min(offset, container.nodeValue?.length || 0)),
      };
    }

    if (container.nodeType !== Node.ELEMENT_NODE) return null;

    const next = container.childNodes[offset];
    const prev = container.childNodes[offset - 1];

    if (next && next.nodeType === Node.TEXT_NODE) {
      return { textNode: next, offset: 0 };
    }

    if (prev && prev.nodeType === Node.TEXT_NODE) {
      return { textNode: prev, offset: prev.nodeValue?.length || 0 };
    }

    return null;
  };

  const expandRangeAtCaret = (caretRange) => {
    if (!caretRange || !caretRange.collapsed) return null;

    const position = getTextPositionFromRange(caretRange);
    if (!position) return null;

    const { textNode, offset } = position;
    const text = textNode.nodeValue || '';
    if (!text) return null;

    const maxIndex = text.length - 1;
    const probes = [offset, offset - 1];
    let charIndex = -1;
    let tokenClass = null;

    for (const probe of probes) {
      if (probe < 0 || probe > maxIndex) continue;
      const klass = getCharClass(text[probe]);
      if (klass) {
        charIndex = probe;
        tokenClass = klass;
        break;
      }
    }

    if (charIndex < 0 || !tokenClass) return null;

    let start = charIndex;
    let end = charIndex + 1;

    if (tokenClass !== 'han') {
      while (start > 0 && getCharClass(text[start - 1]) === tokenClass) {
        start -= 1;
      }
      while (end < text.length && getCharClass(text[end]) === tokenClass) {
        end += 1;
      }
    }

    const range = document.createRange();
    range.setStart(textNode, start);
    range.setEnd(textNode, end);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    savedRangeRef.current = range.cloneRange();
    return range;
  };

  const compareRangeStart = (leftRange, rightRange) =>
    leftRange.compareBoundaryPoints(Range.START_TO_START, rightRange);

  const getCollapsedRect = (range) => {
    const rect = range.getBoundingClientRect();
    if (rect && (rect.height > 0 || rect.width > 0)) return rect;

    const rects = range.getClientRects();
    if (rects.length > 0) return rects[0];
    return null;
  };

  const getRangeEdgeRect = (range, collapseToStart) => {
    const edgeRange = range.cloneRange();
    edgeRange.collapse(collapseToStart);
    return getCollapsedRect(edgeRange);
  };

  const toLayerAnchor = (rect, layerRect) => {
    if (!rect || !layerRect) return null;

    const lineHeight = Math.max(18, Math.round(rect.height || 22));
    const left = rect.left - layerRect.left;
    const top = rect.top - layerRect.top;
    return {
      left,
      top,
      height: lineHeight,
    };
  };

  const syncMobileSelectionUi = () => {
    const layer = mobileLayerRef.current;
    if (!layer) {
      setMobileSelectionUi(EMPTY_MOBILE_SELECTION_UI);
      return;
    }

    const range = getEditorRange();
    if (!range || !isRangeInsideEditor(range)) {
      setMobileSelectionUi(EMPTY_MOBILE_SELECTION_UI);
      return;
    }

    const layerRect = layer.getBoundingClientRect();
    if (layerRect.width <= 0 || layerRect.height <= 0) {
      setMobileSelectionUi(EMPTY_MOBILE_SELECTION_UI);
      return;
    }

    if (range.collapsed) {
      const caretRect = getRangeEdgeRect(range, true);
      const caret = toLayerAnchor(caretRect, layerRect);
      setMobileSelectionUi(
        caret
          ? { mode: 'caret', caret, start: null, end: null }
          : EMPTY_MOBILE_SELECTION_UI
      );
      return;
    }

    const startRect = getRangeEdgeRect(range, true);
    const endRect = getRangeEdgeRect(range, false);
    const start = toLayerAnchor(startRect, layerRect);
    const end = toLayerAnchor(endRect, layerRect);
    setMobileSelectionUi(
      start && end
        ? { mode: 'range', caret: null, start, end }
        : EMPTY_MOBILE_SELECTION_UI
    );
  };

  const refreshSelectionMeta = () => {
    const range = getEditorRange({ requireSelection: true });
    if (!range) {
      setSelectionMeta(EMPTY_SELECTION_META);
      return EMPTY_SELECTION_META;
    }

    const normalizedText = range.toString().trim();
    if (!normalizedText) {
      setSelectionMeta(EMPTY_SELECTION_META);
      return EMPTY_SELECTION_META;
    }

    const nextMeta = {
      text: range.toString(),
      normalizedText,
      detectedType: inferSelectionType(normalizedText),
      polyphoneOptions: getPolyphoneOptions(normalizedText),
    };
    setSelectionMeta(nextMeta);
    return nextMeta;
  };

  const handleSelectionChange = () => {
    saveSelection();
    const nextMeta = refreshSelectionMeta();
    syncMobileSelectionUi();
    if (onSelectionMetaChangeRef.current) {
      onSelectionMetaChangeRef.current(nextMeta);
    }
  };

  const applyHandleDragAtPoint = (clientX, clientY, handleType) => {
    const pointRange = getRangeFromPoint(clientX, clientY);
    if (!pointRange || !isRangeInsideEditor(pointRange)) return;

    const selection = window.getSelection();
    if (!selection) return;

    const currentRange = getEditorRange();
    if (!currentRange) return;

    if (handleType === 'single') {
      pointRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(pointRange);
      savedRangeRef.current = pointRange.cloneRange();
      handleSelectionChange();
      return;
    }

    const fixedStart = currentRange.cloneRange();
    fixedStart.collapse(true);
    const fixedEnd = currentRange.cloneRange();
    fixedEnd.collapse(false);

    const moving = pointRange.cloneRange();
    moving.collapse(true);

    const left =
      handleType === 'start'
        ? compareRangeStart(moving, fixedEnd) <= 0
          ? moving
          : fixedEnd
        : compareRangeStart(fixedStart, moving) <= 0
          ? fixedStart
          : moving;
    const right =
      handleType === 'start'
        ? compareRangeStart(moving, fixedEnd) <= 0
          ? fixedEnd
          : moving
        : compareRangeStart(fixedStart, moving) <= 0
          ? moving
          : fixedStart;

    const nextRange = document.createRange();
    nextRange.setStart(left.startContainer, left.startOffset);
    nextRange.setEnd(right.startContainer, right.startOffset);

    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    handleSelectionChange();
  };

  const handleMobileHandlePointerDown = (event, handleType) => {
    event.preventDefault();
    event.stopPropagation();
    dragHandleRef.current = {
      active: true,
      handle: handleType,
      pointerId: event.pointerId,
    };
  };

  const handleEditorTouchStart = (event) => {
    if (!event.touches || event.touches.length !== 1) return;
    const touch = event.touches[0];

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      const range = getRangeFromPoint(touch.clientX, touch.clientY);
      if (!range || !isRangeInsideEditor(range)) return;
      const selected = expandRangeAtCaret(range);
      if (selected) handleSelectionChange();
    }, 500);
  };

  const handleEditorTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleEditorTouchEnd = (event) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touch = event.changedTouches?.[0];
    if (touch) {
      const range = getRangeFromPoint(touch.clientX, touch.clientY);
      if (range && isRangeInsideEditor(range)) {
        range.collapse(true);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        saveSelection();
      }
    }

    handleSelectionChange();
  };

  const requireSelectedText = () => {
    let range = getEditorRange({ requireSelection: true });
    if (!range) {
      const caretRange = getEditorRange();
      range = expandRangeAtCaret(caretRange);
    }

    if (!range) {
      return null;
    }

    const normalizedText = range.toString().trim();
    if (!normalizedText) {
      return null;
    }

    return { range, normalizedText };
  };

  const handleSelectionChangeRef = useRef(handleSelectionChange);
  handleSelectionChangeRef.current = handleSelectionChange;
  const syncMobileSelectionUiRef = useRef(syncMobileSelectionUi);
  syncMobileSelectionUiRef.current = syncMobileSelectionUi;
  const applyHandleDragAtPointRef = useRef(applyHandleDragAtPoint);
  applyHandleDragAtPointRef.current = applyHandleDragAtPoint;

  useEffect(() => {
    const syncSelection = () => handleSelectionChangeRef.current();
    document.addEventListener('selectionchange', syncSelection);
    return () => {
      document.removeEventListener('selectionchange', syncSelection);
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const drag = dragHandleRef.current;
      if (!drag.active) return;
      if (drag.pointerId !== null && event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      applyHandleDragAtPointRef.current(event.clientX, event.clientY, drag.handle);
    };

    const stopDrag = (event) => {
      const drag = dragHandleRef.current;
      if (!drag.active) return;
      if (drag.pointerId !== null && event.pointerId !== drag.pointerId) return;
      dragHandleRef.current = {
        active: false,
        handle: 'single',
        pointerId: null,
      };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, []);

  useEffect(() => {
    const refresh = () => syncMobileSelectionUiRef.current();
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  return {
    editorRef,
    mobileLayerRef,
    selectionMeta,
    mobileSelectionUi,
    getEditorRange,
    setCaretAfterNode,
    saveSelection,
    requireSelectedText,
    handleSelectionChange,
    handleEditorTouchStart,
    handleEditorTouchMove,
    handleEditorTouchEnd,
    handleMobileHandlePointerDown,
  };
}

export default useEditorSelection;

