import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalShell } from '../app/components/chunkflow/ModalShell';
import { SettingsModal } from '../app/components/chunkflow/SettingsModal';
import { AnalyticsDashboard } from '../app/components/chunkflow/AnalyticsDashboard';
import { ImportQuestionsModal } from '../app/components/chunkflow/ImportQuestionsModal';
import { ListeningNotebookModal } from '../app/components/chunkflow/ListeningNotebookModal';

describe('ModalShell - Responsive Viewport Clamping and Sticky Header Dismissal', () => {
  it('renders pinned sticky header, scrollable body, and optional footer with proper layout classes', () => {
    const onClose = vi.fn();
    render(
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title="Test Modal Title"
        subtitle="Test Subtitle"
        icon={<span>🧪</span>}
        footer={<button type="button">Done</button>}
        testId="test-modal"
      >
        <div style={{ height: '1000px' }}>Long Body Content</div>
      </ModalShell>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    // Clamped viewport classes
    expect(dialog.className).toContain('max-h-[calc(100dvh-1.5rem)]');
    expect(dialog.className).toContain('sm:max-h-[90vh]');
    expect(dialog.className).toContain('flex-col');
    expect(dialog.className).toContain('min-h-0');

    // Pinned header classes
    const header = screen.getByTestId('modal-shell-header');
    expect(header.className).toContain('shrink-0');
    expect(screen.getByText('Test Modal Title')).not.toBeNull();
    expect(screen.getByText('Test Subtitle')).not.toBeNull();

    // Scrollable body classes
    const body = screen.getByTestId('modal-shell-body');
    expect(body.className).toContain('flex-1');
    expect(body.className).toContain('min-h-0');
    expect(body.className).toContain('overflow-y-auto');

    // Pinned footer classes
    const footer = screen.getByTestId('modal-shell-footer');
    expect(footer.className).toContain('shrink-0');
    expect(screen.getByText('Done')).not.toBeNull();
  });

  it('triggers onClose when clicking the close button', () => {
    const onClose = vi.fn();
    render(
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title="Test Modal"
        closeAriaLabel="Close test modal"
      >
        <div>Content</div>
      </ModalShell>
    );

    const closeBtn = screen.getByRole('button', { name: 'Close test modal' });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when clicking the outer backdrop overlay', () => {
    const onClose = vi.fn();
    render(
      <ModalShell isOpen={true} onClose={onClose} title="Test Modal" testId="backdrop-test">
        <div>Content</div>
      </ModalShell>
    );

    const overlay = screen.getByTestId('backdrop-test-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger onClose when clicking inside the modal card', () => {
    const onClose = vi.fn();
    render(
      <ModalShell isOpen={true} onClose={onClose} title="Test Modal">
        <button type="button">Inside Button</button>
      </ModalShell>
    );

    const insideBtn = screen.getByRole('button', { name: 'Inside Button' });
    fireEvent.click(insideBtn);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('triggers onClose when pressing the Escape key', () => {
    const onClose = vi.fn();
    render(
      <ModalShell isOpen={true} onClose={onClose} title="Test Modal">
        <div>Content</div>
      </ModalShell>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when isOpen is false', () => {
    const onClose = vi.fn();
    render(
      <ModalShell isOpen={false} onClose={onClose} title="Hidden Modal">
        <div>Hidden Content</div>
      </ModalShell>
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders headerBottom slot when provided (e.g. tabs or filter bar)', () => {
    const onClose = vi.fn();
    render(
      <ModalShell
        isOpen={true}
        onClose={onClose}
        title="Tabbed Modal"
        headerBottom={<div data-testid="custom-tabs">Tab 1 | Tab 2</div>}
      >
        <div>Tab Content</div>
      </ModalShell>
    );

    const tabs = screen.getByTestId('custom-tabs');
    expect(tabs).not.toBeNull();
    const header = screen.getByTestId('modal-shell-header');
    expect(header.contains(tabs)).toBe(true);
  });
});

describe('All Application Modals Conform to Mobile Scroll and Viewport Clamping Standards', () => {
  it('SettingsModal wraps with ModalShell, provides pinned header ✕, pinned Done button, and scrollable body', () => {
    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.className).toContain('max-h-[calc(100dvh-1.5rem)]');
    expect(dialog.className).toContain('sm:max-h-[90vh]');

    const closeBtn = screen.getByRole('button', { name: 'Close settings' });
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const doneBtn = screen.getByRole('button', { name: 'Done' });
    expect(doneBtn).not.toBeNull();

    const body = screen.getByTestId('modal-shell-body');
    expect(body.className).toContain('overflow-y-auto');
  });

  it('AnalyticsDashboard wraps with ModalShell, provides pinned header ✕, and pinned footer action buttons', () => {
    const onClose = vi.fn();
    const mockStats = {
      totalAttempts: 10,
      correctAttempts: 9,
      accuracy: 90,
      avgLatencyMs: 1200,
      chunksPerMin: 45,
      currentStreak: 5,
      bestStreak: 12,
      recent: {
        sampleSize: 10,
        accuracy: 90,
        avgLatencyMs: 1200,
        totalAttempts: 10,
        correctAttempts: 9,
        chunksPerMin: 45,
      },
    };

    render(
      <AnalyticsDashboard
        isOpen={true}
        onClose={onClose}
        stats={mockStats}
        categoryStats={{}}
        history={[]}
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onResetData={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.className).toContain('max-h-[calc(100dvh-1.5rem)]');

    const closeBtn = screen.getByRole('button', { name: 'Close analytics' });
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const footer = screen.getByTestId('modal-shell-footer');
    expect(footer).not.toBeNull();
  });

  it('ImportQuestionsModal wraps with ModalShell, pins tabs in headerBottom, and keeps ✕ visible during prompt scrolling', () => {
    const onClose = vi.fn();
    render(
      <ImportQuestionsModal
        isOpen={true}
        onClose={onClose}
        totalQuestions={50}
        isCustomBank={false}
        onImportQuestions={vi.fn()}
        onResetToDefaults={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.className).toContain('max-h-[calc(100dvh-1.5rem)]');

    const closeBtn = screen.getByRole('button', { name: 'Close modal' });
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Switch to AI Prompt tab
    const promptTabBtn = screen.getByRole('button', { name: /2\. AI Prompt Helper/i });
    fireEvent.click(promptTabBtn);

    // Close button remains in the pinned header
    expect(screen.getByRole('button', { name: 'Close modal' })).not.toBeNull();
  });

  it('ListeningNotebookModal wraps with ModalShell and preserves close button and body scrollability', () => {
    const onClose = vi.fn();
    render(
      <ListeningNotebookModal
        isOpen={true}
        onClose={onClose}
        markedChunks={[
          {
            id: 'm1',
            questionId: 'q1',
            trainingId: 'unit-1',
            chunkText: 'contract was signed',
            chunkIndex: 1,
            sentence: 'The contract was signed yesterday.',
            timestamp: 1000,
          },
        ]}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.className).toContain('max-h-[calc(100dvh-1.5rem)]');

    const closeBtn = screen.getByTestId('close-notebook-btn');
    expect(closeBtn).not.toBeNull();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const body = screen.getByTestId('modal-shell-body');
    expect(body.className).toContain('overflow-y-auto');
  });
});
