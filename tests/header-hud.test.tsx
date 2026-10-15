import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderHUD } from '../app/components/chunkflow/HeaderHUD';

describe('HeaderHUD - Leftmost Hamburger Matrix Drawer Toggle', () => {
  it('renders the hamburger toggle button at the far left preceding brand logo when drawer is closed', () => {
    const onToggleMatrix = vi.fn();
    const { container } = render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        showMatrix={false}
        onToggleMatrix={onToggleMatrix}
      />
    );

    const toggleBtn = screen.getByTestId('matrix-drawer-toggle');
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn.className).toContain('flex');
    expect(toggleBtn.getAttribute('aria-label')).toBe('開啟訓練矩陣');
    expect(toggleBtn.getAttribute('title')).toBe('顯示訓練矩陣');

    // Verify it is positioned before the brand logo in the left container
    const leftContainer = toggleBtn.parentElement;
    expect(leftContainer).toBeDefined();
    expect(leftContainer?.children[0]).toBe(toggleBtn);
    expect(leftContainer?.textContent).toContain('CF');
  });

  it('hides the hamburger toggle button when drawer is open (showMatrix=true)', () => {
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        showMatrix={true}
        onToggleMatrix={vi.fn()}
      />
    );

    const toggleBtn = screen.getByTestId('matrix-drawer-toggle');
    expect(toggleBtn.className).toContain('hidden');
  });

  it('triggers onToggleMatrix when clicked', () => {
    const onToggleMatrix = vi.fn();
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        showMatrix={false}
        onToggleMatrix={onToggleMatrix}
      />
    );

    const toggleBtn = screen.getByTestId('matrix-drawer-toggle');
    expect(toggleBtn.getAttribute('title')).toBe('顯示訓練矩陣');
    fireEvent.click(toggleBtn);
    expect(onToggleMatrix).toHaveBeenCalledTimes(1);
  });

  it('supports legacy toggle-matrix-btn testid as child', () => {
    const onToggleMatrix = vi.fn();
    render(
      <HeaderHUD
        practiceMode="smart"
        onTogglePracticeMode={vi.fn()}
        onOpenAnalytics={vi.fn()}
        onOpenSettings={vi.fn()}
        showMatrix={false}
        onToggleMatrix={onToggleMatrix}
      />
    );

    const legacyBtn = screen.getByTestId('toggle-matrix-btn');
    fireEvent.click(legacyBtn);
    expect(onToggleMatrix).toHaveBeenCalledTimes(1);
  });
});
