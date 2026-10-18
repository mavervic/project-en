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
import { ListeningNotebookModal } from '../components/chunkflow/ListeningNotebookModal';
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
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
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
    enableNarration,
    accent,
    setAccent,
    speak,
    speakListeningSequence,
    isSpeaking,
    canSelectAccents,
    voices,
    selectedVoiceURI,
    setVoiceURI,
    hasChineseVoice,
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
    blindModeEnabled,
    roundStage,
    subjectMisfireIndex,
    activeBankId,
    activeTrainingId,
    isListeningMode,
    markedChunkIndices,
    markedChunks,
    markedChunksCountMap,
    handleToggleMarkChunk,
    handleRemoveMarkedChunk,
    handleClearMarkedChunks,
    handleListeningNarrationComplete,
    setPracticeMode,
    toggleBlindMode,
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

  const handleToggleBlindMode = () => {
    const nextBlind = toggleBlindMode();
    if (nextBlind) {
      if (!narrationEnabled) {
        enableNarration();
      } else if (currentQuestion?.sentence) {
        speak(currentQuestion.sentence, { force: true });
      }
    }
  };

  const handleUpdateSettings = (newSettings: Partial<ChunkFlowSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  };

  // Auto-play sentence narration on new question when enabled
  useEffect(() => {
    if (!currentQuestion?.sentence) return;
    if (isListeningMode) {
      speakListeningSequence(currentQuestion.sentence, currentQuestion.translation, {
        force: true,
        mode: settings.listeningNarrationMode,
        pauseIntervalMs: settings.listeningPauseIntervalMs,
        rate: settings.listeningSpeechRate,
        onComplete: handleListeningNarrationComplete,
      });
    } else if (narrationEnabled) {
      speak(currentQuestion.sentence);
    }
  }, [
    currentQuestion?.id,
    isListeningMode,
    narrationEnabled,
    speak,
    speakListeningSequence,
    handleListeningNarrationComplete,
    settings.listeningNarrationMode,
    settings.listeningPauseIntervalMs,
    settings.listeningSpeechRate,
  ]);

  const isAnyModalOpen = isAnalyticsOpen || isSettingsOpen || isImportOpen || isNotebookOpen;

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
          markedChunksCountMap={markedChunksCountMap}
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
        onOpenNotebook={() => setIsNotebookOpen(true)}
        markedChunksCount={markedChunks.length}
        narrationEnabled={narrationEnabled}
        accent={accent}
        onSelectAccent={setAccent}
        canSelectAccents={canSelectAccents}
        showMatrix={isDrawerOpen && canOpenDrawer}
        onToggleMatrix={canOpenDrawer ? () => setIsDrawerOpen((prev) => !prev) : undefined}
      />

      {/* Main Training Arena */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 md:px-8 py-6 md:py-12 max-w-5xl mx-auto w-full gap-6 md:gap-8">
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
          onPlayAudio={() => {
            if (isListeningMode) {
              speakListeningSequence(currentQuestion.sentence, currentQuestion.translation, {
                force: true,
                mode: settings.listeningNarrationMode,
                pauseIntervalMs: settings.listeningPauseIntervalMs,
                rate: settings.listeningSpeechRate,
                onComplete: handleListeningNarrationComplete,
              });
            } else {
              speak(currentQuestion.sentence, { force: true });
            }
          }}
          isSpeaking={isSpeaking}
          narrationEnabled={narrationEnabled}
          onToggleNarration={toggleNarration}
          blindModeEnabled={blindModeEnabled}
          onToggleBlindMode={handleToggleBlindMode}
          onSpeakChunk={(text) => speak(text, { force: true })}
          isListeningMode={isListeningMode}
        />

        {/* Action Controls & Hotkey Buttons */}
        <ActionBar
          selectedVoice={selectedVoice}
          selectedTime={selectedTime}
          onSelectVoice={handleSelectVoice}
          onSelectTime={handleSelectTime}
          disabled={
            !isListeningMode && (showFeedback || (isSubjectVerbDrill && roundStage !== 'classify'))
          }
          isListeningMode={isListeningMode}
          chunks={currentQuestion?.chunks}
          markedChunkIndices={markedChunkIndices}
          onToggleMarkChunk={handleToggleMarkChunk}
          isNarrationPlaying={isSpeaking && !showFeedback}
          onNextQuestion={advanceToNextQuestion}
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
        accent={accent}
        onSelectAccent={setAccent}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        onSelectVoiceURI={setVoiceURI}
        hasChineseVoice={hasChineseVoice}
        onPreviewVoice={speak}
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

      {/* Listening Notebook Modal */}
      <ListeningNotebookModal
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        markedChunks={markedChunks}
        onRemoveChunk={handleRemoveMarkedChunk}
        onClearAll={handleClearMarkedChunks}
      />
    </div>
  );
}
