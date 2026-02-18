import MobileSelectionLayer from './MobileSelectionLayer';

function EditorWorkspace({
  editorRef,
  mobileLayerRef,
  mobileSelectionUi,
  onMobileHandlePointerDown,
  onEditorInput,
  onSelectionChange,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onEditorClick,
  onBlur,
  bgmUrl,
  bgmLabel,
  backgroundMusicVolume,
  onSubmit,
}) {
  return (
    <div className="editor-body">
      <div
        ref={editorRef}
        className="editor-input"
        contentEditable
        suppressContentEditableWarning
        onInput={onEditorInput}
        onKeyUp={onSelectionChange}
        onMouseUp={onSelectionChange}
        onPointerUp={onSelectionChange}
        onSelect={onSelectionChange}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onEditorClick}
        onBlur={onBlur}
        aria-label="SSML 编辑输入框"
      />

      <MobileSelectionLayer
        mobileLayerRef={mobileLayerRef}
        mobileSelectionUi={mobileSelectionUi}
        onHandlePointerDown={onMobileHandlePointerDown}
      />

      <div className="editor-footer">
        <div className="bgm-summary">
          当前背景音乐: <span>{bgmUrl ? bgmLabel : '无'}</span>
          <span>音量: {backgroundMusicVolume}</span>
        </div>
        <button type="button" className="submit-btn" onClick={onSubmit}>
          生成 SSML
        </button>
      </div>
    </div>
  );
}

export default EditorWorkspace;
