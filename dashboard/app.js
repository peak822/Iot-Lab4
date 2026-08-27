/* ══════════════════════════════════════════════════════════
   KC868-A6 Precision Laboratory Telemetry Matrix — Application Logic
   Clean Minimalist Laboratory HUD, WebGL Radar Engine (React Bits Spec), Micro-SFX
   ══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════
// Constants & Configuration
// ═══════════════════════════════════════

const STORAGE_SETTINGS_KEY = 'kc868_luxury_settings_v3';
const STORAGE_THEME_KEY = 'kc868_luxury_theme';
const STORAGE_SOUND_KEY = 'kc868_luxury_sound';
const STORAGE_SIM_KEY = 'kc868_sim_enabled';

const MAX_HISTORY = 96; // 48h at 30-min resolution
const SENSOR_TIMEOUT_MS = 180000; // 3 minutes timeout

const THEMES = ['cyan', 'emerald', 'twilight', 'amber'];
const THEME_NAMES = { 
    cyan: 'Cryo Cyan', 
    emerald: 'Bioclean Lab', 
    twilight: 'Laser Physics', 
    amber: 'Radiation Amber' 
};

// Clean Vector Icons (Zero Emojis)
const SVG_ICONS = {
    thermometer: `<svg class="card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><circle cx="11.5" cy="17.5" r="2"/></svg>`,
    battery: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="telemetry-svg"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="11" x2="23" y2="13"/></svg>`,
    rssi: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="telemetry-svg"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`
};

// 8 Sensor Definitions with Hardware Channel Identifiers
const SENSOR_CONFIG = [
    { id: 1, name: 'CHANNEL // 01', zone: 'CHAMBER 01', mac: 'A4:C1:38:00:00:01', model: 'LYWSD03MMC', baseTemp: 27.3, baseHum: 61.2, baseBat: 94, baseRssi: -52, color: '#38bdf8' },
    { id: 2, name: 'CHANNEL // 02', zone: 'CHAMBER 02', mac: 'A4:C1:38:00:00:02', model: 'LYWSD03MMC', baseTemp: 26.8, baseHum: 59.4, baseBat: 88, baseRssi: -55, color: '#818cf8' },
    { id: 3, name: 'CHANNEL // 03', zone: 'CHAMBER 03', mac: 'A4:C1:38:00:00:03', model: 'LYWSD03MMC', baseTemp: 28.1, baseHum: 64.0, baseBat: 91, baseRssi: -48, color: '#c084fc' },
    { id: 4, name: 'CHANNEL // 04', zone: 'CHAMBER 04', mac: 'A4:C1:38:00:00:04', model: 'LYWSD03MMC', baseTemp: 27.7, baseHum: 60.5, baseBat: 85, baseRssi: -61, color: '#f472b6' },
    { id: 5, name: 'CHANNEL // 05', zone: 'CHAMBER 05', mac: 'A4:C1:38:00:00:05', model: 'LYWSD03MMC', baseTemp: 27.0, baseHum: 63.1, baseBat: 90, baseRssi: -57, color: '#34d399' },
    { id: 6, name: 'CHANNEL // 06', zone: 'CHAMBER 06', mac: 'A4:C1:38:00:00:06', model: 'LYWSD03MMC', baseTemp: 28.5, baseHum: 65.2, baseBat: 77, baseRssi: -63, color: '#fbbf24' },
    { id: 7, name: 'CHANNEL // 07', zone: 'CHAMBER 07', mac: 'A4:C1:38:00:00:07', model: 'LYWSD03MMC', baseTemp: 26.9, baseHum: 58.0, baseBat: 79, baseRssi: -50, color: '#2dd4bf' },
    { id: 8, name: 'CHANNEL // 08', zone: 'CHAMBER 08', mac: 'A4:C1:38:00:00:08', model: 'LYWSD03MMC', baseTemp: 27.8, baseHum: 62.4, baseBat: 81, baseRssi: -58, color: '#fb923c' }
];

// App State
let simulationEnabled = true;
let sensorData = [];

let mqttCount = 0;
let uptimeSeconds = 3 * 3600 + 45 * 60;
let currentViewMode = 'grid';
let activeModalSensorId = null;
let simInterval = null;
let watchdogInterval = null;
let soundEnabled = true;
let currentThemeIndex = 0;

// MQTT & Charts
let mqttClient = null;
let isLiveMode = false;
let topicToSensorMap = {};
let isGatewayOnline = true;
let masterComparisonChart = null;
let modalCharts = {};

// ═══════════════════════════════════════
// WebGL Radar Background Engine (React Bits Spec)
// ═══════════════════════════════════════

let radarGl = null;
let radarProgram = null;
let radarUniforms = {};
let radarAnimationId = null;
let radarTargetMouse = [0.5, 0.5];
let radarCurrentMouse = [0.5, 0.5];

const RADAR_THEME_COLORS = {
    cyan: [0.0, 0.898, 1.0],         // #00e5ff
    emerald: [0.0, 0.96, 0.608],     // #00f59b
    twilight: [0.753, 0.518, 0.988], // #c084fc
    amber: [0.96, 0.62, 0.043]       // #f59e0b
};

function initRadarBackground() {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;

    try {
        radarGl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true }) || canvas.getContext('experimental-webgl');
    } catch (e) {
        console.warn('WebGL not supported for Radar background', e);
        return;
    }

    if (!radarGl) return;

    const gl = radarGl;
    gl.clearColor(0, 0, 0, 0);

    const vertexShaderSrc = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSrc = `
        precision highp float;

        uniform float uTime;
        uniform vec3 uResolution;
        uniform float uSpeed;
        uniform float uScale;
        uniform float uRingCount;
        uniform float uSpokeCount;
        uniform float uRingThickness;
        uniform float uSpokeThickness;
        uniform float uSweepSpeed;
        uniform float uSweepWidth;
        uniform float uSweepLobes;
        uniform vec3 uColor;
        uniform vec3 uBgColor;
        uniform float uFalloff;
        uniform float uBrightness;
        uniform vec2 uMouse;
        uniform float uMouseInfluence;
        uniform float uEnableMouse;

        #define TAU 6.28318530718
        #define PI 3.14159265359

        void main() {
            vec2 st = gl_FragCoord.xy / uResolution.xy;
            st = st * 2.0 - 1.0;
            st.x *= uResolution.x / uResolution.y;

            if (uEnableMouse > 0.5) {
                vec2 mShift = (uMouse * 2.0 - 1.0);
                mShift.x *= uResolution.x / uResolution.y;
                st -= mShift * uMouseInfluence;
            }

            st *= uScale;

            float dist = length(st);
            float theta = atan(st.y, st.x);
            float t = uTime * uSpeed;

            float ringPhase = dist * uRingCount - t;
            float ringDist = abs(fract(ringPhase) - 0.5);
            float ringGlow = 1.0 - smoothstep(0.0, uRingThickness, ringDist);

            float spokeAngle = abs(fract(theta * uSpokeCount / TAU + 0.5) - 0.5) * TAU / uSpokeCount;
            float arcDist = spokeAngle * dist;
            float spokeGlow = (1.0 - smoothstep(0.0, uSpokeThickness, arcDist)) * smoothstep(0.0, 0.08, dist);

            float sweepPhase = t * uSweepSpeed;
            float sweepBeam = pow(max(0.5 * sin(uSweepLobes * theta + sweepPhase) + 0.5, 0.0), uSweepWidth);

            float fade = smoothstep(1.15, 0.70, dist) * pow(max(1.0 - dist, 0.0), uFalloff);

            float intensity = max((ringGlow + spokeGlow + sweepBeam) * fade * uBrightness, 0.0);
            vec3 col = uColor * intensity + uBgColor;

            float alpha = clamp(intensity * 0.85, 0.0, 1.0);
            gl_FragColor = vec4(col, alpha);
        }
    `;

    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vertexShaderSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);
    if (!vs || !fs) return;

    radarProgram = gl.createProgram();
    gl.attachShader(radarProgram, vs);
    gl.attachShader(radarProgram, fs);
    gl.linkProgram(radarProgram);

    if (!gl.getProgramParameter(radarProgram, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(radarProgram));
        return;
    }

    gl.useProgram(radarProgram);

    // Quad geometry (Full screen)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
    ]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(radarProgram, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform Locations
    const uniformNames = [
        'uTime', 'uResolution', 'uSpeed', 'uScale', 'uRingCount', 'uSpokeCount',
        'uRingThickness', 'uSpokeThickness', 'uSweepSpeed', 'uSweepWidth',
        'uSweepLobes', 'uColor', 'uBgColor', 'uFalloff', 'uBrightness',
        'uMouse', 'uMouseInfluence', 'uEnableMouse'
    ];

    uniformNames.forEach(name => {
        radarUniforms[name] = gl.getUniformLocation(radarProgram, name);
    });

    // Set Initial Static / Default Uniforms
    gl.uniform1f(radarUniforms.uSpeed, 0.9);
    gl.uniform1f(radarUniforms.uScale, 0.60);
    gl.uniform1f(radarUniforms.uRingCount, 8.0); // 8 concentric channels
    gl.uniform1f(radarUniforms.uSpokeCount, 8.0); // 8 radial telemetry spokes
    gl.uniform1f(radarUniforms.uRingThickness, 0.032);
    gl.uniform1f(radarUniforms.uSpokeThickness, 0.012);
    gl.uniform1f(radarUniforms.uSweepSpeed, 0.85);
    gl.uniform1f(radarUniforms.uSweepWidth, 2.2);
    gl.uniform1f(radarUniforms.uSweepLobes, 1.0);
    gl.uniform3f(radarUniforms.uBgColor, 0.0, 0.0, 0.0);
    gl.uniform1f(radarUniforms.uFalloff, 2.0);
    gl.uniform1f(radarUniforms.uBrightness, 1.0);
    gl.uniform1f(radarUniforms.uMouseInfluence, 0.09);
    gl.uniform1f(radarUniforms.uEnableMouse, 1.0);

    // Set initial theme color
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'cyan';
    const c = RADAR_THEME_COLORS[currentTheme] || RADAR_THEME_COLORS.cyan;
    gl.uniform3f(radarUniforms.uColor, c[0], c[1], c[2]);

    function resizeRadar() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(window.innerWidth * dpr);
        const h = Math.round(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
            gl.useProgram(radarProgram);
            gl.uniform3f(radarUniforms.uResolution, w, h, w / h);
        }
    }

    window.addEventListener('resize', resizeRadar);
    resizeRadar();

    // Mouse Interaction
    window.addEventListener('mousemove', (e) => {
        radarTargetMouse = [
            e.clientX / window.innerWidth,
            1.0 - (e.clientY / window.innerHeight)
        ];
    });

    // Render Loop
    function renderRadar(now) {
        radarAnimationId = requestAnimationFrame(renderRadar);

        if (!radarGl || !radarProgram) return;
        gl.useProgram(radarProgram);

        gl.uniform1f(radarUniforms.uTime, now * 0.001);

        radarCurrentMouse[0] += (radarTargetMouse[0] - radarCurrentMouse[0]) * 0.05;
        radarCurrentMouse[1] += (radarTargetMouse[1] - radarCurrentMouse[1]) * 0.05;
        gl.uniform2f(radarUniforms.uMouse, radarCurrentMouse[0], radarCurrentMouse[1]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    radarAnimationId = requestAnimationFrame(renderRadar);
}

function updateRadarThemeColor(theme) {
    if (!radarGl || !radarProgram || !radarUniforms.uColor) return;
    const c = RADAR_THEME_COLORS[theme] || RADAR_THEME_COLORS.cyan;
    radarGl.useProgram(radarProgram);
    radarGl.uniform3f(radarUniforms.uColor, c[0], c[1], c[2]);
}

// ═══════════════════════════════════════
// Initialization of Sensor Data
// ═══════════════════════════════════════

function initSensorData(withSimData = true) {
    sensorData = SENSOR_CONFIG.map(cfg => ({
        ...cfg,
        temperature: withSimData ? cfg.baseTemp : null,
        humidity: withSimData ? cfg.baseHum : null,
        battery: withSimData ? cfg.baseBat : null,
        rssi: withSimData ? cfg.baseRssi : null,
        online: withSimData,
        hasReceivedRealData: false,
        packetCount: withSimData ? 12 : 0,
        lastUpdate: withSimData ? new Date() : null,
        visibleInMasterChart: true,
        history: {
            temp: withSimData ? generateHistory(cfg.baseTemp, 1.4, 48) : [],
            hum: withSimData ? generateHistory(cfg.baseHum, 2.5, 48) : [],
            rssi: withSimData ? generateHistory(cfg.baseRssi, 4, 48) : [],
            bat: withSimData ? generateBatteryHistory(cfg.baseBat, 48) : []
        }
    }));
}

// ═══════════════════════════════════════
// Simulation Toggle Engine
// ═══════════════════════════════════════

function toggleSimulationMode() {
    simulationEnabled = !simulationEnabled;
    localStorage.setItem(STORAGE_SIM_KEY, simulationEnabled ? '1' : '0');
    playSfx('click');

    applySimulationState();
}

function applySimulationState() {
    const btn = document.getElementById('btn-sim-toggle');
    const dot = document.getElementById('sim-status-dot');
    const text = document.getElementById('sim-status-text');
    const banner = document.getElementById('sim-banner');
    const heroDataSource = document.getElementById('hero-data-source');

    if (simulationEnabled) {
        if (btn) btn.className = 'icon-btn sim-toggle-btn on';
        if (dot) dot.className = 'sim-dot on';
        if (text) text.textContent = 'Sim: ON';

        if (!isLiveMode) {
            initSensorData(true);
            if (!simInterval) simInterval = setInterval(updateSimulationTick, 5000);
            if (heroDataSource) {
                heroDataSource.textContent = 'STANDBY ACTIVE';
                heroDataSource.style.color = '#fcd34d';
            }
        }
    } else {
        if (btn) btn.className = 'icon-btn sim-toggle-btn off';
        if (dot) dot.className = 'sim-dot off';
        if (text) text.textContent = 'Sim: OFF';

        if (simInterval) {
            clearInterval(simInterval);
            simInterval = null;
        }

        if (banner) banner.style.display = 'none';

        if (!isLiveMode) {
            initSensorData(false);
            if (heroDataSource) {
                heroDataSource.textContent = 'AWAITING MQTT';
                heroDataSource.style.color = 'var(--text-muted)';
            }
        }
    }

    renderAllCards();
    updateHeroMetrics();
    if (currentViewMode === 'map') renderSpatialMap();
    else if (currentViewMode === 'table') renderDataTable();
    else if (currentViewMode === 'analytics') renderMasterAnalyticsChart();

    if (activeModalSensorId !== null) {
        const s = sensorData.find(x => x.id === activeModalSensorId);
        if (s) updateModalDOM(s);
    }
}

// ═══════════════════════════════════════
// Web Audio Synthesizer (Micro-SFX)
// ═══════════════════════════════════════

let audioCtx = null;

function initAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSfx(type) {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx || audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click') {
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'open') {
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === 'connect') {
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(659, now + 0.08);
            osc.frequency.setValueAtTime(784, now + 0.16);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);
        }
    } catch (e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(STORAGE_SOUND_KEY, soundEnabled ? '1' : '0');
    updateSoundUI();
    if (soundEnabled) playSfx('click');
}

function updateSoundUI() {
    const onIcon = document.getElementById('icon-sound-on');
    const offIcon = document.getElementById('icon-sound-off');
    if (onIcon && offIcon) {
        onIcon.style.display = soundEnabled ? 'block' : 'none';
        offIcon.style.display = soundEnabled ? 'none' : 'block';
    }
}

// ═══════════════════════════════════════
// Theme Colorway Switcher
// ═══════════════════════════════════════

function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    const theme = THEMES[currentThemeIndex];
    applyTheme(theme);
    playSfx('click');
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-name').textContent = THEME_NAMES[theme] || theme;
    localStorage.setItem(STORAGE_THEME_KEY, theme);
    updateRadarThemeColor(theme);
}

// ═══════════════════════════════════════
// History & Laboratory Precision Calculations
// ═══════════════════════════════════════

function generateHistory(base, variance, points) {
    const data = [];
    let val = base;
    for (let i = 0; i < points; i++) {
        val += (Math.random() - 0.5) * variance * 0.4;
        val = base + (val - base) * 0.95;
        data.push(parseFloat(val.toFixed(2)));
    }
    return data;
}

function generateBatteryHistory(base, points) {
    const data = [];
    let val = Math.min(100, base + 2);
    for (let i = 0; i < points; i++) {
        val -= Math.random() * 0.08;
        data.push(Math.max(0, Math.round(val)));
    }
    return data;
}

function generateTimeLabels(points) {
    const labels = [];
    const now = new Date();
    for (let i = points - 1; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 30 * 60000);
        labels.push(t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0'));
    }
    return labels;
}

function randomFluctuation(current, base, maxDelta, decimals = 2) {
    const delta = (Math.random() - 0.5) * maxDelta;
    let newVal = current + delta;
    newVal += (base - newVal) * 0.05;
    return parseFloat(newVal.toFixed(decimals));
}

function calculateComfort(temp, hum) {
    if (temp === null || hum === null) return { text: 'STANDBY', class: 'offline' };
    if (temp > 28.5) return { text: 'ELEVATED', class: 'warm' };
    if (temp < 25.0) return { text: 'CRYO', class: 'cool' };
    if (hum > 70) return { text: 'HUMID', class: 'humid' };
    if (hum < 40) return { text: 'DRY', class: 'dry' };
    return { text: 'NOMINAL', class: 'optimal' };
}

function calculateDewPoint(temp, hum) {
    if (temp === null || hum === null) return '--';
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(hum / 100.0);
    return ((b * alpha) / (a - alpha)).toFixed(1);
}

// ═══════════════════════════════════════
// View Navigation (Grid / Map / Analytics / Table)
// ═══════════════════════════════════════

function switchViewMode(mode) {
    currentViewMode = mode;
    playSfx('click');

    ['grid', 'map', 'analytics', 'table'].forEach(m => {
        const tab = document.getElementById(`tab-${m}`);
        const panel = document.getElementById(`panel-${m}`);
        if (tab) tab.classList.toggle('active', m === mode);
        if (panel) panel.classList.toggle('active', m === mode);
    });

    if (mode === 'analytics') {
        setTimeout(renderMasterAnalyticsChart, 50);
    } else if (mode === 'map') {
        renderSpatialMap();
    } else if (mode === 'table') {
        renderDataTable();
    }
}

// ═══════════════════════════════════════
// VIEW 1: Precision Laboratory Card Grid
// ═══════════════════════════════════════

function createLuxuryCard(sensor) {
    const card = document.createElement('div');
    card.className = 'luxury-card';
    card.dataset.id = sensor.id;
    card.onclick = () => openModal(sensor.id);

    const batVal = sensor.battery !== null ? sensor.battery : 0;
    const batOffset = Math.max(0, 100 - batVal);
    const comfort = calculateComfort(sensor.temperature, sensor.humidity);
    const comfortClass = !sensor.online ? 'offline' : comfort.class;
    const comfortText = !sensor.online ? 'OFFLINE' : comfort.text;

    const tempStr = sensor.temperature !== null ? `${sensor.temperature.toFixed(1)}°C` : '--°C';
    const humStr = sensor.humidity !== null ? `${sensor.humidity.toFixed(1)}%` : '--%';
    const batStr = sensor.battery !== null ? `${sensor.battery}%` : '--%';
    const rssiStr = sensor.rssi !== null ? `${sensor.rssi} dBm` : '-- dBm';

    const subtitle = `MAC: ${sensor.mac}`;

    card.innerHTML = `
        <div class="card-head">
            <div class="card-node-info">
                <div class="card-icon-gauge">
                    <svg class="gauge-svg" viewBox="0 0 40 40">
                        <circle class="gauge-bg" cx="20" cy="20" r="14" />
                        <circle class="gauge-bar" id="gauge-bar-${sensor.id}" cx="20" cy="20" r="14" style="stroke-dashoffset: ${batOffset};" />
                    </svg>
                    ${SVG_ICONS.thermometer}
                </div>
                <div class="card-titles">
                    <span class="card-id-tag font-mono">CH.${sensor.id.toString().padStart(2, '0')} // ${sensor.zone}</span>
                    <span class="card-name-text font-mono">${sensor.name}</span>
                    <span class="card-location-text font-mono">${subtitle}</span>
                </div>
            </div>
            <span class="card-comfort-badge font-mono ${comfortClass}" id="card-comfort-${sensor.id}">${comfortText}</span>
        </div>

        <div class="card-body-metrics">
            <div class="card-metric-block">
                <div class="metric-micro-label font-mono">TEMPERATURE</div>
                <div class="metric-big-num temp font-mono" id="card-temp-${sensor.id}">${tempStr}</div>
            </div>
            <div class="card-metric-block">
                <div class="metric-micro-label font-mono">HUMIDITY</div>
                <div class="metric-big-num hum font-mono" id="card-hum-${sensor.id}">${humStr}</div>
            </div>
        </div>

        <div class="card-telemetry-row font-mono">
            <div class="telemetry-item">
                ${SVG_ICONS.battery}
                <strong id="card-bat-${sensor.id}">${batStr}</strong>
            </div>
            <div class="telemetry-item">
                ${SVG_ICONS.rssi}
                <strong id="card-rssi-${sensor.id}">${rssiStr}</strong>
            </div>
            <canvas class="card-sparkline-canvas" id="spark-${sensor.id}"></canvas>
        </div>
    `;

    // 3D Tilt Interaction
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const rotateX = ((y / rect.height) - 0.5) * -10;
        const rotateY = ((x / rect.width) - 0.5) * 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });

    return card;
}

function renderAllCards() {
    const grid = document.getElementById('sensor-luxury-grid');
    if (!grid) return;
    grid.innerHTML = '';
    sensorData.forEach(sensor => {
        grid.appendChild(createLuxuryCard(sensor));
    });
    sensorData.forEach(sensor => drawSparkline(sensor));
}

function drawSparkline(sensor) {
    const canvas = document.getElementById(`spark-${sensor.id}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = sensor.history.temp.slice(-18);
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const min = Math.min(...data) - 0.4;
    const max = Math.max(...data) + 0.4;
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = sensor.online ? 'rgba(0, 229, 255, 0.85)' : 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((val - min) / range) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

// ═══════════════════════════════════════
// VIEW 2: Interactive Spatial Chamber Heatmap
// ═══════════════════════════════════════

function renderSpatialMap() {
    const canvas = document.getElementById('floorplan-canvas');
    if (!canvas) return;
    canvas.innerHTML = '';

    sensorData.forEach(sensor => {
        const node = document.createElement('div');
        node.className = 'spatial-room-node';
        node.onclick = () => openModal(sensor.id);

        const hasTemp = sensor.temperature !== null;
        const tempColor = !hasTemp ? 'rgba(100, 116, 139, 0.08)' : sensor.temperature > 28 ? 'rgba(244, 63, 94, 0.22)' : sensor.temperature < 26 ? 'rgba(0, 229, 255, 0.22)' : 'rgba(16, 185, 129, 0.22)';

        const tempStr = hasTemp ? `${sensor.temperature.toFixed(1)}°C` : '--°C';
        const humStr = sensor.humidity !== null ? `${sensor.humidity.toFixed(1)}% RH` : '--% RH';

        node.innerHTML = `
            <div class="spatial-heat-glow" style="background: ${tempColor};"></div>
            <div class="room-node-top">
                <div class="room-name-badge font-mono">${sensor.zone}</div>
                <span class="room-sensor-id font-mono">CH.${sensor.id.toString().padStart(2, '0')}</span>
            </div>
            <div class="room-node-metrics">
                <span class="room-temp-display font-mono ${hasTemp && sensor.temperature > 28 ? 'temp-glow' : ''}">${tempStr}</span>
                <span class="room-hum-display font-mono">${humStr}</span>
            </div>
        `;
        canvas.appendChild(node);
    });
}

// ═══════════════════════════════════════
// VIEW 3: Master Analytics Spectrum Chart
// ═══════════════════════════════════════

function renderMasterAnalyticsChart() {
    const canvas = document.getElementById('master-comparison-chart');
    if (!canvas) return;

    const togglesContainer = document.getElementById('chart-sensor-toggles');
    if (togglesContainer) {
        togglesContainer.innerHTML = '';
        sensorData.forEach((s, idx) => {
            const chip = document.createElement('button');
            chip.className = `sensor-toggle-chip font-mono ${s.visibleInMasterChart ? 'active' : ''}`;
            chip.innerHTML = `<span class="sensor-toggle-dot" style="background: ${s.color};"></span> CH.${s.id} ${s.zone}`;
            chip.onclick = () => {
                s.visibleInMasterChart = !s.visibleInMasterChart;
                chip.classList.toggle('active', s.visibleInMasterChart);
                masterComparisonChart.data.datasets[idx].hidden = !s.visibleInMasterChart;
                masterComparisonChart.update('none');
                playSfx('click');
            };
            togglesContainer.appendChild(chip);
        });
    }

    if (masterComparisonChart) {
        masterComparisonChart.destroy();
    }

    const firstValid = sensorData.find(s => s.history.temp.length > 0);
    const historyLen = firstValid ? firstValid.history.temp.length : 12;
    const labels = generateTimeLabels(historyLen);

    const datasets = sensorData.map((s) => ({
        label: `CH.${s.id} ${s.zone}`,
        data: s.history.temp.length > 0 ? [...s.history.temp] : Array(historyLen).fill(null),
        borderColor: s.color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        hidden: !s.visibleInMasterChart
    }));

    masterComparisonChart = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(8, 12, 22, 0.95)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    titleFont: { family: 'JetBrains Mono', size: 11, weight: 700 },
                    bodyFont: { family: 'JetBrains Mono', size: 11 },
                    padding: 10,
                    cornerRadius: 4
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.025)' },
                    ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 10 }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.025)' },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'JetBrains Mono', size: 10 },
                        callback: v => (typeof v === 'number' ? Number(v.toFixed(1)) : v) + '°C'
                    }
                }
            }
        }
    });
}

// ═══════════════════════════════════════
// VIEW 4: Precision Data Sheet (Table View)
// ═══════════════════════════════════════

function renderDataTable() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    sensorData.forEach(s => {
        const comfort = calculateComfort(s.temperature, s.humidity);
        const tr = document.createElement('tr');
        tr.onclick = () => openModal(s.id);

        const tempStr = s.temperature !== null ? `${s.temperature.toFixed(1)}°C` : '--°C';
        const humStr = s.humidity !== null ? `${s.humidity.toFixed(1)}%` : '--%';
        const batStr = s.battery !== null ? `${s.battery}%` : '--%';
        const rssiStr = s.rssi !== null ? `${s.rssi} dBm` : '-- dBm';
        const timeStr = s.lastUpdate ? formatTimeAgo(s.lastUpdate) : '--';

        tr.innerHTML = `
            <td><strong class="font-mono" style="color:var(--accent)">CH.${s.id.toString().padStart(2, '0')}</strong></td>
            <td><strong class="font-mono">${s.name}</strong> <span class="font-mono" style="color:var(--text-muted); font-size:0.72rem">(${s.mac})</span></td>
            <td><span class="live-pulse ${s.online ? 'green' : 'red'}"></span> <span class="font-mono">${s.online ? 'ONLINE' : 'OFFLINE'}</span></td>
            <td><strong class="temp-glow font-mono">${tempStr}</strong></td>
            <td><strong class="hum-glow font-mono">${humStr}</strong></td>
            <td><span class="card-comfort-badge font-mono ${comfort.class}">${comfort.text}</span></td>
            <td><strong class="font-mono">${batStr}</strong></td>
            <td><span class="font-mono">${rssiStr}</span></td>
            <td><span class="font-mono">${s.packetCount.toLocaleString()}</span></td>
            <td><span class="font-mono" style="color:var(--text-muted)">${timeStr}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ═══════════════════════════════════════
// Detail Modal & Charts
// ═══════════════════════════════════════

function openModal(sensorId) {
    const sensor = sensorData.find(s => s.id === sensorId);
    if (!sensor) return;

    activeModalSensorId = sensorId;
    playSfx('open');

    const modal = document.getElementById('detail-modal');
    document.getElementById('modal-sensor-name').textContent = `${sensor.name} // ${sensor.zone}`;
    document.getElementById('modal-sensor-mac').textContent = `MAC: ${sensor.mac}`;
    document.getElementById('modal-chip-id').textContent = `CHANNEL #${sensor.id.toString().padStart(2, '0')}`;
    document.getElementById('modal-chip-model').textContent = sensor.model;

    updateModalDOM(sensor);
    renderModalCharts(sensor);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateModalDOM(sensor) {
    const comfort = calculateComfort(sensor.temperature, sensor.humidity);
    const dewPoint = calculateDewPoint(sensor.temperature, sensor.humidity);

    document.getElementById('modal-chip-comfort').textContent = comfort.text;
    document.getElementById('modal-chip-comfort').className = `modal-chip comfort ${comfort.class}`;

    const tempStr = sensor.temperature !== null ? `${sensor.temperature.toFixed(1)}°C` : '--°C';
    const humStr = sensor.humidity !== null ? `${sensor.humidity.toFixed(1)}%` : '--%';
    const batStr = sensor.battery !== null ? `${sensor.battery}%` : '--%';
    const rssiStr = sensor.rssi !== null ? `${sensor.rssi} dBm` : '-- dBm';

    document.getElementById('modal-metric-temp').textContent = tempStr;
    document.getElementById('modal-sub-temp').textContent = dewPoint !== '--' ? `Dew Point: ${dewPoint}°C` : 'Dew Point: --';
    document.getElementById('badge-modal-temp-val').textContent = tempStr;

    document.getElementById('modal-metric-hum').textContent = humStr;
    document.getElementById('badge-modal-hum-val').textContent = humStr;

    document.getElementById('modal-metric-bat').textContent = batStr;
    document.getElementById('badge-modal-bat-val').textContent = batStr;

    document.getElementById('modal-metric-rssi').textContent = rssiStr;
    document.getElementById('badge-modal-rssi-val').textContent = rssiStr;

    const statusBadge = document.getElementById('modal-status-badge');
    if (sensor.online) {
        statusBadge.innerHTML = '<span class="live-pulse green"></span> ONLINE';
        statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    } else {
        statusBadge.innerHTML = '<span class="live-pulse red"></span> OFFLINE';
        statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }

    if (modalCharts.temp && sensor.history.temp.length > 0) {
        modalCharts.temp.data.datasets[0].data = [...sensor.history.temp];
        modalCharts.temp.data.labels = generateTimeLabels(sensor.history.temp.length);
        modalCharts.temp.update('none');
    }
    if (modalCharts.hum && sensor.history.hum.length > 0) {
        modalCharts.hum.data.datasets[0].data = [...sensor.history.hum];
        modalCharts.hum.data.labels = generateTimeLabels(sensor.history.hum.length);
        modalCharts.hum.update('none');
    }
    if (modalCharts.rssi && sensor.history.rssi.length > 0) {
        modalCharts.rssi.data.datasets[0].data = [...sensor.history.rssi];
        modalCharts.rssi.data.labels = generateTimeLabels(sensor.history.rssi.length);
        modalCharts.rssi.update('none');
    }
    if (modalCharts.bat && sensor.history.bat.length > 0) {
        modalCharts.bat.data.datasets[0].data = [...sensor.history.bat];
        modalCharts.bat.data.labels = generateTimeLabels(sensor.history.bat.length);
        modalCharts.bat.update('none');
    }
}

function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
    document.body.style.overflow = '';
    activeModalSensorId = null;
    playSfx('click');
    Object.values(modalCharts).forEach(c => {
        try { c.destroy(); } catch (e) {}
    });
    modalCharts = {};
}

document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (activeModalSensorId !== null) closeModal();
        else closeSettings();
    }
});

function makeModalChart(canvasId, data, color, unitSuffix, extraOpts = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const historyData = data.length > 0 ? [...data] : [0, 0];
    const labels = generateTimeLabels(historyData.length);

    return new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: historyData,
                borderColor: color,
                backgroundColor: color.replace(')', ', 0.10)').replace('rgb', 'rgba'),
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: color
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(8, 12, 22, 0.95)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    titleFont: { family: 'JetBrains Mono', size: 11 },
                    bodyFont: { family: 'JetBrains Mono', size: 11 },
                    padding: 8,
                    cornerRadius: 4
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.025)' },
                    ticks: { color: '#64748b', font: { size: 9, family: 'JetBrains Mono' }, maxTicksLimit: 7 }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.025)' },
                    ...(extraOpts.scales?.y || {}),
                    ticks: {
                        color: '#64748b',
                        font: { size: 9, family: 'JetBrains Mono' },
                        callback: v => (typeof v === 'number' ? Number(v.toFixed(1)) : v) + unitSuffix
                    }
                }
            }
        }
    });
}

function renderModalCharts(sensor) {
    Object.values(modalCharts).forEach(c => {
        try { c.destroy(); } catch (e) {}
    });
    modalCharts = {};

    modalCharts.temp = makeModalChart('modal-chart-temp', sensor.history.temp, '#fb923c', '°C');
    modalCharts.hum = makeModalChart('modal-chart-hum', sensor.history.hum, '#00e5ff', '%');
    modalCharts.rssi = makeModalChart('modal-chart-rssi', sensor.history.rssi, '#c084fc', ' dBm');
    modalCharts.bat = makeModalChart('modal-chart-bat', sensor.history.bat, '#00f59b', '%', {
        scales: { y: { min: 0, max: 100 } }
    });
}

// ═══════════════════════════════════════
// Settings Drawer & Presets
// ═══════════════════════════════════════

function toggleSettings() {
    const drawer = document.getElementById('settings-drawer');
    const backdrop = document.getElementById('settings-backdrop');
    const isActive = drawer.classList.contains('active');
    if (isActive) closeSettings();
    else {
        drawer.classList.add('active');
        backdrop.classList.add('active');
        playSfx('open');
    }
}

function closeSettings() {
    document.getElementById('settings-drawer').classList.remove('active');
    document.getElementById('settings-backdrop').classList.remove('active');
    playSfx('click');
}

function applyPreset(type) {
    playSfx('click');
    if (type === 'localhost') {
        document.getElementById('mqtt-protocol').value = 'ws';
        document.getElementById('mqtt-host').value = '127.0.0.1';
        document.getElementById('mqtt-port').value = '9001';
        document.getElementById('mqtt-path').value = '/mqtt';
        addMqttLog('Preset applied: Local Mosquitto (ws://127.0.0.1:9001/mqtt)', 'info');
    } else if (type === 'emqx') {
        document.getElementById('mqtt-protocol').value = 'wss';
        document.getElementById('mqtt-host').value = 'broker.emqx.io';
        document.getElementById('mqtt-port').value = '8084';
        document.getElementById('mqtt-path').value = '/mqtt';
        addMqttLog('Preset applied: Public EMQX (wss://broker.emqx.io:8084/mqtt)', 'info');
    } else if (type === 'hivemq') {
        document.getElementById('mqtt-protocol').value = 'wss';
        document.getElementById('mqtt-host').value = 'broker.hivemq.com';
        document.getElementById('mqtt-port').value = '8884';
        document.getElementById('mqtt-path').value = '/mqtt';
        addMqttLog('Preset applied: Public HiveMQ (wss://broker.hivemq.com:8884/mqtt)', 'info');
    }
}

function saveSettings() {
    const settings = {
        protocol: document.getElementById('mqtt-protocol').value,
        host: document.getElementById('mqtt-host').value,
        port: document.getElementById('mqtt-port').value,
        path: document.getElementById('mqtt-path').value,
        username: document.getElementById('mqtt-username').value,
        password: document.getElementById('mqtt-password').value,
        topicPrefix: document.getElementById('mqtt-topic-prefix').value,
        statusTopic: document.getElementById('mqtt-status-topic').value,
        payloadMode: document.getElementById('mqtt-payload-mode').value
    };
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return;
    try {
        const s = JSON.parse(raw);
        if (s.protocol) document.getElementById('mqtt-protocol').value = s.protocol;
        if (s.host) document.getElementById('mqtt-host').value = s.host;
        if (s.port) document.getElementById('mqtt-port').value = s.port;
        if (s.path) document.getElementById('mqtt-path').value = s.path;
        if (s.username !== undefined) document.getElementById('mqtt-username').value = s.username;
        if (s.password !== undefined) document.getElementById('mqtt-password').value = s.password;
        if (s.topicPrefix) document.getElementById('mqtt-topic-prefix').value = s.topicPrefix;
        if (s.statusTopic) document.getElementById('mqtt-status-topic').value = s.statusTopic;
        if (s.payloadMode) document.getElementById('mqtt-payload-mode').value = s.payloadMode;
    } catch (e) {}
}

function addMqttLog(message, type = 'info') {
    const log = document.getElementById('mqtt-log');
    if (!log) return;
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${escapeHtml(message)}</span>`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 150) log.removeChild(log.firstChild);
}

function clearMqttLog() {
    const log = document.getElementById('mqtt-log');
    if (log) log.innerHTML = '';
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════
// MQTT Connection & Decoder
// ═══════════════════════════════════════

function cleanHost(raw) {
    let host = raw.trim().replace(/^(ws:\/\/|wss:\/\/|http:\/\/|https:\/\/)/i, '').split('/')[0];
    if (host.includes(':')) {
        const parts = host.split(':');
        host = parts[0];
        if (parts[1] && !isNaN(parseInt(parts[1]))) {
            document.getElementById('mqtt-port').value = parts[1];
        }
    }
    return host;
}

function buildTopicMap() {
    const prefix = document.getElementById('mqtt-topic-prefix').value.trim() || 'home/kc868-a6';
    topicToSensorMap = {};
    for (let i = 1; i <= 8; i++) {
        const num2 = i.toString().padStart(2, '0');
        const num1 = i.toString();
        topicToSensorMap[`${prefix}/sensor/mijia_${num2}_temperature/state`] = { sensorId: i, metric: 'temperature' };
        topicToSensorMap[`${prefix}/sensor/mijia_${num2}_humidity/state`] = { sensorId: i, metric: 'humidity' };
        topicToSensorMap[`${prefix}/sensor/mijia_${num2}_battery/state`] = { sensorId: i, metric: 'battery' };
        topicToSensorMap[`${prefix}/sensor/mijia_${num2}_rssi/state`] = { sensorId: i, metric: 'rssi' };

        topicToSensorMap[`${prefix}/sensor/mijia_${num1}_temperature/state`] = { sensorId: i, metric: 'temperature' };
        topicToSensorMap[`${prefix}/sensor/mijia_${num1}_humidity/state`] = { sensorId: i, metric: 'humidity' };
        topicToSensorMap[`${prefix}/sensor/mijia_${num1}_battery/state`] = { sensorId: i, metric: 'battery' };
        topicToSensorMap[`${prefix}/sensor/mijia_${num1}_rssi/state`] = { sensorId: i, metric: 'rssi' };
    }
}

function setBrokerConnectionStatus(state, detail) {
    const pulse = document.getElementById('pill-mqtt-pulse');
    const val = document.getElementById('pill-mqtt-val');
    const ind = document.getElementById('drawer-indicator');
    const title = document.getElementById('drawer-status-title');
    const sub = document.getElementById('drawer-status-subtitle');

    if (pulse) pulse.className = `live-pulse ${state === 'connected' ? 'green' : state === 'connecting' ? 'amber' : state === 'error' ? 'red' : 'grey'}`;
    if (val) val.textContent = state === 'connected' ? 'CONNECTED' : state === 'connecting' ? 'CONNECTING' : state === 'error' ? 'ERR' : 'DISCONNECTED';
    if (ind) ind.className = `drawer-indicator ${state}`;
    if (title) title.textContent = state === 'connected' ? 'MQTT Connected' : state === 'connecting' ? 'Connecting to Broker...' : state === 'error' ? 'Connection Error' : 'MQTT Disconnected';
    if (sub) sub.textContent = detail || '';
}

function handleConnect() {
    if (typeof mqtt === 'undefined') {
        addMqttLog('MQTT.js not loaded. Verify internet connection.', 'error');
        setBrokerConnectionStatus('error', 'MQTT.js script missing');
        return;
    }

    const rawHost = document.getElementById('mqtt-host').value;
    const host = cleanHost(rawHost);
    document.getElementById('mqtt-host').value = host;
    const port = document.getElementById('mqtt-port').value.trim() || '9001';
    const protocol = document.getElementById('mqtt-protocol').value || 'ws';
    let path = document.getElementById('mqtt-path').value.trim() || '/mqtt';
    if (!path.startsWith('/')) path = '/' + path;

    if (!host) {
        addMqttLog('Host IP is required', 'error');
        document.getElementById('mqtt-host').focus();
        return;
    }

    if (mqttClient) {
        mqttClient.end(true);
        mqttClient = null;
    }

    const url = `${protocol}://${host}:${port}${path}`;
    addMqttLog(`Connecting to ${url}...`, 'info');
    setBrokerConnectionStatus('connecting', `${host}:${port}`);

    const options = {
        clientId: 'kc868_lab_' + Math.random().toString(16).substring(2, 9),
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000
    };

    const username = document.getElementById('mqtt-username').value.trim();
    const password = document.getElementById('mqtt-password').value;
    if (username) options.username = username;
    if (password) options.password = password;

    try {
        mqttClient = mqtt.connect(url, options);
    } catch (err) {
        addMqttLog(`Connection setup error: ${err.message}`, 'error');
        setBrokerConnectionStatus('error', err.message);
        return;
    }

    mqttClient.on('connect', () => {
        addMqttLog(`Connected to Broker (${host}:${port})`, 'success');
        setBrokerConnectionStatus('connected', `${host}:${port}`);
        playSfx('connect');

        buildTopicMap();
        const prefix = document.getElementById('mqtt-topic-prefix').value.trim() || 'home/kc868-a6';
        const wildcard = `${prefix}/#`;

        mqttClient.subscribe(wildcard, { qos: 1 }, (err) => {
            if (!err) addMqttLog(`Subscribed to wildcard: ${wildcard}`, 'success');
        });

        switchToLiveMode();
        saveSettings();
        document.getElementById('btn-connect').disabled = true;
        document.getElementById('btn-disconnect').disabled = false;
    });

    mqttClient.on('message', (topic, message) => {
        handleMqttMessage(topic, message.toString().trim());
    });

    mqttClient.on('error', (err) => {
        addMqttLog(`MQTT Error: ${err.message}`, 'error');
        setBrokerConnectionStatus('error', err.message);
    });

    mqttClient.on('close', () => {
        if (isLiveMode) {
            addMqttLog('Reconnecting to Broker...', 'warn');
            setBrokerConnectionStatus('connecting', 'Reconnecting...');
        }
    });
}

function handleDisconnect() {
    if (mqttClient) {
        mqttClient.end(true);
        mqttClient = null;
    }
    addMqttLog('Disconnected', 'info');
    setBrokerConnectionStatus('disconnected', 'Disconnected');
    isLiveMode = false;
    applySimulationState();
    document.getElementById('btn-connect').disabled = false;
    document.getElementById('btn-disconnect').disabled = true;
}

function handleMqttMessage(topic, payload) {
    mqttCount++;

    const statusTopic = document.getElementById('mqtt-status-topic').value.trim();
    if (topic === statusTopic || topic.endsWith('/status')) {
        const isOnline = payload.toLowerCase() === 'online';
        isGatewayOnline = isOnline;
        document.getElementById('pill-gateway-val').textContent = isOnline ? 'ONLINE' : 'OFFLINE';
        document.getElementById('pill-gateway-pulse').className = `live-pulse ${isOnline ? 'green' : 'red'}`;
        addMqttLog(`Gateway: ${payload}`, isOnline ? 'success' : 'warn');
        return;
    }

    const direct = topicToSensorMap[topic];
    if (direct) {
        const num = parseFloat(payload);
        if (!isNaN(num)) {
            applyMetric(direct.sensorId, direct.metric, num);
            return;
        }
    }

    if (payload.startsWith('{') && payload.endsWith('}')) {
        try {
            const data = JSON.parse(payload);
            const sId = extractSensorId(topic);
            if (sId) {
                if (data.temperature !== undefined || data.temp !== undefined) applyMetric(sId, 'temperature', parseFloat(data.temperature ?? data.temp));
                if (data.humidity !== undefined || data.hum !== undefined) applyMetric(sId, 'humidity', parseFloat(data.humidity ?? data.hum));
                if (data.battery !== undefined || data.bat !== undefined) applyMetric(sId, 'battery', parseFloat(data.battery ?? data.bat));
                if (data.rssi !== undefined) applyMetric(sId, 'rssi', parseFloat(data.rssi));
                return;
            }
        } catch (e) {}
    }

    const detectedId = extractSensorId(topic);
    if (detectedId) {
        const num = parseFloat(payload);
        if (!isNaN(num)) {
            const lt = topic.toLowerCase();
            if (lt.includes('temp')) applyMetric(detectedId, 'temperature', num);
            else if (lt.includes('hum')) applyMetric(detectedId, 'humidity', num);
            else if (lt.includes('bat')) applyMetric(detectedId, 'battery', num);
            else if (lt.includes('rssi') || lt.includes('signal')) applyMetric(detectedId, 'rssi', num);
            return;
        }
    }

    addMqttLog(`${topic}: ${payload.substring(0, 50)}`, 'data');
}

function extractSensorId(topic) {
    const match = topic.match(/(?:mijia[_\-\s]*|sensor[_\-\s]*|\/)0?([1-8])(?:\/|[_\-\s]|$)/i);
    return match && match[1] ? parseInt(match[1], 10) : null;
}

function applyMetric(sensorId, metric, value) {
    const sensor = sensorData.find(s => s.id === sensorId);
    if (!sensor) return;

    const prevTemp = sensor.temperature;
    sensor.online = true;
    sensor.hasReceivedRealData = true;
    sensor.packetCount++;
    sensor.lastUpdate = new Date();

    switch (metric) {
        case 'temperature':
            sensor.temperature = parseFloat(value.toFixed(1));
            sensor.history.temp.push(sensor.temperature);
            if (sensor.history.temp.length > MAX_HISTORY) sensor.history.temp.shift();
            break;
        case 'humidity':
            sensor.humidity = Math.max(0, Math.min(100, parseFloat(value.toFixed(1))));
            sensor.history.hum.push(sensor.humidity);
            if (sensor.history.hum.length > MAX_HISTORY) sensor.history.hum.shift();
            break;
        case 'battery':
            sensor.battery = Math.max(0, Math.min(100, Math.round(value)));
            sensor.history.bat.push(sensor.battery);
            if (sensor.history.bat.length > MAX_HISTORY) sensor.history.bat.shift();
            break;
        case 'rssi':
            sensor.rssi = Math.round(value);
            sensor.history.rssi.push(sensor.rssi);
            if (sensor.history.rssi.length > MAX_HISTORY) sensor.history.rssi.shift();
            break;
    }

    updateCardDOM(sensor, prevTemp);
    updateHeroMetrics();

    if (activeModalSensorId === sensorId) updateModalDOM(sensor);
    if (currentViewMode === 'map') renderSpatialMap();
    else if (currentViewMode === 'table') renderDataTable();
    else if (currentViewMode === 'analytics' && masterComparisonChart) {
        masterComparisonChart.data.datasets[sensorId - 1].data = [...sensor.history.temp];
        masterComparisonChart.update('none');
    }
}

// ═══════════════════════════════════════
// Watchdog & Mode Management
// ═══════════════════════════════════════

function runSensorWatchdog() {
    if (!isLiveMode) return;
    const now = new Date();
    let changed = false;

    sensorData.forEach(s => {
        if (s.online && s.lastUpdate && (now - s.lastUpdate > SENSOR_TIMEOUT_MS)) {
            s.online = false;
            changed = true;
            addMqttLog(`CH.${s.id} timed out (> 3m) → OFFLINE`, 'warn');
        }
    });

    if (changed) {
        renderAllCards();
        updateHeroMetrics();
        if (currentViewMode === 'map') renderSpatialMap();
        else if (currentViewMode === 'table') renderDataTable();
    }
}

function switchToLiveMode() {
    isLiveMode = true;
    if (simInterval) { clearInterval(simInterval); simInterval = null; }

    const banner = document.getElementById('sim-banner');
    if (banner) {
        banner.className = 'luxury-status-banner live';
        banner.style.display = 'block';
        document.getElementById('banner-text').innerHTML = '<strong>LIVE TELEMETRY STREAM</strong> — Active MQTT WebSocket';
    }

    const heroDataSource = document.getElementById('hero-data-source');
    if (heroDataSource) {
        heroDataSource.textContent = 'MQTT LIVE';
        heroDataSource.style.color = 'var(--bat-color)';
    }
}

function updateSimulationTick() {
    if (isLiveMode || !simulationEnabled) return;

    sensorData.forEach(sensor => {
        if (!sensor.online) return;
        const prevTemp = sensor.temperature || sensor.baseTemp;
        sensor.temperature = randomFluctuation(sensor.temperature || sensor.baseTemp, sensor.baseTemp, 0.4, 1);
        sensor.humidity = randomFluctuation(sensor.humidity || sensor.baseHum, sensor.baseHum, 1.0, 1);
        sensor.rssi = Math.round(randomFluctuation(sensor.rssi || sensor.baseRssi, sensor.baseRssi, 2, 0));
        if (Math.random() < 0.02 && sensor.battery) sensor.battery = Math.max(0, sensor.battery - 1);
        sensor.lastUpdate = new Date();
        sensor.packetCount += 4;

        sensor.history.temp.push(sensor.temperature);
        sensor.history.hum.push(sensor.humidity);
        sensor.history.rssi.push(sensor.rssi);
        sensor.history.bat.push(sensor.battery);
        if (sensor.history.temp.length > MAX_HISTORY) sensor.history.temp.shift();
        if (sensor.history.hum.length > MAX_HISTORY) sensor.history.hum.shift();
        if (sensor.history.rssi.length > MAX_HISTORY) sensor.history.rssi.shift();
        if (sensor.history.bat.length > MAX_HISTORY) sensor.history.bat.shift();

        mqttCount += 4;
        updateCardDOM(sensor, prevTemp);
    });

    updateHeroMetrics();

    if (activeModalSensorId !== null) {
        const s = sensorData.find(x => x.id === activeModalSensorId);
        if (s) updateModalDOM(s);
    }
    if (currentViewMode === 'map') renderSpatialMap();
    else if (currentViewMode === 'table') renderDataTable();
    else if (currentViewMode === 'analytics' && masterComparisonChart) {
        sensorData.forEach((s, idx) => {
            masterComparisonChart.data.datasets[idx].data = [...s.history.temp];
        });
        masterComparisonChart.update('none');
    }
}

// ═══════════════════════════════════════
// DOM Updates
// ═══════════════════════════════════════

function updateCardDOM(sensor, prevTemp) {
    const tempEl = document.getElementById(`card-temp-${sensor.id}`);
    const humEl = document.getElementById(`card-hum-${sensor.id}`);
    const batEl = document.getElementById(`card-bat-${sensor.id}`);
    const rssiEl = document.getElementById(`card-rssi-${sensor.id}`);
    const comfortEl = document.getElementById(`card-comfort-${sensor.id}`);
    const gaugeBar = document.getElementById(`gauge-bar-${sensor.id}`);

    const tempStr = sensor.temperature !== null ? `${sensor.temperature.toFixed(1)}°C` : '--°C';
    const humStr = sensor.humidity !== null ? `${sensor.humidity.toFixed(1)}%` : '--%';
    const batStr = sensor.battery !== null ? `${sensor.battery}%` : '--%';
    const rssiStr = sensor.rssi !== null ? `${sensor.rssi} dBm` : '-- dBm';

    if (tempEl) {
        tempEl.textContent = tempStr;
        if (prevTemp && sensor.temperature && Math.abs(sensor.temperature - prevTemp) > 0.05) {
            tempEl.classList.remove('value-updated');
            void tempEl.offsetWidth;
            tempEl.classList.add('value-updated');
        }
    }
    if (humEl) humEl.textContent = humStr;
    if (batEl) batEl.textContent = batStr;
    if (rssiEl) rssiEl.textContent = rssiStr;

    if (gaugeBar) {
        const batVal = sensor.battery !== null ? sensor.battery : 0;
        gaugeBar.style.strokeDashoffset = Math.max(0, 100 - batVal);
    }

    if (comfortEl) {
        const comfort = calculateComfort(sensor.temperature, sensor.humidity);
        comfortEl.className = `card-comfort-badge font-mono ${!sensor.online ? 'offline' : comfort.class}`;
        comfortEl.textContent = !sensor.online ? 'OFFLINE' : comfort.text;
    }

    drawSparkline(sensor);
}

function updateHeroMetrics() {
    const onlineSensors = sensorData.filter(s => s.online && s.temperature !== null);
    const onlineCount = onlineSensors.length;

    document.getElementById('hero-online-count').textContent = onlineCount.toString().padStart(2, '0');
    document.getElementById('hero-online-pct').textContent = onlineCount > 0 ? `${Math.round((onlineCount / 8) * 100)}% NOMINAL` : '0% ACTIVE';

    if (onlineSensors.length > 0) {
        const temps = onlineSensors.map(s => s.temperature);
        const hums = onlineSensors.map(s => s.humidity);
        const avgT = temps.reduce((a, b) => a + b, 0) / temps.length;
        const avgH = hums.reduce((a, b) => a + b, 0) / hums.length;
        const minT = Math.min(...temps);
        const maxT = Math.max(...temps);

        document.getElementById('hero-avg-temp').textContent = avgT.toFixed(2);
        document.getElementById('hero-avg-hum').textContent = avgH.toFixed(1);
        document.getElementById('hero-temp-range').textContent = `MIN ${minT.toFixed(1)}° • MAX ${maxT.toFixed(1)}°`;

        const comfort = calculateComfort(avgT, avgH);
        document.getElementById('hero-hum-status').textContent = `ISO-5 ${comfort.text}`;
    } else {
        document.getElementById('hero-avg-temp').textContent = '--';
        document.getElementById('hero-avg-hum').textContent = '--';
        document.getElementById('hero-temp-range').textContent = 'MIN --° • MAX --°';
        document.getElementById('hero-hum-status').textContent = 'AWAITING DATA';
    }

    uptimeSeconds += 5;
    const d = Math.floor(uptimeSeconds / 86400);
    const h = Math.floor((uptimeSeconds % 86400) / 3600);
    const m = Math.floor((uptimeSeconds % 3600) / 60);
    document.getElementById('pill-uptime').textContent = `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;

    document.getElementById('hero-mqtt-packets').textContent = mqttCount.toLocaleString();
}

function updateDigitalClock() {
    const now = new Date();
    const str = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('digital-clock').textContent = str;
}

function exportDataCSV() {
    playSfx('click');
    const headers = ['Channel ID', 'Identifier', 'MAC Address', 'Model', 'Status', 'Temperature (°C)', 'Humidity (% RH)', 'Battery (%)', 'RSSI (dBm)', 'Packets', 'Last Advert'];
    const rows = sensorData.map(s => [
        `"CH.${s.id.toString().padStart(2, '0')}"`,
        `"${s.name}"`,
        s.mac,
        s.model,
        s.online ? 'Online' : 'Offline',
        s.temperature !== null ? s.temperature.toFixed(2) : '--',
        s.humidity !== null ? s.humidity.toFixed(1) : '--',
        s.battery !== null ? s.battery : '--',
        s.rssi !== null ? s.rssi : '--',
        s.packetCount,
        s.lastUpdate ? `"${s.lastUpdate.toISOString()}"` : '"N/A"'
    ]);

    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KC868_Lab_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatTimeAgo(date) {
    if (!date) return '--';
    const sec = Math.floor((new Date() - date) / 1000);
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
}

// ═══════════════════════════════════════
// Initialization
// ═══════════════════════════════════════

function init() {
    const savedSound = localStorage.getItem(STORAGE_SOUND_KEY);
    if (savedSound !== null) soundEnabled = savedSound === '1';
    updateSoundUI();

    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'cyan';
    currentThemeIndex = THEMES.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;
    applyTheme(THEMES[currentThemeIndex]);

    const savedSim = localStorage.getItem(STORAGE_SIM_KEY);
    simulationEnabled = savedSim !== null ? savedSim === '1' : true;

    loadSettings();
    initSensorData(simulationEnabled);
    applySimulationState();

    // Initialize WebGL Radar Background
    initRadarBackground();

    watchdogInterval = setInterval(runSensorWatchdog, 15000);
    setInterval(updateDigitalClock, 1000);
}

document.addEventListener('DOMContentLoaded', init);
