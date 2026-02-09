/**
 * VULNERABLE TICKETING SYSTEM
 * "Vulnerable by Design" - For Demo Purposes
 * 
 * This is a REAL ticketing system with REAL vulnerabilities
 * that bot attacks can exploit.
 * 
 * Features:
 * - Real database (in-memory for demo)
 * - Real checkout flow
 * - NO bot protection (intentionally vulnerable)
 * - Can be attacked by FatBoy
 * 
 * Deploy to: Render.com
 * URL: https://vulnerable-tickets.onrender.com
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// ============================================
// IN-MEMORY DATABASE (Real data structure)
// ============================================

const events = [
  {
    id: 1,
    name: 'Coldplay Concert 2026',
    venue: 'Bukit Jalil Stadium',
    date: '2026-03-15',
    price: 299,
    totalTickets: 1000,
    availableTickets: 1000,
    image: 'https://via.placeholder.com/400x200/1a1a1a/ffffff?text=Coldplay+2026',
  },
  {
    id: 2,
    name: 'Siti Nurhaliza Live',
    venue: 'KLCC Convention Centre',
    date: '2026-04-20',
    price: 199,
    totalTickets: 500,
    availableTickets: 500,
    image: 'https://via.placeholder.com/400x200/2a2a2a/ffffff?text=Siti+Nurhaliza',
  },
  {
    id: 3,
    name: 'Ed Sheeran Malaysia Tour',
    venue: 'Axiata Arena',
    date: '2026-05-10',
    price: 399,
    totalTickets: 800,
    availableTickets: 800,
    image: 'https://via.placeholder.com/400x200/3a3a3a/ffffff?text=Ed+Sheeran',
  },
];

const purchases = []; // Store all purchases (bot + human)
const botDetectionLogs = []; // Track bot attempts

let totalRevenue = 0;
let totalBotPurchases = 0;
let totalHumanPurchases = 0;

// ============================================
// ENDPOINTS
// ============================================

// Get all events
app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    events: events,
    stats: {
      totalRevenue,
      totalPurchases: purchases.length,
      botPurchases: totalBotPurchases,
      humanPurchases: totalHumanPurchases,
    },
  });
});

// Get single event
app.get('/api/events/:id', (req, res) => {
  const event = events.find(e => e.id === parseInt(req.params.id));
  
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  
  res.json({ success: true, event });
});

// ============================================
// VULNERABLE PURCHASE ENDPOINT (No Protection!)
// ============================================
app.post('/api/purchase/vulnerable', (req, res) => {
  const { eventId, quantity, buyerName, buyerEmail } = req.body;
  
  // Find event
  const event = events.find(e => e.id === parseInt(eventId));
  
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  
  // Check availability (but no rate limiting, no bot detection!)
  if (event.availableTickets < quantity) {
    return res.status(400).json({
      success: false,
      error: 'Not enough tickets available',
    });
  }
  
  // Process purchase (VULNERABLE - accepts all requests!)
  event.availableTickets -= quantity;
  
  const purchase = {
    id: purchases.length + 1,
    eventId: event.id,
    eventName: event.name,
    quantity: quantity,
    totalPrice: event.price * quantity,
    buyerName: buyerName,
    buyerEmail: buyerEmail,
    timestamp: new Date().toISOString(),
    isBot: buyerName.includes('BOT') || buyerEmail.includes('bot'), // Simple detection
  };
  
  purchases.push(purchase);
  totalRevenue += purchase.totalPrice;
  
  if (purchase.isBot) {
    totalBotPurchases++;
  } else {
    totalHumanPurchases++;
  }
  
  console.log(`ðŸ’³ PURCHASE: ${buyerName} bought ${quantity} tickets for ${event.name}`);
  
  res.json({
    success: true,
    purchase: purchase,
    message: 'Purchase successful! (No bot protection - vulnerable!)',
  });
});

// ============================================
// PROTECTED PURCHASE ENDPOINT (With Z-Kinetic!)
// ============================================
app.post('/api/purchase/protected', async (req, res) => {
  const { eventId, quantity, buyerName, buyerEmail, biometricData } = req.body;
  
  // Find event
  const event = events.find(e => e.id === parseInt(eventId));
  
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }
  
  // Check availability
  if (event.availableTickets < quantity) {
    return res.status(400).json({
      success: false,
      error: 'Not enough tickets available',
    });
  }
  
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // Z-KINETIC PROTECTION
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  
  if (!biometricData) {
    console.log(`ðŸ›¡ï¸ BLOCKED: No biometric data from ${buyerName}`);
    botDetectionLogs.push({
      timestamp: new Date().toISOString(),
      buyer: buyerName,
      reason: 'Missing biometric data',
      blocked: true,
    });
    
    return res.status(403).json({
      success: false,
      error: 'Biometric verification required',
      blocked: true,
    });
  }
  
  const { motion, touch, pattern } = biometricData;
  
  // Apply Z-Kinetic thresholds
  const motionOK = motion > 0.15;
  const touchOK = touch > 0.15;
  const patternOK = pattern > 0.10;
  
  const sensorsActive = [motionOK, touchOK, patternOK].filter(Boolean).length;
  
  if (sensorsActive < 2) {
    console.log(`ðŸ›¡ï¸ BLOCKED: Bot detected from ${buyerName} (motion=${motion}, touch=${touch}, pattern=${pattern})`);
    botDetectionLogs.push({
      timestamp: new Date().toISOString(),
      buyer: buyerName,
      biometric: { motion, touch, pattern },
      reason: 'Insufficient biometric signals (bot detected)',
      blocked: true,
    });
    
    return res.status(403).json({
      success: false,
      error: 'Bot detected: Insufficient human biometric signals',
      blocked: true,
      details: {
        motion: motionOK ? 'PASS' : 'FAIL',
        touch: touchOK ? 'PASS' : 'FAIL',
        pattern: patternOK ? 'PASS' : 'FAIL',
        required: '2/3 sensors must pass',
      },
    });
  }
  
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // If passed Z-Kinetic, process purchase
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  
  event.availableTickets -= quantity;
  
  const purchase = {
    id: purchases.length + 1,
    eventId: event.id,
    eventName: event.name,
    quantity: quantity,
    totalPrice: event.price * quantity,
    buyerName: buyerName,
    buyerEmail: buyerEmail,
    timestamp: new Date().toISOString(),
    isBot: false, // Passed Z-Kinetic, assumed human
    protected: true,
    biometricScore: {
      motion: motion.toFixed(3),
      touch: touch.toFixed(3),
      pattern: pattern.toFixed(3),
    },
  };
  
  purchases.push(purchase);
  totalRevenue += purchase.totalPrice;
  totalHumanPurchases++;
  
  console.log(`âœ… PROTECTED PURCHASE: ${buyerName} bought ${quantity} tickets (verified human)`);
  
  res.json({
    success: true,
    purchase: purchase,
    message: 'Purchase successful! (Z-Kinetic verified)',
    protected: true,
  });
});

// ============================================
// ADMIN ENDPOINTS (For Demo Visualization)
// ============================================

// Get all purchases
app.get('/api/admin/purchases', (req, res) => {
  res.json({
    success: true,
    purchases: purchases,
    total: purchases.length,
  });
});

// Get bot detection logs
app.get('/api/admin/bot-logs', (req, res) => {
  res.json({
    success: true,
    logs: botDetectionLogs,
    total: botDetectionLogs.length,
  });
});

// Get stats
app.get('/api/admin/stats', (req, res) => {
  const totalTicketsSold = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const totalTicketsAvailable = events.reduce((sum, e) => sum + e.availableTickets, 0);
  
  res.json({
    success: true,
    stats: {
      revenue: {
        total: totalRevenue,
        currency: 'RM',
      },
      purchases: {
        total: purchases.length,
        human: totalHumanPurchases,
        bot: totalBotPurchases,
      },
      tickets: {
        sold: totalTicketsSold,
        available: totalTicketsAvailable,
      },
      botsPrevented: botDetectionLogs.length,
      conversionRate: purchases.length > 0 
        ? ((totalHumanPurchases / purchases.length) * 100).toFixed(1) + '%'
        : '0%',
    },
  });
});

// Reset system (for demo purposes)
app.post('/api/admin/reset', (req, res) => {
  // Reset tickets
  events.forEach(event => {
    event.availableTickets = event.totalTickets;
  });
  
  // Clear purchases
  purchases.length = 0;
  botDetectionLogs.length = 0;
  
  totalRevenue = 0;
  totalBotPurchases = 0;
  totalHumanPurchases = 0;
  
  console.log('ðŸ”„ System reset for demo');
  
  res.json({
    success: true,
    message: 'System reset successfully',
  });
});

// ============================================
// SIMPLE WEB INTERFACE (For Visual Demo)
// ============================================

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vulnerable Ticketing Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 {
            text-align: center;
            margin-bottom: 10px;
            color: #ff5722;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 30px;
        }
        .warning {
            background: rgba(255, 87, 34, 0.1);
            border: 2px solid #ff5722;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #ff5722;
        }
        .stat-label {
            color: #888;
            margin-top: 5px;
        }
        .events {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .event-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .event-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }
        .event-details {
            padding: 20px;
        }
        .event-name {
            font-size: 1.3em;
            margin-bottom: 10px;
            color: #fff;
        }
        .event-info {
            color: #888;
            margin-bottom: 5px;
            font-size: 0.9em;
        }
        .event-price {
            font-size: 1.5em;
            color: #4caf50;
            margin: 10px 0;
        }
        .availability {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn {
            background: #ff5722;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 5px;
            font-size: 1em;
        }
        .btn:hover { background: #e64a19; }
        .btn-secondary {
            background: #2196F3;
        }
        .btn-secondary:hover { background: #1976D2; }
        .api-docs {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .endpoint {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ðŸŽ« Vulnerable Ticketing Demo</h1>
        <p class="subtitle">Real ticketing system for Z-Kinetic demonstration</p>
        
        <div class="warning">
            âš ï¸ <strong>DEMO SYSTEM</strong> - Intentionally vulnerable for testing purposes
        </div>
        
        <div class="stats" id="stats">
            <div class="stat-card">
                <div class="stat-value" id="totalRevenue">RM 0</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalPurchases">0</div>
                <div class="stat-label">Total Purchases</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="botPurchases">0</div>
                <div class="stat-label">Bot Purchases</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="humanPurchases">0</div>
                <div class="stat-label">Human Purchases</div>
            </div>
        </div>
        
        <button class="btn btn-secondary" onclick="resetSystem()">ðŸ”„ Reset Demo</button>
        
        <h2 style="margin: 30px 0 20px 0;">Available Events</h2>
        <div class="events" id="events"></div>
        
        <div class="api-docs">
            <h3>API Endpoints</h3>
            <div class="endpoint">POST /api/purchase/vulnerable - Purchase WITHOUT bot protection</div>
            <div class="endpoint">POST /api/purchase/protected - Purchase WITH Z-Kinetic protection</div>
            <div class="endpoint">GET /api/events - List all events</div>
            <div class="endpoint">GET /api/admin/stats - Get statistics</div>
            <div class="endpoint">POST /api/admin/reset - Reset demo system</div>
        </div>
    </div>
    
    <script>
        async function loadData() {
            try {
                const res = await fetch('/api/events');
                const data = await res.json();
                
                // Update stats
                document.getElementById('totalRevenue').textContent = 'RM ' + data.stats.totalRevenue;
                document.getElementById('totalPurchases').textContent = data.stats.totalPurchases;
                document.getElementById('botPurchases').textContent = data.stats.botPurchases;
                document.getElementById('humanPurchases').textContent = data.stats.humanPurchases;
                
                // Display events
                const eventsDiv = document.getElementById('events');
                eventsDiv.innerHTML = data.events.map(event => \`
                    <div class="event-card">
                        <img src="\${event.image}" class="event-image" alt="\${event.name}">
                        <div class="event-details">
                            <div class="event-name">\${event.name}</div>
                            <div class="event-info">ðŸ“ \${event.venue}</div>
                            <div class="event-info">ðŸ“… \${event.date}</div>
                            <div class="event-price">RM \${event.price}</div>
                            <div class="availability">
                                <span>\${event.availableTickets} / \${event.totalTickets} available</span>
                            </div>
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Error loading data:', error);
            }
        }
        
        async function resetSystem() {
            if (confirm('Reset demo system? This will clear all purchases.')) {
                try {
                    await fetch('/api/admin/reset', { method: 'POST' });
                    loadData();
                    alert('System reset successfully!');
                } catch (error) {
                    alert('Error resetting system');
                }
            }
        }
        
        // Load data on page load and refresh every 5 seconds
        loadData();
        setInterval(loadData, 5000);
    </script>
</body>
</html>
  `);
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('  ðŸŽ« VULNERABLE TICKETING DEMO SYSTEM');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log(`âœ… Server running on port ${PORT}`);
  console.log(`ðŸŒ Web UI: http://localhost:${PORT}`);
  console.log(`ðŸš¨ Status: VULNERABLE (For demo purposes)`);
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
});
