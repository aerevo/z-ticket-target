/**
 * Z-TICKET SERVER - DUAL MODE (REAL!)
 * 
 * TWO ACTUAL MODES:
 * 1. CLEAN MODE: Normal ticketing (vulnerable to bots)
 * 2. INTEGRATED MODE: With Z-Kinetic protection
 * 
 * Toggle between modes via settings endpoint
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// ============================================
// SYSTEM STATE (Toggle between modes)
// ============================================

let SYSTEM_MODE = 'clean'; // 'clean' or 'integrated'

const systemConfig = {
  mode: 'clean',
  zKineticEnabled: false,
  serverStartTime: Date.now(),
};

// ============================================
// DATABASE
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
  },
  {
    id: 2,
    name: 'Siti Nurhaliza Live',
    venue: 'KLCC Convention Centre',
    date: '2026-04-20',
    price: 199,
    totalTickets: 500,
    availableTickets: 500,
  },
];

const purchases = [];
const blockedAttempts = [];

let stats = {
  totalPurchases: 0,
  botPurchases: 0,
  humanPurchases: 0,
  blockedBots: 0,
  revenue: 0,
};

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

// Get current mode
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    mode: systemConfig.mode,
    zKineticEnabled: systemConfig.zKineticEnabled,
    uptime: Date.now() - systemConfig.serverStartTime,
  });
});

// Switch to CLEAN mode
app.post('/api/config/clean', (req, res) => {
  systemConfig.mode = 'clean';
  systemConfig.zKineticEnabled = false;
  
  console.log('🔓 SWITCHED TO CLEAN MODE (No Protection)');
  
  res.json({
    success: true,
    mode: 'clean',
    message: 'System now running WITHOUT Z-Kinetic protection',
  });
});

// Switch to INTEGRATED mode
app.post('/api/config/integrated', (req, res) => {
  systemConfig.mode = 'integrated';
  systemConfig.zKineticEnabled = true;
  
  console.log('🛡️ SWITCHED TO INTEGRATED MODE (Z-Kinetic Active)');
  
  res.json({
    success: true,
    mode: 'integrated',
    message: 'System now running WITH Z-Kinetic protection',
  });
});

// ============================================
// UNIFIED PURCHASE ENDPOINT (Mode-Aware)
// ============================================

app.post('/api/purchase', (req, res) => {
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
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODE CHECK: CLEAN vs INTEGRATED
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  if (systemConfig.mode === 'integrated' && systemConfig.zKineticEnabled) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INTEGRATED MODE: Z-KINETIC PROTECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    if (!biometricData) {
      blockedAttempts.push({
        buyer: buyerName,
        reason: 'No biometric data',
        timestamp: new Date().toISOString(),
      });
      stats.blockedBots++;
      
      console.log(`🛡️ BLOCKED: ${buyerName} - No biometric data`);
      
      return res.status(403).json({
        success: false,
        error: 'Z-Kinetic: Biometric verification required',
        blocked: true,
        mode: 'integrated',
      });
    }
    
    const { motion, touch, pattern } = biometricData;
    
    // Z-Kinetic thresholds
    const motionOK = motion > 0.15;
    const touchOK = touch > 0.15;
    const patternOK = pattern > 0.10;
    
    const passedSensors = [motionOK, touchOK, patternOK].filter(Boolean).length;
    
    if (passedSensors < 2) {
      blockedAttempts.push({
        buyer: buyerName,
        biometric: { motion, touch, pattern },
        reason: 'Bot detected - insufficient biometric signals',
        timestamp: new Date().toISOString(),
      });
      stats.blockedBots++;
      
      console.log(`🛡️ BLOCKED: ${buyerName} - Bot detected (${passedSensors}/3 sensors)`);
      
      return res.status(403).json({
        success: false,
        error: 'Z-Kinetic: Bot detected',
        blocked: true,
        mode: 'integrated',
        details: {
          motion: motionOK ? 'PASS' : 'FAIL',
          touch: touchOK ? 'PASS' : 'FAIL',
          pattern: patternOK ? 'PASS' : 'FAIL',
          required: '2/3 sensors must pass',
        },
      });
    }
    
    // Passed Z-Kinetic - process purchase
    event.availableTickets -= quantity;
    
    const purchase = {
      id: purchases.length + 1,
      eventId,
      eventName: event.name,
      quantity,
      totalPrice: event.price * quantity,
      buyerName,
      buyerEmail,
      timestamp: new Date().toISOString(),
      isBot: false,
      protected: true,
      mode: 'integrated',
      biometricScore: { motion, touch, pattern },
    };
    
    purchases.push(purchase);
    stats.totalPurchases++;
    stats.humanPurchases++;
    stats.revenue += purchase.totalPrice;
    
    console.log(`✅ PROTECTED PURCHASE: ${buyerName} (verified human)`);
    
    return res.json({
      success: true,
      purchase,
      message: 'Purchase successful (Z-Kinetic verified)',
      mode: 'integrated',
    });
    
  } else {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CLEAN MODE: NO PROTECTION (Vulnerable!)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    event.availableTickets -= quantity;
    
    const isBot = buyerName.includes('BOT') || buyerEmail.includes('bot');
    
    const purchase = {
      id: purchases.length + 1,
      eventId,
      eventName: event.name,
      quantity,
      totalPrice: event.price * quantity,
      buyerName,
      buyerEmail,
      timestamp: new Date().toISOString(),
      isBot,
      protected: false,
      mode: 'clean',
    };
    
    purchases.push(purchase);
    stats.totalPurchases++;
    
    if (isBot) {
      stats.botPurchases++;
      console.log(`⚠️ BOT PURCHASE: ${buyerName} (no protection active)`);
    } else {
      stats.humanPurchases++;
      console.log(`💳 HUMAN PURCHASE: ${buyerName}`);
    }
    
    stats.revenue += purchase.totalPrice;
    
    return res.json({
      success: true,
      purchase,
      message: 'Purchase successful (no bot protection)',
      mode: 'clean',
    });
  }
});

// ============================================
// DATA ENDPOINTS
// ============================================

app.get('/api/events', (req, res) => {
  res.json({
    success: true,
    events,
    mode: systemConfig.mode,
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    mode: systemConfig.mode,
    zKineticEnabled: systemConfig.zKineticEnabled,
    stats: {
      ...stats,
      blockRate: stats.totalPurchases > 0
        ? ((stats.blockedBots / (stats.totalPurchases + stats.blockedBots)) * 100).toFixed(1)
        : 0,
    },
  });
});

app.get('/api/purchases', (req, res) => {
  res.json({
    success: true,
    purchases,
    total: purchases.length,
  });
});

app.get('/api/blocked', (req, res) => {
  res.json({
    success: true,
    blocked: blockedAttempts,
    total: blockedAttempts.length,
  });
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

app.post('/api/admin/reset', (req, res) => {
  // Reset tickets
  events.forEach(e => {
    e.availableTickets = e.totalTickets;
  });
  
  // Clear data
  purchases.length = 0;
  blockedAttempts.length = 0;
  
  stats = {
    totalPurchases: 0,
    botPurchases: 0,
    humanPurchases: 0,
    blockedBots: 0,
    revenue: 0,
  };
  
  console.log('🔄 SYSTEM RESET');
  
  res.json({
    success: true,
    message: 'System reset complete',
    mode: systemConfig.mode,
  });
});

// ============================================
// WEB INTERFACE
// ============================================

app.get('/', (req, res) => {
  const modeColor = systemConfig.mode === 'integrated' ? '#4CAF50' : '#FF5722';
  const modeText = systemConfig.mode === 'integrated'
    ? '🛡️ INTEGRATED MODE (Z-Kinetic Active)'
    : '⚠️ CLEAN MODE (No Protection)';
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Z-Ticket Demo Server</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            color: #fff;
            font-size: 2.5em;
        }
        .mode-badge {
            display: inline-block;
            padding: 12px 24px;
            background: ${modeColor};
            border-radius: 20px;
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        .mode-toggle {
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-bottom: 30px;
        }
        .btn {
            padding: 16px 32px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-clean {
            background: #FF5722;
            color: white;
        }
        .btn-integrated {
            background: #4CAF50;
            color: white;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255,255,255,0.05);
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 8px;
        }
        .stat-label {
            color: #888;
            font-size: 0.9em;
        }
        .events {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .event-card {
            background: rgba(255,255,255,0.05);
            padding: 24px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .event-name {
            font-size: 1.3em;
            margin-bottom: 12px;
            color: #fff;
        }
        .event-info {
            color: #888;
            margin-bottom: 8px;
        }
        .event-price {
            font-size: 1.5em;
            color: #4CAF50;
            margin: 12px 0;
        }
        .availability {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .info-box {
            background: rgba(33, 150, 243, 0.1);
            border: 1px solid #2196F3;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎫 Z-Ticket Demo Server</h1>
        
        <div style="text-align: center;">
            <span class="mode-badge">${modeText}</span>
        </div>
        
        <div class="mode-toggle">
            <button class="btn btn-clean" onclick="switchMode('clean')">
                ⚠️ CLEAN MODE
            </button>
            <button class="btn btn-integrated" onclick="switchMode('integrated')">
                🛡️ INTEGRATED MODE
            </button>
        </div>
        
        <div class="info-box">
            <strong>CLEAN MODE:</strong> Normal ticketing (vulnerable to bots)<br>
            <strong>INTEGRATED MODE:</strong> With Z-Kinetic protection (blocks bots)
        </div>
        
        <div class="stats" id="stats"></div>
        
        <h2 style="margin: 30px 0 20px 0;">Available Events</h2>
        <div class="events" id="events"></div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button class="btn btn-clean" onclick="resetSystem()">🔄 RESET SYSTEM</button>
        </div>
    </div>
    
    <script>
        async function loadData() {
            const statsRes = await fetch('/api/stats');
            const statsData = await statsRes.json();
            
            document.getElementById('stats').innerHTML = \`
                <div class="stat-card">
                    <div class="stat-value">RM \${statsData.stats.revenue}</div>
                    <div class="stat-label">Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${statsData.stats.totalPurchases}</div>
                    <div class="stat-label">Purchases</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${statsData.stats.blockedBots}</div>
                    <div class="stat-label">Bots Blocked</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${statsData.stats.blockRate}%</div>
                    <div class="stat-label">Block Rate</div>
                </div>
            \`;
            
            const eventsRes = await fetch('/api/events');
            const eventsData = await eventsRes.json();
            
            document.getElementById('events').innerHTML = eventsData.events.map(event => \`
                <div class="event-card">
                    <div class="event-name">\${event.name}</div>
                    <div class="event-info">📍 \${event.venue}</div>
                    <div class="event-info">📅 \${event.date}</div>
                    <div class="event-price">RM \${event.price}</div>
                    <div class="availability">
                        Available: \${event.availableTickets} / \${event.totalTickets}
                    </div>
                </div>
            \`).join('');
        }
        
        async function switchMode(mode) {
            await fetch(\`/api/config/\${mode}\`, { method: 'POST' });
            location.reload();
        }
        
        async function resetSystem() {
            if (confirm('Reset all data?')) {
                await fetch('/api/admin/reset', { method: 'POST' });
                location.reload();
            }
        }
        
        loadData();
        setInterval(loadData, 3000);
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
  console.log('═══════════════════════════════════════════');
  console.log('  🎫 Z-TICKET DEMO SERVER (DUAL MODE)');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Mode: ${systemConfig.mode.toUpperCase()}`);
  console.log(`🛡️ Z-Kinetic: ${systemConfig.zKineticEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log('═══════════════════════════════════════════');
});
