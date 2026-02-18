import { useEffect, useRef, useState } from 'react';
import { DEFAULT_BGM, DEFAULT_BGM_VOLUME } from '../config/editorConfig';

const clampVolume = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return DEFAULT_BGM_VOLUME;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

function useBgmState() {
  const fileInputRef = useRef(null);
  const uploadedBgmObjectUrlRef = useRef(null);

  const [bgmUrl, setBgmUrl] = useState(DEFAULT_BGM.url);
  const [bgmLabel, setBgmLabel] = useState(DEFAULT_BGM.label);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(DEFAULT_BGM_VOLUME);
  const [bgmModalOpen, setBgmModalOpen] = useState(false);
  const [bgmDraft, setBgmDraft] = useState({
    url: DEFAULT_BGM.url,
    label: DEFAULT_BGM.label,
    volume: DEFAULT_BGM_VOLUME,
  });

  const openBgmModal = () => {
    setBgmDraft({
      url: bgmUrl,
      label: bgmLabel,
      volume: backgroundMusicVolume,
    });
    setBgmModalOpen(true);
  };

  const closeBgmModal = () => {
    setBgmModalOpen(false);
  };

  const handleBgmPresetPick = (preset) => {
    setBgmDraft((prev) => ({
      ...prev,
      url: preset.url,
      label: preset.label,
    }));
  };

  const handleUploadBgmChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    if (uploadedBgmObjectUrlRef.current) {
      URL.revokeObjectURL(uploadedBgmObjectUrlRef.current);
    }
    uploadedBgmObjectUrlRef.current = objectUrl;

    setBgmDraft((prev) => ({
      ...prev,
      url: objectUrl,
      label: file.name,
    }));

    event.target.value = '';
  };

  const setBgmDraftVolume = (value) => {
    setBgmDraft((prev) => ({
      ...prev,
      volume: clampVolume(value),
    }));
  };

  const confirmBgmModal = () => {
    setBgmUrl(bgmDraft.url);
    setBgmLabel(bgmDraft.label || (bgmDraft.url ? '已上传音乐' : '无背景音乐'));
    setBackgroundMusicVolume(clampVolume(bgmDraft.volume));
    setBgmModalOpen(false);
  };

  useEffect(() => {
    return () => {
      if (uploadedBgmObjectUrlRef.current) {
        URL.revokeObjectURL(uploadedBgmObjectUrlRef.current);
      }
    };
  }, []);

  return {
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
  };
}

export default useBgmState;
