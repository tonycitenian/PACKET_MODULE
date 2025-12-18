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
  tbody.innerHTML = '';

  let totalCompleted = 0;
  let totalPending = 0;
  let totalActivities = 0;

  currentUser.modules.forEach(module => {
    if (!module || !module.activities) return; // Skip if module is invalid
    
    module.activities.forEach((activity, index) => {
      if (!activity) return; // Skip if activity is invalid
      
      totalActivities++;
      
      const row = document.createElement('tr');
      row.setAttribute('data-module', module.module || '');
      row.setAttribute('data-activity-index', index);
      row.setAttribute('data-col', activity.col || '');

      // Module cell
      const moduleCell = document.createElement('td');
      moduleCell.className = 'module-cell';
      moduleCell.textContent = module.module || 'Unknown Module';
      row.appendChild(moduleCell);

      // Activity cell
      const activityCell = document.createElement('td');
      activityCell.className = 'activity-cell';
      activityCell.textContent = activity.name || 'Unknown Activity';
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
      let isMissing = false;
      
      if (status === 'COMPLETED') {
        badge.className += ' status-done';
        badge.textContent = 'COMPLETED';
        totalCompleted++;
        isCompleted = true;
      } else if (status === 'MISSING') {
        badge.className += ' status-missing';
        badge.textContent = 'MISSING';
        totalPending++;
        isMissing = true;
      } else if (status === 'LOCKED') {
        badge.className += ' status-locked';
        badge.textContent = 'LOCKED';
        isLocked = true;
      } else if (status === 'NOT APPLICABLE') {
        badge.className += ' status-na';
        badge.textContent = 'NOT APPLICABLE';
        isNotApplicable = true;
      } else if (status === 'PENDING') {
        badge.className += ' status-pending';
        badge.textContent = 'PENDING';
        totalPending++;
        isPending = true;
      } else {
        // Fallback for any other status
        badge.className += ' status-empty';
        badge.textContent = status || 'NOT STARTED';
        totalPending++;
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
        // Allow editing for PENDING, MISSING, and other editable statuses
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
        // Both MISSING and PENDING show "MARK AS DONE"
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
 * @param {string} moduleName - Module name/label
 * @param {number} activityIndex - Activity index
 * @param {object} activity - Activity object
 * @param {HTMLTextAreaElement} textareaEl - Textarea element
 */
async function markAsDone(moduleName, activityIndex, activity, textareaEl) {
  if (!currentUser) return;

  const confirmed = confirm(
    'Mark "' + activity.name + '" in ' + moduleName + ' as DONE?\n\n' +
    'This will update the status to COMPLETED and disable further editing of the input text.'
  );
  
  if (!confirmed) return;

  const row = currentUser.row;
  const col = activity.col;
  const inputText = textareaEl ? textareaEl.value : '';

  const tbody = document.getElementById('progressTableBody');
  const rows = tbody.querySelectorAll('tr');
  let targetRow = null;
  
  // Find desktop row
  rows.forEach(r => {
    if (r.getAttribute('data-module') == moduleName &&
        r.getAttribute('data-activity-index') == activityIndex) {
      targetRow = r;
      r.classList.add('updating-row');
      const btn = r.querySelector('.btn-action');
      if (btn) {
        btn.disabled = true;
        btn.classList.add('loading');
        btn.textContent = 'Submitting...';
      }
    }
  });

  // Find mobile card
  const cards = document.querySelectorAll('.progress-card-item');
  let targetCard = null;
  cards.forEach(card => {
    const cardModule = card.querySelector('.card-module')?.textContent || '';
    const cardActivity = card.querySelector('.card-activity')?.textContent || '';
    if (cardModule === moduleName && cardActivity === activity.name) {
      targetCard = card;
      card.classList.add('card-updating');
      const btn = card.querySelector('button');
      if (btn) {
        btn.disabled = true;
        btn.classList.add('loading');
        btn.textContent = 'Submitting...';
      }
    }
  });

  try {
    const result = await callAPI('updateActivity', {
      row: row,
      colLetter: col,
      newValue: 'DONE',
      inputText: inputText
    });
    
    if (result && result.success) {
      // Show bouncing checkmark and success flash on desktop
      if (targetRow) {
        targetRow.classList.remove('updating-row');
        
        // Add bouncing checkmark
        const successBadge = document.createElement('div');
        successBadge.className = 'success-badge';
        successBadge.innerHTML = '<div class="checkmark-circle">✓</div>';
        targetRow.style.position = 'relative';
        targetRow.appendChild(successBadge);
        
        // Add flash animation
        targetRow.classList.add('success-flash');
        
        // Remove checkmark after animation
        setTimeout(() => {
          targetRow.classList.remove('success-flash');
          successBadge.remove();
        }, 600);
      }

      // Show bouncing checkmark and success flash on mobile
      if (targetCard) {
        targetCard.classList.remove('card-updating');
        
        // Add bouncing checkmark
        const successBadge = document.createElement('div');
        successBadge.className = 'success-badge';
        successBadge.innerHTML = '<div class="checkmark-circle">✓</div>';
        targetCard.style.position = 'relative';
        targetCard.appendChild(successBadge);
        
        // Add flash animation
        targetCard.classList.add('success-flash');
        
        // Remove checkmark after animation
        setTimeout(() => {
          targetCard.classList.remove('success-flash');
          successBadge.remove();
        }, 600);
      }
      
      // Auto-refresh to get latest data from Google Sheets (with slight delay)
      setTimeout(async () => {
        if (typeof refreshData === 'function') {
          await refreshData();
        } else {
          // Fallback: manual update if refresh not available
          const mod = currentUser.modules.find(m => m.module === moduleName);
          if (mod && mod.activities[activityIndex]) {
            mod.activities[activityIndex].rawValue = 'DONE';
            mod.activities[activityIndex].rawTimestamp = result.timestamp || new Date().toString();
            mod.activities[activityIndex].status = 'COMPLETED';
            mod.activities[activityIndex].inputText = inputText;
          }
          renderProgressTable();
        }
        showNotice('✓ Activity marked as DONE successfully!', 'success');
      }, 400);
    } else {
      if (targetRow) targetRow.classList.remove('updating-row');
      if (targetCard) targetCard.classList.remove('card-updating');
      showNotice(result && result.message ? result.message : 'Failed to update activity', 'error');
    }
  } catch (error) {
    if (targetRow) targetRow.classList.remove('updating-row');
    if (targetCard) targetCard.classList.remove('card-updating');
    console.error(error);
    showNotice('Error updating activity: ' + (error && error.message ? error.message : String(error)), 'error');
  }
}

/**
 * Build card data array from user modules
 */
function buildCardData() {
  if (!currentUser || !currentUser.modules) return [];
  
  const data = [];
  currentUser.modules.forEach(module => {
    module.activities.forEach((activity, index) => {
      data.push({
        Module: module.module || 'Unknown Module',
        Activity: activity.name,
        Status: activity.status === 'COMPLETED' ? 'Done' : 'Pending',
        Submission: activity.inputText || '',
        Date: activity.rawTimestamp || '',
        // Keep metadata for Option 2
        moduleNumber: module.module,
        activityIndex: index,
        activityObj: activity
      });
    });
  });
  
  return data;
}
