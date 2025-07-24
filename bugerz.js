(function(window, document){
  // Default configuration
  const DEFAULTS = {
    publicKey: null,             // REQUIRED
    endpoint: 'https://bugerz.com/api/report',
    placement: 'bottom-right',   // 'bottom-left' | 'top-right' | 'top-left'
    addButton: true,
    buttonText: 'Report Bug',
    autoTrigger: false,
    trackConsole: true,
    consoleBufferSize: 100,
    trackEvents: false,
    eventBufferSize: 100,
    allowPublicSubmission: false,
    showPublicCheckbox: false,
    showEmailField: true,
    screenshot: true,
    screenshotLibUrl: 'https://unpkg.com/html-to-image@1.11.13/dist/html-to-image.js',//'https://cdn.jsdelivr.net/npm/html-to-image@1.8.0/dist/html-to-image.min.js',
    formContainerSelector: null,
    screenshotOptions: {
      type: 'jpeg',        // 'png' or 'jpeg'
      quality: 1,         // only for jpeg: 0.0–1.0
      pixelRatio: 1,      // scale down to 50% resolution
      // width: 800,        // you can also force an explicit width (only jpg)
      // height: 600
    },
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
      const msg = document.createElement('div');
      msg.style.cssText =
        'position:fixed; top:1em; right:1em; padding:0.8em 1.2em; z-index:99;' +
        'background:var(--bz-success); color:#fff; border-radius:var(--bz-radius); ' +
        'font-family:var(--bz-font); box-shadow:0 2px 6px rgba(0,0,0,0.2);' +
        'overflow: hidden;';  // ensure close button stays inside

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
      const msg = document.createElement('div');
      msg.style.cssText =
        'position:fixed; top:1em; right:1em; padding:0.8em 1.2em; ' +
        'background:var(--bz-error); color:#fff; border-radius:var(--bz-radius); ' +
        'font-family:var(--bz-font); box-shadow:0 2px 6px rgba(0,0,0,0.2);' +
        'overflow: hidden;';

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
      text.textContent = `❌ Failed to send report: ${err}`;
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
        display: none;
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bz-bg);
        color: var(--bz-color);
        border: 1px solid var(--bz-border);
        border-radius: var(--bz-radius);
        padding: 24px;
        width: 360px;
        max-width: 90%;
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

  function hijackConsole(buffer) {
    ['log','warn','error','info'].forEach(level => {
      const orig = console[level];
      console[level] = function(...args) {
        buffer.push({ level, args, timestamp: new Date().toISOString() });
        orig.apply(console, args);
      };
    });
  }

  function trackEvents(buffer) {
    ['click','keydown'].forEach(evt => {
      document.addEventListener(evt, e =>
        buffer.push({ type: evt, tag: e.target.tagName, x: e.clientX, y: e.clientY, key: e.key || null, timestamp: new Date().toISOString() }),
        true
      );
    });
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
        <textarea id="bz-description" name="description" rows="4" required placeholder="Describe the bug in full please."></textarea>
      </div>
      ${opts.showEmailField ? `<div class="field"><label for="bz-email">Email (optional - get bug link & updates)</label><input type="email" id="bz-email" name="email" placeholder="your@example.com"></div>` : ''}
      <div class="checkbox-field field">${opts.showPublicCheckbox ? `<input type="checkbox" id="bz-public" name="isPublic"><label for="bz-public">Make public</label>` : ''}
      </div>
      
      <button type="submit">Send Report</button>
    `;
    return form;
  }

  window.BugerZ = {
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

      opts.cssVars = extend({}, DEFAULTS.cssVars); //deep merge for cssVars
      if (userOptions.cssVars) extend(opts.cssVars, userOptions.cssVars);
      if (!opts.publicKey) throw new Error('BugerZ: publicKey is required');
      injectStyles(opts.cssVars);
      const consoleBuf = new CircularBuffer(opts.consoleBufferSize);
      if (opts.trackConsole) hijackConsole(consoleBuf);
      const eventBuf = opts.trackEvents ? new CircularBuffer(opts.eventBufferSize) : null;
      if (opts.trackEvents) trackEvents(eventBuf);

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

      if (opts.autoTrigger) this.show();

      form.addEventListener('submit', async e => {
        e.preventDefault();
        form.classList.add('loading');
        this.hide();
        const spinner = container.querySelector('#bugerz-spinner');
        spinner.style.display = 'block';

        const data = {
          publicKey: opts.publicKey,
          url: location.href,
          title: document.title,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          console: consoleBuf.get(),
          events: opts.trackEvents ? eventBuf.get() : undefined,
          fields: {}
        };
        Array.from(form.elements).forEach(el => {
          if (el.name) data.fields[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        });

        if (opts.screenshot) {
          await new Promise(res => {
            if (window.htmlToImage) return res();
            const s = document.createElement('script');
            s.src = opts.screenshotLibUrl;
            s.onload = res;
            document.head.appendChild(s);
          });
          try {
            // data.screenshot = await window.htmlToImage.toPng(document.body);
            const imgOpts = opts.screenshotOptions || {};
            if (imgOpts.type === 'jpeg') {
              data.screenshot = await window.htmlToImage.toJpeg(
                document.body,
                {
                  quality: imgOpts.quality,
                  pixelRatio: imgOpts.pixelRatio,
                  width: imgOpts.width,
                  height: imgOpts.height
                }
              );
            } else {
              // fallback to PNG but allow downscaling
              data.screenshot = await window.htmlToImage.toPng(
                document.body,
                { pixelRatio: imgOpts.pixelRatio }
              );
            }
          } catch (err) {
            console.warn('Screenshot failed:', err);
          }
        }

        try {
          console.log('BugerZ: Sending report with data:', data, opts.endpoint);
          const res = await fetch(opts.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const resData = await res.json();
          if (!resData.ok) throw new Error(resData.message || res.statusText || res.status);
          
          opts.onSuccess(resData);
          form.reset();
        } catch (err) {
          // console.error('BugerZ: Error sending report:', err);
          opts.onError(err.message);
        } finally {
          spinner.style.display = 'none';
          form.classList.remove('loading');
        }
      });
    }
  };
})(window, document);
