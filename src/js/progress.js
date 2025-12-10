/**
 * ============================================
 * PROGRESS TABLE RENDERING
 * ============================================
 * 
 * Renders the student progress table and mobile cards
 */

/**
 * Render the complete progress table
 */
function renderProgressTable() {
  if (!currentUser || !currentUser.modules) return;

  const tbody = document.getElementById('progressTableBody');
  const fragment = document.createDocumentFragment();

  let totalCompleted = 0;
  let totalPending = 0;
  let totalActivities = 0;

  currentUser.modules.forEach(module => {
    module.activities.forEach((activity, index) => {
      totalActivities++;
      
      const row = document.createElement('tr');
      row.setAttribute('data-module', module.module);
      row.setAttribute('data-activity-index', index);
      row.setAttribute('data-col', activity.col || '');
      
      // Module cell
      const moduleCell = document.createElement('td');
      moduleCell.className = 'module-cell';
      if (index === 0) {
        moduleCell.textContent = 'MODULE ' + module.module;
      } else {
        moduleCell.textContent = '';
      }
      row.appendChild(moduleCell);

      // Activity cell
      const activityCell = document.createElement('td');
      activityCell.className = 'activity-cell';
      activityCell.textContent = activity.name;
      row.appendChild(activityCell);

      // Status cell
      const statusCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'status-badge';
      
      const status = (activity.status || '').toUpperCase();
      let isPending = false;
      let isLocked = false;
      let isCompleted = false;
      let isNotApplicable = false;
      
      if (status === 'COMPLETED') {
        badge.className += ' status-done';
        badge.textContent = 'COMPLETED';
        totalCompleted++;
        isCompleted = true;
      } else if (status === 'LOCKED') {
        badge.className += ' status-locked';
        badge.textContent = 'LOCKED';
        isLocked = true;
      } else if (status === 'NOT APPLICABLE' || status === 'N/A' || status === 'NA') {
        badge.className += ' status-na';
        badge.textContent = 'NOT APPLICABLE';
        isNotApplicable = true;
      } else if (status === 'EMPTY' || !status) {
        badge.className += ' status-empty';
        badge.textContent = 'NOT STARTED';
        totalPending++;
      } else {
        badge.className += ' status-pending';
        badge.textContent = 'PENDING';
        totalPending++;
        isPending = true;
      }
      
      statusCell.appendChild(badge);
      row.appendChild(statusCell);

      // Input cell
      const inputCell = document.createElement('td');
      const textarea = document.createElement('textarea');
      textarea.className = 'input-textarea';
      textarea.maxLength = 100000;
      textarea.value = activity.inputText || '';
      textarea.placeholder = 'Enter notes / response (max 1000 words)';
      textarea.readOnly = true;

      textarea.oninput = function() {
        enforceWordLimit(this);
        const wc = countWords(this.value);
        const wcSpan = this.nextElementSibling;
        if (wcSpan) wcSpan.textContent = wc + ' / ' + MAX_WORDS + ' words';
      };

      textarea.addEventListener('click', (e) => {
        if (textarea.disabled) return;
        openInputModal(textarea, module.module, activity.name, index, activity);
        e.stopPropagation();
      });

      const wc = document.createElement('div');
      wc.className = 'word-count';
      wc.textContent = countWords(textarea.value) + ' / ' + MAX_WORDS + ' words';

      if (isCompleted || isLocked || isNotApplicable) {
        textarea.disabled = true;
        textarea.title = 'Disabled: activity is ' + badge.textContent;
      } else {
        textarea.style.cursor = 'pointer';
      }

      inputCell.appendChild(textarea);
      inputCell.appendChild(wc);
      row.appendChild(inputCell);

      // DateTime cell
      const datetimeCell = document.createElement('td');
      datetimeCell.className = 'datetime-cell';
      
      if (activity.rawTimestamp && String(activity.rawTimestamp).trim() !== '') {
        datetimeCell.textContent = activity.rawTimestamp;
      } else {
        datetimeCell.textContent = 'PENDING';
        datetimeCell.classList.add('datetime-pending');
      }
      
      row.appendChild(datetimeCell);

      // Action cell
      const actionCell = document.createElement('td');
      const actionBtn = document.createElement('button');
      actionBtn.className = 'btn-small';
      
      if (isCompleted || isLocked || isNotApplicable) {
        actionBtn.className += ' btn-disabled';
        actionBtn.disabled = true;
        if (isCompleted) actionBtn.textContent = 'COMPLETED';
        else if (isLocked) actionBtn.textContent = 'LOCKED';
        else if (isNotApplicable) actionBtn.textContent = 'NOT APPLICABLE';
      } else {
        actionBtn.className += ' btn-action';
        actionBtn.textContent = 'MARK AS DONE';
        actionBtn.onclick = () => markAsDone(module.module, index, activity, textarea);
      }
      
      actionCell.appendChild(actionBtn);
      row.appendChild(actionCell);

      tbody.appendChild(row);
    });
  });

  // Update statistics
  document.getElementById('statCompleted').textContent = totalCompleted;
  document.getElementById('statPending').textContent = totalPending;
  document.getElementById('statTotal').textContent = totalActivities;
  
  // Render mobile cards
  const cardData = buildCardData();
  if (typeof renderProgressCards === 'function') {
    renderProgressCards(cardData);
  }
}

