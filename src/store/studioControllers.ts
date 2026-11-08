// @ts-nocheck
export function createDeckHistory({ serialize, restore, limit = 35, onChange = () => {} }) {
  let snapshot = null;
  let undoStack = [];
  let redoStack = [];
  const notify = () => onChange({ snapshot, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 });
  function record() {
    const now = serialize();
    if (snapshot === null) {
      snapshot = now;
      notify();
      return;
    }
    if (snapshot !== now) {
      undoStack.push(snapshot);
      if (undoStack.length > limit) undoStack.shift();
      redoStack = [];
      snapshot = now;
    }
    notify();
  }
  function undo() {
    record();
    if (!undoStack.length) return;
    redoStack.push(snapshot);
    snapshot = undoStack.pop();
    restore(snapshot);
    notify();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot);
    snapshot = redoStack.pop();
    restore(snapshot);
    notify();
  }
  return { record, undo, redo };
}

export function createDraftRepository(getStorage) {
  const currentKey = 'xbrain-v1-draft';
  return {
    save(document) {
      const savedAt = new Date().toISOString();
      getStorage().setItem(currentKey, JSON.stringify({ ...document, savedAt }));
      return savedAt;
    },
    load() {
      const raw = getStorage().getItem(currentKey);
      return raw ? JSON.parse(raw) : null;
    },
  };
}

