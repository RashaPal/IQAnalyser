/**
 * Enhanced UI Controller for Jira Epic Analyzer
 * With improvements for child issue display and metrics
 * Fixed version that properly handles clickable rows and epic detail popups
 */
class UIController {


// Add to the UIController class constructor
constructor() {
  this.epicsData = [];
  this.metricsData = null;
  this.filteredEpics = [];
  
  // Pagination state
  this.currentPage = 1;
  this.rowsPerPage = 20; // Default
  
  // Sorting state - add these new properties
  this.sortDirection = 'desc'; // Start with descending order
  this.sortColumn = 'id'; // Default sort by ID
  
  // Debug mode
  this.debugMode = true;

    // Initialize UI components
    this.initializeEventListeners();
    // Add dark mode toggle
    this.addDarkModeToggle();
}
  

  /**
   * Set up event listeners for interactive elements
   */
  initializeEventListeners() {
    // File input change listeners
    const mainFileInput = document.getElementById('mainCsvFile');
    const mainFileDisplay = document.getElementById('mainFileName');
    if (mainFileInput && mainFileDisplay) {
      mainFileInput.addEventListener('change', () => {
        Utils.setFileNameDisplay(mainFileInput, mainFileDisplay);
      });
    }
    
    const timeFileInput = document.getElementById('timeCsvFile');
    const timeFileDisplay = document.getElementById('timeFileName');
    if (timeFileInput && timeFileDisplay) {
      timeFileInput.addEventListener('change', () => {
        Utils.setFileNameDisplay(timeFileInput, timeFileDisplay);
      });
    }
    
    // Filter change listeners
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    const sprintFilter = document.getElementById('sprintFilter');
    if (sprintFilter) {
      sprintFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    // Add SLA Status filter listener
    const slaStatusFilter = document.getElementById('slaStatusFilter');
    if (slaStatusFilter) {
      slaStatusFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    // Pagination controls
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    if (rowsPerPageSelect) {
      rowsPerPageSelect.addEventListener('change', (e) => {
        this.rowsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
        this.currentPage = 1; // Reset to first page
        this.applyFilters();
      });
    }
    
    const prevPageBtn = document.getElementById('prevPageBtn');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.updatePaginatedTable();
        }
      });
    }
    
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        const totalPages = this.calculateTotalPages();
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.updatePaginatedTable();
        }
      });
    }
    
    // Handle ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }
  
  /**
   * Debugging helper
   */
  debug(message, data) {
    if (this.debugMode) {
      console.log(`[EPIC-DEBUG] ${message}`, data);
    }
  }
  
  /**
   * Close all open modals
   */
  closeAllModals() {
    const modals = document.querySelectorAll('.epic-detail-modal, .email-modal');
    modals.forEach(modal => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
  }
  
  /**
   * Reset the form and clear all data
   */
  resetForm() {
    // Reset file inputs
    const mainFileInput = document.getElementById('mainCsvFile');
    const timeFileInput = document.getElementById('timeCsvFile');
    const mainFileDisplay = document.getElementById('mainFileName');
    const timeFileDisplay = document.getElementById('timeFileName');
    
    if (mainFileInput) mainFileInput.value = '';
    if (timeFileInput) timeFileInput.value = '';
    if (mainFileDisplay) mainFileDisplay.textContent = 'No file selected';
    if (timeFileDisplay) timeFileDisplay.textContent = 'No file selected';
    
    // Reset filter dropdowns to 'all'
    const filters = ['statusFilter', 'sprintFilter', 'slaStatusFilter'];
    filters.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = 'all';
    });
    
    // Reset pagination
    this.currentPage = 1;
    
    const currentPageElem = document.getElementById('currentPage');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (currentPageElem) currentPageElem.textContent = '1';
    if (paginationInfo) paginationInfo.textContent = 'Showing 0-0 of 0 items';
    if (prevPageBtn) prevPageBtn.disabled = true;
    if (nextPageBtn) nextPageBtn.disabled = true;
    
    // Hide results
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) resultsSection.style.display = 'none';
    
    // Clear error message using ErrorHandler
    if (window.ErrorHandler) ErrorHandler.clear();
    
    // Reset data
    this.epicsData = [];
    this.filteredEpics = [];
    this.metricsData = null;
  }
  
/**
 * Display the results in the UI
 * @param {Array} epics - Processed epic data
 * @param {Object} metrics - Calculated metrics
 */
