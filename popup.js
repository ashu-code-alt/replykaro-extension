// popup.js

// ↳ Point to your Dev backend:
const API = "https://HueComm-backend-dev.onrender.com";

const userInput       = document.getElementById("userInput");
const toneSelect      = document.getElementById("tone");
const goalSelect      = document.getElementById("goal");
const statusEl        = document.getElementById("status");
const recBtn          = document.getElementById("recordBtn");
const genBtn          = document.getElementById("generateBtn");
const spinner         = document.getElementById("spinner");
const repliesContainer = document.getElementById("repliesContainer");
const clearBtn        = document.getElementById("clearBtn");

// Utility: set status message (error or normal)
function setStatus(msg, isError = false) {
  statusEl.innerText = msg;
  statusEl.style.color = isError ? "#d00" : "#555";
}

// Utility: toggle loading spinner + disable buttons
function setLoading(on) {
  spinner.classList.toggle("hidden", !on);
  genBtn.disabled = recBtn.disabled = on;
  if (on) {
    // Clear any previous replies + status
    setStatus("");
    repliesContainer.innerHTML = "";
  }
}

// -------- Clear button: empties the textarea --------
clearBtn.onclick = () => {
  userInput.value = "";
  userInput.focus();
};

// -------- Generate 3 variants + scores --------
genBtn.onclick = async () => {
  if (!userInput.value.trim()) {
    setStatus("Please enter or speak a message.", true);
    return;
  }
  setLoading(true);

  try {
    // POST to /generate-reply with variants: 3
    const { data } = await axios.post(`${API}/generate-reply`, {
      message: userInput.value,
      tone: toneSelect.value,
      goal: goalSelect.value,
      variants: 3
    });

    const { replies = [], scores = [] } = data;

    // Clear container, then render each variant
    repliesContainer.innerHTML = "";
    replies.forEach((reply, i) => {
      const score = scores[i] ?? 0;

      // Outer card for this variant
      const card = document.createElement("div");
      card.className = "variant";

      // Header “Variant 1”, “Variant 2”, etc.
      const h3 = document.createElement("h3");
      h3.innerText = `Variant ${i + 1}`;
      card.appendChild(h3);

      // Preformatted block for the reply text
      const pre = document.createElement("pre");
      pre.innerText = reply;
      card.appendChild(pre);

      // Copy button for this variant
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.innerHTML = `<i class="fas fa-copy"></i> Copy`;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(reply)
          .then(() => setStatus("Variant Copied!"))
          .catch(() => setStatus("Copy failed.", true));
      };
      card.appendChild(copyBtn);

      // Score bar + text
      const sc = document.createElement("div");
      sc.className = "scoreContainer";
      const bar = document.createElement("div");
      bar.className = "scoreBar";
      bar.style.setProperty("--fill-width", `${score}%`);
      sc.appendChild(bar);

      const txt = document.createElement("span");
      txt.className = "scoreText";
      txt.innerText = `Predicted ${score}%`;
      sc.appendChild(txt);

      card.appendChild(sc);

      repliesContainer.appendChild(card);
    });

    setStatus("Replies generated.");
  } catch (err) {
    console.error(err);
    setStatus("Failed to generate replies.", true);
  } finally {
    setLoading(false);
  }
};

// -------- Voice recording → Whisper transcription --------
recBtn.onclick = async () => {
  setLoading(true);
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    setStatus("Microphone access denied.", true);
    setLoading(false);
    return;
  }

  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);

  recorder.onstop = async () => {
    // Stop mic tracks
    stream.getTracks().forEach(t => t.stop());

    // Send to backend (/transcribe-audio)
    const blob = new Blob(chunks, { type: chunks[0].type });
    const form = new FormData();
    form.append("audio", blob, "voice.webm");

    try {
      setStatus("Transcribing…");
      const resp = await axios.post(`${API}/transcribe-audio`, form);
      // Put the transcript back into the textarea:
      userInput.value = resp.data.transcript;
      setStatus("Transcribed! Ready to generate.");
    } catch (err) {
      console.error(err);
      setStatus("Transcription failed.", true);
    } finally {
      setLoading(false);
    }
  };

  // Record ~5 seconds then stop
  recorder.start();
  setTimeout(() => recorder.stop(), 5000);
};
