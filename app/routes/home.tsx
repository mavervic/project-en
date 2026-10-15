import { useState, useEffect } from 'react';
import type { Route } from './+types/home';
import { useChunkFlowGame } from '../hooks/useChunkFlowGame';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSpeechNarration } from '../hooks/useSpeechNarration';
import { HeaderHUD } from '../components/chunkflow/HeaderHUD';
import { ChunkFlowArena } from '../components/chunkflow/ChunkFlowArena';
import { ActionBar } from '../components/chunkflow/ActionBar';
import { AnalyticsDashboard } from '../components/chunkflow/AnalyticsDashboard';
import { SettingsModal } from '../components/chunkflow/SettingsModal';
import { ImportQuestionsModal } from '../components/chunkflow/ImportQuestionsModal';
import { TrainingMatrix } from '../components/chunkflow/TrainingMatrix';
import { TrainingMatrixDrawer } from '../components/chunkflow/TrainingMatrixDrawer';
import { getRegisteredBanks } from '../data/banks';
import { loadSettings, saveSettings } from '../utils/storage';
import type { ChunkFlowSettings } from '../types/chunkflow';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'ChunkFlow — Syntactic Chunking & Grammar Intuition Arena' },
    {
      name: 'description',
      content:
        'Train your English grammatical intuition at high speed. Keyboard-first syntactic chunk parsing with progressive visual focus cues and weakness analytics.',
    },
  ];
}

