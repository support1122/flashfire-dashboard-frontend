import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from '@posthog/react';
import { posthogClient } from '../lib/posthog';

export function PostHogSessionControl() {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthogClient || !posthog) return;
    const onOptimize = location.pathname.startsWith('/optimize');
    if (onOptimize) {
      posthog.stopSessionRecording();
    } else {
      posthog.startSessionRecording();
    }
  }, [location.pathname, posthog]);

  return null;
}
