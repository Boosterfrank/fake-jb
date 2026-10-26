/* app.js — fake "liveboot": pongoOS-style console, verbose boot text, Apple logo + progress bar.
 * One linear timeline of about 60 s, played exactly once. Nothing loops or repeats.
 * When it has finished, a tap anywhere starts a fresh run. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var screen = $('screen'), con = $('console'), logo = $('logo'),
      apple = $('apple'), bar = $('bar'), hint = $('hint'), install = $('install');

  /* ---------------- Phase 1: pongoOS-style console ----------------
   * [text, pause after the line in ms] */
  var PONGO_A = [
    ['initializing AIC 2', 420],
    ['#==================', 40],
    ['#', 20],
    ['# pongoOS 1.2.1.2-bf671fa3 (EL1)', 20],
    ['#', 20],
    ['# https://checkra.in', 20],
    ['#', 20],
    ['#==================', 140],
    ['Booted by: iBoot-5540.140.12', 70],
    ['Built with: GCC 4.2.1 Compatible Apple LLVM 11.0.3 (clang-1103.0.32.62)', 70],
    ['Running on: t8010', 320],
    ['Enabling USB', 950],
    ['Done!', 1700],
    ['pongoOS> sep pwn', 1450],
    ['successfully obtained SEPROM code execution', 520],
    ['SEPROM payload loaded successfully! sep peek/poke/boot are now available', 900],
    ['pongoOS> sep boot', 750],
    ['pongoOS> SEPOS booted!', 250]
  ];
  // (the logo appears between these two blocks)
  var PONGO_B = [
    ['pongoOS> xargs serial=3 -v', 650],
    ['pongoOS> xfb', 520],
    ['pongoOS> bootx', 1250],
    ['Booting...', 1300],
    ['Loading kernelcache... done (26.4 MB)', 1000],
    ['Applying patches... done', 1200],
    ['Jumping to kernel', 1700]
  ];

  /* ---------------- Phase 2: verbose boot text ----------------
   * Strings are lines; numbers are pauses (ms) between bursts. Every line is unique. */
  var XNU = [
    'iBoot version: iBoot-5540.140.12',
    'Darwin Kernel Version 19.5.0: Tue Apr 21 22:17:45 PDT 2020; root:xnu-6153.122.1~1/RELEASE_ARM64_T8010',
    'kernelcache: prelinked, text 23.9 MB, data 4.1 MB, 212 kexts',
    'mem actual: 0x80000000, usable: 0x7a600000',
    'cpu: 2 cores online (1 fusion domain), 2 clusters',
    'boot-args = serial=3 -v',
    'standard timeslicing quantum is 10000 us',
    'standard background quantum is 2500 us',
    'vm_compressor_mode is 4',
    'entropy source: 512 bytes from boot loader',
    420,
    'MAC Framework successfully initialized',
    'using 16384 buffer headers and 10240 cluster IO buffer headers',
    'IOKit Component Version 19.5.0',
    'IORegistry: 1 root, building device tree from boot loader (1411 nodes)',
    'AppleARMPlatform: starting, board D10AP',
    'AppleARMIO: probing bus 0 ... 12 devices',
    'AppleARMIO: probing bus 1 ... 7 devices',
    'AppleInterruptController: 320 vectors, 2 targets',
    'AppleWatchdog: disabled by boot-args',
    'AppleClockManager: 61 clocks registered',
    'AppleDART: 14 units configured, bypass disabled',
    'AppleAES: hardware engine ready',
    'AppleUART: console on uart0 @ 115200 (serial=3)',
    260,
    'kext: com.apple.driver.AppleARMPlatform (1.0.2) loaded',
    'kext: com.apple.iokit.IOStorageFamily (2.1) loaded',
    'kext: com.apple.iokit.IONetworkingFamily (3.4) loaded',
    'kext: com.apple.iokit.IOHIDFamily (2.0.0) loaded',
    'kext: com.apple.iokit.IOUSBHostFamily (1.2) loaded',
    'kext: com.apple.iokit.IOPCIFamily (2.9) loaded',
    'kext: com.apple.iokit.IOSurface (269.6) loaded',
    'kext: com.apple.iokit.IOGPUFamily (10.5) loaded',
    'kext: com.apple.iokit.IOAudio2Family (1.0) loaded',
    'kext: com.apple.iokit.IOMobileGraphicsFamily (343.0.0) loaded',
    'kext: com.apple.driver.AppleSPMI (1.0.1) loaded',
    'kext: com.apple.driver.ApplePMGR (1) loaded',
    'kext: com.apple.driver.AppleSEPManager (1.0.1) loaded',
    'kext: com.apple.driver.AppleKeyStore (2) loaded',
    'kext: com.apple.driver.AppleCredentialManager (1.0) loaded',
    'kext: com.apple.driver.AppleBiometricServices (1) loaded',
    'kext: com.apple.driver.AppleEmbeddedAudio (1.0) loaded',
    'kext: com.apple.driver.AppleDisplayCrossbar (1.0.0) loaded',
    'kext: com.apple.driver.AppleMultitouch (1.0.0) loaded',
    'kext: com.apple.filesystems.apfs (1412.141.1) loaded',
    'kext: com.apple.filesystems.hfs.kext (522.100.5) loaded',
    'kext: com.apple.nke.ppp (1.9) loaded',
    'kext: 212 of 212 kexts started in 1.8 s',
    900,
    'AppleSPMI: 2 controllers, 43 devices enumerated',
    'ApplePMU: revision 3, 11 regulators online',
    'ApplePMU: charger: battery 73% (4089 mV), external power: no',
    'AppleTemp: 9 thermal sensors registered',
    'AppleAOP: firmware 1.3.0 loaded (RTKit), 3 endpoints',
    'AppleAOP: syslog relay enabled',
    'AppleSensorHub: accelerometer (0x4), gyro (0x8), compass (0x10) online',
    'AppleAmbientLight: sensor calibrated, 5 gain stages',
    'AppleHaptics: engine ready, 2 waveform banks',
    1100,
    'AppleDisplay: panel 1334x750 @ 60 Hz, 8-bit, color mode P3',
    'AppleDisplay: backlight 0 -> 0 (boot, keep off)',
    'AppleFramebuffer: 2 layers, 1 overlay, swap interval 1',
    'AppleGPU: 6 cores, firmware v34.1, 1 GB shared',
    'AppleGPU: compute ring 0 ready, ring 1 ready',
    'AppleScaler: 2 pipelines, color space conversion online',
    'AppleJPEG: hardware codec ready',
    'AppleVideoEncoder: hardware encoder online (H.264/HEVC)',
    'AppleVideoDecoder: hardware decoder online',
    'AppleISP: camera firmware loaded, 2 sensors paired',
    'AppleAudio: codec ready, 2 outputs 3 inputs, 48 kHz',
    'AppleAudio: speaker protection table version 7',
    2200,
    'AppleNVMe: controller ready, firmware 0.1.5',
    'AppleNVMe: 128 GB, namespace 1 ready, 2 queues of depth 64',
    'AppleStorage: partition 1 (system), partition 2 (data), partition 3 (baseband)',
    'AppleEffaceable: 2 lockers online',
    'apfs: module loaded (1412.141.1)',
    'apfs: container 0 found, 2 volumes, 128 GB',
    'apfs: mounted volume "System" (read-only, snapshot)',
    'apfs: mounted volume "Data" (read-write, 96.3 GB free)',
    'BSD root: disk0s1s1, major 1, minor 1',
    'bsd_init: rootvnode ok, /dev populated (144 nodes)',
    'kern.bootsessionuuid = 5A2C7E1B-9F1C-4D2A-8C4B-0E7F6A1D3B92',
    3600,
    'apfs: verifying container checkpoint ... ok (41 ms)',
    'apfs: volume "Data" journal replay: 0 transactions',
    'apfs: snapshot "com.apple.os.update-4C1F2A" sealed, 0 differences',
    'apfs: keybag unlocked for volume "Data" (class A pending)',
    'apfs: trim: 18.2 GB queued for discard',
    'mount: /private/var mounted from disk0s1s2',
    2000,
    'AppleUSB: host controller online, 1 port (type-A off, lightning on)',
    'AppleUSB: device mode ready, 3 configurations',
    'AppleUSBEthernet: interface en2 registered',
    'AppleWiFi: firmware 9.30.440 loaded, 2 radios (2.4/5 GHz)',
    'AppleWiFi: interface en0 registered, country code resolved',
    'AppleBluetooth: firmware loaded, host interface online',
    'AppleBaseband: PCIe link up (gen 1, x1)',
    'AppleBaseband: modem firmware 1.07.02 loaded',
    'AppleBaseband: SIM tray: present',
    'AppleNFC: controller ready',
    'AppleLocation: GNSS receiver online, 0 satellites',
    2100,
    'AppleTouch: digitizer calibrated, 16x9 sense grid',
    'AppleButtons: 4 inputs (power, volume up, volume down, ringer)',
    'AppleHome: home button pressure sensor paired',
    'AppleBiometric: sensor paired, template store locked',
    'AppleKeyStore: starting (BUILT: Apr 21 2020 22:08:31)',
    'AppleSEP: secure enclave link established, 4 mailboxes',
    'AppleSEP: firmware version 1.0 (build 1738)',
    'AppleSEPKeyStore: starting, protection classes 1-4 loaded',
    'AppleCredentialManager: init: called',
    'AppleCredentialManager: start: initializing power management',
    'AppleCredentialManager: start: started',
    'AppleSSE: key manager online',
    'AppleTrustCache: 1 cache loaded (static)',
    2600,
    'IOSurface: root ready, 0 surfaces',
    'IOAccelerator: 1 device registered',
    'IOMobileFramebuffer: display 0 attached, 4 timing modes',
    'IOHID: event system ready, 7 services',
    'IOPower: 3 power planes, 2 sleep states',
    'IONetworking: 3 interfaces, loopback up',
    'IOAudio: 1 engine, 2 streams',
    'IOThermal: policy table loaded (12 entries)',
    'IOReport: 41 channels registered',
    'IOTimeSync: clock domain 0 ready',
    'IOText: 1 encryption provider',
    3000,
    'Darwin Bootstrapper Version 6.0.0: Tue Apr 21 22:22:35 PDT 2020; root:libxpc_private-1738.140.1~1/RELEASE_ARM64_T8010',
    'launchd: reading /System/Library/LaunchDaemons (214 plists)',
    'launchd: reading /Library/LaunchDaemons (0 plists)',
    'launchd: loading system services (214 jobs)',
    'launchd: starting com.apple.securityd',
    'launchd: starting com.apple.configd',
    'launchd: starting com.apple.notifyd',
    'launchd: starting com.apple.powerd',
    'launchd: starting com.apple.logd',
    'launchd: starting com.apple.mediaserverd',
    'launchd: starting com.apple.locationd',
    'launchd: starting com.apple.wifid',
    'launchd: starting com.apple.bluetoothd',
    'launchd: starting com.apple.CommCenter',
    'launchd: starting com.apple.mobile.lockdown',
    'launchd: starting com.apple.imagent',
    'launchd: starting com.apple.cloudd',
    'launchd: starting com.apple.backupd',
    'launchd: starting com.apple.assistantd',
    'launchd: starting com.apple.nfcd',
    'launchd: starting com.apple.biometrickitd',
    'launchd: starting com.apple.trustd',
    'launchd: starting com.apple.coreduetd',
    'launchd: starting com.apple.symptomsd',
    'launchd: starting com.apple.healthd',
    1700,
    'securityd: keychain opened, 3 keybags',
    'configd: network configuration loaded, 3 services',
    'configd: setting hostname to iPhone',
    'powerd: assertion table ready, 0 assertions',
    'logd: 2 log stores, 64 MB each',
    'mediaserverd: 1 audio session, 0 active',
    'locationd: 0 clients, GNSS idle',
    'wifid: scanning 0 networks (radio off until unlock)',
    'bluetoothd: 0 paired devices (store locked)',
    'CommCenter: baseband attached, radio idle',
    'lockdown: pairing records: 1',
    'trustd: 1 trust store, 160 roots',
    'nfcd: field off',
    2000,
    'launchd: starting com.apple.mobileactivationd',
    'launchd: starting com.apple.apsd',
    'launchd: starting com.apple.identityservicesd',
    'launchd: starting com.apple.rapportd',
    'launchd: starting com.apple.sharingd',
    'launchd: starting com.apple.searchd',
    'launchd: starting com.apple.suggestd',
    'launchd: starting com.apple.homed',
    'launchd: starting com.apple.calaccessd',
    'launchd: starting com.apple.UserEventAgent (System)',
    'apsd: push transport idle, 0 channels',
    'mobileactivationd: activation record present, state: activated',
    'identityservicesd: 0 accounts loaded',
    1800,
    'launchd: starting com.apple.backboardd',
    'backboardd: display 0 claimed, 1 layer',
    'backboardd: hid: 7 services attached',
    'backboardd: boot UI: progress bar',
    'launchd: starting com.apple.SpringBoard',
    'SpringBoard: 1 display, 1 home screen, 0 pending installs',
    'SpringBoard: boot: handing display to boot UI',
    5100
  ];
  // Deterministic short gaps inside a burst (ms), cycled.
  var GAP = [0, 25, 0, 45, 10, 0, 70, 15, 0, 30, 0, 0, 55, 5, 110, 0, 20, 0, 40, 12];

  /* ---------------- Phase 3: Apple logo + progress bar ----------------
   * [bar width %, pause after in ms] */
  var PROGRESS = [[0, 900], [8, 1200], [31, 1300], [47, 900], [58, 1800], [71, 1100], [100, 1600]];

  /* ---------------- Build the timeline ---------------- */
  var steps = [], T = 0;
  function at(fn, wait) { steps.push({ at: T, fn: fn }); T += wait || 0; }
  function line(text, wait) { at(function () { print(text); }, wait); }

  at(function () { setPhase('pongo'); }, 1300);
  PONGO_A.forEach(function (s) { line(s[0], s[1]); });
  at(function () { logo.hidden = false; }, 1800);
  PONGO_B.forEach(function (s) { line(s[0], s[1]); });
  at(function () { setPhase('xnu'); }, 150);
  var k = 0;
  XNU.forEach(function (item) {
    if (typeof item === 'number') T += item;
    else line(item, GAP[k++ % GAP.length]);
  });
  at(function () { setPhase('apple'); }, 0);
  PROGRESS.forEach(function (p) { at(function () { setBar(p[0]); }, p[1]); });
  var TOTAL_MS = T;                     // time from start until the bar is full
  at(function () { done = true; }, 3000);
  at(function () { hint.hidden = false; }, 0);

  /* ---------------- Rendering helpers ---------------- */
  var needScroll = false;
  function print(text) {
    var el = document.createElement('div');
    el.textContent = text === '' ? ' ' : text;
    con.appendChild(el);
    while (con.childElementCount > 320) con.removeChild(con.firstElementChild);
    needScroll = true;
  }
  function flushScroll() {
    if (!needScroll) return;
    needScroll = false;
    screen.scrollTop = screen.scrollHeight;
  }
  function setPhase(p) {
    if (p === 'pongo') { screen.className = 'pongo'; screen.hidden = false; }
    if (p === 'xnu') { con.textContent = ''; logo.hidden = true; screen.className = 'xnu'; screen.scrollTop = 0; }
    if (p === 'apple') { con.textContent = ''; screen.hidden = true; apple.hidden = false; }
  }
  function setBar(pct) { bar.style.width = pct + '%'; }
  function drawLogo() {
    var dpr = window.devicePixelRatio || 1;
    var cell = Math.max(1, Math.round(dpr * 1.25));
    CheckLogo.draw(logo, cell);
    logo.style.width = (CheckLogo.W * cell / dpr) + 'px';
    logo.style.height = (CheckLogo.H * cell / dpr) + 'px';
  }

  /* ---------------- Player (drift-free, pauses while hidden) ---------------- */
  var idx = 0, t0 = 0, timer = 0, pausedAt = -1, done = false;
  function elapsed() { return performance.now() - t0; }
  function tick() {
    timer = 0;
    var now = elapsed();
    while (idx < steps.length && steps[idx].at <= now + 2) steps[idx++].fn();
    flushScroll();
    if (idx < steps.length) timer = setTimeout(tick, Math.max(0, steps[idx].at - elapsed()));
  }
  function reset() {
    if (timer) clearTimeout(timer);
    timer = 0; idx = 0; done = false; pausedAt = -1;
    con.textContent = '';
    logo.hidden = true; apple.hidden = true; hint.hidden = true;
    screen.className = 'pongo'; screen.hidden = false; screen.scrollTop = 0;
    bar.style.transition = 'none'; bar.style.width = '0%';
    void bar.offsetWidth;               // flush so the next width change animates again
    bar.style.transition = '';
  }
  function start() { reset(); t0 = performance.now(); tick(); }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (timer) { clearTimeout(timer); timer = 0; }
      pausedAt = performance.now();
    } else {
      if (pausedAt >= 0) { t0 += performance.now() - pausedAt; pausedAt = -1; }
      if (idx < steps.length && !timer) tick();
      keepAwake();
    }
  });

  /* ---------------- Input ---------------- */
  document.addEventListener('pointerdown', function () {
    keepAwake();
    install.hidden = true;
    if (done) start();
  }, { passive: true });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------------- Keep the screen on (where supported) ---------------- */
  var lock = null;
  function keepAwake() {
    try {
      if (!('wakeLock' in navigator) || (lock && !lock.released)) return;
      navigator.wakeLock.request('screen').then(function (l) { lock = l; }, function () { lock = null; });
    } catch (_) { lock = null; }
  }

  /* ---------------- One-time "Add to Home Screen" hint (Safari only, not when installed) ---------------- */
  function maybeInstallHint() {
    var standalone = navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches);
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (standalone || !ios) return;
    var seen = false;
    try { seen = localStorage.getItem('liveboot.installHint') === '1'; } catch (_) {}
    if (seen) return;
    try { localStorage.setItem('liveboot.installHint', '1'); } catch (_) {}
    install.hidden = false;
    setTimeout(function () { install.hidden = true; }, 8000);
  }

  /* ---------------- Offline support ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }

  window.LIVEBOOT = { totalMs: TOTAL_MS, restart: start };

  drawLogo();
  maybeInstallHint();
  keepAwake();
  start();
})();
