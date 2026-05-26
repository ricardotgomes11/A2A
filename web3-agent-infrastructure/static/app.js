const termOut = document.getElementById('term-out');
const termIn = document.getElementById('term-in');
const regContainer = document.getElementById('register-container');
const statusIndicator = document.getElementById('connection-status');
const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let telemetryData = null;

// Canvas scaling setup
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight - 40;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Append to terminal view
function appendTerminal(text, type = 'info') {
    const el = document.createElement('div');
    el.innerHTML = `[${new Date().toLocaleTimeString()}] ${text.replace(/\n/g, '<br>')}`;
    if (type === 'error') el.style.color = '#f43f5e';
    if (type === 'success') el.style.color = '#10b981';
    if (type === 'input') el.style.color = '#06b6d4';
    termOut.appendChild(el);
    termOut.scrollTop = termOut.scrollHeight;
}

// WebSocket Connection Management
const ws = new WebSocket(`ws://${window.location.host}/ws/telemetry`);

ws.onopen = () => {
    statusIndicator.className = 'status-indicator stable';
    statusIndicator.textContent = 'CONNECTED';
    appendTerminal('Web3-Chase Clearing Bridge Simulation Pipe Linked Successfully.', 'success');
    appendTerminal('Type <b>help</b> or try: <b>trigger-transfer</b>, <b>enable-secure-channel</b>, <b>calculate-vicreg</b>, <b>optimize-routing-trajectory</b>, <b>trigger-audit</b>', 'info');
};

ws.onclose = () => {
    statusIndicator.className = 'status-indicator alert';
    statusIndicator.textContent = 'DISCONNECTED';
    appendTerminal('Connection vector lost.', 'error');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    telemetryData = data;
    
    // UI Register Update Matrix
    regContainer.innerHTML = '';
    for (const [key, val] of Object.entries(data.registers)) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `<div class="label">${key.replace(/_/g, ' ')}</div><div class="value">${val}</div>`;
        regContainer.appendChild(card);
    }

    if (data.audit_status === "active") {
         appendTerminal("Alert: Real-time Compliance sweep audit cycle running...", "error");
         // Inject compliance audit particles
         if (Math.random() < 0.4) {
             triggerSweepParticles();
         }
    }
};

// Node Spatial Mapping Setup
const nodePositions = {
    "METAMASK": { x: 0.1, y: 0.5, label: "MetaMask", role: "Client Gate", color: "#f59e0b" },
    "BITCOIN": { x: 0.35, y: 0.3, label: "Bitcoin", role: "Layer 1 Asset", color: "#f59e0b" },
    "BINANCE": { x: 0.35, y: 0.7, label: "Binance", role: "Liquidity Engine", color: "#eab308" },
    "BITPAY": { x: 0.65, y: 0.3, label: "BitPay", role: "Settlement Utility", color: "#3b82f6" },
    "COINBASE": { x: 0.65, y: 0.7, label: "Coinbase", role: "Institutional Ramp", color: "#06b6d4" },
    "JPMORGAN CHASE": { x: 0.9, y: 0.5, label: "JPMorgan Chase", role: "Treasury Center", color: "#a855f7" }
};

// Define explicit flow paths
const flowPaths = [
    { from: "METAMASK", to: "BITCOIN" },
    { from: "METAMASK", to: "BINANCE" },
    { from: "BITCOIN", to: "BITPAY" },
    { from: "BITCOIN", to: "COINBASE" },
    { from: "BINANCE", to: "BITPAY" },
    { from: "BINANCE", to: "COINBASE" },
    { from: "BITPAY", to: "JPMORGAN CHASE" },
    { from: "COINBASE", to: "JPMORGAN CHASE" }
];

function triggerSweepParticles(route = null) {
    if (route) {
        const nodes = route.split('->').map(s => s.trim());
        for (let i = 0; i < nodes.length - 1; i++) {
            const from = nodes[i];
            const to = nodes[i+1];
            particles.push({
                path: { from, to },
                t: 0,
                speed: 0.008 + Math.random() * 0.006,
                size: 3 + Math.random() * 2
            });
        }
    } else {
        flowPaths.forEach(path => {
            particles.push({
                path: path,
                t: 0,
                speed: 0.01 + Math.random() * 0.015,
                size: 2 + Math.random() * 3
            });
        });
    }
}