displayResults(epics, metrics) {
  console.log("Displaying results with epics:", epics);
  
  // Store data for filtering
  this.epicsData = epics;
  this.filteredEpics = epics; // Initially, filtered is same as all
  this.metricsData = metrics;
  
  // Reset pagination to first page
  this.currentPage = 1;
  
  // Show results section
  const resultsSection = document.getElementById('resultsSection');
  if (resultsSection) resultsSection.style.display = 'block';
  
  // Reset filters to 'all'
  const filters = {
    statusFilter: document.getElementById('statusFilter'),
    sprintFilter: document.getElementById('sprintFilter'),
    slaStatusFilter: document.getElementById('slaStatusFilter')
  };
  
  Object.values(filters).forEach(filter => {
    if (filter) filter.value = 'all';
  });
  
  // Reset rows per page to default
  const rowsPerPage = document.getElementById('rowsPerPage');
  if (rowsPerPage) {
    rowsPerPage.value = this.rowsPerPage === 'all' ? 'all' : this.rowsPerPage.toString();
  }
  
  // Update available filter options
  this.updateFilters(epics);
  
  // Update table headers to be sortable
  this.updateTableHeaders();
  
  // Sort epics based on current sort settings
  this.sortEpics();
  
  // Update metrics summary
  this.updateMetricsSummary(metrics);
  
  // Update table with pagination
  this.updatePaginatedTable();
}
  
  /**
   * Update the filter dropdowns with available options
   * @param {Array} epics - Epic data
   */
  updateFilters(epics) {
    // Extract unique statuses and sprints
    const statuses = Utils.getUniqueValues(epics, 'status');
    const sprints = Utils.getUniqueValues(epics, 'sprint');
    
    // Update status filter
    Utils.updateSelectOptions(document.getElementById('statusFilter'), statuses);
    
    // Update sprint filter
    Utils.updateSelectOptions(document.getElementById('sprintFilter'), sprints);
  }
  
  /**
   * Update the metrics summary section
   * @param {Object} metrics - Calculated metrics
   */
  updateMetricsSummary(metrics) {
    const { overall, sprintData } = metrics;
    
    // Create metrics summary HTML
    let html = `
      <div class="metrics-card">
        <div class="metric-item">
          <span class="metric-value">${overall.totalEpics}</span>
          <span class="metric-label">Total Epics</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">${Utils.formatPercentage(parseFloat(overall.realization))}</span>
          <span class="metric-label">Sprint Realization</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">${overall.avgCycleTime}</span>
          <span class="metric-label">Avg Cycle Time (days)</span>
        </div>
        <div class="metric-item">
          <span class="metric-value">${overall.atRiskCount} (${Utils.formatPercentage(parseFloat(overall.atRiskPercentage))})</span>
          <span class="metric-label">Epics At Risk</span>
        </div>
      </div>
      
      <h3>Sprint Metrics</h3>
      <table class="sprint-metrics-table">
        <thead>
          <tr>
            <th>Sprint</th>
            <th>Committed Points</th>
            <th>Completed Points</th>
            <th>Realization %</th>
            <th>Avg Cycle Time</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add sprint rows
    sprintData.forEach(sprint => {
      html += `
        <tr>
          <td>${sprint.name}</td>
          <td>${Utils.formatNumber(sprint.committed, 1)}</td>
          <td>${Utils.formatNumber(sprint.completed, 1)}</td>
          <td>${sprint.realization}%</td>
          <td>${sprint.avgCycleTime}</td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    
    // Update the metrics summary element
    const metricsSummary = document.getElementById('metricsSummary');
    if (metricsSummary) {
      metricsSummary.innerHTML = html;
    }
  }
  

/**
 * Enhance the updateResultsTable method in UIController to display child badges more clearly
 * This is a snippet to update in your existing UIController class
 * Update the results table with epic data
 * FIXED: now properly marks rows as clickable and includes clearer child counts
 * @param {Array} epics - Epic data to display
 */
/**
 * Update the results table with epic data
 * @param {Array} epics - Epic data to display
 */
