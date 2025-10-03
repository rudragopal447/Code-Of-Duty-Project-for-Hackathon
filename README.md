🎓 AI-Powered Certificate Automation System
This project is a Proof-of-Concept (PoC) full-stack system designed to automate the generation and delivery of personalized digital certificates based on uploaded CSV data.

It uses a React frontend for data upload and preview, and a Node.js backend for secure API integration (Twilio and Brevo) to handle the actual delivery of the certificates.

✨ Features
CSV Data Ingestion: Upload participant data (Name, Email, Phone) via CSV file.

AI-like Data Verification: Automatically checks and corrects common name formatting issues (e.g., casing, extra spaces) to ensure professional certificate quality.

Dynamic Certificate Generation: Generates personalized certificates on the fly using the HTML Canvas API (Frontend Preview) and node-canvas (Backend).

Dual Delivery Channels: Integrated for real-world delivery (via local backend):

Email: Uses the Brevo (Sendinblue) API to send certificates as attachments.

WhatsApp: Uses the Twilio API to send message notifications.

Real-time Dashboard: Tracks and displays the delivery status (Delivered, Pending, Bounced) returned by the backend API.

🛠️ Tech Stack
Frontend (React / Vite)
Framework: React (Functional Components)

Tooling: Vite

Styling: Tailwind CSS (via CDN)

Icons: Lucide React

Backend (Node.js / Express)
Runtime: Node.js (ES Modules)

Web Framework: Express

APIs: twilio and @sendinblue/client (Brevo)

Image Generation: node-canvas (to render certificates server-side)

🚀 Local Setup and Installation
1. Prerequisites
You must have the following installed on your machine:

Node.js (which includes npm)

A verified Brevo account (for email).

A configured Twilio account with a WhatsApp Sandbox (for WhatsApp).

2. File Structure & Dependencies
This project runs as two separate processes (frontend and backend) from the root directory.

Install All Dependencies: Run this command in the project root (certificate-automation/):

npm install

3. Configure API Secrets
Your secrets must be configured in a private .env file in the project root to be read by server.js.

Create a file named .env in the project root.

Add your real credentials (Do NOT push this file to Git):

# .env (Place this file in the project root)
BREVO_API_KEY=xkeysib-YOUR-REAL-BREVO-KEY-HERE
TWILIO_ACCOUNT_SID=AC-YOUR-REAL-TWILIO-SID-HERE
TWILIO_AUTH_TOKEN=YOUR-REAL-TWILIO-AUTH-TOKEN-HERE
TWILIO_WHATSAPP_NUMBER=whatsapp:+12065550000 

Update Sender Email: Open server.js and ensure the email address used in the Brevo section is a verified sender in your Brevo account.

4. Run the Project (Simultaneously)
We use concurrently (included in your package.json) to run the frontend and backend in a single command.

npm start

This single command will:

Start the Backend Server on http://localhost:3000 (Terminal 1).

Start the React Frontend via Vite on http://localhost:5173 (Terminal 2).

Access the application in your browser at http://localhost:5173.

📂 Project Structure Overview
certificate-automation/
├── src/
│   ├── main.jsx                 # React Entry Point
│   ├── App.jsx                  # Main UI, State, and Backend Fetch Logic
│   └── sample-data.csv          # Example data for testing upload
├── node_modules/                # (Ignored by Git)
├── server.js                    # Node.js Backend API (Handles Brevo/Twilio/Canvas)
├── package.json                 # Lists all dependencies and start scripts
├── .env                         # Your API Secrets (DO NOT COMMIT)
└── .gitignore                   # Ensures secrets and build files are not uploaded
