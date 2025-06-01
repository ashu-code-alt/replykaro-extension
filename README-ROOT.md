# PersonalProject

This repo contains two subprojects:

1. **HueComm-backend** – Express.js + OpenAI backend (GPT + Whisper)  
2. **HueComm-extension** – Chrome extension UI

## Running

### Backend
\`\`\`bash
cd HueComm-backend
npm install
npm start
\`\`\`

### Extension
1. Open Chrome → \`chrome://extensions\` → Load unpacked → select \`HueComm-extension/\`  
2. Ensure backend is running at \`https://HueComm-backend.onrender.com\`  
3. Use the popup UI to draft emails.



# HueComm AI PersonalProject

This folder contains two standalone projects:

## 1. Backend (`HueComm-backend`)
- **Endpoints**:
  - `GET  /`               → health check, returns `OK`
  - `POST /generate-reply` → `{ reply: string, score: number }`
  - `POST /transcribe-audio` → `{ transcript: string }`
- **Run Locally**:
  ```bash
  cd HueComm-backend
  npm install
  npm start
