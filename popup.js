const API = 'https://replykaro-backend.onrender.com';

const userInput = document.getElementById('userInput');
const toneSelect = document.getElementById('tone');
const goalSelect = document.getElementById('goal');
const statusEl = document.getElementById('status');
const recBtn = document.getElementById('recordBtn');
const genBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const spinner = document.getElementById('spinner');
const replyText = document.getElementById('replyText');

function setStatus(msg, isError = false) {
  statusEl.innerText = msg;
  statusEl.style.color = isError ? '#d00' : '#555';
}

function setLoading(on) {
  if (on) {
    spinner.classList.remove('hidden');
    genBtn.disabled = copyBtn.disabled = recBtn.disabled = true;
  } else {
    spinner.classList.add('hidden');
    genBtn.disabled = copyBtn.disabled = false;
    recBtn.disabled = false;
  }
}

// Generate Reply
genBtn.onclick = async () => {
  setStatus('');
  replyText.innerText = '';
  setLoading(true);

  try {
    const res = await axios.post(`${API}/generate-reply`, {
      message: userInput.value,
      tone: toneSelect.value,
      goal: goalSelect.value,
    });
    replyText.innerText = res.data.reply;
    setStatus('Reply generated.', false);
    copyBtn.style.display = 'block';
  } catch (err) {
    console.error(err);
    setStatus('Failed to generate reply.', true);
  } finally {
    setLoading(false);
  }
};

// Copy
copyBtn.onclick = () => {
  navigator.clipboard
    .writeText(replyText.innerText)
    .then(() => setStatus('Copied to clipboard!'))
    .catch(() => setStatus('Copy failed.', true));
};

// Voice Recording & Transcription
recBtn.onclick = async () => {
  setStatus('');
  replyText.innerText = '';
  setLoading(true);

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.error(err);
    setStatus('Microphone access denied.', true);
    setLoading(false);
    return;
  }

  const recorder = new MediaRecorder(stream);
  const chunks = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks, { type: chunks[0].type });
    const form = new FormData();
    form.append('audio', blob, 'voice.webm');

    try {
      setStatus('Transcribing…');
      const resp = await axios.post(`${API}/transcribe-audio`, form);
      userInput.value = resp.data.transcript;
      setStatus('Transcribed! Ready to generate.');
    } catch (err) {
      console.error(err);
      setStatus('Transcription failed.', true);
    } finally {
      setLoading(false);
    }
  };

  recorder.start();
  setTimeout(() => recorder.stop(), 5000);
};
