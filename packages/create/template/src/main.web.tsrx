import { createRoot } from 'octane';
import { App } from './App.tsrx';
import '@octane-xplat/ui/theme/tokens.css';
import './style.css';

createRoot(document.getElementById('root')!).render(<App />);
