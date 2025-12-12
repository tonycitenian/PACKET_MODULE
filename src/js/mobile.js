/**
 * Mobile-specific UI enhancements
 * Handles card layout, collapsible sections, and bottom navigation
 */

// Render progress data as mobile cards
function renderProgressCards(data) {
  const cardsContainer = document.getElementById('progressCardsContainer');
  if (!cardsContainer) return;

  cardsContainer.innerHTML = '';

  data.forEach((row, index) => {
    const card = document.createElement('div');
    card.className = 'progress-card-item';
    card.dataset.rowIndex = index;

    const statusBadge = row.Status === 'Done' 
      ? '<span class="stat-badge success">✓ Done</span>'
      : '<span class="stat-badge pending">⏱ Pending</span>';

    const dateTime = row.Date 
      ? `<div class="card-datetime">📅 ${row.Date}</div>`
      : '<div class="card-datetime card-datetime-pending">Not submitted yet</div>';

    const submissionText = row.Submission 
      ? `<div class="card-submission">${row.Submission.substring(0, 80)}${row.Submission.length > 80 ? '...' : ''}</div>`
      : '<div class="card-submission" style="color: rgba(255,255,255,0.4)">No submission</div>';

    const isDisabled = row.Status === 'Done';
    const buttonText = isDisabled ? '✓ Submitted' : '📝 Submit';

    card.innerHTML = `
      <div class="card-header">
        <div class="card-module">${row.Module}</div>
        <div class="card-status">${statusBadge}</div>
      </div>
      <div class="card-body">
        <div class="card-activity">${row.Activity}</div>
        ${submissionText}
        ${dateTime}
      </div>
      <div class="card-footer">
        <button class="btn-small ${isDisabled ? 'done' : ''}" 
                data-card-index="${index}"
                ${isDisabled ? 'disabled' : ''}>
          ${buttonText}
        </button>
      </div>
    `;

    // Create hidden textarea for this card (needed by openInputModal)
    const textarea = document.createElement('textarea');
    textarea.style.display = 'none';
    textarea.value = row.Submission || '';
    textarea.className = 'mobile-card-textarea';
    textarea.dataset.cardIndex = index;
    card.appendChild(textarea);

    // Add click handler to button
    const button = card.querySelector('button');
    if (button && !isDisabled) {
      button.addEventListener('click', () => {
        if (row.moduleNumber && row.activityObj) {
          openInputModal(textarea, row.moduleNumber, row.Activity, row.activityIndex, row.activityObj);
        }
      });
    }

    cardsContainer.appendChild(card);
  });
}

// Toggle collapsible sections
function toggleCollapsible(element) {
  const content = element.nextElementSibling;
  const icon = element.querySelector('.collapsible-icon');
  
  if (!content || !icon) return;

  const isExpanded = content.classList.contains('expanded');
  
  if (isExpanded) {
    content.classList.remove('expanded');
    icon.classList.remove('expanded');
  } else {
    content.classList.add('expanded');
    icon.classList.add('expanded');
  }
}

// Bottom navigation handling
function initBottomNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all items
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Add active class to clicked item
      this.classList.add('active');
      
      // Handle navigation action
      const action = this.dataset.action;
      
      switch(action) {
        case 'home':
          scrollToTop();
          break;
        case 'progress':
          scrollToProgress();
          break;
        case 'stats':
          scrollToStats();
          break;
        case 'profile':
          showProfileInfo();
          break;
      }
    });
  });
}

// Scroll to top
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Scroll to progress section
function scrollToProgress() {
  const progressCard = document.querySelector('.progress-card');
  if (progressCard) {
    progressCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Scroll to stats
function scrollToStats() {
  const stats = document.querySelector('.progress-stats');
  if (stats) {
    stats.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Show profile info
function showProfileInfo() {
  const studentName = document.getElementById('headerStudentName').textContent;
  showNotice(`Logged in as: ${studentName}`, 'info');
}

// Scroll to top button
function initScrollTopButton() {
  const scrollBtn = document.querySelector('.scroll-top-btn');
  if (!scrollBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  scrollBtn.addEventListener('click', scrollToTop);
}

// Detect if mobile device
function isMobileDevice() {
  return window.innerWidth <= 768;
}

// Initialize mobile features
function initMobileFeatures() {
  if (isMobileDevice()) {
    document.body.classList.add('mobile-nav-active');
    initBottomNavigation();
    initScrollTopButton();
  }
}

// Re-render on window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (isMobileDevice()) {
      document.body.classList.add('mobile-nav-active');
    } else {
      document.body.classList.remove('mobile-nav-active');
    }
  }, 250);
});
