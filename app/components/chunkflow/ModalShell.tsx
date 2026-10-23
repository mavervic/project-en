import React, { useEffect, useRef } from 'react';

export interface ModalShellProps {
  isOpen?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerBottom?: React.ReactNode;
  maxWidthClass?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  testId?: string;
  closeAriaLabel?: string;
  closeBtnTestId?: string;
  disableBackdropClick?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen = true,
  onClose,
  title,
  subtitle,
  icon,
  headerBottom,
  maxWidthClass = 'max-w-2xl',
  footer,
  children,
  className = '',
  bodyClassName = '',
  testId,
  closeAriaLabel = 'Close modal',
  closeBtnTestId,
  disableBackdropClick = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableBackdropClick) return;
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      data-testid={testId ? `${testId}-overlay` : undefined}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="presentation"
    >
      <div
        ref={cardRef}
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidthClass} max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] flex flex-col min-h-0 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden ${className}`}
      >
        {/* Pinned Sticky Header */}
        <div
          data-testid="modal-shell-header"
          className="flex flex-col shrink-0 border-b border-zinc-800/80 bg-zinc-950/95"
        >
          <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              {icon && <span className="text-xl shrink-0">{icon}</span>}
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {title}
                </h2>
                {subtitle && (
                  <div className="text-xs text-zinc-400 mt-0.5 sm:mt-1 leading-relaxed">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-testid={closeBtnTestId}
              className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label={closeAriaLabel}
            >
              ✕
            </button>
          </div>
          {headerBottom && <div className="px-5 pb-3 sm:px-6 sm:pb-4 shrink-0">{headerBottom}</div>}
        </div>

        {/* Scrollable Body */}
        <div
          data-testid="modal-shell-body"
          className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 ${bodyClassName}`}
        >
          {children}
        </div>

        {/* Optional Pinned Footer */}
        {footer && (
          <div
            data-testid="modal-shell-footer"
            className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/80 px-5 py-3.5 sm:px-6 sm:py-4"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
