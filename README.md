# Bugerz browser client

The browser widget for [Bugerz](https://bugerz.com). See the [configuration and API documentation](https://bugerz.com/documentation).

## Install

Include one script source and initialize it with your project's public widget key:

```html
<script src="https://bugerz.com/javascripts/bugerz.min.js"></script>
<script>
  BugerZ.init({ publicKey: 'YOUR_PUBLIC_KEY' });
</script>
```

## Script hosts

| Host | Minified client | Readable source |
| --- | --- | --- |
| Bugerz | [bugerz.min.js](https://bugerz.com/javascripts/bugerz.min.js) | [bugerz.js](https://bugerz.com/javascripts/bugerz.js) |
| jsDelivr | [bugerz.min.js](https://cdn.jsdelivr.net/gh/msj121/bugerz@main/bugerz.min.js) | [bugerz.js](https://cdn.jsdelivr.net/gh/msj121/bugerz@main/bugerz.js) |
| GitHub Pages | [bugerz.min.js](https://msj121.github.io/bugerz/bugerz.min.js) | [bugerz.js](https://msj121.github.io/bugerz/bugerz.js) |

The jsDelivr and GitHub Pages copies come from this repository. Branch URLs track updates and may be cached. For a fixed jsDelivr build, replace `@main` with a commit SHA. You can also download `bugerz.min.js` and host it yourself.

## Screenshot settings

```javascript
BugerZ.init({
  publicKey: 'YOUR_PUBLIC_KEY',
  screenshotOptions: {
    mode: 'viewport',       // Default: Visible area. Use 'full-page' for the entire page.
    imagePlaceholder: true // Default: built-in fallback. Also accepts an image data URL or false.
  }
});
```

These are developer settings. The report form uses the configured capture area.

Unavailable images use an embedded “Image unavailable” placeholder without another network request. A [downloadable SVG](images/screenshot-placeholder.svg) is included for customization. Leave `filterCrossOrigin: false` to attempt external images and replace failures; `true` omits those elements before placeholders apply. Malformed CSS backgrounds may remain blank.

PNG at a pixel ratio of `1` is the default. For smaller attachments, use `type: 'jpeg'` with a lower `quality` or `pixelRatio`. Font embedding is skipped by default. If a scrolled capture fails or stalls, the widget retries a standard capture from the top before omitting the image. The retry keeps the configured image format, dimensions, and privacy filters, and does not scroll the live page. If media also breaks the standard renderer, a final retry omits images, video, canvases, and embedded content to retain the page’s text and layout. All attempts share the screenshot timeout. If every attempt fails, the description still sends.

## Programmatic reports

```javascript
await BugerZ.report(
  { description: 'The save button did not respond.' },
  { screenshotOptions: { mode: 'full-page' } }
);
```

`report()` returns a Promise without opening the form or calling the widget's UI callbacks. `show()`, `hide()`, and `toggle()` control the built-in form.

## Privacy and compatibility

The widget, password inputs, and elements marked `data-bugerz-private` are excluded from screenshots. Console capture is separate; avoid logging private data or disable it with `trackConsole: false`. Click tracking and automatic error reporting are off by default.

Compared with the older client, screenshots now default to the visible area and full-resolution PNG rather than a reduced-resolution full-page JPEG. Set explicit screenshot options if your installation needs the previous capture area or smaller attachments.

The screenshot helper remains [html-to-image](https://github.com/bubkoo/html-to-image), loaded on demand from `https://unpkg.com/html-to-image@1.11.13/dist/html-to-image.js`. This is a third-party dependency, separate from the Bugerz client distributions above.
