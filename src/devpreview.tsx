// Preview harness for JrCredsPrompt. Renders the real component with the real
// stylesheet against a stubbed API response, so the modal can be looked at and
// screenshotted without standing up an operator session.
//
// Dev-only: devpreview.html is not referenced by index.html and is never part
// of a production build. Delete both files when you no longer need the preview.
//
//   npm run dev -- --port 5199
//   http://localhost:5199/devpreview.html            both missing (default)
//   http://localhost:5199/devpreview.html?case=email     password saved, no email
//   http://localhost:5199/devpreview.html?case=password  email saved, no password
//   http://localhost:5199/devpreview.html?case=denied    server says 403 (a client)
import { createRoot } from 'react-dom/client';
import './index.css';
import JrCredsPrompt from './components/JrCredsPrompt';

const CASE = new URLSearchParams(location.search).get('case') || 'both';
const CLIENT = 'rijuljain17@gmail.com';

const original = window.fetch;
window.fetch = async (input: any, init?: any) => {
  if (String(input).includes('/operations/jr-creds-status')) {
    if (CASE === 'denied') {
      // What a client gets, even with role forged in localStorage.
      return new Response(JSON.stringify({ success: false, error: 'NOT_AN_OPERATOR' }),
        { status: 403, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      success: true,
      clientEmail: CLIENT,
      needsSetup: true,
      hasEmail: CASE === 'password',
      hasPassword: CASE === 'email',
      jobrightUrl: 'https://jobright.ai/login',
      suggestedEmail: CLIENT,
      suggestedPassword: 'Jobhunt@2026',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return original(input, init);
};

createRoot(document.getElementById('root')!).render(
  <div className="min-h-screen bg-gray-50">
    <JrCredsPrompt operatorEmail="sarah@flashfirehq" clientEmail={CLIENT} role="operations" />
  </div>,
);