export default function Home() {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [settings, setSettings] = useState<ChunkFlowSettings>(() => loadSettings());

  const {
    narrationEnabled,
    toggleNarration,
    accent,
    setAccent,
    speak,
    isSpeaking,
    canSelectAccents,
  } = useSpeechNarration();

  const registeredBanks = getRegisteredBanks();

  const {
    questions,
    currentQuestion,
    selectedVoice,
    selectedTime,
    lastEvaluation,
    showFeedback,
    focusState,
    progressPercent,
    stats,
    categoryStats,
    trainingTelemetry,
    history,
    practiceMode,
    isCustomBank,
    isSubjectVerbDrill,
    roundStage,
    subjectMisfireIndex,
    activeBankId,
    activeTrainingId,
    setPracticeMode,
    handleSelectBank,
    handleSelectTraining,
    handleSelectSubjectChunk,
    handleSelectVoice,
    handleSelectTime,
    advanceToNextQuestion,
    handleResetHistory,
    handleImportQuestions,
    handleResetQuestions,
  } = useChunkFlowGame();

  const handleUpdateSettings = (newSettings: Partial<ChunkFlowSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  };

  // Auto-play sentence narration on new question when enabled
  useEffect(() => {
    if (narrationEnabled && currentQuestion?.sentence) {
      speak(currentQuestion.sentence);
    }
  }, [currentQuestion?.id, narrationEnabled, speak]);

  const isAnyModalOpen = isAnalyticsOpen || isSettingsOpen || isImportOpen;

  useKeyboardShortcuts({
    onSelectVoice: handleSelectVoice,
    onSelectTime: handleSelectTime,
    onNextQuestion: advanceToNextQuestion,
    disabled: showFeedback || isAnyModalOpen || (isSubjectVerbDrill && roundStage !== 'classify'),
    showFeedback,
  });

  const hasTrainings = Object.keys(trainingTelemetry).length > 0;
  const canOpenDrawer = registeredBanks.length > 0 || hasTrainings;

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-[padding] duration-300 ${
        isDrawerOpen && canOpenDrawer ? 'lg:pl-72' : ''
      }`}
    >
      {/* Collapsible Left Glassmorphic Training Matrix Drawer */}
      {canOpenDrawer && (
        <TrainingMatrixDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          telemetry={trainingTelemetry}
          activeTrainingId={activeTrainingId}
          onSelectTraining={handleSelectTraining}
          banks={registeredBanks}
          activeBankId={activeBankId}
          onSelectBank={handleSelectBank}
        />
      )}

      {/* Top Navigation & Realtime HUD */}
      <HeaderHUD
        practiceMode={practiceMode}
        onTogglePracticeMode={() =>
          setPracticeMode((prev) => (prev === 'smart' ? 'random' : 'smart'))
        }
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        narrationEnabled={narrationEnabled}
        accent={accent}
        onSelectAccent={setAccent}
        canSelectAccents={canSelectAccents}
        showMatrix={isDrawerOpen && canOpenDrawer}
        onToggleMatrix={canOpenDrawer ? () => setIsDrawerOpen((prev) => !prev) : undefined}
      />

      {/* Main Training Arena */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 md:px-8 py-6 md:py-12 max-w-5xl mx-auto w-full gap-6 md:gap-8">
        {settings.showGuidance && (
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-zinc-900 border border-zinc-800 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              FOCUS STATE:{' '}
              <span className="uppercase text-cyan-300 font-semibold">{focusState}</span>
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {isSubjectVerbDrill && roundStage === 'subject'
                ? 'Identify the Grammatical Subject'
                : isSubjectVerbDrill && roundStage === 'verb'
                  ? 'Identify the Grammatical Verb'
                  : 'Identify the Grammatical Slot'}
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 max-w-lg mx-auto">
              {isSubjectVerbDrill && roundStage === 'subject' ? (
                <>
                  Click or tap the <strong className="text-sky-300">Subject chunk</strong> of the
                  sentence to lock it before finding the verb.
                </>
              ) : isSubjectVerbDrill && roundStage === 'verb' ? (
                <>
                  Click or tap the <strong className="text-cyan-300">Verb chunk</strong> of the
                  sentence to lock it before classifying voice and tense.
                </>
              ) : (
                <>
                  Classify the highlighted chunk’s <strong className="text-zinc-200">Voice</strong>{' '}
                  (Active/Passive) and <strong className="text-zinc-200">Tense</strong>{' '}
                  (Present/Past/Future) before the background completely darkens.
                </>
              )}
            </p>
          </div>
        )}

        {/* Central Sentence Arena */}
        <ChunkFlowArena
          question={currentQuestion}
          focusState={focusState}
          progressPercent={progressPercent}
          lastEvaluation={lastEvaluation}
          showFeedback={showFeedback}
          onNextQuestion={advanceToNextQuestion}
          stats={stats}
          roundStage={roundStage}
          isSubjectVerbDrill={isSubjectVerbDrill}
          onSelectChunk={handleSelectSubjectChunk}
          chunkMisfireIndex={subjectMisfireIndex}
          onPlayAudio={() => speak(currentQuestion.sentence, { force: true })}
          isSpeaking={isSpeaking}
          narrationEnabled={narrationEnabled}
          onToggleNarration={toggleNarration}
        />

        {/* Action Controls & Hotkey Buttons */}
        <ActionBar
          selectedVoice={selectedVoice}
          selectedTime={selectedTime}
          onSelectVoice={handleSelectVoice}
          onSelectTime={handleSelectTime}
          disabled={showFeedback || (isSubjectVerbDrill && roundStage !== 'classify')}
          showGuidance={settings.showGuidance}
        />

        {/* Keyboard Shortcut Guidance Bar (desktop only) */}
        {settings.showGuidance && (
          <div className="w-full max-w-4xl hidden md:flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 rounded-xl bg-zinc-900/30 border border-zinc-900 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold">
                A / J
              </kbd>{' '}
              Active
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold">
                P / K
              </kbd>{' '}
              Passive
            </span>
            <span className="text-zinc-700">|</span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold">
                1
              </kbd>{' '}
              Present
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold">
                2
              </kbd>{' '}
              Past
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold">
                3
              </kbd>{' '}
              Future
            </span>
            <span className="text-zinc-700">|</span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold">
                Space / Enter
              </kbd>{' '}
              Next
            </span>
          </div>
        )}
      </main>

      {/* Analytics Modal Drawer */}
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        stats={stats}
        categoryStats={categoryStats}
        history={history}
        practiceMode={practiceMode}
        onTogglePracticeMode={() =>
          setPracticeMode((prev) => (prev === 'smart' ? 'random' : 'smart'))
        }
        onResetData={handleResetHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Import Custom Questions Modal */}
      <ImportQuestionsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        totalQuestions={questions.length}
        isCustomBank={isCustomBank}
        onImportQuestions={handleImportQuestions}
        onResetToDefaults={handleResetQuestions}
      />
    </div>
  );
}
