const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const Z_KINETIC_URL = 'https://z-kinetic-server.onrender.com/attest';
let tickets = 1000;
let botCount = 0;
let humanCount = 0;

// 1. PINTU BOCOR (VULNERABLE)
app.post('/api/purchase/vulnerable', (req, res) => {
    if (tickets > 0) {
        tickets--;
        botCount++; // Kita anggap semua yang masuk sini adalah bot/unprotected
        console.log(`[VULNERABLE] Ticket Stolen! Left: ${tickets}`);
        res.json({ status: 'success', balance: tickets });
    } else {
        res.status(400).json({ message: 'Sold Out' });
    }
});

// 2. PINTU KEBAL (PROTECTED)
app.post('/api/purchase/protected', async (req, res) => {
    try {
        // Minta pengesahan Z-Kinetic
        const check = await axios.post(Z_KINETIC_URL, req.body);
        
        if (check.data.status === 'verified') {
            if (tickets > 0) {
                tickets--;
                humanCount++;
                console.log(`[SECURE] Human verified. Sale OK.`);
                return res.json({ status: 'success', balance: tickets });
            }
        }
        
        // Jika Z-Kinetic kesan bot
        console.log(`[SECURE] 🛡️ Z-KINETIC BLOCKED A BOT!`);
        res.status(403).json({ status: 'blocked' });
    } catch (e) {
        res.status(403).json({ status: 'blocked', error: 'Security Check Failed' });
    }
});

// 3. ADMIN RESET
app.post('/api/admin/reset', (req, res) => {
    tickets = 1000;
    botCount = 0;
    humanCount = 0;
    res.json({ status: 'reset', balance: 1000 });
});

// 4. DASHBOARD UI (KEMAS & PROFESSIONAL)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Z-TICKET MONITOR</title>
            <script>setInterval(() => location.reload(), 1500);</script>
            <style>
                body { background: #0a0a0a; color: white; font-family: 'Segoe UI', sans-serif; text-align: center; padding-top: 50px; }
                .container { max-width: 800px; margin: auto; border: 1px solid #333; padding: 30px; border-radius: 15px; background: #111; }
                .ticket-box { font-size: 120px; font-weight: bold; color: #00ff00; text-shadow: 0 0 20px rgba(0,255,0,0.5); }
                .stats { display: flex; justify-content: space-around; margin-top: 30px; }
                .stat-card { padding: 15px; border-radius: 10px; background: #1a1a1a; width: 40%; }
                .stat-bot { color: #ff4444; border: 1px solid #ff4444; }
                .stat-human { color: #44ff44; border: 1px solid #44ff44; }
                .header { color: #888; letter-spacing: 5px; text-transform: uppercase; font-size: 14px; }
                .badge { background: #333; padding: 5px 15px; border-radius: 50px; font-size: 12px; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">Live Ticketing System</div>
                <h1>COLDPLAY TOUR 2026</h1>
                <div class="badge">SECURED BY Z-KINETIC</div>
                <div class="ticket-box">${tickets}</div>
                <div style="color: #666">TICKETS REMAINING</div>
                
                <div class="stats">
                    <div class="stat-card stat-bot">
                        <div style="font-size: 12px">BOT PURCHASES</div>
                        <div style="font-size: 24px; font-weight: bold;">${botCount}</div>
                    </div>
                    <div class="stat-card stat-human">
                        <div style="font-size: 12px">HUMAN PURCHASES</div>
                        <div style="font-size: 24px; font-weight: bold;">${humanCount}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Server Active on Port ' + PORT));
