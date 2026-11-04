(function(window, document){
  // Embedded so a failed image never needs another network request to recover.
  // Keep the downloadable copy in public/images/screenshot-placeholder.svg in sync.
  const BUILTIN_IMAGE_PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" role="img" aria-label="Image unavailable">
  <rect width="320" height="180" fill="#f1f5f9"/>
  <rect x="0.5" y="0.5" width="319" height="179" fill="none" stroke="#cbd5e1"/>
  <g fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="140" y="52" width="40" height="32" rx="4"/>
    <circle cx="151" cy="62" r="3"/>
    <path d="m143 80 11-11 8 8 6-6 9 9"/>
  </g>
  <text x="160" y="112" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="14">Image unavailable</text>
</svg>`);

  // Default configuration
  const DEFAULTS = {
    publicKey: null,             // REQUIRED
    endpoint: 'https://bugerz.com/api/report',
    placement: 'bottom-right',   // 'bottom-left' | 'top-right' | 'top-left'
    addButton: true,
    buttonText: 'Report Bug',
    openOnInit: false,
    autoSendOnError: false, 
    autoSendLimit:    5,     // max number of auto‐reports per session
    autoSendDelay:    1000,  // debounce delay in ms, reset auto-send if new error occurs
    autoSendMaxDebounceCount: 3,     // optional: how many times to postpone before forcing
    trackConsole: true,
    consoleBufferSize: 100,
    trackEvents: false,
    eventBufferSize: 100,
    allowPublicSubmission: false,
    showPublicCheckbox: false,
    showEmailField: true,
    screenshot: true,
    screenshotTimeout: 8000,
    requestTimeout: 15000,
    screenshotLibUrl: 'https://unpkg.com/html-to-image@1.11.13/dist/html-to-image.js',
    screenshotLibIntegrity: 'sha384-Tha/42qsYmpYmQ07pX+nJzkKumO0BzKJxK/uzVc7xyBQxVCUgQBhQIG8L7vXK+9C',
    formContainerSelector: null,
    screenshotOptions: {
      mode: 'viewport',    // 'viewport' (visible area) or 'full-page'
      type: 'png',         // 'png' or 'jpeg'
      quality: 1,          // only for jpeg: 0.0–1.0
      pixelRatio: 1,       // full resolution for readability
      skipFonts: true,      // skip font embedding to avoid CORS issues
      cacheBust: false,     // disable cache busting for better performance
      imagePlaceholder: true,  // true: built-in fallback; data URL: custom image; false: disable
      filter: undefined     // optional: function to filter out problematic nodes
      // width: 800,        // optional override for the selected capture area's dimensions
      // height: 600
    },
    // Quick flag to auto-filter cross-origin resources (images, iframes, stylesheets)
    filterCrossOrigin: false,
    cssVars: {
      '--bz-bg': '#ffffff',
      '--bz-color': '#333333',
      '--bz-border': '#e0e0e0',
      '--bz-radius': '8px',
      '--bz-zindex': '10000',
      '--bz-font': '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      '--bz-anti-primary': '#ffffff', // contrast color for text on primary buttons
      '--bz-primary': '#4F46E5',
      '--bz-success': '#10B981',
      '--bz-error': '#EF4444',
      '--bz-overlay': 'rgba(0, 0, 0, 0.5)'
    },
    // Callback invoked on successful report. Receives response JSON, e.g. { url: 'https://...' }// inside DEFAULTS:
    onSuccess: (resData) => {
      document.getElementById('bugerz-notice')?.remove();
      const msg = document.createElement('div');
      msg.id = 'bugerz-notice';
      msg.setAttribute('role', 'status');
      msg.style.cssText =
        'position:fixed; top:1em; right:1em; padding:0.8em 2em 0.8em 1.2em; z-index:calc(var(--bz-zindex) + 1);' +
        'background:var(--bz-success); color:#fff; border-radius:var(--bz-radius); ' +
        'font-family:var(--bz-font); box-shadow:0 2px 6px rgba(0,0,0,0.2);' +
        'max-width:calc(100vw - 2em); box-sizing:border-box; overflow-wrap:anywhere; overflow:hidden;';

      // Close button
      const close = document.createElement('button');
      close.classList.add('bugerz-close-button');
      close.textContent = '×';
      close.style.cssText =
        'position:absolute; top:0.2em; right:0.4em; background:transparent; ' +
        'border:none; font-size:1.2rem; color:#fff; cursor:pointer; padding:0;';
      close.addEventListener('click', () => msg.remove());
      msg.appendChild(close);

      // Message text
      const text = document.createElement('span');
      text.textContent = '✅ Report sent! Thanks for your feedback.';
      msg.appendChild(text);

      // Optional link
      if (resData && resData.url) {
        const link = document.createElement('a');
        link.href = resData.url;
        link.textContent = ' View Report';
        link.classList.add('bugerz-report-link');
        link.target = '_blank';
        link.style.cssText = 'margin-left:0.5em; color:#fff; text-decoration:underline;';
        msg.appendChild(link);
      }

      document.body.appendChild(msg);
      // no more auto-remove
    },

    onError: (err) => {
      document.getElementById('bugerz-notice')?.remove();
      const msg = document.createElement('div');
      msg.id = 'bugerz-notice';
      msg.setAttribute('role', 'alert');
      msg.style.cssText =
        'position:fixed; top:1em; right:1em; padding:0.8em 2em 0.8em 1.2em; z-index:calc(var(--bz-zindex) + 1); ' +
        'background:var(--bz-error); color:#fff; border-radius:var(--bz-radius); ' +
        'font-family:var(--bz-font); box-shadow:0 2px 6px rgba(0,0,0,0.2);' +
        'max-width:calc(100vw - 2em); box-sizing:border-box; overflow-wrap:anywhere; overflow:hidden;';

      // Close button
      const close = document.createElement('button');
      close.classList.add('bugerz-close-button');
      close.textContent = '×';
      close.style.cssText =
        'position:absolute; top:0.2em; right:0.4em; background:transparent; ' +
        'border:none; font-size:1.2rem; color:#fff; cursor:pointer; padding:0;';
      close.addEventListener('click', () => msg.remove());
      msg.appendChild(close);

      // Error text
      const text = document.createElement('span');
      text.textContent = `Couldn’t send your report: ${err.message || err}. Your text is still here—please try again.`;
      msg.appendChild(text);

      document.body.appendChild(msg);
      // no more auto-remove
    }
  };

  function extend(dest, src) {
    for (let k in src) if (src[k] != null) dest[k] = src[k];
    return dest;
  }

  function createButton(text, placement, cssVars) {
    const btn = document.createElement('button');
    btn.id = 'bugerz-report-button';
    btn.innerText = text;
    Object.assign(btn.style, {
      position: 'fixed',
      zIndex: cssVars['--bz-zindex'],
      padding: '0.6em 1.2em',
      border: 'none',
      cursor: 'pointer',
      background: cssVars['--bz-primary'],
      color: '#fff',
      fontFamily: cssVars['--bz-font'],
      borderRadius: cssVars['--bz-radius'],
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      transition: 'transform 0.2s ease'
    });
    btn.addEventListener('mouseover', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseout', () => btn.style.transform = 'scale(1)');
    const [vert, hor] = placement.split('-');
    btn.style[vert] = '1em';
    btn.style[hor] = '1em';
    return btn;
  }

  function injectStyles(vars) {
    Object.keys(vars).forEach(key => {
      document.documentElement.style.setProperty(key, vars[key]);
    });
    const s = document.createElement('style');
    s.innerHTML = `
      #bugerz-overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: var(--bz-overlay);
        z-index: calc(var(--bz-zindex) - 1);
      }
      #bugerz-form-container {
        box-sizing: border-box;
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bz-bg);
        color: var(--bz-color);
        border: 1px solid var(--bz-border);
        border-radius: var(--bz-radius);
        padding: 24px;
        width: 408px;
        max-width: calc(100vw - 32px);
        max-height: calc(100dvh - 32px);
        overflow: auto;
        font-family: var(--bz-font);
        line-height: 1.5;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        z-index: var(--bz-zindex);
      }
      #bugerz-form-container h2 { margin: 0 0 16px; font-size:1.25rem; font-weight:600; color:var(--bz-primary); }
      #bugerz-form-container .field { margin-bottom:8px; display:flex; flex-direction:column; }
      #bugerz-form-container label { font-weight:600; font-size:0.9rem; }
      #bugerz-form-container input[type="text"],
      #bugerz-form-container input[type="email"],
      #bugerz-form-container textarea,
      #bugerz-form-container select {
        padding:8px;
        border:1px solid var(--bz-border);
        border-radius:var(--bz-radius);
        font-size:0.9rem;
        font-family:inherit;
        transition:border-color 0.2s ease;
      }
      #bugerz-form-container input:focus,
      #bugerz-form-container textarea:focus,
      #bugerz-form-container select:focus { outline:none; border-color:var(--bz-primary); }
      #bugerz-form-container .checkbox-field { display:flex; align-items:center; gap:8px; flex-direction:row; }
      #bugerz-form-container button[type="submit"] {
        width:100%; padding:12px;
        background:var(--bz-primary); color:var(--bz-anti-primary);
        border:none; border-radius:var(--bz-radius);
        font-size:1rem; font-weight:600;
        cursor:pointer; transition:background 0.2s ease;
      }
      #bugerz-form-container button[type="submit"]:hover { background:#4338CA; }
      #bugerz-form-container .close-btn {
        position:absolute; top:-15px; right:-5px;
        background:transparent; border:none;
        font-size:1.25rem; cursor:pointer; color:var(--bz-color);
      }
      #bugerz-form-container.loading { opacity:0.6; pointer-events:none; }
      #bugerz-spinner {
        display:none; position:absolute;
        top:50%; left:50%; width:32px; height:32px;
        margin:-16px 0 0 -16px;
        border:4px solid rgba(0,0,0,0.1);
        border-top-color:var(--bz-primary);
        border-radius:50%; animation:spin 1s linear infinite;
        z-index:calc(var(--bz-zindex) + 1);
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(s);
  }

  class CircularBuffer {
    constructor(size) { this.size = size; this.buf = []; }
    push(item) { this.buf.push(item); if (this.buf.length > this.size) this.buf.shift(); }
    get()   { return this.buf.slice(); }
  }

  function hijackConsole(opts, consoleBuffer, eventBuffer) {
    let sendCount = 0;
    let debounceTimer = null;
    let debounceRuns = 0;
    let lastFields = null;

    const scheduleSend = () => {
      if (sendCount >= opts.autoSendLimit) return;
      if (debounceTimer && debounceRuns < opts.autoSendMaxDebounceCount) {
        clearTimeout(debounceTimer);
        debounceRuns++;
      } else if (debounceTimer) {
        return;
      }
      debounceTimer = setTimeout(async () => {
        if(sendCount < opts.autoSendLimit && opts.publicKey) {
          try {
            sendCount++; // Bound attempts even when delivery fails.
            await sendReport(opts, consoleBuffer, eventBuffer, lastFields);
            debounceRuns = 0; // reset debounce count after successful send
          } catch (err) {
            console.debug('BugerZ: Error sending auto report:', err);
          }
        }
        debounceTimer = null; 
        debounceRuns = 0; 
      }, opts.autoSendDelay);
    };

    ['log','warn','error','info'].forEach(level => {
      const orig = console[level];
      console[level] = function(...args) {
        consoleBuffer.push({ level, args: safeLogArgs(args), timestamp: new Date().toISOString() });
        orig.apply(console, args);
        if (level === 'error') {
          // send error report immediately if enabled
          if (opts && opts.autoSendOnError) {
            if (opts.publicKey) {
              lastFields = { description: `Auto‐triggered on console.${level}:\n${safeLogArgs(args).map(value => typeof value === 'string' ? value : JSON.stringify(value)).join(' ')}`};
              scheduleSend();
            } else {
              console.debug('BugerZ: publicKey not set, cannot send error report');
            }
          }
        }
      };
    });
  }

  function safeLogArgs(args) {
    const seen = new WeakSet();
    try {
      return JSON.parse(JSON.stringify(args, (_, value) => {
        if (typeof value === 'bigint') return value.toString();
        if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
        if (value && typeof value === 'object') {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      }));
    } catch (_) { return ['[Unserializable console entry]']; }
  }

  function trackEvents(buffer) {
    // Opt-in click breadcrumbs only. Never listen to typed characters or values.
    document.addEventListener('click', e => {
      if (!e.target || e.target.closest('input, textarea, [contenteditable], [data-bugerz-private], #bugerz-form-container')) return;
      buffer.push({ type: 'click', tag: e.target.tagName, x: e.clientX, y: e.clientY, timestamp: new Date().toISOString() });
    }, true);
  }

  function withTimeout(promise, milliseconds, message) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    })]).finally(() => clearTimeout(timer));
  }

  function loadScreenshotLibrary(opts) {
    if (window.htmlToImage) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => finish(new Error('Screenshot library timed out')), opts.screenshotTimeout);
      const finish = error => {
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); }
        else resolve();
      };
      script.src = opts.screenshotLibUrl;
      // A custom/self-hosted helper can supply its own integrity hash. Do not
      // apply the built-in helper's hash to a different URL.
      if(opts.screenshotLibIntegrity){script.integrity=opts.screenshotLibIntegrity;script.crossOrigin='anonymous';}
      script.referrerPolicy='no-referrer';
      script.onload = () => finish(window.htmlToImage ? null : new Error('Screenshot library unavailable'));
      script.onerror = () => finish(new Error('Screenshot library could not load'));
      document.head.appendChild(script);
    });
  }

  function screenshotBounds(mode) {
    const root = document.documentElement;
    const style = window.getComputedStyle(root);
    const fullPage = mode === 'full-page';
    const pageWidth = Math.max(root.scrollWidth, root.clientWidth);
    const pageHeight = Math.max(root.scrollHeight, root.clientHeight);
    return {
      width: fullPage ? pageWidth : (root.clientWidth || window.innerWidth),
      height: fullPage ? pageHeight : (root.clientHeight || window.innerHeight),
      // Move the cloned document through layout, rather than a transform, so
      // fixed and sticky elements stay anchored to the captured viewport.
      style: {
        // Set the shorthand together so cloned logical margins cannot override
        // the horizontal or vertical offsets.
        margin: `${(parseFloat(style.marginTop) || 0) - (fullPage ? 0 : window.scrollY)}px ${style.marginRight} ${style.marginBottom} ${(parseFloat(style.marginLeft) || 0) - (fullPage ? 0 : window.scrollX)}px`,
        width: style.width,
        height: `${pageHeight}px`
      }
    };
  }

  let screenshotSequence = 0;

  function screenshotFailureMessage(error) {
    if (error?.message) return error.message;
    if (typeof error === 'string' && error) return error;
    // Image loading can reject with a browser Event, which has no message.
    return error?.type === 'error'
      ? 'The browser could not load or render a screenshot image'
      : 'An image or page resource could not be captured';
  }

  function checkScreenshot(dataUrl) {
    // A zero-sized or oversized canvas can return "data:," without throwing.
    if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg);base64,.+/.test(dataUrl)) {
      throw new Error('The browser returned an empty screenshot');
    }
    return dataUrl;
  }

  async function captureStandardScreenshot(options, type) {
    const root = document.documentElement;
    return checkScreenshot(await (type === 'jpeg'
      ? window.htmlToImage.toJpeg(root, options) : window.htmlToImage.toPng(root, options)));
  }

  async function captureScrolledScreenshot(options, type, panels, timeout) {
    // html-to-image copies styles and children, but not element scroll offsets.
    // Mark scrolled panels so we can restore their visible contents in the SVG.
    const root = document.documentElement;
    const attribute = `data-bugerz-scroll-${++screenshotSequence}`;
    let svgUrl;
    const offsets = panels.map(node => ({
      top: node.scrollTop, left: node.scrollLeft,
      width: node.clientWidth,
      pageHeight: node.scrollHeight, outerWidth: node.offsetWidth, outerHeight: node.offsetHeight
    }));
    try {
      panels.forEach((node, index) => node.setAttribute(attribute, index));
      // Clean up live markers even if the library never settles.
      svgUrl = await withTimeout(window.htmlToImage.toSvg(root, options), timeout, 'Scrolled screenshot capture timed out');
    } finally {
      panels.forEach(node => node.removeAttribute(attribute));
    }
    const svg = new DOMParser().parseFromString(decodeURIComponent(svgUrl.slice(svgUrl.indexOf(',') + 1)), 'image/svg+xml');
    if (svg.querySelector('parsererror') || svg.documentElement.localName !== 'svg') {
      throw new Error('The scrolled screenshot contains invalid SVG');
    }
    svg.querySelectorAll(`[${attribute}]`).forEach(content => {
      const offset = offsets[Number(content.getAttribute(attribute))];
      content.removeAttribute(attribute);
      const viewport = svg.createElementNS('http://www.w3.org/1999/xhtml', 'div');
      viewport.style.cssText = content.style.cssText;
      Object.assign(viewport.style, {
        display: content.style.display.startsWith('inline') ? 'inline-block' : 'block',
        boxSizing: 'border-box', padding: '0', overflow: 'hidden',
        width: `${offset.outerWidth}px`, height: `${offset.outerHeight}px`
      });
      content.replaceWith(viewport);
      viewport.appendChild(content);
      // Keep the panel's original flex/grid layout and clipping. Moving it by
      // margins also leaves fixed descendants anchored to their viewport.
      Object.assign(content.style, {
        margin: `${-offset.top}px 0 0 ${-offset.left}px`,
        boxSizing: 'border-box', width: `${offset.width}px`, height: `${offset.pageHeight}px`,
        minWidth: '0', maxWidth: 'none', minHeight: '0', maxHeight: 'none',
        overflow: 'visible', position: content.style.position === 'static' ? 'static' : 'relative',
        inset: 'auto', transform: 'none', translate: 'none', rotate: 'none', scale: 'none',
        border: '0', borderRadius: '0', boxShadow: 'none', outline: 'none',
        background: 'transparent', opacity: '1', filter: 'none'
      });
    });

    const image = await new Promise((resolve, reject) => {
      const image = new Image();
      // Wait for the SVG's load event before drawing its foreignObject, and
      // turn message-less image events into actionable capture errors.
      image.onload = () => { image.onload = image.onerror = null; resolve(image); };
      image.onerror = () => {
        image.onload = image.onerror = null;
        reject(new Error('The browser could not render the scrolled screenshot SVG'));
      };
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    });
    const canvas = document.createElement('canvas');
    const ratio = options.pixelRatio || window.devicePixelRatio || 1;
    canvas.width = options.width * ratio;
    canvas.height = options.height * ratio;
    // Match html-to-image's canvas limit for large captures.
    const scale = Math.min(1, 16384 / canvas.width, 16384 / canvas.height);
    if (scale < 1) { canvas.width *= scale; canvas.height *= scale; }
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The browser could not create a screenshot canvas');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return checkScreenshot(type === 'jpeg' ? canvas.toDataURL('image/jpeg', options.quality ?? 1) : canvas.toDataURL());
  }

  async function captureScreenshot(options, type, timeout) {
    const root = document.documentElement;
    const panels = Array.from(root.querySelectorAll('*')).filter(node => {
      if (node === document.scrollingElement || !(node.scrollTop || node.scrollLeft)) return false;
      if (node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml') return false;
      // A scrolled textarea in the report form (or a private section) must not
      // switch an otherwise ordinary screenshot into the panel capture path.
      for (let ancestor = node; ancestor && ancestor !== root; ancestor = ancestor.parentElement) {
        if (options.filter && !options.filter(ancestor)) return false;
      }
      return true;
    });
    const canFallback = panels.length > 0 || Boolean(window.scrollX || window.scrollY);
    const deadline = Date.now() + timeout;
    // Reserve time for a simpler capture if scroll reconstruction fails/hangs.
    const primaryTimeout = canFallback ? Math.max(1, Math.floor(timeout * 0.65)) : timeout;
    try {
      return await withTimeout(panels.length
        ? captureScrolledScreenshot(options, type, panels, primaryTimeout)
        : captureStandardScreenshot(options, type), primaryTimeout, 'Screenshot capture timed out');
    } catch (error) {
      if (!canFallback) throw error;
      // Standard html-to-image capture starts inner panels at the top. Also
      // reset the cloned document's offset, keeping the requested dimensions
      // and privacy filters, without scrolling or resizing the live page.
      const fallbackOptions = { ...options, style: {
        ...options.style, margin: screenshotBounds('full-page').style.margin
      } };
      const failures = [`Scrolled capture failed: ${screenshotFailureMessage(error)}`];
      for (const omitMedia of [false, true]) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        // A broken video, tainted canvas, or invalid embedded image can also
        // break the standard renderer. Preserve the page's text/layout as a
        // last resort, still applying every configured exclusion.
        const retryOptions = omitMedia ? { ...fallbackOptions, filter: node =>
          (!options.filter || options.filter(node)) &&
          !['IMG', 'SVG', 'VIDEO', 'CANVAS', 'IFRAME', 'OBJECT', 'EMBED'].includes((node.tagName || '').toUpperCase())
        } : fallbackOptions;
        try {
          const screenshot = await withTimeout(captureStandardScreenshot(retryOptions, type),
            omitMedia ? remaining : Math.max(1, Math.floor(remaining * 0.6)), 'Screenshot fallback timed out');
          console.debug(omitMedia
            ? 'Screenshot captured from the top with media omitted after capture failed:'
            : 'Screenshot captured from the top after scrolled capture failed:', failures.join('; '));
          return screenshot;
        } catch (fallbackError) {
          failures.push(`${omitMedia ? 'Simplified' : 'Top-of-page'} fallback failed: ${screenshotFailureMessage(fallbackError)}`);
        }
      }
      throw new Error(failures.join('; '));
    }
  }

  function imageFallbackOptions(value) {
    if (value === false) return {};
    const placeholder = typeof value === 'string' && value ? value : BUILTIN_IMAGE_PLACEHOLDER;
    return {
      imagePlaceholder: placeholder,
      // Fetch can succeed with an invalid image (for example an HTML error
      // page). Recover from decode errors too, using only the cloned image.
      onImageErrorHandler: event => {
        const image = event && event.target;
        if (!image) return;
        return new Promise(resolve => {
          const currentSource = image.src || image.href?.baseVal;
          let replacement = currentSource === placeholder ? BUILTIN_IMAGE_PLACEHOLDER : placeholder;
          const finish = () => {
            image.onload = image.onerror = null;
            resolve();
          };
          const replace = () => {
            if ('src' in image) image.src = replacement;
            else if (image.href) image.href.baseVal = replacement;
            else finish();
          };
          image.onload = finish;
          image.onerror = () => {
            if (replacement === BUILTIN_IMAGE_PLACEHOLDER) return finish();
            // A broken custom placeholder gets one final built-in fallback.
            replacement = BUILTIN_IMAGE_PLACEHOLDER;
            replace();
          };
          replace();
        });
      }
    };
  }

  function buildForm(opts) {
    const form = document.createElement('form');
    form.id = 'bugerz-form';
    form.style.position = 'relative';
    form.innerHTML = `
      <button type="button" class="close-btn" aria-label="Close">×</button>
      <div id="bugerz-spinner"></div>
      <h2>Report a Bug</h2>
      <div class="field">
        <label for="bz-description">What happened?</label>
        <textarea id="bz-description" name="description" rows="4" required placeholder="What were you trying to do, and what happened instead?"></textarea>
      </div>
      ${opts.showEmailField ? `<div class="field"><label for="bz-email">Email (optional, so the team can follow up)</label><input type="email" id="bz-email" name="email" placeholder="your@example.com"></div>` : ''}
      <div class="checkbox-field field">${opts.showPublicCheckbox ? `<input type="checkbox" id="bz-public" name="isPublic"><label for="bz-public">Make public</label>` : ''}
      </div>
      
      <button type="submit">Send Report</button>
    `;
    return form;
  }

  async function sendReport(opts, consoleBuf, eventBuf, fields = {}) {
    const data = {
      publicKey: opts.publicKey,
      url: location.href,
      title: document.title,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      console: consoleBuf.get(),
      events: opts.trackEvents ? eventBuf.get() : undefined,
      fields: fields || {}
    };

    if (opts.screenshot) {
      try {
        const captureStarted = Date.now();
        await loadScreenshotLibrary(opts);
        const imgOpts = opts.screenshotOptions || {};
        const bounds = screenshotBounds(imgOpts.mode);

        // Build the options object for html-to-image
        const htmlToImageOpts = {
          quality: imgOpts.quality,
          pixelRatio: imgOpts.pixelRatio,
          width: imgOpts.width || bounds.width,
          height: imgOpts.height || bounds.height,
          style: bounds.style,
          skipFonts: imgOpts.skipFonts,
          cacheBust: imgOpts.cacheBust,
          ...imageFallbackOptions(imgOpts.imagePlaceholder)
        };

        // Add filter function - either custom or auto cross-origin filter
        if (imgOpts.filter && typeof imgOpts.filter === 'function') {
          // User provided custom filter
          htmlToImageOpts.filter = imgOpts.filter;
        } else if (opts.filterCrossOrigin) {
          // Auto-filter cross-origin resources
          htmlToImageOpts.filter = function(node) {
            // Skip external images and iframes that cause CORS issues
            if (node.tagName === 'IMG' || node.tagName === 'IFRAME') {
              const src = node.src || (node.getAttribute && node.getAttribute('src')) || '';
              // Skip if it's a cross-origin resource (not same origin or data URI)
              if (src && !src.startsWith('data:') && !src.startsWith(window.location.origin) && !src.startsWith('/')) {
                return false; // exclude this node
              }
            }
            // Skip external stylesheets
            if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
              const href = node.href || '';
              if (href && !href.startsWith(window.location.origin) && !href.startsWith('/')) {
                return false;
              }
            }
            return true;
          };
        }

        const customFilter = htmlToImageOpts.filter;
        htmlToImageOpts.filter = node => {
          // Computed styles are already embedded by html-to-image. Cloning
          // the head would also bring along stylesheets and page scripts.
          if (node.tagName === 'HEAD') return false;
          if (node.id && node.id.startsWith('bugerz-')) return false;
          if (node.matches && node.matches('[data-bugerz-private], input[type="password"]')) return false;
          return customFilter ? customFilter(node) : true;
        };

        const remaining = opts.screenshotTimeout - (Date.now() - captureStarted);
        if (remaining <= 0) throw new Error('Screenshot capture timed out');
        data.screenshot = await captureScreenshot(htmlToImageOpts, imgOpts.type, remaining);
      } catch (err) {
        console.debug('Screenshot unavailable; sending report without it:', screenshotFailureMessage(err));
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.requestTimeout);
    try {
      const res = await fetch(opts.endpoint, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.ok) throw new Error(resData.message || `Server returned ${res.status}`);
      return resData;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('The request timed out. Please try again');
      throw err;
    } finally { clearTimeout(timer); }
  }

  let reportFromClient = null;

  window.BugerZ = {
    // Explicit programmatic reporting returns a promise; it never installs an
    // automatic error handler or shows the form.
    report: async function(fields = {}, options = {}) {
      if (!reportFromClient) throw new Error('BugerZ.init must be called before BugerZ.report');
      if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('Report fields must be an object');
      return reportFromClient(fields, options);
    },
    show: function() {
      const ov = document.getElementById('bugerz-overlay');
      const ct = document.getElementById('bugerz-form-container');
      if (ov && ct) { ov.style.display = 'block'; ct.style.display = 'block'; }
    },
    hide: function() {
      const ov = document.getElementById('bugerz-overlay');
      const ct = document.getElementById('bugerz-form-container');
      if (ov && ct) { ov.style.display = 'none'; ct.style.display = 'none'; }
    },
    toggle: function() {
      const ov = document.getElementById('bugerz-overlay');
      const ct = document.getElementById('bugerz-form-container');
      if (ov && ct) {
        if (ov.style.display === 'block') this.hide(); else this.show();
      }
    },
    init: function(userOptions = {}) {
      const opts = extend(extend({}, DEFAULTS), userOptions);
      if(opts.screenshotLibUrl!==DEFAULTS.screenshotLibUrl&&!Object.hasOwn(userOptions,'screenshotLibIntegrity'))opts.screenshotLibIntegrity=null;

      opts.screenshotOptions = extend(extend({}, DEFAULTS.screenshotOptions), userOptions.screenshotOptions || {});
      for (const name of ['screenshotTimeout', 'requestTimeout']) {
        if (!Number.isFinite(opts[name]) || opts[name] <= 0) opts[name] = DEFAULTS[name];
      }
      opts.cssVars = extend({}, DEFAULTS.cssVars); //deep merge for cssVars
      if (userOptions.cssVars) extend(opts.cssVars, userOptions.cssVars);
      if (!opts.publicKey) throw new Error('BugerZ: publicKey is required');
      injectStyles(opts.cssVars);
      const consoleBuf = new CircularBuffer(opts.consoleBufferSize);
      const eventBuf = opts.trackEvents ? new CircularBuffer(opts.eventBufferSize) : null;
      if (opts.trackConsole) hijackConsole(opts, consoleBuf, eventBuf);
      if (opts.trackEvents) trackEvents(eventBuf);
      reportFromClient = (fields, options = {}) => sendReport(
        { ...opts, screenshot: typeof options.screenshot === 'boolean' ? options.screenshot : opts.screenshot,
          screenshotOptions: { ...opts.screenshotOptions, ...options.screenshotOptions } },
        consoleBuf, eventBuf, fields);

      let overlay = document.getElementById('bugerz-overlay');
      if (!overlay) {
        overlay = document.createElement('div'); overlay.id = 'bugerz-overlay';
        document.body.appendChild(overlay);
      }

      let container;
      if (opts.formContainerSelector) {
        container = document.querySelector(opts.formContainerSelector) || document.createElement('div');
        if (!container.parentNode) document.body.appendChild(container);
      } else {
        container = document.createElement('div'); document.body.appendChild(container);
      }
      container.id = 'bugerz-form-container';

      const form = buildForm(opts);
      container.innerHTML = '';
      container.appendChild(form);

      form.querySelector('.close-btn').addEventListener('click', () => this.hide());
      overlay.addEventListener('click', () => this.hide());

      if (opts.addButton && !document.getElementById('bugerz-report-button')) {
        const btn = createButton(opts.buttonText, opts.placement, opts.cssVars);
        document.body.appendChild(btn);
        btn.addEventListener('click', () => this.show());
      }

      if (opts.openOnInit) this.show();

      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (form.classList.contains('loading')) return;
        form.classList.add('loading');
        form.setAttribute('aria-busy', 'true');
        const spinner = container.querySelector('#bugerz-spinner');
        spinner.style.display = 'block';

        let fields = {};
        Array.from(form.elements).forEach(el => {
          if (el.name) fields[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        });

        try {
          let sent = await sendReport(opts, consoleBuf, eventBuf, fields);
          form.reset();
          this.hide();
          if (opts.onSuccess) opts.onSuccess(sent);
        } catch (err) {
          this.show();
          if (opts.onError) opts.onError(err);
        } finally {
          spinner.style.display = 'none';
          form.classList.remove('loading');
          form.removeAttribute('aria-busy');
        }
      });
    }
  };
})(window, document);
