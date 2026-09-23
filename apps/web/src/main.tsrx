import { createRoot } from 'octane';
import { App } from '@xplat/app';
import '@xplat/ui/theme/tokens.css';
import '@xplat/demos/demo.css';

createRoot(document.getElementById('root')!).render(<App />);
