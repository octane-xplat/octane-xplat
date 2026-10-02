import { createRoot } from 'octane'
import { TiptapEditor } from './TiptapEditor.web.tsrx'
import { installEditorDocument } from '@octane-xplat/richtext/browser-transport'
const root = createRoot(document.getElementById('root')!)
installEditorDocument((props) => root.render(<TiptapEditor {...props} />))
