### Draw double and 3D borders on native macOS

Experimental AppKit now draws `double`, `groove`, `ridge`, `inset` and
`outset` borders instead of painting them solid with a warning. `double` needs
a width of at least 3 points, and the 3D styles darken some sides so the box
looks raised or sunken. On rounded corners the inner edges stay straight. The
borders have not yet been checked on a running Mac.

```css
.sunken-well { border-width: 3px; border-style: inset; border-color: #888; }
.picture-frame { border-width: 6px; border-style: double; }
```

See [AppKit borders](https://octane-xplat.goddardai.org/app/styling#appkit-borders).