// Canvas Execution Loop
function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background network grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw connection lines
    ctx.lineWidth = 2;
    flowPaths.forEach(path => {
        const fromNode = nodePositions[path.from];
        const toNode = nodePositions[path.to];
        if (fromNode && toNode) {
            const fx = fromNode.x * canvas.width;
            const fy = fromNode.y * canvas.height;
            const tx = toNode.x * canvas.width;
            const ty = toNode.y * canvas.height;
            
            // Gradient along the line
            const grad = ctx.createLinearGradient(fx, fy, tx, ty);
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            grad.addColorStop(1, 'rgba(168, 85, 247, 0.25)');
            
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = grad;
            ctx.stroke();
        }
    });

    // Update and draw path flow particles
    particles.forEach((p, idx) => {
        let speedMultiplier = 1.0;
        if (telemetryData) {
            const loss = telemetryData.registers.VICREG_LOSS || 0.0;
            const coherence = telemetryData.system_coherence_index || 100.0;
            speedMultiplier = (coherence / 100.0) * (1.0 / (1.0 + loss * 0.05));
        }
        p.t += p.speed * speedMultiplier;
        if (p.t >= 1) {
            particles.splice(idx, 1);
            return;
        }
        
        const fromNode = nodePositions[p.path.from];
        const toNode = nodePositions[p.path.to];
        if (fromNode && toNode) {
            const fx = fromNode.x * canvas.width;
            const fy = fromNode.y * canvas.height;
            const tx = toNode.x * canvas.width;
            const ty = toNode.y * canvas.height;
            
            const px = fx + (tx - fx) * p.t;
            const py = fy + (ty - fy) * p.t;
            
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, 2 * Math.PI);
            ctx.fillStyle = '#ec4899';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ec4899';
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    });

    // Draw Nodes
    Object.keys(nodePositions).forEach(nodeId => {
        const node = nodePositions[nodeId];
        const nx = node.x * canvas.width;
        const ny = node.y * canvas.height;
        
        // Find corresponding state from telemetry
        let status = 'stable';
        let load = 0.1;
        if (telemetryData && telemetryData.nodes) {
            const match = telemetryData.nodes.find(n => n.id === nodeId);
            if (match) {
                status = match.status;
                load = match.load;
            }
        }

        // Draw pulsating halo based on status and load
        const pulse = 10 + Math.sin(Date.now() * 0.003 + nodeId.charCodeAt(0)) * 5;
        const radius = 22 + load * 15;
        
        ctx.beginPath();
        ctx.arc(nx, ny, radius + pulse * 0.4, 0, 2 * Math.PI);
        if (status === 'stable') {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        } else {
            ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
        }
        ctx.fill();
        ctx.stroke();

        // Draw main node circle
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();

        // Draw live data stream activity wave rings
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
            const waveRadius = radius + ((Date.now() * 0.04 + i * 25) % 75);
            const alpha = Math.max(0, 1 - (waveRadius - radius) / 75) * 0.15;
            ctx.beginPath();
            ctx.arc(nx, ny, waveRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1.5;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.restore();
        }

        // Draw node title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, nx, ny - 2);

        // Draw node role/type
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText(node.role.toUpperCase(), nx, ny + 10);

        // Draw live geospatial calculated metrics (distance and latency from Manhattan)
        let distanceText = "";
        let latencyText = "";
        if (telemetryData && telemetryData.nodes) {
            const match = telemetryData.nodes.find(n => n.id === nodeId);
            if (match && match.distance_km !== undefined) {
                distanceText = `${match.distance_km.toLocaleString()} km`;
                latencyText = `${match.latency_ms.toFixed(2)} ms`;
            }
        }
        if (distanceText) {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
            ctx.font = '8px JetBrains Mono, monospace';
            ctx.fillText(`${distanceText} | ${latencyText}`, nx, ny + 20);
        }
    });

    // Draw telemetry card overlay
    if (telemetryData) {
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(15, 15, 300, 112, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`OPERATOR: ${telemetryData.operator}`, 25, 35);
        ctx.fillStyle = '#a855f7';
        ctx.fillText(`ANCHOR: ${telemetryData.geospatial_anchor}`, 25, 52);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`CLIENT ID: ${telemetryData.client_id}`, 25, 69);
        ctx.fillStyle = '#10b981';
        ctx.fillText(`AUDIT STATUS: ${telemetryData.audit_status.toUpperCase()}`, 25, 86);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`COHERENCE INDEX: ${telemetryData.system_coherence_index || 0}%`, 25, 103);
    }
    
    requestAnimationFrame(drawNetwork);
}
drawNetwork();

// Intercept Local CLI Input Array
termIn.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const cmd = termIn.value.trim();
        if (!cmd) return;
        
        appendTerminal(cmd, 'input');
        termIn.value = '';

        if (cmd.toLowerCase() === 'help') {
            appendTerminal(
                'Available Commands:<br>' +
                ' - <b>trigger-transfer</b>: Increment bridge volume metrics and run simulated transfer split<br>' +
                ' - <b>reset-metrics</b>: Reset all registers and latency parameters<br>' +
                ' - <b>enable-secure-channel</b>: Verify secure cryptographic channel signature<br>' +
                ' - <b>calculate-vicreg</b>: Run representation decorrelation analysis via VICReg Loss<br>' +
                ' - <b>optimize-routing-trajectory</b>: Optimize clearing volume allocations using SciPy<br>' +
                ' - <b>process-settlement [gateway] [amount]</b>: Execute manual settlement routing<br>' +
                ' - <b>trigger-audit</b>: Trigger real-time compliance sweep audit simulation<br>' +
                ' - <b>resolve-audit</b>: Resolve active compliance audits and verify integrity hash<br>' +
                ' - <b>process-modules</b>: Ingest and process high-performance Web3 framework modules<br>' +
                ' - <b>run-analytics</b>: Run BigQuery SQL precalculations and telemetry analytics<br>' +
                ' - <b>shutdown</b>: Turn offline the simulation dashboard services',
                'info'
            );
            return;
        }

        // Execute JSON-RPC v2 Method Call Mapping
        try {
            const response = await fetch('/api/v1/a2a', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "lf.a2a.v1.A2AService.SendMessage",
                    params: { message: cmd },
                    id: Date.now()
                })
            });
            const data = await response.json();
            if (data.result) {
                appendTerminal(data.result.payload, 'success');
                // Parse route string if present to trigger path-specific particles
                const routeMatch = data.result.payload.match(/Route:\s+([A-Za-z0-9_ ]+(?:\s*->\s*[A-Za-z0-9_ ]+)+)/);
                if (routeMatch) {
                    triggerSweepParticles(routeMatch[1]);
                } else {
                    triggerSweepParticles();
                }
            } else {
                appendTerminal(data.error.message, 'error');
            }
        } catch (err) {
            appendTerminal('Transport level framework error.', 'error');
        }
    }
});
