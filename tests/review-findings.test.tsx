import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HeaderHUD } from '../app/components/chunkflow/HeaderHUD';
import { ImportQuestionsModal } from '../app/components/chunkflow/ImportQuestionsModal';
import { useKeyboardShortcuts } from '../app/hooks/useKeyboardShortcuts';

function ShortcutTestHost({ isModalOpen }: { isModalOpen: boolean }) {
  const [voice, setVoice] = React.useState<string | null>(null);

  // This replicates what Home should do: disable when modal is open
  useKeyboardShortcuts({
    onSelectVoice: (v) => setVoice(v),
    onSelectTime: vi.fn(),
    disabled: isModalOpen,
  });

  return (
    <div>
      <div data-testid="voice">{voice}</div>
      {isModalOpen && <div data-testid="modal">Modal Content</div>}
    </div>
  );
}

import Home from '../app/routes/home';

describe('Review Findings Verification (RED phase before fix)', () => {
  describe('Finding 1: Keyboard shortcuts must be disabled when modals are open in Home', () => {
    it('disables shortcuts in Home when a modal is open', async () => {
      render(<Home />);

      // Open settings modal
      const settingsBtn = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsBtn);

      // Verify settings modal is open
      expect(screen.getByRole('heading', { name: /Arena Settings/i })).toBeDefined();

      // Press hotkey '1' (Present)
      fireEvent.keyDown(window, { key: '1', code: 'Digit1' });

      // In ActionBar, the button for 'Present' should NOT be selected (checked / active)
      // If shortcuts were NOT disabled, it would have selected 'present'
      const presentBtn = screen.getByRole('button', { name: /Present/i });
      // When not selected, its className does not have the active highlight ring/bg
      expect(presentBtn.className).not.toContain('bg-cyan-500');
    });
  });

  describe('Finding 3: HeaderHUD Import button aria-label', () => {
    it('provides an explicit aria-label for accessibility when text is hidden on mobile', () => {
      render(
        <HeaderHUD
          practiceMode="smart"
          onTogglePracticeMode={vi.fn()}
          onOpenAnalytics={vi.fn()}
          onOpenSettings={vi.fn()}
          onOpenImport={vi.fn()}
        />
      );

      const importButton = screen.getByRole('button', { name: /import custom questions/i });
      expect(importButton).toBeDefined();
      expect(importButton.getAttribute('aria-label')).toBe('Import custom questions');
    });
  });

  describe('Finding 2: Clipboard fallback in non-secure HTTP contexts', () => {
    const originalClipboard = navigator.clipboard;

    beforeEach(() => {
      // Simulate non-secure context (e.g. mobile LAN HTTP where navigator.clipboard is undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });

    it('handles missing clipboard gracefully and informs the user or provides fallback', async () => {
      render(
        <ImportQuestionsModal
          isOpen={true}
          onClose={vi.fn()}
          totalQuestions={10}
          isCustomBank={false}
          onImportQuestions={vi.fn()}
          onResetToDefaults={vi.fn()}
        />
      );

      // Switch to Tab 2: AI Prompt Helper
      const tab2Button = screen.getByText(/AI Prompt Helper/i);
      fireEvent.click(tab2Button);

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy ai prompt/i });
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // It should display a notice/fallback prompting user to select or copy manually
      expect(
        screen.getByText(/Clipboard unavailable in this browser context|Please copy manually/i)
      ).toBeDefined();
    });
  });
});
