import { createRoot } from 'octane';
import { Gallery } from '@xplat/demos';
import './fonts.css';
import '@octane-xplat/ui/theme/tokens.css';
import '@octane-xplat/ui/theme/chrome.css';
import '@xplat/demos/demo.css';
import '@xplat/app/app.css';

createRoot(document.getElementById('root')!).render(<Gallery />);