updateResultsTable(epics) {
  const tableBody = document.getElementById('resultsBody');
  if (!tableBody) {
    this.debug('Results table body not found!', null);
    return;
  }
  
  this.debug(`Updating table with ${epics.length} epics`, epics);
  
  // Clear existing content
  tableBody.innerHTML = '';
  
  // Add each epic
  epics.forEach(epic => {
    // Create a new row for the epic
    const row = document.createElement('tr');
    
    // Make ALL rows clickable for consistent UX
    row.classList.add('clickable-row');
    row.setAttribute('data-epic-id', epic.id);
    row.title = 'Click to view epic details';
    
    // Add child issue count badge if there are children
    const childrenCount = epic.children ? epic.children.length : 0;
    let childBadge = '';
    
    if (childrenCount > 0) {
      childBadge = `<span class="children-badge" title="${childrenCount} child issues">${childrenCount}</span>`;
    }
    
    // Create email button for at-risk epics
    let actionCell = '';
    if (epic.slaStatus && epic.slaStatus.class === 'at-risk') {
      actionCell = `
        <button class="email-btn" data-epic-id="${epic.id}" title="Send escalation email">
          <i class="fas fa-envelope"></i>
        </button>
      `;
    }
    
    // Format points display to show both epic points and total points if they differ
    let pointsDisplay = epic.storyPoints || '0';
    if (epic.totalStoryPoints && epic.totalStoryPoints !== epic.storyPoints) {
      pointsDisplay = `${epic.storyPoints || '0'} <span class="total-points">(${epic.totalStoryPoints.toFixed(1)})</span>`;
    }
    
    // Calculate completion percentage
    let completionPercentage = '0%';
    let completionBar = '';
    if (epic.totalStoryPoints > 0) {
      const percentage = (epic.completedStoryPoints / epic.totalStoryPoints) * 100;
      completionPercentage = `${percentage.toFixed(1)}%`;
      
      // Add visual completion bar
      completionBar = `
        <div class="completion-indicator" title="${completionPercentage} completed">
          <div class="completion-bar" style="width: ${percentage.toFixed(1)}%"></div>
        </div>
      `;
    }
    
    // Format sprint as badge
    const sprintDisplay = epic.sprint ? 
      `<span class="sprint-badge">${epic.sprint}</span>` : 
      '-';
    
    // Populate the row with epic data
    row.innerHTML = `
      <td>${epic.id} ${childBadge}</td>
      <td>${epic.name}</td>
      <td>${epic.status}</td>
      <td>${epic.timeInStatus || '-'}</td>
      <td>${sprintDisplay}</td>
      <td>${pointsDisplay}</td>
      <td>${epic.cycleTime || '-'}</td>
      <td class="${epic.slaStatus.class}">${epic.slaStatus.text}</td>
      <td>${completionPercentage} ${completionBar}</td>
      <td class="epic-actions">${actionCell}</td>
    `;
    
    // Add the row to the table
    tableBody.appendChild(row);
  });
  
  // Add event listeners to rows and buttons AFTER they're all added to the DOM
  this.attachRowClickHandlers();
  this.attachEmailButtonListeners();
}
  /**
   * Attach event listeners to clickable rows
   * FIXED: now properly attaches event listeners to all rows
   */
  attachRowClickHandlers() {
    const clickableRows = document.querySelectorAll('.clickable-row');
    this.debug(`Found ${clickableRows.length} clickable rows`, clickableRows);
    
    if (clickableRows.length === 0) {
      console.warn('No clickable rows found. Check row creation in updateResultsTable.');
    }
    
    clickableRows.forEach(row => {
      row.addEventListener('click', (event) => {
        // Don't trigger if clicking on the email button
        if (event.target.closest('.email-btn')) {
          return;
        }
        
        const epicId = row.getAttribute('data-epic-id');
        this.debug(`Row clicked for epic ${epicId}`);
        
        const epic = this.findEpicById(epicId);
        if (epic) {
          this.showEpicDetailPopup(epic);
        } else {
          console.error(`Epic not found for ID: ${epicId}`);
        }
      });
    });
  }
  
  /**
   * Attach event listeners to email buttons
   */
  attachEmailButtonListeners() {
    const emailButtons = document.querySelectorAll('.email-btn');
    this.debug(`Found ${emailButtons.length} email buttons`, emailButtons);
    
    emailButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation(); // Prevent row click event from triggering
        
        const epicId = button.getAttribute('data-epic-id');
        this.debug(`Email button clicked for epic ${epicId}`);
        
        const epic = this.findEpicById(epicId);
        
        if (epic) {
          this.showEmailDialog(epic);
        }
      });
    });
  }
  
  /**
   * Find epic by ID
   * @param {string} epicId - Epic ID to find
   * @returns {Object|null} - Found epic or null
   */
  findEpicById(epicId) {
    const epic = this.epicsData.find(epic => epic.id === epicId);
    if (!epic) {
      console.error(`Epic with ID ${epicId} not found in data:`, this.epicsData);
      return null;
    }
    return epic;
  }
  
  /**
   * Show epic detail popup with child issues
   * FIXED: now properly displays child issues and handles edge cases
   * @param {Object} epic - Epic data
   */
  showEpicDetailPopup(epic) {
    if (!epic) {
      console.error('Cannot show detail popup: Epic not found');
      return;
    }
    
    this.debug(`Showing detail popup for epic ${epic.id}`, epic);
    
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'epic-detail-modal';
    
    // Calculate child issue statistics
    const childIssues = epic.children || [];
    const totalChildIssues = childIssues.length;
    
    this.debug(`Epic has ${totalChildIssues} child issues`, childIssues);
    
    const completedChildIssues = childIssues.filter(issue => 
      issue.isCompleted || DataProcessor.COMPLETED_STATUSES.includes(issue.status?.toLowerCase())
    ).length;
    
    const completionPercentage = totalChildIssues > 0 ? Math.round((completedChildIssues / totalChildIssues) * 100) : 0;
    
    // Group child issues by status
    const issuesByStatus = {};
    childIssues.forEach(issue => {
      const status = issue.status || 'No Status';
      if (!issuesByStatus[status]) {
        issuesByStatus[status] = [];
      }
      issuesByStatus[status].push(issue);
    });
    
    // Create status tabs HTML
    const statusNames = Object.keys(issuesByStatus);
    let tabsHtml = `
      <div class="status-tabs">
        <button class="status-tab active" data-status="all">All (${totalChildIssues})</button>
    `;
    
    statusNames.forEach(status => {
      tabsHtml += `
        <button class="status-tab" data-status="${status}">${status} (${issuesByStatus[status].length})</button>
      `;
    });
    
    tabsHtml += `</div>`;
    
    // Create child issues table HTML
    let childIssuesHtml = '';
    if (totalChildIssues > 0) {
      childIssuesHtml = `
        <table class="child-issues-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Story Points</th>
              <th>Sprint</th>
            </tr>
          </thead>
          <tbody>
            ${childIssues.map(issue => `
              <tr data-status="${issue.status || 'No Status'}" class="child-issue-row">
                <td>${issue.id || issue.key}</td>
                <td>${issue.name || issue.summary}</td>
                <td>${issue.status || 'No Status'}</td>
                <td>${issue.storyPoints || '-'}</td>
                <td>${issue.sprint || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      childIssuesHtml = '<p>No child issues found for this epic.</p>';
    }
    
    // Build the complete modal content
    modal.innerHTML = `
      <div class="epic-detail-content">
        <span class="epic-detail-close">&times;</span>
        <div class="epic-detail-header">
          <h3>${epic.name} <span class="epic-id">${epic.id}</span></h3>
          <div class="epic-status">Status: <span class="status-badge ${epic.slaStatus.class}">${epic.status}</span></div>
        </div>
        
        <div class="epic-summary">
          <div class="summary-item">
            <span class="summary-label">Sprint:</span> 
            <span class="summary-value">${epic.sprint || 'Not Assigned'}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Story Points:</span> 
            <span class="summary-value">${epic.totalStoryPoints || epic.storyPoints || '-'}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Time in Status:</span> 
            <span class="summary-value">${epic.timeInStatus || '-'}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">SLA Status:</span> 
            <span class="summary-value ${epic.slaStatus.class}">${epic.slaStatus.text}</span>
          </div>
        </div>
        
        <div class="child-issues-summary">
          <h4>Child Issues <span class="child-count">${completedChildIssues} of ${totalChildIssues} completed</span></h4>
          <div class="completion-indicator">
            <div class="completion-bar" style="width: ${completionPercentage}%"></div>
            <span>${completionPercentage}%</span>
          </div>
        </div>
        
        ${totalChildIssues > 0 ? tabsHtml : ''}
        
        <div class="child-issues-container">
          ${childIssuesHtml}
        </div>
      </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Set up event listeners
    const closeBtn = modal.querySelector('.epic-detail-close');
    
    // Close modal function
    const closeModal = () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    };
    
    // Add event listeners
    closeBtn.addEventListener('click', closeModal);
    
    // Add click outside to close
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
    
    // Add tab switching functionality
    if (totalChildIssues > 0) {
      const tabs = modal.querySelectorAll('.status-tab');
      const childRows = modal.querySelectorAll('.child-issue-row');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          tabs.forEach(t => t.classList.remove('active'));
          
          // Add active class to clicked tab
          tab.classList.add('active');
          
          const status = tab.getAttribute('data-status');
          
          // Show/hide rows based on status
          childRows.forEach(row => {
            if (status === 'all' || row.getAttribute('data-status') === status) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          });
        });
      });
    }
  }
  /**
   * Show email dialog for epic
   * @param {Object} epic - Epic data
   */
  showEmailDialog(epic) {
    // Generate email template using DataProcessor
    const emailTemplate = DataProcessor.generateEscalationEmailTemplate(epic);
    
    // Create email suggestions based on epic data
    const projectLead = epic.projectLead || ""; 
    const creator = epic.creator || "";         
    const assignee = epic.assignee || "";       
    
    // Format the names for email if they exist
    const formatEmailName = (name) => {
      if (!name) return "";
      // Remove any titles, keep just first and last name
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0].toLowerCase();
        const lastName = nameParts[nameParts.length - 1].toLowerCase();
        return `${firstName}.${lastName}@company.com`;
      }
      return "";
    };
    
    const projectLeadEmail = formatEmailName(projectLead);
    const creatorEmail = formatEmailName(creator);
    const assigneeEmail = formatEmailName(assignee);
    
    // Create suggestions array, filtering out empty ones
    const suggestions = [];
    if (projectLead) {
      suggestions.push({
        role: 'Project Lead',
        name: projectLead,
        email: projectLeadEmail
      });
    }
    
    if (creator) {
      suggestions.push({
        role: 'Creator',
        name: creator,
        email: creatorEmail
      });
    }
    
    if (assignee) {
      suggestions.push({
        role: 'Assignee',
        name: assignee,
        email: assigneeEmail
      });
    }
    
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'email-modal';
    
    // Create suggestions HTML
    let suggestionsHTML = '';
    if (suggestions.length > 0) {
      suggestionsHTML = `
        <div class="email-suggestions">
          ${suggestions.map(suggestion => `
            <div class="suggestion-item">
              <span class="suggestion-role">${suggestion.role}:</span>
              <span class="suggestion-name">${suggestion.name}</span>
              ${suggestion.email ? `<button class="add-recipient-btn" data-email="${suggestion.email}" title="Add to recipients"><i class="fas fa-plus"></i></button>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Add child issues summary if available
    let childIssuesSummary = '';
    if (epic.childIssues && epic.childIssues.length > 0) {
      const totalChildIssues = epic.childIssues.length;
      const completedChildIssues = epic.childIssues.filter(issue => 
        DataProcessor.COMPLETED_STATUSES.includes(issue.status?.toLowerCase())
      ).length;
      
      childIssuesSummary = `
        <div class="child-issues-summary">
          <h4>Child Issues Status</h4>
          <p>${completedChildIssues} of ${totalChildIssues} child issues completed</p>
          <div class="completion-indicator">
            <div class="completion-bar" style="width: ${Math.round((completedChildIssues / totalChildIssues) * 100)}%"></div>
          </div>
        </div>
      `;
    }
    
    modal.innerHTML = `
      <div class="email-modal-content">
        <span class="email-modal-close">&times;</span>
        <h3>Send Escalation Email for Epic ${epic.id}</h3>
        
        ${childIssuesSummary}
        
        <div class="email-form">
          ${suggestionsHTML}
        
          <div class="email-form-group">
            <label for="email-to">To:</label>
            <input type="email" id="email-to" placeholder="Enter recipient email addresses" value="${emailTemplate.recipient}" multiple>
          </div>
          
          <div class="email-form-group">
            <label for="email-subject">Subject:</label>
            <input type="text" id="email-subject" value="${emailTemplate.subject}">
          </div>
          
          <div class="email-form-group">
            <label for="email-body">Message:</label>
            <textarea id="email-body" rows="12">${emailTemplate.body}</textarea>
          </div>
          
          <div class="email-actions">
            <button id="send-email-btn" class="primary-btn">
              <i class="fas fa-paper-plane"></i> Send Email
            </button>
            <button id="cancel-email-btn" class="secondary-btn">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.email-modal-close');
    const cancelBtn = modal.querySelector('#cancel-email-btn');
    const sendBtn = modal.querySelector('#send-email-btn');
    
    const closeModal = () => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Add event listeners for the add recipient buttons
    const addRecipientBtns = modal.querySelectorAll('.add-recipient-btn');
    addRecipientBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        const toField = modal.querySelector('#email-to');
        
        // Add email to the To field
        if (toField.value) {
          // Check if the email is already in the list
          if (!toField.value.includes(email)) {
            toField.value += `, ${email}`;
          }
        } else {
          toField.value = email;
        }
        
        // Flash the button to indicate it was added
        btn.classList.add('added');
        setTimeout(() => {
          btn.classList.remove('added');
        }, 1000);
      });
    });
    
    // Add send email functionality
    sendBtn.addEventListener('click', () => {
      const to = modal.querySelector('#email-to').value;
      const subject = modal.querySelector('#email-subject').value;
      const body = modal.querySelector('#email-body').value;
      
      // Encode the email body for mailto
      const encodedBody = encodeURIComponent(body);
      const encodedSubject = encodeURIComponent(subject);
      
      // Create mailto link and open it
      const mailtoLink = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
      window.location.href = mailtoLink;
      
      // Close the modal after sending
      closeModal();
      
      // Show success message
      if (window.ErrorHandler) {
        ErrorHandler.handle(
          `Email client opened with escalation for Epic ${epic.id}`,
          '', true, 'info'
        );
      }
    });
    
    // Focus the To field
    setTimeout(() => {
      modal.querySelector('#email-to').focus();
    }, 100);
  }
  
/**
 * Apply filters to the data and update the display
 */
applyFilters() {
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';
  const sprintFilter = document.getElementById('sprintFilter')?.value || 'all';
  const slaStatusFilter = document.getElementById('slaStatusFilter')?.value || 'all';
  
  // Filter epics based on selected filters
  this.filteredEpics = [...this.epicsData];
  
  if (statusFilter !== 'all') {
    this.filteredEpics = this.filteredEpics.filter(epic => epic.status === statusFilter);
  }
  
  if (sprintFilter !== 'all') {
    this.filteredEpics = this.filteredEpics.filter(epic => epic.sprint === sprintFilter);
  }
  
  if (slaStatusFilter !== 'all') {
    this.filteredEpics = this.filteredEpics.filter(epic => epic.slaStatus.class === slaStatusFilter);
  }
  
  // Reset to first page when filters change
  this.currentPage = 1;
  
  // Re-sort the filtered epics to maintain sort order
  this.sortEpics();
  
  // Update table with filtered and paginated data
  this.updatePaginatedTable();
}
  
  /**
   * Calculate the total number of pages
   * @returns {number} - Total pages
   */
  calculateTotalPages() {
    if (this.rowsPerPage === 'all' || !this.filteredEpics.length) {
      return 1;
    }
    return Math.ceil(this.filteredEpics.length / this.rowsPerPage);
  }
  
  /**
   * Update the table with paginated data
   */
  updatePaginatedTable() {
    const totalItems = this.filteredEpics.length;
    const totalPages = this.calculateTotalPages();
    
    // Ensure current page is valid
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    
    // Get current page data
    let currentPageData;
    if (this.rowsPerPage === 'all') {
      currentPageData = this.filteredEpics;
    } else {
      const startIndex = (this.currentPage - 1) * this.rowsPerPage;
      const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
      currentPageData = this.filteredEpics.slice(startIndex, endIndex);
    }
    
    // Update table with current page data
    this.updateResultsTable(currentPageData);
    
    // Update pagination controls
    this.updatePaginationControls(totalItems, totalPages);
  }
  
  /**
   * Update pagination controls and info
   * @param {number} totalItems - Total number of items
   * @param {number} totalPages - Total number of pages
   */
  updatePaginationControls(totalItems, totalPages) {
    // Update pagination info text
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
      if (this.rowsPerPage === 'all') {
        paginationInfo.textContent = `Showing all ${totalItems} items`;
      } else {
        const startItem = totalItems === 0 ? 0 : (this.currentPage - 1) * this.rowsPerPage + 1;
        const endItem = Math.min(startItem + this.rowsPerPage - 1, totalItems);
        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} items`;
      }
    }
    
    // Update current page text
    const currentPageElem = document.getElementById('currentPage');
    if (currentPageElem) {
      currentPageElem.textContent = this.currentPage;
    }
    
    // Enable/disable pagination buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= totalPages || this.rowsPerPage === 'all';
    }
  }

