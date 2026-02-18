import { ENGLISH_OPTIONS, NUMBER_OPTIONS, PAUSE_OPTIONS, TOOLBAR_ITEMS } from '../config/editorConfig';

function EditorToolbar({
  toolbarRef,
  recommendedTool,
  openMenuTool,
  selectionMeta,
  onToolClick,
  onPauseOptionSelect,
  onNumberOptionSelect,
  onEnglishOptionSelect,
  onPolyphoneOptionSelect,
}) {
  const pauseMenuVisible = openMenuTool === 'pause';
  const numberMenuVisible = openMenuTool === 'number' && selectionMeta.detectedType === 'number';
  const englishMenuVisible = openMenuTool === 'english' && selectionMeta.detectedType === 'english';
  const polyphoneMenuVisible =
    openMenuTool === 'polyphone' && selectionMeta.polyphoneOptions.length > 1;

  return (
    <div ref={toolbarRef} className="toolbar" role="toolbar" aria-label="SSML 编辑工具栏">
      {TOOLBAR_ITEMS.map((item) => {
        const isActive = recommendedTool === item.key || openMenuTool === item.key;

        return (
          <div key={item.key} className="toolbar__item-wrap">
            <button
              type="button"
              className={`toolbar__item ${item.hasCaret ? 'has-caret' : ''} ${
                isActive ? 'is-active' : ''
              }`}
              onPointerDown={(event) => {
                event.preventDefault();
                onToolClick(item.key);
              }}
            >
              {item.label}
            </button>

            {item.key === 'pause' && pauseMenuVisible && (
              <div className="tool-menu" role="menu">
                {PAUSE_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    role="menuitem"
                    className="tool-menu__item"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onPauseOptionSelect(option);
                    }}
                  >
                    <span className="tool-menu__dot tool-menu__dot--pause" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {item.key === 'number' && numberMenuVisible && (
              <div className="tool-menu" role="menu">
                {NUMBER_OPTIONS.map((option) => (
                  <button
                    key={option.interpretAs}
                    type="button"
                    role="menuitem"
                    className="tool-menu__item"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onNumberOptionSelect(option.interpretAs);
                    }}
                  >
                    <span className={`tool-menu__dot ${option.dotClass}`} />
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {item.key === 'english' && englishMenuVisible && (
              <div className="tool-menu" role="menu">
                {ENGLISH_OPTIONS.map((option) => (
                  <button
                    key={option.interpretAs}
                    type="button"
                    role="menuitem"
                    className="tool-menu__item"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onEnglishOptionSelect(option.interpretAs);
                    }}
                  >
                    <span className="tool-menu__dot tool-menu__dot--english" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {item.key === 'polyphone' && polyphoneMenuVisible && (
              <div className="tool-menu" role="menu">
                {selectionMeta.polyphoneOptions.map((option) => (
                  <button
                    key={option.ph}
                    type="button"
                    role="menuitem"
                    className="tool-menu__item"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onPolyphoneOptionSelect(option.ph);
                    }}
                  >
                    <span className="tool-menu__dot tool-menu__dot--polyphone" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default EditorToolbar;
