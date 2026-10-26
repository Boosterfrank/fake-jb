/* logo.js — 1-bit pixel-art "checkra1n"-style logo (Apple silhouette + chess rook + chessboard).
 * Shared by the boot screen (app.js) and the icon generator (tools/make-icons.mjs).
 * Everything is drawn from code, so there are no image assets to keep in sync. */
(function (global) {
  'use strict';

  // Apple silhouette, 24x24 viewBox.
  var APPLE = 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701';

  var W = 64, H = 76;      // logical pixel grid
  var bm = null;           // cached bitmap (Uint8Array, 1 = lit)
  var src = null;          // cached 1:1 canvas of the bitmap

  function clearRect(b, x0, y0, x1, y1) {
    for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) b[y * W + x] = 0;
  }

  function bitmap() {
    if (bm) return bm;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff';
    g.translate(-2.2, 2);  // centre the 24-unit path (which spans x≈2.9..19.9) on the grid
    g.scale(3, 3);
    g.fill(new Path2D(APPLE));
    var px = g.getImageData(0, 0, W, H).data;
    var b = new Uint8Array(W * H);
    for (var i = 0; i < b.length; i++) b[i] = px[i * 4] > 127 ? 1 : 0;

    // Chess rook cut out of the apple.
    clearRect(b, 24, 24, 28, 28); clearRect(b, 30, 24, 34, 28); clearRect(b, 36, 24, 40, 28); // merlons
    clearRect(b, 24, 28, 40, 31);  // crown
    clearRect(b, 26, 31, 38, 33);  // collar
    clearRect(b, 27, 33, 37, 58);  // body
    clearRect(b, 25, 58, 39, 61);  // base
    clearRect(b, 23, 61, 41, 66);  // plinth

    // Chessboard dithering across the lower part of the apple, either side of the rook.
    for (var y = 42; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (x >= 23 && x < 41) continue;
        if ((((x >> 1) + (y >> 1)) & 1) === 0) b[y * W + x] = 0;
      }
    }
    bm = b;
    return b;
  }

  function source() {
    if (src) return src;
    var b = bitmap();
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    var img = g.createImageData(W, H);
    for (var i = 0; i < b.length; i++) {
      var v = b[i] ? 255 : 0;
      img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    src = c;
    return c;
  }

  /* Draw the logo into `canvas` with `cell` device pixels per logical pixel. */
  function draw(canvas, cell) {
    canvas.width = W * cell; canvas.height = H * cell;
    var g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#000'; g.fillRect(0, 0, canvas.width, canvas.height);
    g.drawImage(source(), 0, 0, canvas.width, canvas.height);
  }

  /* Square app icon: black background, logo centred, `scale` = logo height / icon size. */
  function icon(size, scale) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
    g.imageSmoothingEnabled = false;
    var h = Math.round(size * scale), w = Math.round(h * W / H);
    g.drawImage(source(), Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
    return c;
  }

  global.CheckLogo = { W: W, H: H, bitmap: bitmap, draw: draw, icon: icon };
})(window);