/**
 * Update the table headers to make them sortable
 */
updateTableHeaders() {
  const headers = document.querySelectorAll('#resultsTable th');
  
  // Map of columns to their data attributes for sorting
  const sortableColumns = {
    'Epic ID': 'id',
    'Epic Name': 'name',
    'Current Status': 'status',
    'Time in Status': 'timeInStatus',
    'Sprint': 'sprint',
    'Story Points': 'totalStoryPoints',
    'Cycle Time (days)': 'cycleTime',
    'SLA Status': 'slaStatus',
    'Completion': 'completion'
  };
  
  headers.forEach(header => {
    const columnName = header.textContent.trim();
    const dataAttribute = sortableColumns[columnName];
    
    // Skip non-sortable columns like Actions
    if (!dataAttribute) return;
    
    // Add sortable class and data attribute
    header.classList.add('sortable');
    header.setAttribute('data-sort', dataAttribute);
    
    // Add sort indicator
    const sortIndicator = document.createElement('span');
    sortIndicator.className = 'sort-indicator';
    sortIndicator.innerHTML = '<i class="fas fa-sort"></i>';
    header.appendChild(sortIndicator);
    
    // Add click event
    header.addEventListener('click', () => this.handleSort(dataAttribute));
  });
}

/**
 * Handle sorting when a header is clicked
 * @param {string} column - Column to sort by
 */
