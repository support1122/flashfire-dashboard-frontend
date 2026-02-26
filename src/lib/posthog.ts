import posthog from 'posthog-js';

const key = import.meta.env.VITE_POSTHOG_KEY || import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

if (key) {
  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    disable_session_recording: true,
    session_recording: {
      recordCrossOriginIframes: false,
    },
  });
}

export const posthogClient = key ? posthog : null;
