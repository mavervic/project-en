import React, { useState, useMemo } from 'react';
import type { MarkedChunkRecord } from '../../types/chunkflow';
import { TOEIC_LISTENING_UNITS } from '../../data/toeic-listening';

export interface ListeningNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  markedChunks: MarkedChunkRecord[];
  onRemoveChunk?: (id: string) => void;
  onClearAll?: () => void;
}

export const ListeningNotebookModal: React.FC<ListeningNotebookModalProps> = ({
  isOpen,
  onClose,
  markedChunks,
  onRemoveChunk,
  onClearAll,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const getTopicTitle = (trainingId: string) => {
    const found = TOEIC_LISTENING_UNITS.find(
      (u) => u.trainingId === trainingId || u.trainingId.startsWith(trainingId)
    );
    return found ? found.title.replace(/\s*\((Easy|Medium|Hard)\)$/i, '') : trainingId;
  };

  // Unique topics present in marked chunks
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    for (const c of markedChunks) {
      if (c.trainingId) set.add(c.trainingId);
    }
    return Array.from(set);
  }, [markedChunks]);

  // Filtered marked chunks
  const filteredChunks = useMemo(() => {
    return markedChunks.filter((chunk) => {
      if (selectedTopic !== 'all' && chunk.trainingId !== selectedTopic) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inChunk = chunk.chunkText.toLowerCase().includes(q);
        const inSentence = chunk.sentence.toLowerCase().includes(q);
        const inTranslation = (chunk.translation || '').toLowerCase().includes(q);
        if (!inChunk && !inSentence && !inTranslation) return false;
      }
      return true;
    });
  }, [markedChunks, selectedTopic, searchQuery]);

  // Group by topic for export and structured display
  const groupedByTopic = useMemo(() => {
    const map = new Map<string, MarkedChunkRecord[]>();
    for (const chunk of filteredChunks) {
      const topicName = getTopicTitle(chunk.trainingId);
      if (!map.has(topicName)) {
        map.set(topicName, []);
      }
      map.get(topicName)!.push(chunk);
    }
    return map;
  }, [filteredChunks]);

  const handleExportMarkdown = async () => {
    let md = '# TOEIC Listening Notebook 聽力盲點筆記\n\n';
    for (const [topic, items] of groupedByTopic.entries()) {
      md += `## ${topic}\n`;
      for (const item of items) {
        md += `- **${item.chunkText}**\n`;
        md += `  - 完整句子: ${item.sentence}\n`;
        if (item.translation) {
          md += `  - 中文翻譯: ${item.translation}\n`;
        }
      }
      md += '\n';
    }

    try {
      await navigator.clipboard.writeText(md.trim());
      setCopyFeedback('已複製 Markdown 格式！');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('複製失敗，請手動複製');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleExportText = async () => {
    let text = '=== TOEIC Listening Notebook 聽力盲點筆記 ===\n\n';
    for (const [topic, items] of groupedByTopic.entries()) {
      text += `[${topic}]\n`;
      for (const item of items) {
        text += `• 語塊: ${item.chunkText}\n`;
        text += `  句子: ${item.sentence}\n`;
        if (item.translation) {
          text += `  翻譯: ${item.translation}\n`;
        }
        text += '\n';
      }
    }

    try {
      await navigator.clipboard.writeText(text.trim());
      setCopyFeedback('已複製純文字！');
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback('複製失敗，請手動複製');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="listening-notebook-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 sm:p-7 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📓</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Listening <span className="text-amber-400">Notebook</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {markedChunks.length} 語塊
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                回顧聽力盲點語塊，複習易混淆或聽不清楚的發音句型。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-testid="close-notebook-btn"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close notebook"
          >
            ✕
          </button>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Topic Filter */}
            <select
              data-testid="notebook-topic-filter"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="all">所有主題 ({markedChunks.length})</option>
              {availableTopics.map((topicId) => {
                const count = markedChunks.filter((c) => c.trainingId === topicId).length;
                return (
                  <option key={topicId} value={topicId}>
                    {getTopicTitle(topicId)} ({count})
                  </option>
                );
              })}
            </select>

            {/* Search Input */}
            <input
              type="text"
              data-testid="notebook-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋語塊或句子..."
              className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {markedChunks.length > 0 && (
              <>
                <button
                  type="button"
                  data-testid="export-markdown-btn"
                  onClick={handleExportMarkdown}
                  title="複製 Markdown 格式筆記"
                  className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  匯出 MD
                </button>
                <button
                  type="button"
                  data-testid="export-text-btn"
                  onClick={handleExportText}
                  title="複製純文字格式筆記"
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  匯出純文字
                </button>
                {onClearAll && (
                  <button
                    type="button"
                    data-testid="clear-all-notes-btn"
                    onClick={onClearAll}
                    title="清空所有筆記"
                    className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 hover:border-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    清空
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Copy Feedback Toast */}
        {copyFeedback && (
          <div
            data-testid="copy-feedback-toast"
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium text-center animate-fadeIn"
          >
            ✓ {copyFeedback}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 max-h-[55vh]">
          {filteredChunks.length === 0 ? (
            <div
              data-testid="notebook-empty-state"
              className="flex flex-col items-center justify-center py-12 text-center text-zinc-500"
            >
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm font-medium text-zinc-400">目前沒有標記任何聽力盲點語塊</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                在聽力練習中，語音朗讀完成後點選下方語塊即可標記盲點，後續可在此統一複習與匯出。
              </p>
            </div>
          ) : (
            filteredChunks.map((item) => (
              <div
                key={item.id}
                data-testid={`notebook-item-${item.id}`}
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col gap-2 relative group"
              >
                {/* Top: Chunk & Topic Tag */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      {item.chunkText}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                      {getTopicTitle(item.trainingId)}
                    </span>
                  </div>
                  {onRemoveChunk && (
                    <button
                      type="button"
                      data-testid={`remove-marked-chunk-${item.id}`}
                      onClick={() => onRemoveChunk(item.id)}
                      title="移除此盲點語塊"
                      className="text-zinc-500 hover:text-rose-400 transition-colors text-xs p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                      aria-label="Remove chunk"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sentence */}
                <p className="text-xs sm:text-sm text-zinc-200 font-serif leading-relaxed">
                  {item.sentence}
                </p>

                {/* Translation */}
                {item.translation && (
                  <p className="text-xs text-zinc-400 border-t border-zinc-800/60 pt-1.5 mt-0.5 font-sans">
                    {item.translation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
