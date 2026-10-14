import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { loadSubjectVerbDrill, saveSubjectVerbDrill } from '../app/utils/storage';

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
  });

  describe('Sequential Stage Chaining in useChunkFlowGame', () => {
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

    it('initializes roundStage directly to "classify" when isSubjectVerbDrill is false', async () => {
      const { renderHook } = await import('@testing-library/react');
      const { useChunkFlowGame } = await import('../app/hooks/useChunkFlowGame');

      saveSubjectVerbDrill(false);
      const { result } = renderHook(() => useChunkFlowGame());

      expect(result.current.isSubjectVerbDrill).toBe(false);
      expect(result.current.roundStage).toBe('classify');
    });
  });

  describe('UI Component Integration', () => {
    it('renders S+V Drill toggle in HeaderHUD and responds to clicks', async () => {
      const { render, screen, fireEvent } = await import('@testing-library/react');
      const { HeaderHUD } = await import('../app/components/chunkflow/HeaderHUD');
      const onToggle = vi.fn();

      render(
        <HeaderHUD
          practiceMode="smart"
          onTogglePracticeMode={vi.fn()}
          isSubjectVerbDrill={true}
          onToggleSubjectVerbDrill={onToggle}
          onOpenAnalytics={vi.fn()}
          onOpenSettings={vi.fn()}
        />
      );

      const toggleBtn = screen.getByRole('button', { name: /toggle subject-verb drill mode/i });
      expect(toggleBtn).toBeDefined();
      expect(toggleBtn.textContent).toContain('S+V Drill');

      fireEvent.click(toggleBtn);
      expect(onToggle).toHaveBeenCalledTimes(1);
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
      // Subject should show locked [S] badge
      expect(screen.getByText('S')).toBeDefined();

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
  });
});
