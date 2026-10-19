import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import {
  loadBlindModeEnabled,
  loadSubjectVerbDrill,
  saveActiveBankId,
  saveBlindModeEnabled,
  saveSubjectVerbDrill,
} from '../app/utils/storage';

describe('Subject-Verb Drill Mode Settings Specification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Storage persistence', () => {
    it('defaults to true (enabled) when no preference is stored', () => {
      const mode = loadSubjectVerbDrill();
      expect(mode).toBe(true);
    });

    it('persists and retrieves boolean settings accurately', () => {
      saveSubjectVerbDrill(false);
      expect(loadSubjectVerbDrill()).toBe(false);

      saveSubjectVerbDrill(true);
      expect(loadSubjectVerbDrill()).toBe(true);
    });

    it('defaults blindModeEnabled to false and persists boolean settings under chunkflow_blind_mode_v1', () => {
      expect(loadBlindModeEnabled()).toBe(false);

      saveBlindModeEnabled(true);
      expect(window.localStorage.getItem('chunkflow_blind_mode_v1')).toBe('true');
      expect(loadBlindModeEnabled()).toBe(true);

      saveBlindModeEnabled(false);
      expect(window.localStorage.getItem('chunkflow_blind_mode_v1')).toBe('false');
      expect(loadBlindModeEnabled()).toBe(false);
    });
  });

  describe('Sequential Stage Chaining in useChunkFlowGame', () => {
    beforeEach(() => {
      saveActiveBankId('toeic-part5');
    });

    it('progresses from subject -> verb -> classify when isSubjectVerbDrill is true', async () => {
      const { renderHook, act } = await import('@testing-library/react');
      const { useChunkFlowGame } = await import('../app/hooks/useChunkFlowGame');

      saveSubjectVerbDrill(true);
      const { result } = renderHook(() => useChunkFlowGame());

      expect(result.current.isSubjectVerbDrill).toBe(true);
      expect(result.current.roundStage).toBe('subject');

      const subjectIndex = result.current.currentQuestion.chunks.findIndex(
        (c) => c.type === 'subject'
      );
      const verbIndex = result.current.currentQuestion.chunks.findIndex(
        (c) => c.type === 'verb' || c.isTargetSlot
      );
      const wrongIndex = result.current.currentQuestion.chunks.findIndex(
        (c) => c.type !== 'subject' && c.type !== 'verb' && !c.isTargetSlot
      );

      // Attempting wrong chunk in subject stage does not advance
      act(() => {
        result.current.handleSelectChunk(wrongIndex !== -1 ? wrongIndex : verbIndex);
      });
      expect(result.current.roundStage).toBe('subject');

      // Selecting correct subject advances to 'verb'
      act(() => {
        result.current.handleSelectChunk(subjectIndex);
      });
      expect(result.current.roundStage).toBe('verb');

      // Attempting non-verb chunk in verb stage does not advance
      act(() => {
        result.current.handleSelectChunk(wrongIndex !== -1 ? wrongIndex : subjectIndex);
      });
      expect(result.current.roundStage).toBe('verb');

      // Selecting correct verb advances to 'classify'
      act(() => {
        result.current.handleSelectChunk(verbIndex);
      });
      expect(result.current.roundStage).toBe('classify');
    });

    it('always enforces roundStage "subject" on questions containing a subject chunk', async () => {
      const { renderHook } = await import('@testing-library/react');
      const { useChunkFlowGame } = await import('../app/hooks/useChunkFlowGame');

      const { result } = renderHook(() => useChunkFlowGame());

      expect(result.current.isSubjectVerbDrill).toBe(true);
      expect(result.current.roundStage).toBe('subject');
    });
  });

  describe('UI Component Integration', () => {
    it('does not render S+V Drill toggle in HeaderHUD', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { HeaderHUD } = await import('../app/components/chunkflow/HeaderHUD');

      render(
        <HeaderHUD
          practiceMode="smart"
          onTogglePracticeMode={vi.fn()}
          onOpenAnalytics={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      const toggleBtn = screen.queryByRole('button', { name: /toggle subject-verb drill mode/i });
      expect(toggleBtn).toBeNull();
    });

    it('renders interactive subject chunks in ChunkFlowArena during subject stage', async () => {
      const { render, screen, fireEvent } = await import('@testing-library/react');
      const { ChunkFlowArena } = await import('../app/components/chunkflow/ChunkFlowArena');
      const onSelect = vi.fn();

      const sampleQuestion = {
        id: 'test-1',
        sentence: 'The committee approved the budget.',
        chunks: [
          { text: 'The committee', isTargetSlot: false, type: 'subject' as const },
          { text: 'approved', isTargetSlot: true, type: 'verb' as const },
          { text: 'the budget.', isTargetSlot: false },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active' as const, time: 'past' as const },
        grammarNote: 'Test note',
      };

      render(
        <ChunkFlowArena
          question={sampleQuestion}
          focusState="focusing"
          progressPercent={50}
          lastEvaluation={null}
          showFeedback={false}
          roundStage="subject"
          isSubjectVerbDrill={true}
          onSelectSubjectChunk={onSelect}
        />
      );

      // Verify stage watermark badge
      expect(screen.getByText(/1. Tap Subject Chunk/i)).toBeDefined();

      // Click the subject chunk
      const chunkBtn = screen.getByRole('button', { name: /select chunk: the committee/i });
      fireEvent.click(chunkBtn);
      expect(onSelect).toHaveBeenCalledWith(0);
    });

    it('renders verb stage with locked subject and clickable verb chunk in ChunkFlowArena', async () => {
      const { render, screen, fireEvent } = await import('@testing-library/react');
      const { ChunkFlowArena } = await import('../app/components/chunkflow/ChunkFlowArena');
      const onSelect = vi.fn();

      const sampleQuestion = {
        id: 'test-1',
        sentence: 'The committee approved the budget.',
        chunks: [
          { text: 'The committee', isTargetSlot: false, type: 'subject' as const },
          { text: 'approved', isTargetSlot: true, type: 'verb' as const },
          { text: 'the budget.', isTargetSlot: false },
        ],
        targetSlotIndex: 1,
        correctAnswers: { voice: 'active' as const, time: 'past' as const },
        grammarNote: 'Test note',
      };

      render(
        <ChunkFlowArena
          question={sampleQuestion}
          focusState="focusing"
          progressPercent={50}
          lastEvaluation={null}
          showFeedback={false}
          roundStage="verb"
          isSubjectVerbDrill={true}
          onSelectChunk={onSelect}
        />
      );

      // Verify stage watermark badge
      expect(screen.getByText(/2. Tap Verb Chunk/i)).toBeDefined();
      // Subject should show locked styling without inline S badge
      const subjectSpan = screen.getByText('The committee');
      expect(subjectSpan.className).toContain('border-sky-500/60');
      expect(screen.queryByText(/^S$/)).toBeNull();

      // Click the verb chunk
      const verbBtn = screen.getByRole('button', { name: /select chunk: approved/i });
      fireEvent.click(verbBtn);
      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('falls back directly to "classify" stage when an imported question lacks a subject chunk', async () => {
      const { renderHook, act } = await import('@testing-library/react');
      const { useChunkFlowGame } = await import('../app/hooks/useChunkFlowGame');

      saveSubjectVerbDrill(true);
      const { result } = renderHook(() => useChunkFlowGame());

      // Question without explicit subject chunk
      const questionWithoutSubject = {
        id: 'no-sub-1',
        sentence: 'Approved without clear subject.',
        chunks: [
          { text: 'Approved', isTargetSlot: true, type: 'verb' as const },
          { text: 'without clear subject.', isTargetSlot: false },
        ],
        targetSlotIndex: 0,
        correctAnswers: { voice: 'active' as const, time: 'past' as const },
        grammarNote: 'No subject note',
      };

      act(() => {
        result.current.handleImportQuestions([questionWithoutSubject], 'replace');
      });

      // Even though S+V drill is enabled, absence of subject chunk should gracefully fallback to classify
      expect(result.current.isSubjectVerbDrill).toBe(true);
      expect(result.current.roundStage).toBe('classify');
    });

    it('bypasses subject and verb selection (roundStage "classify") when blindModeEnabled is true and restores "subject" when toggled off', async () => {
      const { renderHook, act } = await import('@testing-library/react');
      const { useChunkFlowGame } = await import('../app/hooks/useChunkFlowGame');

      saveActiveBankId('toeic-part5');
      const { result } = renderHook(() => useChunkFlowGame());

      // Starts in 'subject' when blindModeEnabled is false
      expect(result.current.blindModeEnabled).toBe(false);
      expect(result.current.roundStage).toBe('subject');

      // Toggle blind mode ON -> jumps directly to 'classify'
      let nextBlindState = false;
      act(() => {
        nextBlindState = result.current.toggleBlindMode();
      });
      expect(nextBlindState).toBe(true);
      expect(result.current.blindModeEnabled).toBe(true);
      expect(result.current.roundStage).toBe('classify');
      expect(window.localStorage.getItem('chunkflow_blind_mode_v1')).toBe('true');

      // Advancing to next question while blindModeEnabled is true stays in 'classify'
      act(() => {
        result.current.advanceToNextQuestion();
      });
      expect(result.current.roundStage).toBe('classify');

      // Toggling blind mode OFF on an unevaluated question with subject restores 'subject'
      act(() => {
        nextBlindState = result.current.toggleBlindMode();
      });
      expect(nextBlindState).toBe(false);
      expect(result.current.blindModeEnabled).toBe(false);
      expect(result.current.roundStage).toBe('subject');

      // Answering directly in blind mode works without tapping subject/verb chunks
      act(() => {
        result.current.toggleBlindMode();
      });
      expect(result.current.roundStage).toBe('classify');
      const targetVoice = result.current.currentQuestion.correctAnswers.voice;
      const targetTime = result.current.currentQuestion.correctAnswers.time;
      act(() => {
        result.current.handleSelectVoice(targetVoice);
        result.current.handleSelectTime(targetTime);
      });
      expect(result.current.showFeedback).toBe(true);
      expect(result.current.lastEvaluation?.isCorrect).toBe(true);
    });
  });
});
