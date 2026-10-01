import { createRoot } from 'octane';
import { App } from '@xplat/app';
import './fonts.css';
import '@octane-xplat/ui/theme/tokens.css';
import '@octane-xplat/ui/theme/chrome.css';
import 'virtual:bamboo.css';
import '@xplat/demos/demo.css';
import '@xplat/app/app.css';

createRoot(document.getElementById('root')!).render(<App />);
