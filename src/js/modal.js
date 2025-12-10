/**
 * ============================================
 * MODAL EDITOR FUNCTIONS
 * ============================================
 * 
 * Fullscreen modal editor with font size controls
 */

/**
 * Create modal DOM structure
 * @returns {object} Modal DOM elements
 */
function createModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.tabIndex = 0;

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Edit input';

  const controls = document.createElement('div');
  controls.className = 'modal-controls';

  const fontControl = document.createElement('div');
  fontControl.className = 'font-control';

  const minusBtn = document.createElement('button');
  minusBtn.type = 'button';
  minusBtn.title = 'Decrease font size';
  minusBtn.textContent = 'A-';

  const plusBtn = document.createElement('button');
  plusBtn.type = 'button';
  plusBtn.title = 'Increase font size';
  plusBtn.textContent = 'A+';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.title = 'Reset font size';
  resetBtn.textContent = 'Reset';

  const range = document.createElement('input');
  range.type = 'range';
  range.min = 12;
  range.max = 40;
  range.step = 1;

  const label = document.createElement('div');
  label.className = 'font-size-label';
  label.textContent = (getPersistedFontSize() || DEFAULT_FONT_PX) + ' px';

  fontControl.appendChild(minusBtn);
  fontControl.appendChild(range);
  fontControl.appendChild(plusBtn);
  fontControl.appendChild(label);
  fontControl.appendChild(resetBtn);

  controls.appendChild(fontControl);
  header.appendChild(title);
  header.appendChild(controls);

  const textarea = document.createElement('textarea');
  textarea.className = 'modal-textarea';
  textarea.placeholder = 'Type your response here (max ' + MAX_WORDS + ' words)';

  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  const wc = document.createElement('div');
  wc.className = 'word-count';
  wc.style.color = '#cbd5e1';
  wc.textContent = '0 / ' + MAX_WORDS + ' words';

  const btns = document.createElement('div');
  btns.style.display = 'flex';
  btns.style.gap = '8px';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'modal-save';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'modal-cancel';
  cancelBtn.textContent = 'Cancel';

  btns.appendChild(saveBtn);
  btns.appendChild(cancelBtn);
  footer.appendChild(wc);
  footer.appendChild(btns);

  modal.appendChild(header);
  modal.appendChild(textarea);
  modal.appendChild(footer);
  overlay.appendChild(modal);

  // Initialize font size
  const persisted = getPersistedFontSize();
  range.value = persisted;
  label.textContent = persisted + ' px';
  textarea.style.fontSize = persisted + 'px';

  // Wire font controls
  minusBtn.addEventListener('click', () => {
    let v = parseInt(range.value, 10) - 1;
    if (v < parseInt(range.min, 10)) v = parseInt(range.min, 10);
    range.value = v;
    range.dispatchEvent(new Event('input'));
  });

  plusBtn.addEventListener('click', () => {
    let v = parseInt(range.value, 10) + 1;
    if (v > parseInt(range.max, 10)) v = parseInt(range.max, 10);
    range.value = v;
    range.dispatchEvent(new Event('input'));
  });

  resetBtn.addEventListener('click', () => {
    range.value = DEFAULT_FONT_PX;
    range.dispatchEvent(new Event('input'));
  });

  range.addEventListener('input', () => {
    const v = parseInt(range.value, 10);
    textarea.style.fontSize = v + 'px';
    label.textContent = v + ' px';
    setPersistedFontSize(v);
  });

  return {
    overlay,
    modal,
    title,
    textarea,
    wc,
    saveBtn,
    cancelBtn
  };
}

/**
 * Open modal editor for textarea input
 * @param {HTMLTextAreaElement} smallTextarea - Original textarea element
 * @param {number} moduleNumber - Module number
 * @param {string} activityName - Activity name
 * @param {number} activityIndex - Activity index
 * @param {object} activityObj - Activity object
 */
function openInputModal(smallTextarea, moduleNumber, activityName, activityIndex, activityObj) {
  if (!smallTextarea) return;
  if (smallTextarea.disabled) return;

  const modalParts = createModal();
  modalParts.title.textContent = 'Module ' + moduleNumber + ' — ' + (activityName || 'Activity');
  modalParts.textarea.value = smallTextarea.value || '';
  modalParts.textarea.value = enforceWordLimitOnValue(modalParts.textarea.value);
  modalParts.wc.textContent = countWords(modalParts.textarea.value) + ' / ' + MAX_WORDS + ' words';

  document.body.appendChild(modalParts.overlay);

  const origin = smallTextarea;

  setTimeout(() => {
    modalParts.textarea.focus();
    modalParts.textarea.selectionStart = modalParts.textarea.selectionEnd = modalParts.textarea.value.length;
  }, 50);

  modalParts.textarea.addEventListener('input', () => {
    enforceWordLimit(modalParts.textarea);
    modalParts.wc.textContent = countWords(modalParts.textarea.value) + ' / ' + MAX_WORDS + ' words';
  });

  function closeModal(apply) {
    if (modalParts.overlay && modalParts.overlay.parentNode) {
      modalParts.overlay.parentNode.removeChild(modalParts.overlay);
    }
    if (apply) {
      const newVal = modalParts.textarea.value;
      origin.value = newVal;
      const wcEl = origin.nextElementSibling;
      if (wcEl && wcEl.classList && wcEl.classList.contains('word-count')) {
        wcEl.textContent = countWords(newVal) + ' / ' + MAX_WORDS + ' words';
      }
    }
    try {
      origin.focus();
    } catch (e) {}
  }

  modalParts.saveBtn.addEventListener('click', () => {
    closeModal(true);
  });

  modalParts.cancelBtn.addEventListener('click', () => {
    closeModal(false);
  });

  modalParts.overlay.addEventListener('click', (ev) => {
    if (ev.target === modalParts.overlay) {
      closeModal(false);
    }
  });

  function onKeyDown(ev) {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      closeModal(false);
      window.removeEventListener('keydown', onKeyDown);
    } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      closeModal(true);
    }
  }
  window.addEventListener('keydown', onKeyDown);
}