handleSort(column) {
  // Toggle sort direction if same column clicked again
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  // Update sort indicators in the UI
  this.updateSortIndicators();
  
  // Sort the filtered epics
  this.sortEpics();
  
  // Update the table
  this.updatePaginatedTable();
}

/**
 * Update sort indicators in table headers
 */
updateSortIndicators() {
  const headers = document.querySelectorAll('#resultsTable th.sortable');
  
  headers.forEach(header => {
    const column = header.getAttribute('data-sort');
    const indicator = header.querySelector('.sort-indicator');
    
    if (column === this.sortColumn) {
      indicator.innerHTML = this.sortDirection === 'asc' 
        ? '<i class="fas fa-sort-up"></i>' 
        : '<i class="fas fa-sort-down"></i>';
    } else {
      indicator.innerHTML = '<i class="fas fa-sort"></i>';
    }
  });
}

/**
 * Sort epics based on current sort column and direction
 */
sortEpics() {
  const column = this.sortColumn;
  const direction = this.sortDirection;
  
  this.filteredEpics.sort((a, b) => {
    let valueA, valueB;
    
    // Extract the appropriate values for comparison
    switch (column) {
      case 'id':
        // Extract numeric parts from IDs for numeric sorting
        const numA = parseInt(a.id.replace(/[^\d]/g, '')) || 0;
        const numB = parseInt(b.id.replace(/[^\d]/g, '')) || 0;
        valueA = numA;
        valueB = numB;
        break;
      case 'name':
        valueA = a.name || '';
        valueB = b.name || '';
        break;
      case 'status':
        valueA = a.status || '';
        valueB = b.status || '';
        break;
      case 'timeInStatus':
        // Convert time to numeric value for sorting
        valueA = this.parseTimeValue(a.timeInStatus);
        valueB = this.parseTimeValue(b.timeInStatus);
        break;
      case 'sprint':
        valueA = a.sprint || '';
        valueB = b.sprint || '';
        break;
      case 'totalStoryPoints':
        valueA = a.totalStoryPoints || 0;
        valueB = b.totalStoryPoints || 0;
        break;
      case 'cycleTime':
        valueA = parseFloat(a.cycleTime) || 0;
        valueB = parseFloat(b.cycleTime) || 0;
        break;
      case 'slaStatus':
        valueA = a.slaStatus ? a.slaStatus.text : '';
        valueB = b.slaStatus ? b.slaStatus.text : '';
        break;
      case 'completion':
        valueA = a.totalStoryPoints > 0 ? a.completedStoryPoints / a.totalStoryPoints : 0;
        valueB = b.totalStoryPoints > 0 ? b.completedStoryPoints / b.totalStoryPoints : 0;
        break;
      default:
        valueA = a.id;
        valueB = b.id;
    }
    
    // Compare the values
    let result;
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      result = valueA - valueB;
    } else {
      result = String(valueA).localeCompare(String(valueB));
    }
    
    // Apply sort direction
    return direction === 'asc' ? result : -result;
  });

  // After sorting, add animation classes to rows
