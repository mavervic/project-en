import React from 'react';
import type { ChunkFlowSettings } from '../../types/chunkflow';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChunkFlowSettings;
  onUpdateSettings: (newSettings: Partial<ChunkFlowSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 md:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-cyan-400">Arena</span> Settings
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Customize interface guidance and display preferences.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Settings List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex flex-col gap-0.5 pr-4">
              <span className="text-sm font-semibold text-zinc-100">Instructional Guidance</span>
              <span className="text-xs text-zinc-400 leading-relaxed">
                Show detailed headers, prompts, and duplicate action hints. Turn off for a
                minimalist focus arena.
              </span>
            </div>
            <button
              role="switch"
              aria-checked={settings.showGuidance}
              onClick={() => onUpdateSettings({ showGuidance: !settings.showGuidance })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                settings.showGuidance ? 'bg-cyan-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.showGuidance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Training Sort Policy */}
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-zinc-100">訓練單元排序方式</span>
              <span className="text-xs text-zinc-400 leading-relaxed">
                選擇訓練單元卡片的排列順序：成績最差優先（針對弱點）或依課次順序（1~50）。
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                data-testid="sort-policy-weakest"
                onClick={() => onUpdateSettings({ trainingSortPolicy: 'weakest' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  settings.trainingSortPolicy !== 'sequential'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-semibold'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                成績最差優先 (預設)
              </button>
              <button
                type="button"
                data-testid="sort-policy-sequential"
                onClick={() => onUpdateSettings({ trainingSortPolicy: 'sequential' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  settings.trainingSortPolicy === 'sequential'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-semibold'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                依課次順序 (1~50)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-900">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
