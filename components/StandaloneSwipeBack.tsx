'use client';

import { useEffect } from 'react';

const EDGE_THRESHOLD_PX = 32;
const TRIGGER_DISTANCE_PX = 72;
const MAX_VERTICAL_DRIFT_PX = 48;

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function StandaloneSwipeBack() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let triggered = false;

    const handleTouchStart = (event: TouchEvent) => {
      if (!isStandaloneMode()) return;
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      if (touch.clientX > EDGE_THRESHOLD_PX) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
      triggered = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!tracking || triggered) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      if (deltaY > MAX_VERTICAL_DRIFT_PX) {
        tracking = false;
        return;
      }

      if (deltaX >= TRIGGER_DISTANCE_PX) {
        triggered = true;
        tracking = false;

        if (window.history.length > 1) {
          window.history.back();
        }
      }
    };

    const handleTouchEnd = () => {
      tracking = false;
      triggered = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return null;
}
