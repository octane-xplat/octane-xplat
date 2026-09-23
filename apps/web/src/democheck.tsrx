import { createRoot } from 'octane';
import { Gallery } from '@xplat/demos';
import '@xplat/ui/theme/tokens.css';
import '@xplat/demos/demo.css';

createRoot(document.getElementById('root')!).render(<Gallery />);
