import React, { useState, useRef } from 'react';
import { ModalShell } from './ModalShell';
import type { Question } from '../../types/chunkflow';
import { validateQuestionsJson } from '../../utils/storage';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  isCustomBank: boolean;
  onImportQuestions: (questions: Question[], mode: 'append' | 'replace') => void;
  onResetToDefaults: () => void;
}

export const TOEIC_AI_PROMPT_TEMPLATE = `You are an expert English linguist and TOEIC Part 5 syntactic chunking assistant.

Your task is to take the following raw TOEIC Part 5 grammar error questions (questions with blanks, 4 multiple-choice options, and correct answers/explanations) and convert them into a structured JSON array for the ChunkFlow high-speed intuition trainer.

### Formatting Requirements:
1. Each question must be segmented into natural, granular syntactic chunks ("chunks", min 4-8 chunks per sentence). Do not clump long prepositional phrases, appositives, or participle clauses together with the subject or object.
2. Insert the correct answer into the sentence blank so the sentence is grammatically complete.
3. Mark the primary predicate verb chunk with \`"isTargetSlot": true\` and \`"type": "verb"\`. All other chunks must have \`"isTargetSlot": false\`.
4. Identify the grammatical head subject chunk and mark it with \`"type": "subject"\`. Prepositional modifiers, appositives, and participle clauses following the head subject must be separated into their own distinct chunks (\`"type": "clause"\`).
5. Specify \`"targetSlotIndex"\` (0-indexed position of the target verb chunk in the \`chunks\` array).
6. Specify \`"correctAnswers"\`:
   - \`"voice"\`: \`"active"\` or \`"passive"\`
   - \`"time"\`: \`"present"\`, \`"past"\`, or \`"future"\`
   - \`"aspect"\` (optional): \`"simple"\`, \`"continuous"\`, or \`"perfect"\`
7. Provide a fluent Traditional Chinese full-sentence translation in \`"translation"\`.
8. Provide a concise \`"grammarNote"\` in Traditional Chinese explaining the voice, tense clue (e.g., time adverbs, by-phrase), and key reasoning.
9. Output ONLY a valid JSON array matching the schema below.

### Output Schema:
\`\`\`json
[
  {
    "id": "toeic-custom-001",
    "sentence": "The dedicated committee for workplace safety is currently reviewing employee incident reports.",
    "translation": "致力於職場安全的工作委員會目前正在審核員工意外事件報告。",
    "chunks": [
      { "text": "The dedicated committee", "isTargetSlot": false, "type": "subject" },
      { "text": "for workplace safety", "isTargetSlot": false, "type": "clause" },
      { "text": "is currently reviewing", "isTargetSlot": true, "type": "verb" },
      { "text": "employee incident reports.", "isTargetSlot": false, "type": "object" }
    ],
    "targetSlotIndex": 2,
    "correctAnswers": {
      "voice": "active",
      "time": "present",
      "aspect": "continuous"
    },
    "grammarNote": "現在進行式主動語態 (is + V-ing)。主詞 committee 為委員會主動審核報告。"
  }
]
\`\`\`

### Example:
Input:
"The quarterly performance review ______ by senior management before next Friday's executive briefing.
(A) conducts (B) was conducted (C) will be conducted (D) has conducted
Answer: (C)
Explanation: Future passive needed due to 'next Friday' and passive receiver subject."

Output:
[
  {
    "id": "toeic-custom-001",
    "sentence": "The quarterly performance review will be conducted by senior management before next Friday's executive briefing.",
    "translation": "資深管理階層將於下週五的高階匯報前主持季度績效考核。",
    "chunks": [
      { "text": "The quarterly performance review", "isTargetSlot": false, "type": "subject" },
      { "text": "will be conducted", "isTargetSlot": true, "type": "verb" },
      { "text": "by senior management", "isTargetSlot": false, "type": "clause" },
      { "text": "before next Friday's executive briefing.", "isTargetSlot": false, "type": "clause" }
    ],
    "targetSlotIndex": 1,
    "correctAnswers": {
      "voice": "passive",
      "time": "future",
      "aspect": "simple"
    },
    "grammarNote": "未來被動語態 (will be + p.p.)。主詞 review 為被執行對象，搭配時間副詞 next Friday。"
  }
]

### Raw TOEIC Part 5 Questions to Convert:
[PASTE YOUR TOEIC PART 5 QUESTIONS AND CHOICES HERE]`;

