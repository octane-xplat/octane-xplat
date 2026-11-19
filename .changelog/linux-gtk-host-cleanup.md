---
hype: 40
---

### Clean up app resources when GTK shuts down

Return a cleanup function from the `runGtkApp` mount callback. The host calls it once on shutdown, before it unmounts the root.

```ts
import { runGtkApp } from '@octane-xplat/linux-gtk/host'
import { App } from './App'

runGtkApp({ applicationId: 'com.example.Notes', title: 'Notes' }, ({ root }) => {
  root.render(App, {})
  const timer = setInterval(() => console.log('Notes is open'), 1000)
  return () => clearInterval(timer)
})
```

[Linux GTK host exports](https://octane-xplat.goddardai.org/package-linux-gtk-renderer#exports)