setTimeout(() => {
  const rows = document.querySelectorAll('#resultsBody tr');
  rows.forEach((row, index) => {
    row.style.transition = 'none';
    row.style.opacity = '0.7';
    row.style.transform = 'translateY(0)';
    
    setTimeout(() => {
      row.style.transition = 'all 0.3s ease';
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, 50 * (index % 10)); // Stagger animation
  });
}, 0);

}

/**
 * Parse time value for sorting (e.g., "2w 3d" -> days)
 * @param {string} timeString - Time string to parse
 * @returns {number} - Time value in days
 */
parseTimeValue(timeString) {
  if (!timeString || timeString === '-') return 0;
  
  try {
    return DataProcessor.parseTimeInStatus(timeString);
  } catch (e) {
    return 0;
  }
}
    
    /**
     * Handle sorting when a header is clicked
     * @param {string} column - Column to sort by
     */
    handleSort(column) {
      // Toggle sort direction if same column clicked again
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
      
      // Update sort indicators in the UI
      this.updateSortIndicators();
      
      // Sort the filtered epics
      this.sortEpics();
      
      // Update the table
      this.updatePaginatedTable();
    }
    
    /**
     * Update sort indicators in table headers
     */
    updateSortIndicators() {
      const headers = document.querySelectorAll('#resultsTable th.sortable');
      
      headers.forEach(header => {
        const column = header.getAttribute('data-sort');
        const indicator = header.querySelector('.sort-indicator');
        
        if (column === this.sortColumn) {
          indicator.innerHTML = this.sortDirection === 'asc' 
            ? '<i class="fas fa-sort-up"></i>' 
            : '<i class="fas fa-sort-down"></i>';
        } else {
          indicator.innerHTML = '<i class="fas fa-sort"></i>';
        }
      });
    }
    
    /**
     * Sort epics based on current sort column and direction
     */
    sortEpics() {
      const column = this.sortColumn;
      const direction = this.sortDirection;
      
      this.filteredEpics.sort((a, b) => {
        let valueA, valueB;
        
        // Extract the appropriate values for comparison
        switch (column) {
          case 'id':
            // Extract numeric parts from IDs for numeric sorting
            const numA = parseInt(a.id.replace(/[^\d]/g, '')) || 0;
            const numB = parseInt(b.id.replace(/[^\d]/g, '')) || 0;
            valueA = numA;
            valueB = numB;
            break;
          case 'name':
            valueA = a.name || '';
            valueB = b.name || '';
            break;
          case 'status':
            valueA = a.status || '';
            valueB = b.status || '';
            break;
          case 'timeInStatus':
            // Convert time to numeric value for sorting
            valueA = this.parseTimeValue(a.timeInStatus);
            valueB = this.parseTimeValue(b.timeInStatus);
            break;
          case 'sprint':
            valueA = a.sprint || '';
            valueB = b.sprint || '';
            break;
          case 'totalStoryPoints':
            valueA = a.totalStoryPoints || 0;
            valueB = b.totalStoryPoints || 0;
            break;
          case 'cycleTime':
            valueA = parseFloat(a.cycleTime) || 0;
            valueB = parseFloat(b.cycleTime) || 0;
            break;
          case 'slaStatus':
            valueA = a.slaStatus ? a.slaStatus.text : '';
            valueB = b.slaStatus ? b.slaStatus.text : '';
            break;
          case 'completion':
            valueA = a.totalStoryPoints > 0 ? a.completedStoryPoints / a.totalStoryPoints : 0;
            valueB = b.totalStoryPoints > 0 ? b.completedStoryPoints / b.totalStoryPoints : 0;
            break;
          default:
            valueA = a.id;
            valueB = b.id;
        }
        
        // Compare the values
        let result;
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          result = valueA - valueB;
        } else {
          result = String(valueA).localeCompare(String(valueB));
        }
        
        // Apply sort direction
        return direction === 'asc' ? result : -result;
      });
    }
    
    /**
     * Parse time value for sorting (e.g., "2w 3d" -> days)
     * @param {string} timeString - Time string to parse
     * @returns {number} - Time value in days
     */
    parseTimeValue(timeString) {
      if (!timeString || timeString === '-') return 0;
      
      try {
        return DataProcessor.parseTimeInStatus(timeString);
      } catch (e) {
        return 0;
      }
    }

