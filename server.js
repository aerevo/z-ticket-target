const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(cors());

// URL Z-Kinetic Authority
const Z_KINETIC_URL = 'https://z-kinetic-server.onrender.com/attest';

let tickets = 1000; // Database tiket kita

// --- PINTU 1: VULNERABLE (BOCOR) ---
app.post('/api/purchase/vulnerable', (req, res) => {
    if (tickets > 0) {
        tickets--;
        res.json({ status: 'success', mode: 'vulnerable', balance: tickets });
    } else {
        res.status(400).json({ message: 'Sold out' });
    }
});

// --- PINTU 2: PROTECTED (KEBAL) ---
app.post('/api/purchase/protected', async (req, res) => {
    try {
        // Tanya Z-Kinetic
        const check = await axios.post(Z_KINETIC_URL, req.body);
        if (check.data.status === 'verified') {
            if (tickets > 0) {
                tickets--;
                return res.json({ status: 'success', mode: 'protected', balance: tickets });
            }
        }
        // Jika Z-Kinetic kata BOT atau token tak sah
        res.status(403).json({ status: 'blocked', message: 'Z-Kinetic Blocked You' });
    } catch (e) {
        res.status(403).json({ status: 'blocked', message: 'Security Check Failed' });
    }
});

// Reset & Status API
app.get('/api/events', (req, res) => res.json({ tickets }));
app.post('/api/admin/reset', (req, res) => { tickets = 1000; res.json({ balance: tickets }); });

// Tampilan Website (Dashboard)
app.get('/', (req, res) => {
    res.send(`
        <body style="background:black;color:white;text-align:center;padding-top:100px;font-family:sans-serif;">
            <h1>🎫 Z-TICKET LIVE DASHBOARD</h1>
            <div style="font-size:150px;color:#00ff00;">${tickets}</div>
            <p>Tickets Left</p>
            <script>setInterval(()=>location.reload(), 1000)</script>
        </body>
    `);
});

app.listen(process.env.PORT || 3001);
