// popup.js
// Handles both “Generate Reply” and “Translate” flows.

document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateReplyBtn");
  const translateBtn = document.getElementById("translateBtn");

  generateBtn.addEventListener("click", handleGenerateReply);
  translateBtn.addEventListener("click", handleTranslate);
});

async function handleGenerateReply() {
  const text = document.getElementById("inputMessage").value.trim();
  const tone = document.getElementById("toneSelector").value;
  const mood = document.getElementById("moodSelector").value;
  const resultDiv = document.getElementById("replyResult");

  if (!text) {
    resultDiv.innerText = "Please enter a message to generate a reply.";
    return;
  }

  resultDiv.innerText = "Generating reply…";
  try {
    // Send both tone and mood in the payload
    const response = await axios.post("http://localhost:3000/generate-reply", {
      text,
      tone,
      mood
    });
    // Expecting backend to still return { variants: [ "...", "...", "..." ] }
    const { variants } = response.data;
    resultDiv.innerHTML = variants
      .map((v) => `<p>${v}</p>`)
      .join("<hr/>");
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Error generating reply.";
  }
}

async function handleTranslate() {
  const text = document.getElementById("textToTranslate").value.trim();
  const sourceLang = document.getElementById("sourceLang").value;
  const targetLang = document.getElementById("targetLang").value;
  const tone = document.getElementById("translateTone").value;
  const resultDiv = document.getElementById("translateResult");

  if (!text) {
    resultDiv.innerText = "Please enter text to translate.";
    return;
  }

  resultDiv.innerText = "Translating…";
  try {
    const response = await axios.post("http://localhost:3000/translate", {
      text,
      sourceLang,
      targetLang,
      tone,
      culturalContext: `${sourceLang}->${targetLang}`
    });
    const { translatedText } = response.data;
    resultDiv.innerText = translatedText;
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Error during translation.";
  }
}
