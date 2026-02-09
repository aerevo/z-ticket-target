const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(cors());

// --- CONFIG ---
// Ini URL server Z-Kinetic (JANGAN UBAH)
const Z_KINETIC_URL = 'https://z-kinetic-server.onrender.com/attest';
let tickets = 1000; // Baki Tiket

// --- 1. PINTU MASUK "BOCOR" (CLEAN) ---
// FatBoy butang MERAH akan tembak sini
app.post('/api/buy-clean', (req, res) => {
    if (tickets > 0) {
        tickets--; // Tiket luak terus!
        console.log(`[CLEAN] 🔴 TICKET SOLD! Balance: ${tickets}`);
        res.json({ status: 'success', message: 'Bought via Clean Door', balance: tickets });
    } else {
        res.status(400).json({ status: 'fail', message: 'Sold Out' });
    }
});

// --- 2. PINTU MASUK "KEBAL" (INTEGRATED) ---
// FatBoy butang HIJAU akan tembak sini
app.post('/api/buy-integrated', async (req, res) => {
    try {
        // Tanya Z-Kinetic dulu: "Ini Bot ke Manusia?"
        const check = await axios.post(Z_KINETIC_URL, req.body);
        
        if (check.data.status === 'verified') {
            // Kalau Z-Kinetic kata OK (Manusia)
            if (tickets > 0) {
                tickets--;
                console.log(`[SECURE] 🟢 VERIFIED SALE. Balance: ${tickets}`);
                res.json({ status: 'success', message: 'Bought via Secure Door', balance: tickets });
            } else {
                res.status(400).json({ status: 'fail', message: 'Sold Out' });
            }
        } else {
            // Kalau Z-Kinetic kata BOT
            console.log(`[SECURE] 🛡️ BLOCKED A BOT!`);
            res.status(403).json({ status: 'blocked', message: 'Z-Kinetic Blocked You!' });
        }
    } catch (e) {
        // Kalau server error / tak ada token
        res.status(403).json({ status: 'blocked', message: 'Security Check Failed' });
    }
});

// --- RESET SYSTEM ---
app.post('/api/reset', (req, res) => {
    tickets = 1000;
    console.log('🔄 SYSTEM RESET');
    res.json({ message: 'Reset OK', balance: tickets });
});

// --- DASHBOARD (FRONTEND) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Z-TICKET LIVE</title>
        <meta http-equiv="refresh" content="1"> <style>
            body { background-color: #000; color: #0f0; font-family: 'Courier New', monospace; text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100vh; margin: 0; }
            h1 { font-size: 3rem; margin-bottom: 0; color: #fff; }
            .count { font-size: 15rem; font-weight: bold; text-shadow: 0 0 20px #0f0; margin: 0; }
            .label { font-size: 1.5rem; color: #666; }
            .status { margin-top: 20px; padding: 10px; border: 1px solid #333; display: inline-block; }
        </style>
    </head>
    <body>
        <h1>COLDPLAY 2026</h1>
        <div class="count">${tickets}</div>
        <div class="label">TICKETS REMAINING</div>
        <div class="status">
            SERVER STATUS: <strong>ONLINE</strong><br>
            MODE: <strong>HYBRID (Clean + Secured)</strong>
        </div>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
