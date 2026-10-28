/* app.js — fake "liveboot": pongoOS-style console, verbose boot text, Apple logo + progress bar.
 * One linear timeline of about 45 s, played exactly once. Nothing loops and no line repeats.
 * Runs only when launched as a Home Screen (standalone) web app. A tap after it ends starts a fresh run. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var screen = $('screen'), con = $('console'), logo = $('logo'),
      apple = $('apple'), bar = $('bar'), hint = $('hint'), install = $('install');

  /* ---------------- PWA gate ---------------- */
  function isStandalone() {
    if (navigator.standalone === true) return true;
    try {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.matchMedia('(display-mode: fullscreen)').matches;
    } catch (_) { return false; }
  }

  /* ---------------- Offline support (registered in both modes so the install is pre-cached) ---------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }

  if (!isStandalone()) {
    screen.hidden = true;
    install.hidden = false;
    window.LIVEBOOT = { standalone: false };
    return;
  }

  /* ---------------- Small deterministic helpers for generated lines ---------------- */
  var seed = 0x9e3779b9;
  function rnd() {                      // mulberry32: same numbers every run, no Math.random
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function hex(n) { var s = ''; while (s.length < n) s += Math.floor(rnd() * 16).toString(16); return s; }

  /* ---------------- Phase 1: pongoOS-style console ----------------
   * [text, pause after the line in ms]. The banner comes up at once, like the real screen. */
  var PONGO_A = [
    ['initializing AIC 2', 0],
    ['#==================', 0],
    ['#', 0],
    ['# pongoOS 1.2.1.2-bf671fa3 (EL1)', 0],
    ['#', 0],
    ['# https://checkra.in', 0],
    ['#', 0],
    ['#==================', 0],
    ['Booted by: iBoot-5540.140.12', 0],
    ['Built with: GCC 4.2.1 Compatible Apple LLVM 11.0.3 (clang-1103.0.32.62)', 0],
    ['Running on: t8010', 0],
    ['Enabling USB', 350],
    ['Done!', 1400],
    ['pongoOS> sep pwn', 900],
    ['successfully obtained SEPROM code execution', 300],
    ['SEPROM payload loaded successfully! sep peek/poke/boot are now available', 500],
    ['pongoOS> sep boot', 450],
    ['pongoOS> SEPOS booted!', 150]
  ];
  // (the logo appears between these two blocks)
  var PONGO_B = [
    ['pongoOS> fuse lock', 250],
    ['pongoOS> sep auto', 250],
    ['pongoOS> checkra1n_flags 0x0', 250],
    ['pongoOS> xargs serial=3 -v', 250],
    ['pongoOS> xfb', 250],
    ['pongoOS> bootx', 900],
    ['Booting...', 1600]
  ];

  /* ---------------- Phase 2: verbose boot text ----------------
   * Strings are lines; numbers are pauses (ms) between bursts. Generated sections use
   * fixed tables plus the seeded generator above, so every run prints the same unique lines. */
  var DT_NODES = ['aic@20e100000', 'pmgr@20e000000', 'gpio@20f100000', 'spmi@20f200000', 'pmgr-dvfm@20e0a0000',
    'i2c0@20e280000', 'i2c1@20e2a0000', 'i2c2@20e2c0000', 'spi0@20e300000', 'spi1@20e320000', 'spi2@20e340000',
    'spi3@20e360000', 'uart0@20e600000', 'uart1@20e620000', 'uart4@20e680000', 'uart8@20e6f0000',
    'dart-usb@20e900000', 'dart-sio@20ea00000', 'dart-disp0@20eb00000', 'dart-isp@20ec00000', 'dart-ave@20ed00000',
    'dart-scaler@20ee00000', 'dart-apcie0@20ef00000', 'usb-drd@211000000', 'usb-complex@211400000', 'sio@212000000',
    'ans@213000000', 'aop@214000000', 'sep@215000000', 'isp@216000000', 'disp0@217000000', 'jpeg@218000000',
    'scaler@219000000', 'ave@21a000000', 'avd@21b000000', 'agx@21c000000', 'apcie@21d000000',
    'baseband-spmi@21e000000', 'mca0@21f000000', 'dwi@220000000', 'wdt@221000000', 'mcc@222000000'];
  var DRIVERS = { aic: 'AppleInterruptController', pmgr: 'ApplePMGR', gpio: 'AppleGPIO', spmi: 'AppleSPMI',
    'pmgr-dvfm': 'AppleDVFM', 'usb-drd': 'AppleUSBDRD', 'usb-complex': 'AppleUSBComplex', sio: 'AppleSIO',
    ans: 'AppleNVMe', aop: 'AppleAOP', sep: 'AppleSEPManager', isp: 'AppleISP', disp0: 'AppleDisplay',
    jpeg: 'AppleJPEG', scaler: 'AppleScaler', ave: 'AppleVideoEncoder', avd: 'AppleVideoDecoder', agx: 'AppleGPU',
    apcie: 'ApplePCIe', 'baseband-spmi': 'AppleBasebandSPMI', mca0: 'AppleMCA', dwi: 'AppleDWI',
    wdt: 'AppleWatchdog', mcc: 'AppleMCC' };
  function driverFor(name) {
    if (DRIVERS[name]) return DRIVERS[name];
    if (name.indexOf('i2c') === 0) return 'AppleI2C';
    if (name.indexOf('spi') === 0) return 'AppleSPI';
    if (name.indexOf('uart') === 0) return 'AppleUART';
    if (name.indexOf('dart') === 0) return 'AppleDART';
    return 'AppleARMIODevice';
  }
  var KEXTS = [['com.apple.driver.AppleARMPlatform', '1.0.2'], ['com.apple.iokit.IOStorageFamily', '2.1'],
    ['com.apple.iokit.IONetworkingFamily', '3.4'], ['com.apple.iokit.IOHIDFamily', '2.0.0'],
    ['com.apple.iokit.IOUSBHostFamily', '1.2'], ['com.apple.iokit.IOPCIFamily', '2.9'],
    ['com.apple.iokit.IOSurface', '269.6'], ['com.apple.iokit.IOGPUFamily', '10.5'],
    ['com.apple.iokit.IOAudio2Family', '1.0'], ['com.apple.iokit.IOMobileGraphicsFamily', '343.0.0'],
    ['com.apple.iokit.IOReportFamily', '47'], ['com.apple.iokit.IOTimeSyncFamily', '900.4'],
    ['com.apple.iokit.IOCryptoAcceleratorFamily', '1.0'], ['com.apple.iokit.IOSerialFamily', '11'],
    ['com.apple.iokit.IOSlowAdaptiveClockingFamily', '1.0.0'], ['com.apple.driver.AppleSPMI', '1.0.1'],
    ['com.apple.driver.ApplePMGR', '1'], ['com.apple.driver.AppleInterruptController', '1.0.0d1'],
    ['com.apple.driver.AppleARMWatchdogTimer', '1'], ['com.apple.driver.AppleDART', '1'],
    ['com.apple.driver.AppleUART', '1'], ['com.apple.driver.AppleUSBDeviceNCM', '1.0'],
    ['com.apple.driver.AppleUSBHostPlatform', '1'], ['com.apple.driver.AppleSEPManager', '1.0.1'],
    ['com.apple.driver.AppleKeyStore', '2'], ['com.apple.driver.AppleCredentialManager', '1.0'],
    ['com.apple.driver.AppleBiometricServices', '1'], ['com.apple.driver.AppleEmbeddedAudio', '1.0'],
    ['com.apple.driver.AppleDisplayCrossbar', '1.0.0'], ['com.apple.driver.AppleMultitouch', '1.0.0'],
    ['com.apple.driver.AppleJPEGDriver', '1.0'], ['com.apple.driver.AppleAVE2', '1.0'],
    ['com.apple.driver.AppleAVD', '1.0'], ['com.apple.driver.AppleScalerCSC', '1.0'],
    ['com.apple.driver.AppleCamera', '1.0'], ['com.apple.driver.AppleNVMe', '1.0'],
    ['com.apple.driver.AppleEffaceable', '1.0'], ['com.apple.driver.AppleBaseband', '1.0'],
    ['com.apple.driver.AppleWLAN', '1.0'], ['com.apple.driver.AppleBluetooth', '1.0'],
    ['com.apple.driver.AppleNFC', '1.0'], ['com.apple.driver.AppleThermal', '1.0'],
    ['com.apple.filesystems.apfs', '1412.141.1'], ['com.apple.filesystems.hfs.kext', '522.100.5'],
    ['com.apple.nke.ppp', '1.9'], ['com.apple.nke.l2tp', '1.9'],
    ['com.apple.security.sandbox', '300.0'], ['com.apple.security.quarantine', '4']];
  var VM_REGIONS = [['kernel text', 'r-x', 23900], ['kernel data', 'rw-', 4100], ['kernel bss', 'rw-', 1800],
    ['prelinked kexts', 'r-x', 31200], ['device tree', 'r--', 512], ['boot-args', 'r--', 4],
    ['trust cache', 'r--', 1536], ['sep firmware', 'r--', 1024], ['framebuffer', 'rw-', 8100], ['iboot data', 'r--', 256]];
  var ZONES = [['kalloc.16', 16], ['kalloc.32', 32], ['kalloc.48', 48], ['kalloc.64', 64], ['kalloc.96', 96],
    ['kalloc.128', 128], ['kalloc.256', 256], ['kalloc.512', 512], ['kalloc.1024', 1024], ['kalloc.2048', 2048],
    ['vm.pages', 64], ['vm.map.entries', 80], ['proc', 1184], ['threads', 616], ['uthreads', 400],
    ['ipc.ports', 168], ['ipc.spaces', 128], ['vnodes', 248], ['bufs', 368], ['mbufs', 256]];
  var SENSORS = [['cpu-die', 31], ['gpu-die', 29], ['soc', 30], ['pmu', 28], ['battery', 26], ['charger', 27],
    ['display', 25], ['baseband', 29], ['nand', 28]];
  var DOMAINS = ['cpu', 'gpu', 'disp', 'isp', 'ave', 'avd', 'usb', 'pcie', 'nvme', 'sep', 'aop', 'baseband'];
  var MODES = [['1334x750', 60, 74], ['1334x750', 30, 37], ['1334x750', 24, 30], ['667x375', 60, 19]];
  var CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 36, 40, 44, 48, 149, 153, 157, 161];
  var SELFTEST = ['aes-ecb', 'aes-cbc', 'aes-gcm', 'sha1', 'sha256', 'sha512', 'hmac-sha256', 'rsa-sig',
    'ecdsa-p256', 'drbg-ctr'];
  var SLICES = [['0x000028', '0x0a1fff', 'system', 'System'], ['0x0a2000', '0xef5fff', 'data', 'Data'],
    ['0xef6000', '0xf0dfff', 'baseband', 'Baseband'], ['0xf0e000', '0xf11fff', 'nvram', 'NVRAM']];
  var DAEMONS_A = ['securityd', 'configd', 'notifyd', 'powerd', 'logd', 'mediaserverd', 'locationd', 'wifid',
    'bluetoothd', 'CommCenter', 'mobile.lockdown', 'imagent', 'cloudd', 'backupd', 'assistantd', 'nfcd',
    'biometrickitd', 'trustd', 'coreduetd', 'symptomsd', 'healthd'];
  var DAEMONS_B = ['accessoryd', 'accountsd', 'aggregated', 'akd', 'analyticsd', 'appstored', 'audiomxd', 'bird',
    'cfprefsd', 'contextstored', 'coreaudiod', 'dasd', 'dataaccessd', 'diagnosticd', 'distnoted', 'duetexpertd',
    'fairplayd', 'fseventsd', 'geod', 'itunesstored', 'keybagd', 'mDNSResponder', 'mediaremoted', 'misd',
    'mobileassetd', 'nanoregistryd', 'nehelper', 'nsurlsessiond', 'passd', 'powerlogHelperd', 'profiled', 'routined',
    'runningboardd', 'searchpartyd', 'siriknowledged', 'softwareupdated', 'tccd', 'timed', 'usermanagerd', 'watchdogd'];
  var DAEMONS_C = ['mobileactivationd', 'apsd', 'identityservicesd', 'rapportd', 'sharingd', 'searchd', 'suggestd',
    'homed', 'calaccessd', 'UserEventAgent (System)'];

  /* Verbose boot text: strings are lines, numbers are pauses (ms) between bursts. Every pause is
   * under half a second so the text keeps flowing. All lines are unique. */
  function buildXNU() {
    var L = [];
    var push = function () { for (var i = 0; i < arguments.length; i++) L.push(arguments[i]); };

    push('iBoot version: iBoot-5540.140.12',
      'Darwin Kernel Version 19.5.0: Tue Apr 21 22:17:45 PDT 2020; root:xnu-6153.122.1~1/RELEASE_ARM64_T8010',
      'kernelcache: prelinked, text 23.9 MB, data 4.1 MB, 212 kexts',
      'mem actual: 0x80000000, usable: 0x7a600000',
      'cpu: 2 cores online (1 fusion domain), 2 clusters',
      'boot-args = serial=3 -v',
      'standard timeslicing quantum is 10000 us',
      'standard background quantum is 2500 us',
      'vm_compressor_mode is 4',
      'entropy source: 512 bytes from boot loader');
    VM_REGIONS.forEach(function (r, i) {
      var start = 0x8000 + i * 0x80, end = start + 0x7f;
      push('vm: region ' + i + ' 0xfffffff' + start.toString(16) + '0000-0xfffffff' + end.toString(16) + 'ffff ' +
        r[2] + ' KB ' + r[1] + ' ' + r[0]);
    });
    push(300,
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
      250);
    ZONES.forEach(function (z, i) {
      var elems = 256 + ((i * 7919) % 4096) * 4;
      push('zone: ' + z[0] + ': ' + elems + ' elements of ' + z[1] + ' bytes, ' + Math.ceil(elems * z[1] / 16384) + ' pages');
    });
    push(350);
    DT_NODES.forEach(function (n, i) {
      var name = n.split('@')[0], addr = n.split('@')[1];
      push('IODeviceTree: /arm-io/' + n + ' (' + (7 + (i * 5) % 23) + ' properties, ' + (i % 4) + ' children)');
      push('IODeviceTree: /arm-io/' + name + ': reg 0x' + addr + ' size 0x' + (0x1000 * (1 + i % 16)).toString(16) +
        ', interrupts [' + (32 + i * 3) + ', ' + (33 + i * 3) + ']');
      if (i === 13 || i === 27) push(300);
    });
    push(400);
    DT_NODES.forEach(function (n, i) {
      var name = n.split('@')[0];
      push('AppleARMIO: ' + name + ' matched ' + driverFor(name) + ' (score ' + (1000 + (i * 37) % 500) + ')');
    });
    push(350);
    KEXTS.forEach(function (k) { push('kext: ' + k[0] + ' (' + k[1] + ') loaded'); });
    push('kext: 212 kexts in prelinked cache, 48 started early, rest on demand', 300);
    KEXTS.forEach(function (k, i) { push('kext: ' + k[0] + ' started (' + ((i * 13) % 41) + ' ms)'); });
    push(350,
      'AppleSPMI: 2 controllers, 43 devices enumerated',
      'ApplePMU: revision 3, 11 regulators online',
      'ApplePMU: charger: battery 73% (4089 mV), external power: no',
      'AppleTemp: 9 thermal sensors registered');
    SENSORS.forEach(function (s) { push('AppleTemp: ' + s[0] + ' = ' + s[1] + '.' + Math.floor(rnd() * 10) + ' C'); });
    DOMAINS.forEach(function (d, i) { push('IOPower: domain ' + d + ': on (' + (1 + (i * 5) % 7) + ' clients)'); });
    push('AppleAOP: firmware 1.3.0 loaded (RTKit), 3 endpoints',
      'AppleAOP: syslog relay enabled',
      'AppleSensorHub: accelerometer (0x4), gyro (0x8), compass (0x10) online',
      'AppleAmbientLight: sensor calibrated, 5 gain stages',
      'AppleHaptics: engine ready, 2 waveform banks',
      400,
      'AppleDisplay: panel 1334x750 @ 60 Hz, 8-bit, color mode P3',
      'AppleDisplay: backlight 0 -> 0 (boot, keep off)');
    MODES.forEach(function (m, i) { push('AppleDisplay: timing mode ' + i + ': ' + m[0] + ' @ ' + m[1] + ' Hz, pclk ' + m[2] + ' MHz'); });
    push('AppleDisplay: gamma table 2.2 loaded, 1024 entries',
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
      350,
      'AppleNVMe: controller ready, firmware 0.1.5',
      'AppleNVMe: 128 GB, namespace 1 ready, 2 queues of depth 64');
    SLICES.forEach(function (s, i) {
      push('AppleStorage: slice ' + (i + 1) + ' lba ' + s[0] + '-' + s[1] + ' type ' + s[2] + ' uuid ' +
        hex(8).toUpperCase() + '-' + hex(4).toUpperCase() + ' "' + s[3] + '"');
    });
    push('AppleEffaceable: 2 lockers online',
      'apfs: module loaded (1412.141.1)',
      'apfs: container 0 found, 2 volumes, 128 GB',
      'apfs: mounted volume "System" (read-only, snapshot)',
      'apfs: mounted volume "Data" (read-write, 96.3 GB free)',
      'BSD root: disk0s1s1, major 1, minor 1',
      'bsd_init: rootvnode ok, /dev populated (144 nodes)',
      'kern.bootsessionuuid = 5A2C7E1B-9F1C-4D2A-8C4B-0E7F6A1D3B92',
      450,
      'apfs: verifying container checkpoint ... ok (41 ms)',
      'apfs: omap tree: 3 levels, 1842 nodes',
      'apfs: fsroot tree: 4 levels, 21930 nodes',
      'apfs: extentref tree: 3 levels, 2210 nodes',
      'apfs: snapshot metadata tree: 1 level, 2 nodes',
      'apfs: fext tree: 2 levels, 310 nodes',
      'apfs: space manager: 32 chunks, 96.3 GB free',
      'apfs: reaper: 0 objects queued',
      'apfs: encryption rolling: idle',
      'apfs: volume "Data" journal replay: 0 transactions',
      'apfs: snapshot "com.apple.os.update-4C1F2A" sealed, 0 differences',
      'apfs: keybag unlocked for volume "Data" (class A pending)',
      'apfs: trim: 18.2 GB queued for discard',
      'mount: /private/var mounted from disk0s1s2',
      400,
      'AppleUSB: host controller online, 1 port (type-A off, lightning on)',
      'AppleUSB: device mode ready, 3 configurations',
      'AppleUSBEthernet: interface en2 registered',
      'AppleWiFi: firmware 9.30.440 loaded, 2 radios (2.4/5 GHz)');
    CHANNELS.forEach(function (ch) {
      var freq = ch <= 14 ? 2407 + 5 * ch : 5000 + 5 * ch;
      push('AppleWiFi: channel ' + ch + ' (' + freq + ' MHz) allowed, max power ' + (ch <= 14 ? 20 : 23) + ' dBm');
    });
    push('AppleWiFi: interface en0 registered, country code resolved',
      'AppleBluetooth: firmware loaded, host interface online',
      'AppleBaseband: PCIe link up (gen 1, x1)',
      'AppleBaseband: modem firmware 1.07.02 loaded',
      'AppleBaseband: SIM tray: present',
      'AppleNFC: controller ready',
      'AppleLocation: GNSS receiver online, 0 satellites',
      350,
      'AppleTouch: digitizer calibrated, 16x9 sense grid',
      'AppleButtons: 4 inputs (power, volume up, volume down, ringer)',
      'AppleHome: home button pressure sensor paired',
      'AppleBiometric: sensor paired, template store locked',
      'AppleKeyStore: starting (BUILT: Apr 21 2020 22:08:31)',
      'AppleSEP: secure enclave link established, 4 mailboxes',
      'AppleSEP: firmware version 1.0 (build 1738)');
    for (var m = 0; m < 8; m++) push('AppleSEP: mbox ' + m + ' rx ' + hex(16) + ' ' + hex(16) + ' (ep ' + (m % 4) + ')');
    push('AppleSEPKeyStore: starting, protection classes 1-4 loaded',
      'AppleCredentialManager: init: called',
      'AppleCredentialManager: start: initializing power management',
      'AppleCredentialManager: start: started',
      'AppleSSE: key manager online',
      'AppleTrustCache: 1 cache loaded (static)');
    SELFTEST.forEach(function (a, i) {
      push('corecrypto: self-test ' + a + ' vector ' + (i + 1) + ': ' + hex(32) + ' ok (' + (i % 3) + ' ms)');
    });
    push(400,
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
      300,
      'Darwin Bootstrapper Version 6.0.0: Tue Apr 21 22:22:35 PDT 2020; root:libxpc_private-1738.140.1~1/RELEASE_ARM64_T8010',
      'launchd: reading /System/Library/LaunchDaemons (214 plists)',
      'launchd: reading /Library/LaunchDaemons (0 plists)',
      'launchd: loading system services (214 jobs)');
    DAEMONS_A.forEach(function (d) { push('launchd: starting com.apple.' + d); });
    push(300);
    DAEMONS_B.forEach(function (d, i) { push('launchd: starting com.apple.' + d); if (i === 19) push(300); });
    push(400,
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
      'keybagd: system keybag loaded, 4 classes',
      'runningboardd: 0 processes tracked',
      'cfprefsd: 12 domains cached',
      'distnoted: 0 observers',
      'mDNSResponder: 3 interfaces, 0 records',
      350);
    DAEMONS_C.forEach(function (d) { push('launchd: starting com.apple.' + d); });
    push('apsd: push transport idle, 0 channels',
      'mobileactivationd: activation record present, state: activated',
      'identityservicesd: 0 accounts loaded',
      300,
      'launchd: starting com.apple.backboardd',
      'backboardd: display 0 claimed, 1 layer',
      'backboardd: hid: 7 services attached',
      'backboardd: boot UI: progress bar',
      'launchd: starting com.apple.SpringBoard',
      'SpringBoard: 1 display, 1 home screen, 0 pending installs',
      'SpringBoard: boot: handing display to boot UI',
      450);
    return L;
  }
  var XNU = buildXNU();
  // Deterministic short gaps inside a burst (ms), cycled. Longest gap well under half a second.
  var GAP = [0, 65, 0, 130, 35, 0, 200, 45, 0, 90, 0, 0, 155, 20, 260, 0, 55, 0, 110, 35];

  /* ---------------- Phase 3: Apple logo + progress bar ----------------
   * [bar width %, pause after in ms] */
  var PROGRESS = [[0, 1500], [6, 1400], [22, 1600], [38, 1300], [49, 2000], [63, 1500], [80, 1200], [100, 1400]];

  /* ---------------- Build the timeline ---------------- */
  var steps = [], T = 0;
  function at(fn, wait) { steps.push({ at: T, fn: fn }); T += wait || 0; }
  var ALL_LINES = [];
  function line(text, wait) { ALL_LINES.push(text); at(function () { print(text); }, wait); }

  at(function () { setPhase('pongo'); }, 600);
  PONGO_A.forEach(function (s) { line(s[0], s[1]); });
  at(function () { logo.hidden = false; }, 1300);
  PONGO_B.forEach(function (s) { line(s[0], s[1]); });
  at(function () { setPhase('xnu'); }, 150);
  var XNU_START = T, k = 0, lastAt = T;
  XNU.forEach(function (item) {
    if (typeof item === 'number') T = Math.max(T, lastAt + item);   // stall measured from the last line
    else { lastAt = T; line(item, GAP[k++ % GAP.length]); }
  });
  var XNU_END = T;
  at(function () { setPhase('apple'); }, 0);
  PROGRESS.forEach(function (p) { at(function () { setBar(p[0]); }, p[1]); });
  var TOTAL_MS = T;                     // time from start until the bar is full
  at(function () { done = true; }, 5000);
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
    var cell = Math.max(1, Math.round(dpr));          // 64 CSS px wide on any screen
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

  window.LIVEBOOT = { standalone: true, totalMs: TOTAL_MS, lines: ALL_LINES, restart: start,
    times: steps.map(function (s) { return s.at; }), xnu: [XNU_START, XNU_END] };

  drawLogo();
  keepAwake();
  start();
})();