/**
 * Handle sorting when a header is clicked
 * @param {string} column - Column to sort by
 */
handleSort(column) {
  // Toggle sort direction if same column clicked again
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  // Update sort indicators in the UI
  this.updateSortIndicators();
  
  // Sort the filtered epics
  this.sortEpics();
  
  // Update the table
  this.updatePaginatedTable();
}

/**
 * Update sort indicators in table headers
 */
updateSortIndicators() {
  const headers = document.querySelectorAll('#resultsTable th.sortable');
  
  headers.forEach(header => {
    const column = header.getAttribute('data-sort');
    const indicator = header.querySelector('.sort-indicator');
    
    if (column === this.sortColumn) {
      indicator.innerHTML = this.sortDirection === 'asc' 
        ? '<i class="fas fa-sort-up"></i>' 
        : '<i class="fas fa-sort-down"></i>';
    } else {
      indicator.innerHTML = '<i class="fas fa-sort"></i>';
    }
  });
}

/**
 * Sort epics based on current sort column and direction
 */
sortEpics() {
  const column = this.sortColumn;
  const direction = this.sortDirection;
  
  this.filteredEpics.sort((a, b) => {
    let valueA, valueB;
    
    // Extract the appropriate values for comparison
    switch (column) {
      case 'id':
        valueA = a.id;
        valueB = b.id;
        break;
      case 'name':
        valueA = a.name || '';
        valueB = b.name || '';
        break;
      case 'status':
        valueA = a.status || '';
        valueB = b.status || '';
        break;
      case 'timeInStatus':
        // Convert time to numeric value for sorting
        valueA = this.parseTimeValue(a.timeInStatus);
        valueB = this.parseTimeValue(b.timeInStatus);
        break;
      case 'sprint':
        valueA = a.sprint || '';
        valueB = b.sprint || '';
        break;
      case 'totalStoryPoints':
        valueA = a.totalStoryPoints || 0;
        valueB = b.totalStoryPoints || 0;
        break;
      case 'cycleTime':
        valueA = parseFloat(a.cycleTime) || 0;
        valueB = parseFloat(b.cycleTime) || 0;
        break;
      case 'slaStatus':
        valueA = a.slaStatus ? a.slaStatus.text : '';
        valueB = b.slaStatus ? b.slaStatus.text : '';
        break;
      case 'completion':
        valueA = a.completedStoryPoints / (a.totalStoryPoints || 1);
        valueB = b.completedStoryPoints / (b.totalStoryPoints || 1);
        break;
      default:
        valueA = a.id;
        valueB = b.id;
    }
    
    // Compare the values
    let result;
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      result = valueA - valueB;
    } else {
      result = String(valueA).localeCompare(String(valueB));
    }
    
    // Apply sort direction
    return direction === 'asc' ? result : -result;
  });
}