export const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  totalQuestions,
  isCustomBank,
  onImportQuestions,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'prompt'>('import');
  const [jsonText, setJsonText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    setCopyError(null);
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyError(
        'Clipboard unavailable in this browser context (e.g. non-HTTPS). Please copy manually from the box below.'
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(TOEIC_AI_PROMPT_TEMPLATE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      setCopyError(
        'Clipboard unavailable in this browser context. Please copy manually from the box below.'
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setJsonText(content);
        setErrors([]);
        setSuccessMessage(null);
      }
    };
    reader.readAsText(file);
    // Reset file input so re-selecting same file works
    e.target.value = '';
  };

  const handleExecuteImport = () => {
    setErrors([]);
    setSuccessMessage(null);

    const validation = validateQuestionsJson(jsonText);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onImportQuestions(validation.questions, importMode);
    setSuccessMessage(
      `Successfully ${importMode === 'append' ? 'appended' : 'loaded'} ${validation.questions.length} question(s) into the arena!`
    );
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          <span className="text-cyan-400">Custom</span> Questions
        </>
      }
      subtitle="Import personal TOEIC Part 5 mistakes or copy the prompt for AI conversion."
      maxWidthClass="max-w-2xl"
      closeAriaLabel="Close modal"
      headerBottom={
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            1. Import JSON
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'prompt'
                ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span>2. AI Prompt Helper</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
              TOEIC Part 5
            </span>
          </button>
        </div>
      }
    >
      {/* Tab 1: Import JSON */}
      {activeTab === 'import' && (
        <div className="flex flex-col gap-5">
          {/* Question Bank Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-zinc-400">Current Question Pool:</span>
              <strong className="text-zinc-100">{totalQuestions} questions</strong>
              {isCustomBank && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Custom Bank Active
                </span>
              )}
            </div>

            {isCustomBank && (
              <button
                onClick={onResetToDefaults}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-300 border border-zinc-700 hover:border-rose-500/50 text-zinc-300 transition-colors cursor-pointer"
              >
                Restore Default Questions
              </button>
            )}
          </div>

          {/* Paste or Upload Area */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-zinc-300 font-semibold">
                Paste JSON Array or Object:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-cyan-300 border border-zinc-700 hover:border-cyan-500/50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload .json File
                </button>
              </div>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setErrors([]);
              }}
              rows={9}
              placeholder={`[\n  {\n    "sentence": "The strategic distribution contract between the two pharmaceutical companies had been signed before the press conference began.",\n    "translation": "兩家製藥公司之間的策略經銷合約在記者會開始前便已簽署完成。",\n    "chunks": [\n      { "text": "The strategic distribution contract", "isTargetSlot": false, "type": "subject" },\n      { "text": "between the two", "isTargetSlot": false, "type": "clause" },\n      { "text": "pharmaceutical companies", "isTargetSlot": false, "type": "clause" },\n      { "text": "had been signed", "isTargetSlot": true, "type": "verb" },\n      { "text": "before the press conference began.", "isTargetSlot": false, "type": "clause" }\n    ],\n    "targetSlotIndex": 3,\n    "correctAnswers": { "voice": "passive", "time": "past" },\n    "grammarNote": "過去完成被動語態 (had been + p.p.)。"\n  }\n]`}
              className="w-full p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-y"
            />
          </div>

          {/* Validation Feedback */}
          {errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 flex flex-col gap-1.5 text-xs font-mono text-rose-300">
              <span className="font-bold flex items-center gap-1.5">
                <span>⚠</span> Validation Errors ({errors.length}):
              </span>
              <ul className="list-disc list-inside space-y-1 text-rose-200/90">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono text-emerald-300 font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Import Mode Radio Options & Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-zinc-900">
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="accent-cyan-400"
                />
                <span>Append to bank</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="accent-cyan-400"
                />
                <span>Replace entire bank</span>
              </label>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold tracking-wide shadow-md hover:shadow-cyan-500/25 transition-all cursor-pointer"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Prompt Helper */}
      {activeTab === 'prompt' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed flex flex-col gap-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="text-cyan-400">💡</span> How to use with ChatGPT / Claude / Gemini:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>
                Click <strong className="text-zinc-200">"Copy AI Prompt"</strong> below.
              </li>
              <li>Open your AI tool (ChatGPT, Claude, Gemini, etc.) and paste the prompt.</li>
              <li>
                Paste your raw TOEIC Part 5 mistake questions into the designated section at the
                bottom.
              </li>
              <li>
                Copy the generated JSON array and paste it into the{' '}
                <strong className="text-cyan-300">"Import JSON"</strong> tab!
              </li>
            </ol>
          </div>

          {/* Copy Error Notice (e.g. non-secure HTTP context) */}
          {copyError && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-xs font-mono text-amber-200 flex items-center gap-2">
              <span>⚠</span>
              <span>{copyError}</span>
            </div>
          )}

          {/* Prompt Preview & Copy Button */}
          <div className="relative rounded-xl border border-zinc-800 bg-black/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 text-xs font-mono text-zinc-400">
              <span>Standardized TOEIC Part 5 Prompt Template</span>
              <button
                onClick={handleCopyPrompt}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-sm'
                }`}
              >
                {isCopied ? (
                  <>
                    <span>✓</span>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      />
                    </svg>
                    <span>Copy AI Prompt</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 text-[11px] font-mono text-zinc-300 leading-relaxed overflow-x-auto max-h-72 select-all">
              {TOEIC_AI_PROMPT_TEMPLATE}
            </pre>
          </div>
        </div>
      )}
    </ModalShell>
  );
};
