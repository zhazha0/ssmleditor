import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import EditorToolbar from './components/EditorToolbar';
import EditorWorkspace from './components/EditorWorkspace';
import BgmModal from './components/BgmModal';
import { escapeXml, serializeEditorNode } from './utils/ssml';
import { createTokenElement, getTokenPlainText } from './utils/tokenDom';
import {
  getPolyphoneOptions,
  inferSelectionType,
  isChineseChar,
  isEnglishText,
  isNumberText,
} from './utils/textDetection';
import useBgmState from './hooks/useBgmState';
import useEditorSelection from './hooks/useEditorSelection';

export { getPolyphoneOptions, inferSelectionType };
const CONTENT_CHANGE_MESSAGE_TYPE = 'ssml-editor-content-change';

function App() {
  const toolbarRef = useRef(null);
  const [payload, setPayload] = useState(null);
  const [openMenuTool, setOpenMenuTool] = useState(null);

  const handleSelectionMetaChange = useCallback((nextMeta) => {
    if (nextMeta.detectedType === 'polyphone' && nextMeta.polyphoneOptions.length > 1) {
      setOpenMenuTool((prev) => (prev === 'pause' ? prev : 'polyphone'));
      return;
    }

    setOpenMenuTool((prev) => {
      if (prev === 'polyphone') return null;
      if (prev === 'number' && nextMeta.detectedType !== 'number') return null;
      if (prev === 'english' && nextMeta.detectedType !== 'english') return null;
      return prev;
    });
  }, []);

  const {
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
  } = useEditorSelection({
    inferSelectionType,
    getPolyphoneOptions,
    isChineseChar,
    onSelectionMetaChange: handleSelectionMetaChange,
  });

  const {
    fileInputRef,
    bgmUrl,
    bgmLabel,
    backgroundMusicVolume,
    bgmModalOpen,
    bgmDraft,
    openBgmModal,
    closeBgmModal,
    handleBgmPresetPick,
    handleUploadBgmChange,
    setBgmDraftVolume,
    confirmBgmModal,
  } = useBgmState();

  const isToolEnabled = useCallback(
    (toolKey) => {
      if (toolKey === 'pause' || toolKey === 'bgm') return true;
      if (toolKey === 'number') return selectionMeta.detectedType === 'number';
      if (toolKey === 'english') return selectionMeta.detectedType === 'english';
      if (toolKey === 'polyphone') {
        return (
          selectionMeta.detectedType === 'polyphone' && selectionMeta.polyphoneOptions.length > 1
        );
      }
      return false;
    },
    [selectionMeta.detectedType, selectionMeta.polyphoneOptions.length]
  );

  const replaceRangeWithToken = (range, tokenMeta) => {
    const token = createTokenElement(tokenMeta);
    range.deleteContents();
    range.insertNode(token);
    setCaretAfterNode(token);
    setOpenMenuTool(null);
    handleSelectionChange();
    notifyContainerContentChange('toolbar-token-insert');
  };

  const handlePauseOptionSelect = (option) => {
    const range = getEditorRange();
    if (!range) return;

    if (option.custom) {
      const raw = window.prompt('璇疯緭鍏ュ仠椤挎椂闀匡紝渚嬪 1s 鎴?300ms', '1s');
      if (raw === null) return;
      const time = raw.trim() || '1s';
      replaceRangeWithToken(range, { type: 'pause', label: time, time });
      return;
    }

    replaceRangeWithToken(range, {
      type: 'pause',
      label: option.label,
      time: option.time,
    });
  };

  const insertNumberFromSelection = (interpretAs) => {
    const selected = requireSelectedText();
    if (!selected) return;
    if (!isNumberText(selected.normalizedText)) return;

    replaceRangeWithToken(selected.range, {
      type: 'number',
      label: selected.normalizedText,
      value: selected.normalizedText,
      interpretAs,
    });
  };

  const insertEnglishFromSelection = (interpretAs = 'characters') => {
    const selected = requireSelectedText();
    if (!selected) return;
    if (!isEnglishText(selected.normalizedText)) return;

    replaceRangeWithToken(selected.range, {
      type: 'english',
      label: selected.normalizedText,
      value: selected.normalizedText,
      interpretAs,
    });
  };

  const insertPolyphoneFromSelection = (ph) => {
    const selected = requireSelectedText();
    if (!selected) return;

    const options = getPolyphoneOptions(selected.normalizedText);
    if (options.length <= 1) return;

    replaceRangeWithToken(selected.range, {
      type: 'polyphone',
      label: selected.normalizedText,
      value: selected.normalizedText,
      ph,
    });
  };

  const handleToolClick = (toolKey) => {
    if (!isToolEnabled(toolKey)) {
      setOpenMenuTool(null);
      return;
    }

    if (toolKey === 'pause') {
      setOpenMenuTool((prev) => (prev === 'pause' ? null : 'pause'));
      return;
    }

    if (toolKey === 'bgm') {
      setOpenMenuTool(null);
      openBgmModal();
      return;
    }

    if (toolKey === 'number') {
      setOpenMenuTool((prev) => (prev === 'number' ? null : 'number'));
      return;
    }

    if (toolKey === 'english') {
      setOpenMenuTool((prev) => (prev === 'english' ? null : 'english'));
      return;
    }

    if (toolKey === 'polyphone') {
      setOpenMenuTool((prev) => (prev === 'polyphone' ? null : 'polyphone'));
    }
  };

  const handleEditorClick = (event) => {
    const target =
      event.target instanceof Element ? event.target : event.target?.parentElement ?? null;
    if (!target) return;

    const removeButton = target.closest('.tag-chip__remove');
    const chip = target.closest('.tag-chip');
    if (!chip || !chip.parentNode || !editorRef.current?.contains(chip)) return;

    if (removeButton) {
      chip.remove();
      handleSelectionChange();
      notifyContainerContentChange('token-remove');
      return;
    }

    event.preventDefault();
    const textNode = document.createTextNode(getTokenPlainText(chip));
    chip.replaceWith(textNode);
    setCaretAfterNode(textNode);
    handleSelectionChange();
    notifyContainerContentChange('token-replace-with-text');
  };

  const buildPayload = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return null;

    const ssmlBody = Array.from(editor.childNodes)
      .map((node) => serializeEditorNode(node))
      .join('');

    const attrs = [];
    if (bgmUrl.trim()) {
      attrs.push(`bgm="${escapeXml(bgmUrl.trim())}"`);
      attrs.push(`backgroundMusicVolume="${backgroundMusicVolume}"`);
    }
    const ssml = `<speak${attrs.length ? ` ${attrs.join(' ')}` : ''}>${ssmlBody}</speak>`;

    const contentPayload = {
      text: ssml,
      bgm: bgmUrl.trim(),
      backgroundMusicVolume,
    };

    return {
      ...contentPayload,
      speech_rate: 0,
      pitch_rate: 0,
      voice: 'xiaoyun',
      volume: 50,
    };
  }, [backgroundMusicVolume, bgmUrl, editorRef]);

  const notifyContainerContentChange = useCallback(
    (reason) => {
      const nextPayload = buildPayload();
      if (!nextPayload) return;

      const message = {
        type: CONTENT_CHANGE_MESSAGE_TYPE,
        reason,
        payload: {
          text: nextPayload.text,
          bgm: nextPayload.bgm,
          backgroundMusicVolume: nextPayload.backgroundMusicVolume,
        },
        timestamp: Date.now(),
      };

      if (window.wx?.miniProgram?.postMessage) {
        window.wx.miniProgram.postMessage({ data: message });
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
    },
    [buildPayload]
  );

  const handleEditorInput = () => {
    handleSelectionChange();
    notifyContainerContentChange('editor-input');
  };

  const serializeToPayload = () => {
    const nextPayload = buildPayload();
    if (!nextPayload) return;
    setPayload(nextPayload);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.innerHTML = '';
    notifyContainerContentChange('init');
  }, [editorRef, notifyContainerContentChange]);

  useEffect(() => {
    const handleOutside = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (bgmModalOpen) return;
      if (toolbarRef.current?.contains(target)) return;
      setOpenMenuTool(null);
    };

    document.addEventListener('pointerdown', handleOutside);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, [bgmModalOpen]);

  return (
    <div className="app-shell">
      <main className="editor-page">

        <section className="editor-card">
          <EditorToolbar
            toolbarRef={toolbarRef}
            recommendedTool={selectionMeta.detectedType}
            openMenuTool={openMenuTool}
            selectionMeta={selectionMeta}
            isToolEnabled={isToolEnabled}
            onToolClick={handleToolClick}
            onPauseOptionSelect={handlePauseOptionSelect}
            onNumberOptionSelect={insertNumberFromSelection}
            onEnglishOptionSelect={insertEnglishFromSelection}
            onPolyphoneOptionSelect={insertPolyphoneFromSelection}
          />

          <EditorWorkspace
            editorRef={editorRef}
            mobileLayerRef={mobileLayerRef}
            mobileSelectionUi={mobileSelectionUi}
            onMobileHandlePointerDown={handleMobileHandlePointerDown}
            onEditorInput={handleEditorInput}
            onSelectionChange={handleSelectionChange}
            onTouchStart={handleEditorTouchStart}
            onTouchMove={handleEditorTouchMove}
            onTouchEnd={handleEditorTouchEnd}
            onEditorClick={handleEditorClick}
            onBlur={saveSelection}
            bgmUrl={bgmUrl}
            bgmLabel={bgmLabel}
            backgroundMusicVolume={backgroundMusicVolume}
            onSubmit={serializeToPayload}
          />
        </section>

        {payload && (
          <section className="result-panel">
            <h2>鎻愪氦鍙傛暟</h2>
            <pre>{JSON.stringify(payload, null, 2)}</pre>
          </section>
        )}
      </main>

      <BgmModal
        open={bgmModalOpen}
        draft={bgmDraft}
        fileInputRef={fileInputRef}
        onClose={closeBgmModal}
        onPickPreset={handleBgmPresetPick}
        onUploadChange={handleUploadBgmChange}
        onVolumeChange={setBgmDraftVolume}
        onConfirm={confirmBgmModal}
      />
    </div>
  );
}

export default App;


