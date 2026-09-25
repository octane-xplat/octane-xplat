import { createRoot } from 'octane';
import { App } from '@xplat/app';
import '@octane-xplat/ui/theme/tokens.css';
import '@xplat/demos/demo.css';
import '@xplat/app/app.css';

createRoot(document.getElementById('root')!).render(<App />);
