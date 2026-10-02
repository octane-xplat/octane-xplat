import { createRoot } from 'octane'
import { LexicalEditor } from './LexicalEditor.web.tsrx'
import { installEditorDocument } from '@octane-xplat/richtext/browser-transport'
const root = createRoot(document.getElementById('root')!)
installEditorDocument((props) => root.render(<LexicalEditor {...props} />))
