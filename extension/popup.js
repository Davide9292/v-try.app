document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const apiStatus = document.getElementById('apiStatus');
  const userImageInput = document.getElementById('userImage');
  const uploadBtn = document.getElementById('uploadBtn');
  const imagePreview = document.getElementById('imagePreview');
  const outputModeInputs = document.querySelectorAll('input[name="outputMode"]');

  // Load saved data
  loadSavedData();

  // Event listeners
  saveApiKeyBtn.addEventListener('click', saveApiKey);
  uploadBtn.addEventListener('click', () => userImageInput.click());
  userImageInput.addEventListener('change', handleImageUpload);
  outputModeInputs.forEach(input => {
    input.addEventListener('change', saveOutputMode);
  });

  async function loadSavedData() {
    try {
      const result = await chrome.storage.local.get(['geminiApiKey', 'userImage', 'outputMode']);
      
      if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
        showStatus('API Key caricata ✓', 'success');
      }
      
      if (result.userImage) {
        displayImagePreview(result.userImage);
      }
      
      if (result.outputMode) {
        const modeInput = document.querySelector(`input[name="outputMode"][value="${result.outputMode}"]`);
        if (modeInput) {
          modeInput.checked = true;
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }

  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Inserisci una API Key valida', 'error');
      return;
    }

    try {
      // Test the API key
      showStatus('Verifica API Key...', '');
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: {
          'x-goog-api-key': apiKey
        }
      });

      if (response.ok) {
        await chrome.storage.local.set({ geminiApiKey: apiKey });
        showStatus('API Key salvata e verificata ✓', 'success');
      } else {
        showStatus('API Key non valida ✗', 'error');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      showStatus('Errore nella verifica ✗', 'error');
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      showStatus('Immagine troppo grande (max 4MB)', 'error');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showStatus('Seleziona un file immagine valido', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
      const imageData = e.target.result;
      
      try {
        await chrome.storage.local.set({ userImage: imageData });
        displayImagePreview(imageData);
        showStatus('Immagine salvata ✓', 'success');
      } catch (error) {
        console.error('Error saving image:', error);
        showStatus('Errore nel salvare l\'immagine', 'error');
      }
    };
    
    reader.readAsDataURL(file);
  }

  function displayImagePreview(imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.className = 'preview-image';
    img.alt = 'Preview';
    
    imagePreview.innerHTML = '';
    imagePreview.appendChild(img);
  }

  async function saveOutputMode() {
    const selectedMode = document.querySelector('input[name="outputMode"]:checked').value;
    try {
      await chrome.storage.local.set({ outputMode: selectedMode });
      console.log('Output mode saved:', selectedMode);
    } catch (error) {
      console.error('Error saving output mode:', error);
    }
  }

  function showStatus(message, type) {
    apiStatus.textContent = message;
    apiStatus.className = `status ${type}`;
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        apiStatus.textContent = '';
        apiStatus.className = 'status';
      }, 3000);
    }
  }
});
