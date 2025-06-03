// popup.js

const BACKEND_URL = 'https://huecomm-backend-dev.onrender.com'; // Change to http://localhost:5050 if testing locally

// UI Elements
const userInput = document.getElementById('userInput');
const toneSelect = document.getElementById('toneSelect');
const goalSelect = document.getElementById('goalSelect');
const recordBtn = document.getElementById('recordBtn');
const optInStyleMemory = document.getElementById('optInStyleMemory');
const generateBtn = document.getElementById('generateBtn');
const errorMessage = document.getElementById('errorMessage');
const micError = document.getElementById('micError');
const spinner = document.getElementById('spinner');
const loadFavoriteBtn = document.getElementById('loadFavorite');

// Variant containers
const variantTextEls = [
  document.getElementById('variantText0'),
  document.getElementById('variantText1'),
  document.getElementById('variantText2'),
];
const scoreBarEls = [
  document.getElementById('scoreBar0'),
  document.getElementById('scoreBar1'),
  document.getElementById('scoreBar2'),
];
const scoreLabelEls = [
  document.getElementById('scoreLabel0'),
  document.getElementById('scoreLabel1'),
  document.getElementById('scoreLabel2'),
];
const copyBtns = document.querySelectorAll('.copy-btn');
const saveBtns = document.querySelectorAll('.save-btn');

let mediaRecorder;
let audioChunks = [];

/**
 * getUserId()
 * Returns a Promise that resolves to a persistent userId stored in chrome.storage.local.
 * If no ID exists yet, creates a new UUID and stores it.
 */
function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['huecommUserId'], (result) => {
      if (result.huecommUserId) {
        resolve(result.huecommUserId);
      } else {
        const newId = crypto.randomUUID();
        chrome.storage.local.set({ huecommUserId: newId }, () => {
          resolve(newId);
        });
      }
    });
  });
}

/**
 * Load the favorite variant (if any) from chrome.storage.local and fill the textarea.
 */
loadFavoriteBtn.addEventListener('click', () => {
  chrome.storage.local.get(['favoriteVariant'], (result) => {
    if (result.favoriteVariant) {
      userInput.value = result.favoriteVariant;
    } else {
      alert('No favorite variant saved yet.');
    }
  });
});

/**
 * Copy variant text to clipboard when “Copy” button is clicked.
 */
copyBtns.forEach((btn) => {
  btn.addEventListener('click', (event) => {
    const idx = event.target.dataset.index;
    const textToCopy = variantTextEls[idx].innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      event.target.innerText = 'Copied!';
      setTimeout(() => (event.target.innerText = 'Copy'), 1500);
    });
  });
});

/**
 * Save a variant as “favorite” in chrome.storage.local when “⭐ Save” is clicked.
 */
saveBtns.forEach((btn) => {
  btn.addEventListener('click', (event) => {
    const idx = event.target.dataset.index;
    const textToSave = variantTextEls[idx].innerText;
    chrome.storage.local.set({ favoriteVariant: textToSave }, () => {
      event.target.innerText = 'Saved!';
      setTimeout(() => (event.target.innerText = '⭐ Save'), 1500);
    });
  });
});

/**
 * Handling voice recording for ~5 seconds, sending to /transcribe-audio,
 * and populating the textarea with the resulting transcript.
 */
recordBtn.addEventListener('click', async () => {
  micError.innerText = '';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.start();

    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      try {
        const resp = await axios.post(
          `${BACKEND_URL}/transcribe-audio`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        userInput.value = resp.data.transcript;
      } catch (err) {
        micError.innerText = 'Transcription failed. Try again.';
      }
    });

    // Stop recording after 5 seconds
    setTimeout(() => mediaRecorder.stop(), 5000);
  } catch (err) {
    micError.innerText = 'Cannot access microphone. Check permissions.';
  }
});

/**
 * When “Generate Reply” is clicked:
 * 1. Validate input.
 * 2. Optionally retrieve userId if style memory is checked.
 * 3. POST to /generate-reply with message, tone, goal, userId, recipientDomain.
 * 4. Display returned variants & their success probabilities.
 */
generateBtn.addEventListener('click', async () => {
  errorMessage.innerText = '';
  spinner.style.display = 'block';

  const message = userInput.value.trim();
  const tone = toneSelect.value;
  const goal = goalSelect.value;
  const recipientDomain = document
    .getElementById('recipientDomain')
    .value.trim();
  const styleMemoryChecked = optInStyleMemory.checked;

  if (!message) {
    errorMessage.innerText = 'Please enter a message or transcript first.';
    spinner.style.display = 'none';
    return;
  }

  try {
    const userId = styleMemoryChecked ? await getUserId() : null;

    // Build payload for backend
    const payload = {
      message,
      tone,
      goal,
      userId,
      recipientDomain: recipientDomain || null,
    };

    // Call /generate-reply
    const resp = await axios.post(`${BACKEND_URL}/generate-reply`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const { scoredVariants } = resp.data;

    // Display each variant and its successProbability
    scoredVariants.forEach((variantObj, idx) => {
      variantTextEls[idx].innerText = variantObj.text;
      const prob = variantObj.successProbability || 0;
      scoreBarEls[idx].style.width = `${prob}%`;
      scoreLabelEls[idx].innerText =
        variantObj.successProbability !== null ? `${prob}% likely` : 'N/A';
    });
  } catch (err) {
    console.error(err);
    errorMessage.innerText = 'Failed to generate replies. Please try again.';
  } finally {
    spinner.style.display = 'none';
  }
});
