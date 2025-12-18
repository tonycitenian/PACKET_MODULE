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

  // Create Save/Cancel buttons container
  const btns = document.createElement('div');
  btns.style.display = 'flex';
  btns.style.gap = '8px';

  // Check if mobile view (768px or less)
  const isMobile = window.innerWidth <= 768;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'modal-save';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'modal-cancel';
  cancelBtn.textContent = 'Cancel';

  const doneBtn = document.createElement('button');
  doneBtn.className = 'modal-done';
  doneBtn.textContent = 'MARK AS DONE';
  doneBtn.title = 'Save and mark activity as completed';

  // Mobile: Only Cancel + Mark as Done (no Save)
  // Desktop: All 3 buttons (Save + Cancel + Mark as Done)
  if (!isMobile) {
    btns.appendChild(saveBtn);
  }
  btns.appendChild(cancelBtn);
  btns.appendChild(doneBtn);

  controls.appendChild(fontControl);
  controls.appendChild(btns); // Add buttons to header controls
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

  footer.appendChild(wc);
  // Buttons removed from footer - now in header

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
    cancelBtn,
    doneBtn
  };
}

/**
 * Open modal editor for textarea input
 * @param {HTMLTextAreaElement} smallTextarea - Original textarea element
 * @param {string} moduleName - Module name/label
 * @param {string} activityName - Activity name
 * @param {number} activityIndex - Activity index
 * @param {object} activityObj - Activity object
 */
function openInputModal(smallTextarea, moduleName, activityName, activityIndex, activityObj) {
  if (!smallTextarea) return;
  if (smallTextarea.disabled) return;

  const modalParts = createModal();
  modalParts.title.textContent = (moduleName || 'Module') + ' — ' + (activityName || 'Activity');
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

  // Only add Save button handler if Save button exists (desktop only)
  if (modalParts.saveBtn) {
    modalParts.saveBtn.addEventListener('click', () => {
      closeModal(true);
    });
  }

  modalParts.cancelBtn.addEventListener('click', () => {
    closeModal(false);
  });

  // Mark as Done button
  modalParts.doneBtn.addEventListener('click', async () => {
    // Check if activity is already completed/locked
    if (activityObj && (activityObj.status === 'COMPLETED' || activityObj.status === 'LOCKED' || activityObj.status === 'NOT APPLICABLE')) {
      showNotice('Activity is already ' + activityObj.status, 'error');
      return;
    }

    const confirmed = confirm(
      'Mark this activity as DONE?\n\n' +
      'This will save your text and mark the activity as COMPLETED.\n' +
      'Further editing will be disabled.'
    );
    
    if (!confirmed) return;

    // Save the text first
    const newVal = modalParts.textarea.value;
    origin.value = newVal;
    const wcEl = origin.nextElementSibling;
    if (wcEl && wcEl.classList && wcEl.classList.contains('word-count')) {
      wcEl.textContent = countWords(newVal) + ' / ' + MAX_WORDS + ' words';
    }

    // Close modal
    if (modalParts.overlay && modalParts.overlay.parentNode) {
      modalParts.overlay.parentNode.removeChild(modalParts.overlay);
    }

    // Call markAsDone function
    if (typeof markAsDone === 'function' && activityObj) {
      await markAsDone(moduleName, activityIndex, activityObj, origin);
    } else {
      showNotice('Cannot mark as done: missing data', 'error');
    }
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
