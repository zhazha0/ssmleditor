import { BGM_PRESETS } from '../config/editorConfig';

function BgmModal({
  open,
  draft,
  fileInputRef,
  onClose,
  onPickPreset,
  onUploadChange,
  onVolumeChange,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="bgm-modal-mask" onPointerDown={onClose}>
      <section
        className="bgm-modal"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="bgm-modal__header">
          <h2>背景音乐</h2>
          <button type="button" className="bgm-modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="bgm-modal__content">
          <div className="bgm-modal__section-title">音乐</div>
          <div className="bgm-modal__grid">
            {BGM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`bgm-modal__music-btn ${
                  draft.url === preset.url && draft.label === preset.label ? 'is-selected' : ''
                }`}
                onClick={() => onPickPreset(preset)}
              >
                <span className="bgm-modal__music-icon">▶</span>
                {preset.label}
              </button>
            ))}
          </div>

          <div className="bgm-modal__upload-row">
            <button
              type="button"
              className="bgm-modal__upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              上传音乐
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="bgm-modal__hidden-file"
              onChange={onUploadChange}
            />
          </div>

          <div className="bgm-modal__divider" />

          <div className="bgm-modal__section-title">音量</div>
          <input
            type="range"
            min="0"
            max="100"
            value={draft.volume}
            className="bgm-modal__slider"
            onChange={(event) => onVolumeChange(event.target.value)}
          />
        </div>

        <footer className="bgm-modal__footer">
          <button type="button" className="bgm-modal__btn bgm-modal__btn--ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="bgm-modal__btn bgm-modal__btn--primary" onClick={onConfirm}>
            确定
          </button>
        </footer>
      </section>
    </div>
  );
}

export default BgmModal;