export function createHeaderStatus({ getDocument, getInfo }) {
  let snapshot = null;
  let savedSnapshot = null;
  let savedAt = null;
  let qaSnapshot = null;
  let qaSummary = null;
  let canUndo = false;
  let canRedo = false;
  let saveError = false;
  function render() {
    const doc = getDocument();
    if (!doc) return;
    const name = doc.getElementById('v1-document-name');
    if (!name) return;
    const info = getInfo();
    const title = info.name || 'Bộ trình chiếu chưa đặt tên';
    name.textContent = title;
    name.title = title;
    doc.getElementById('v1-document-count').textContent = info.count + ' slide';
    const draft = doc.getElementById('v1-draft-status');
    const saved = savedSnapshot !== null && snapshot === savedSnapshot;
    draft.textContent = saveError
      ? 'Chưa lưu được nháp'
      : saved
      ? 'Đã lưu nháp'
      : savedSnapshot !== null
      ? 'Có thay đổi'
      : 'Chưa lưu nháp';
    draft.title = savedAt
      ? 'Bản nháp gần nhất: ' + savedAt
      : 'Bản nháp chỉ được lưu khi chọn Tệp → Lưu nháp trong trình duyệt.';
    doc.getElementById('v1-undo').disabled = !canUndo;
    doc.getElementById('v1-redo').disabled = !canRedo;
    for (const mode of ['workspace', 'gallery', 'brand']) {
      const button = doc.getElementById('tab-btn-' + mode);
      if (!button) continue;
      if (info.mode === mode) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    const inline = doc.getElementById('btn-toggle-edit');
    inline.setAttribute('aria-checked', String(info.inline));
    const qa = doc.getElementById('v1-qa-trigger');
    const badge = doc.getElementById('v1-qa-status');
    const label = doc.getElementById('v1-qa-label');
    const fresh = qaSummary && snapshot === qaSnapshot;
    label.textContent = qaSummary && !fresh ? 'Kiểm tra lại' : 'Kiểm tra';
    badge.hidden = !qaSummary;
    if (!qaSummary) {
      qa.title = 'Chưa kiểm tra';
      qa.removeAttribute('aria-label');
      return;
    }
    if (!fresh) {
      badge.textContent = '•';
      badge.dataset.state = 'stale';
      qa.title = 'Nội dung đã thay đổi. Cần kiểm tra lại.';
    } else {
      const issues = qaSummary.errors + qaSummary.warnings;
      badge.textContent = issues ? String(issues) : '✓';
      badge.dataset.state = issues ? 'issues' : 'clean';
      qa.title = qaSummary.errors + ' lỗi · ' + qaSummary.warnings + ' cảnh báo';
    }
    qa.setAttribute('aria-label', label.textContent + ': ' + qa.title);
  }
  return {
    render,
    changed(state) {
      snapshot = state.snapshot;
      canUndo = state.canUndo;
      canRedo = state.canRedo;
      saveError = false;
      render();
    },
    saved(value, when) {
      savedSnapshot = value;
      savedAt = when;
      saveError = false;
      render();
    },
    saveFailed() {
      saveError = true;
      render();
    },
    checked(value, summary) {
      qaSnapshot = value;
      qaSummary = summary;
      render();
    },
    invalidateQA() {
      qaSnapshot = null;
      render();
    },
  };
}

export function createHeaderMenus({ getDocument }) {
  let active = null;
  const element = id => getDocument()?.getElementById(id);
  const trigger = name => element('v1-menu-' + name + '-trigger');
  const menu = name => element('v1-menu-' + name);
  const items = name => [...(menu(name)?.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"]') || [])].filter(el => !el.disabled);
  function close(restoreFocus = true) {
    if (!active) return;
    const name = active;
    active = null;
    if (menu(name)) menu(name).hidden = true;
    if (trigger(name)) {
      trigger(name).setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger(name).focus();
    }
  }
  function open(name, last = false) {
    if (!menu(name) || !trigger(name)) return;
    close(false);
    active = name;
    const panel = menu(name);
    panel.style.left = '';
    panel.style.right = '';
    panel.hidden = false;
    trigger(name).setAttribute('aria-expanded', 'true');
    const rect = panel.getBoundingClientRect();
    const host = panel.parentElement.getBoundingClientRect();
    const width = getDocument().defaultView.innerWidth;
    if (rect.left < 8 || rect.right > width - 8) {
      panel.style.left = Math.max(8, Math.min(rect.left, width - rect.width - 8)) - host.left + 'px';
      panel.style.right = 'auto';
    }
    const list = items(name);
    (last ? list.at(-1) : list[0])?.focus();
  }
  function toggle(name) {
    if (active === name) close();
    else open(name);
  }
  function bind() {
    const doc = getDocument();
    const root = element('app-topbar');
    if (!doc || !root) return;
    doc.addEventListener('click', event => {
      if (!event.target.closest('[data-v1-menu]')) close(false);
    });
    doc.addEventListener('focusin', event => {
      if (active && !event.target.closest('[data-v1-menu="' + active + '"]')) close(false);
    });
    doc.defaultView.addEventListener('resize', () => close(false));
    root.addEventListener('keydown', event => {
      const opener = event.target.closest('[data-v1-menu-trigger]');
      if (opener && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        open(opener.dataset.v1MenuTrigger, event.key === 'ArrowUp');
        return;
      }
      if (active) {
        event.stopPropagation();
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
          return;
        }
        if (event.key === 'Tab') {
          close();
          return;
        }
        const list = items(active);
        const index = list.indexOf(doc.activeElement);
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
              ? list.length - 1
              : (index + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
          list[next]?.focus();
        }
      } else if (event.target.closest('button') && [' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.stopPropagation();
      }
    });
  }
  return {
    toggle,
    close,
    bind,
    get isOpen() {
      return active !== null;
    },
  };
}

export function createSchemaViewer({ getDocument, getCompiler, getClipboard, download }) {
  let text = '';
  let returnFocus = null;
  const bound = new WeakSet();
  const label = () => 'Schema JSON';
  const element = id => getDocument()?.getElementById(id);
  const isOpen = () => !element('v1-schema-modal')?.classList.contains('hidden');
  function show() {
    text = JSON.stringify(getCompiler().schema(), null, 2);
    const output = element('v1-schema-json');
    output.textContent = text;
    output.scrollTop = 0;
    output.scrollLeft = 0;
    output.setAttribute('aria-label', label());
    element('v1-schema-status').textContent = '';
  }
  function close() {
    if (!isOpen()) return;
    element('v1-schema-modal').classList.add('hidden');
    element('v1-schema-trigger').setAttribute('aria-expanded', 'false');
    element('v1-schema-json').textContent = '';
    element('v1-schema-status').textContent = '';
    text = '';
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }
  function bind(modal) {
    if (bound.has(modal)) return;
    bound.add(modal);
    modal.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'Tab') {
        const controls = [...modal.querySelectorAll('button,[tabindex="0"]')].filter(el => !el.disabled && el.tabIndex >= 0);
        const first = controls[0];
        const last = controls.at(-1);
        const active = getDocument().activeElement;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
  function open() {
    const modal = element('v1-schema-modal');
    if (!modal || isOpen()) return;
    returnFocus = getDocument().activeElement;
    show();
    bind(modal);
    modal.classList.remove('hidden');
    element('v1-schema-trigger').setAttribute('aria-expanded', 'true');
    element('v1-schema-json').focus();
  }
  async function copy() {
    if (!isOpen()) return;
    const content = text;
    const name = label();
    let copied = false;
    try {
      const clipboard = getClipboard();
      if (clipboard?.writeText) {
        await clipboard.writeText(content);
        copied = true;
      }
    } catch {}
    if (!isOpen() || text !== content) return;
    if (!copied && isOpen()) {
      const doc = getDocument();
      const selection = doc.getSelection();
      const range = doc.createRange();
      const saved = [];
      if (selection) {
        for (let i = 0; i < selection.rangeCount; i++) saved.push(selection.getRangeAt(i).cloneRange());
        range.selectNodeContents(element('v1-schema-json'));
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          copied = doc.execCommand('copy');
        } catch {}
        if (copied) {
          selection.removeAllRanges();
          for (const previous of saved) selection.addRange(previous);
        }
      }
    }
    if (isOpen())
      element('v1-schema-status').textContent = copied
        ? 'Đã sao chép ' + name + '.'
        : 'Trình duyệt chưa sao chép được. Chọn JSON và nhấn Ctrl+C, hoặc dùng Tải JSON.';
  }
  function save() {
    if (isOpen()) download('xbrain-deck-v1.schema.json', text + '\n');
  }
  return { open, close, copy, save };
}