/**
 * Mark activity as done
 * @param {number} moduleNumber - Module number
 * @param {number} activityIndex - Activity index
 * @param {object} activity - Activity object
 * @param {HTMLTextAreaElement} textareaEl - Textarea element
 */
async function markAsDone(moduleNumber, activityIndex, activity, textareaEl) {
  if (!currentUser) return;
  
  const confirmed = confirm(
    'Mark "' + activity.name + '" in Module ' + moduleNumber + ' as DONE?\n\n' +
    'This will update the status to COMPLETED and disable further editing of the input text.'
  );
  
  if (!confirmed) return;

  const row = currentUser.row;
  const col = activity.col;
  const inputText = textareaEl ? textareaEl.value : '';
  
  // Backup original state for rollback
  const mod = currentUser.modules.find(m => m.module === moduleNumber);
  const originalActivity = mod ? JSON.parse(JSON.stringify(mod.activities[activityIndex])) : null;

  // OPTIMISTIC UPDATE: Update UI immediately
  if (mod && mod.activities[activityIndex]) {
    mod.activities[activityIndex].rawValue = 'DONE';
    mod.activities[activityIndex].status = 'COMPLETED';
    mod.activities[activityIndex].rawTimestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    mod.activities[activityIndex].inputText = inputText;
  }
  
  // Re-render table with optimistic update
  renderProgressTable();
  showNotice('Saving to server...', 'info');

  try {
    const result = await callAPI('updateActivity', {
      row: row,
      colLetter: col,
      newValue: 'DONE',
      inputText: inputText
    });
    
    if (result && result.success) {
      // Update with server timestamp
      if (mod && mod.activities[activityIndex]) {
        mod.activities[activityIndex].rawTimestamp = result.timestamp || mod.activities[activityIndex].rawTimestamp;
      }
      renderProgressTable();
      showNotice('✓ Saved successfully!', 'success');
    } else {
      // Rollback optimistic update on failure
      if (originalActivity && mod) {
        mod.activities[activityIndex] = originalActivity;
        renderProgressTable();
      }
      showNotice('Save failed: ' + (result && result.message ? result.message : 'Unknown error') + '\nPlease try again.', 'error');
    }
  } catch (error) {
    // Rollback optimistic update on error
    if (originalActivity && mod) {
      mod.activities[activityIndex] = originalActivity;
      renderProgressTable();
    }
    console.error(error);
    showNotice('Network error: ' + (error && error.message ? error.message : String(error)) + '\nYour changes were not saved. Please try again.', 'error');
  }
}

/**
 * Build card data array from user modules
 */
function buildCardData() {
  if (!currentUser || !currentUser.modules) return [];
  
  const data = [];
  currentUser.modules.forEach(module => {
    module.activities.forEach(activity => {
      data.push({
        Module: 'MODULE ' + module.module,
        Activity: activity.name,
        Status: activity.status === 'COMPLETED' ? 'Done' : 'Pending',
        Submission: activity.inputText || '',
        Date: activity.rawTimestamp || ''
      });
    });
  });
  
  return data;
}
