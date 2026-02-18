const getIndicatorStyle = (anchor) =>
  anchor
    ? {
        left: `${anchor.left}px`,
        top: `${anchor.top}px`,
        height: `${anchor.height}px`,
      }
    : undefined;

const getHandleStyle = (anchor) =>
  anchor
    ? {
        left: `${anchor.left}px`,
        top: `${anchor.top + anchor.height}px`,
      }
    : undefined;

function MobileSelectionLayer({ mobileLayerRef, mobileSelectionUi, onHandlePointerDown }) {
  return (
    <div ref={mobileLayerRef} className="mobile-selection-layer" aria-hidden="true">
      {mobileSelectionUi.mode === 'caret' && mobileSelectionUi.caret && (
        <>
          <div
            className="mobile-caret-indicator"
            style={getIndicatorStyle(mobileSelectionUi.caret)}
          />
          <button
            type="button"
            className="mobile-selection-handle mobile-selection-handle--single"
            style={getHandleStyle(mobileSelectionUi.caret)}
            onPointerDown={(event) => onHandlePointerDown(event, 'single')}
            aria-label="caret-handle"
          />
        </>
      )}

      {mobileSelectionUi.mode === 'range' &&
        mobileSelectionUi.start &&
        mobileSelectionUi.end && (
          <>
            <div
              className="mobile-caret-indicator"
              style={getIndicatorStyle(mobileSelectionUi.start)}
            />
            <div
              className="mobile-caret-indicator"
              style={getIndicatorStyle(mobileSelectionUi.end)}
            />
            <button
              type="button"
              className="mobile-selection-handle mobile-selection-handle--start"
              style={getHandleStyle(mobileSelectionUi.start)}
              onPointerDown={(event) => onHandlePointerDown(event, 'start')}
              aria-label="selection-start-handle"
            />
            <button
              type="button"
              className="mobile-selection-handle mobile-selection-handle--end"
              style={getHandleStyle(mobileSelectionUi.end)}
              onPointerDown={(event) => onHandlePointerDown(event, 'end')}
              aria-label="selection-end-handle"
            />
          </>
        )}
    </div>
  );
}

export default MobileSelectionLayer;