/**
 * Parse time value for sorting (e.g., "2w 3d" -> days)
 * @param {string} timeString - Time string to parse
 * @returns {number} - Time value in days
 */
parseTimeValue(timeString) {
  if (!timeString || timeString === '-') return 0;
  
  try {
    return DataProcessor.parseTimeInStatus(timeString);
  } catch (e) {
    return 0;
  }
}

// Add to UIController class
saveUserPreferences() {
  const preferences = {
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection,
    rowsPerPage: this.rowsPerPage,
    statusFilter: document.getElementById('statusFilter')?.value || 'all',
    sprintFilter: document.getElementById('sprintFilter')?.value || 'all',
    slaStatusFilter: document.getElementById('slaStatusFilter')?.value || 'all'
  };
  
  localStorage.setItem('jiraEpicAnalyzerPrefs', JSON.stringify(preferences));
}

loadUserPreferences() {
  try {
    const savedPrefs = localStorage.getItem('jiraEpicAnalyzerPrefs');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      
      // Restore sort settings
      this.sortColumn = prefs.sortColumn || 'id';
      this.sortDirection = prefs.sortDirection || 'desc';
      
      // Restore rows per page
      this.rowsPerPage = prefs.rowsPerPage || 20;
      
      // Will restore filters when data is loaded
      this.savedFilters = {
        statusFilter: prefs.statusFilter || 'all',
        sprintFilter: prefs.sprintFilter || 'all',
        slaStatusFilter: prefs.slaStatusFilter || 'all'
      };
    }
  } catch (e) {
    console.error('Error loading user preferences:', e);
  }
}

// Add dark mode toggle
addDarkModeToggle() {
  const toggle = document.createElement('div');
  toggle.className = 'mode-toggle';
  toggle.innerHTML = '<i class="fas fa-moon"></i>';
  toggle.title = 'Toggle dark mode';
  
  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    toggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  });
  
  // Check saved preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    toggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  
  document.body.appendChild(toggle);
}

}

// Make UIController available globally
window.UIController = UIController;
