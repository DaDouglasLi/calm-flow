// Minimal tab controller for Notice and Upload tabs

let currentTab = null
let currentPanel = null

// Initialize tabs
export function initTabs() {
  const noticeTab = document.getElementById('notice-tab')
  const uploadTab = document.getElementById('upload-tab')
  const noticePanel = document.getElementById('notice-panel')
  const uploadPanel = document.getElementById('upload-panel')
  const fileInput = document.getElementById('file-input')
  const statusText = document.getElementById('status-text')
  const resetLink = document.getElementById('reset-link')

  // Tab click handlers
  noticeTab.addEventListener('click', () => switchTab('notice'))
  uploadTab.addEventListener('click', () => switchTab('upload'))

  // File input handler
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0]
    if (file) {
      // Dispatch custom event for app.js to handle
      document.dispatchEvent(new CustomEvent('ui:file-selected', { detail: file }))
    }
  })

  // Reset link handler
  resetLink.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('ui:reset-to-noise'))
  })

  // ESC key handler
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && currentPanel) {
      closePanel()
    }
  })

  // Click outside to close
  document.addEventListener('click', (event) => {
    if (currentPanel && !event.target.closest('.tl-tabs')) {
      closePanel()
    }
  })

  console.log('Tabs initialized')
}

// Switch between tabs
function switchTab(tabName) {
  const noticeTab = document.getElementById('notice-tab')
  const uploadTab = document.getElementById('upload-tab')
  const noticePanel = document.getElementById('notice-panel')
  const uploadPanel = document.getElementById('upload-panel')

  // Remove active states
  noticeTab.classList.remove('active')
  uploadTab.classList.remove('active')
  noticePanel.classList.remove('active')
  uploadPanel.classList.remove('active')

  // Add active state to selected tab
  if (tabName === 'notice') {
    noticeTab.classList.add('active')
    noticePanel.classList.add('active')
    currentTab = 'notice'
    currentPanel = noticePanel
  } else if (tabName === 'upload') {
    uploadTab.classList.add('active')
    uploadPanel.classList.add('active')
    currentTab = 'upload'
    currentPanel = uploadPanel
  }
}

// Close current panel
function closePanel() {
  if (currentPanel) {
    currentPanel.classList.remove('active')
    currentPanel = null
  }
  if (currentTab) {
    document.getElementById(currentTab + '-tab').classList.remove('active')
    currentTab = null
  }
}

// Update status text in upload panel
export function updateStatus(text) {
  const statusText = document.getElementById('status-text')
  if (statusText) {
    statusText.textContent = text
  }
}

// Hide file input after selection
export function hideFileInput() {
  const fileInput = document.getElementById('file-input')
  if (fileInput) {
    fileInput.style.display = 'none'
  }
}

// Show file input
export function showFileInput() {
  const fileInput = document.getElementById('file-input')
  if (fileInput) {
    fileInput.style.display = 'block'
  }
}
