cd "/home/overlord/VsCode/Hackaton 2026/blind-orbit"
cat << 'EOF' > README.md
# BlindOrbit: Zero-Custody Satellite Collision Avoidance via TideCloak Emergent Authority

**BlindOrbit** is a hackathon-winning full-stack prototype demonstrating how **TideCloak's "Emergent Authority"** eliminates the trust bottleneck in classified satellite conjunction assessment (collision avoidance).

---

## 🚀 The Core Innovation
* **The Problem:** Low Earth Orbit (LEO) is heavily congested. Defense agencies (classified reconnaissance assets) and commercial operators (e.g., Starlink) need to coordinate collision avoidance maneuvers. However, neither will upload unredacted orbital trajectories (ephemeris data) or fuel states to a central clearinghouse because whoever holds the master keys gains a real-time surveillance map of global orbital assets.
* **The Breakthrough (TideCloak):** Trajectory data is encrypted at rest (`AES-256-GCM`). **Zero persistent master keys exist.** Authority to calculate a conjunction plane and recommend an evasive maneuver never exists persistently—it emerges ephemerally for 15 seconds *only* when:
  1. Coarse public radar flags an intersection hazard ($\le 5.0\text{ km}$ miss distance).
  2. Both operators (Defense Reconnaissance + Commercial Flight Director) authenticate and sign the Conjunction Ticket.
  3. TideCloak evaluates the policy quorum and issues a single-use ephemeral token allowing a sandboxed worker to calculate the relative miss distance and delta-v burn recommendation, returning **only** the maneuver recommendation before immediately destroying the ephemeral key.

---

## 🛠️ Tech Stack
* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide-React, HTML5 2D/3D Tactical Canvas (`OrbitalCanvas.tsx`).
* **Backend:** Node.js, Express, TypeScript, JSON Web Tokens, JWKS Verification (`server/`).
* **Security Layer:** TideCloak SDK integration (`@tidecloak/js`) with hybrid WebCrypto Enclave fallback.

---

## ⚙️ Quickstart & Setup Guide (Clone & Run)

If you have cloned or transferred this repository to a new machine, follow these steps to install dependencies and run the application locally:

### 1. Clone the Repository
```bash
git clone [https://github.com/sshinyaaaa/rmit-goondocks.git](https://github.com/sshinyaaaa/rmit-goondocks.git)
cd rmit-goondocks

# # #
cd "/home/overlord/VsCode/Hackaton 2026/blind-orbit/server"
npm uninstall ts-node-dev ts-node
npm install -D tsx

npm pkg set scripts.dev="npx tsx watch src/server.ts"

cd "/home/overlord/VsCode/Hackaton 2026/blind-orbit/server"
npm run dev



# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install



3. Run the Development Environment

Open two separate terminal tabs in VS Code to run the backend and frontend concurrently:

    Terminal 1: Start the Backend Server (Port 3001)
    Bash

    cd server
    npm run dev

    (You should see: [BlindOrbit Backend] Listening on http://localhost:3001)

    Terminal 2: Start the Frontend Client (Port 5173)
    Bash

    cd client
    npm run dev

    (Vite will spin up the UI at http://localhost:5173)

    Open http://localhost:5173 in your browser to interact with the mission-control dashboard and test the TideCloak Emergent Authority workflow!
