// Custom timer logic
var start = null;
var isBlink = false;
var isLight = true;
var isRun = false;
var isShow = true;
var isWarned = false;
var handler = null;
var latency = 0;
var stopBy = null;
var delay = 60000;
var countdownMax = 60000;
var audioRemind = null;
var audioEnd = null;
var isBombMode = false;
var currentTheme = 'theme-classic';

var themeColors = {
  'theme-classic': '#fff',
  'theme-sunshine': '#0f2b4c',
  'theme-forest': '#e7f6df',
  'theme-ocean': '#e5fbff'
};

var newAudio = function(file) {
  var node = new Audio();
  node.src = file;
  node.loop = false;
  node.load();
  document.body.appendChild(node);
  return node;
};

var soundToggle = function(des, state) {
  if (state) {
    return des.play();
  } else {
    des.currentTime = 0;
    des.pause();
    return des;
  }
};

var getThemeColor = function() {
  if (isBombMode) {
    return '#fff';
  }
  return themeColors[currentTheme] || '#fff';
};

var applyExplosion = function(active) {
  document.body.classList.toggle('bomb-exploded', !!active);
};

var stopAllSounds = function() {
  soundToggle(audioEnd, false);
  soundToggle(audioRemind, false);
};

var updateFuse = function(remaining) {
  if (!isBombMode) {
    return;
  }
  var base = countdownMax || delay || 1;
  var progress = 1 - Math.max(0, Math.min(1, remaining / base));
  var burntWidth = (progress * 100).toFixed(2) + '%';
  var sparkPercent = (100 - progress * 100).toFixed(2) + '%';
  var timer = document.getElementById('timer');
  timer.style.setProperty('--fuse-progress', burntWidth);
  timer.style.setProperty('--spark-position', sparkPercent);
};

var formatTime = function(ms) {
  var safeMs = Math.max(0, ms);
  return (safeMs / 1000).toFixed(2);
};

var updateTimerText = function(value) {
  $('#timer-text').text(formatTime(value));
  updateFuse(value);
  resize();
};

var refreshTextColor = function() {
  if (!isBlink) {
    $('#timer-text').css('color', getThemeColor());
  }
};

var stopTimerRunning = function() {
  if (handler) {
    clearInterval(handler);
  }
  handler = null;
  isRun = false;
  $('#toggle').text('RUN');
  stopBy = null;
  latency = 0;
  start = null;
  isBlink = false;
  isWarned = false;
  applyExplosion(false);
  stopAllSounds();
  refreshTextColor();
};

var show = function() {
  isShow = !isShow;
  $('body').toggleClass('controls-hidden', !isShow);
  $('#primary-controls, #preset-controls').attr('aria-hidden', !isShow);
};

var adjust = function(it, v) {
  if (isBlink) {
    stopTimerRunning();
  }
  if (it === 0) {
    stopTimerRunning();
    delay = v * 1000;
    countdownMax = delay;
  } else {
    delay = delay + it * 1000;
    countdownMax = Math.max(delay, countdownMax);
  }
  if (delay <= 0) {
    delay = 0;
  }
  updateTimerText(delay);
  refreshTextColor();
};

var toggle = function() {
  isRun = !isRun;
  $('#toggle').text(isRun ? 'STOP' : 'RUN');
  if (!isRun && handler) {
    stopBy = new Date();
    clearInterval(handler);
    handler = null;
    stopAllSounds();
  }
  if (stopBy) {
    latency = latency + new Date().getTime() - stopBy.getTime();
  }
  if (isRun) {
    countdownMax = delay;
    applyExplosion(false);
    return run();
  }
};

var reset = function() {
  if (delay === 0) {
    delay = 1000;
  }
  stopTimerRunning();
  countdownMax = delay;
  updateTimerText(delay);
};

var blink = function() {
  isBlink = true;
  isLight = !isLight;
  $('#timer-text').css('color', isLight ? getThemeColor() : '#f00');
};

var count = function() {
  var tm, diff;
  tm = $('#timer-text');
  diff = start.getTime() - new Date().getTime() + delay + latency;
  if (diff > 60000) {
    isWarned = false;
  }
  if (diff < 60000 && !isWarned) {
    isWarned = true;
    soundToggle(audioRemind, true);
  }
  if (diff < 55000) {
    soundToggle(audioRemind, false);
  }
  if (diff < 0 && !isBlink) {
    soundToggle(audioEnd, true);
    isBlink = true;
    diff = 0;
    clearInterval(handler);
    handler = setInterval(function() {
      return blink();
    }, 500);
    if (isBombMode) {
      applyExplosion(true);
    }
  }
  updateTimerText(diff);
  return resize();
};

var run = function() {
  if (start === null) {
    start = new Date();
    latency = 0;
    isBlink = false;
    refreshTextColor();
  }
  if (handler) {
    clearInterval(handler);
  }
  if (isBlink) {
    return handler = setInterval(function() {
      return blink();
    }, 500);
  } else {
    return handler = setInterval(function() {
      return count();
    }, 100);
  }
};

var resize = function() {
  var tm = $('#timer-text');
  var container = $('#timer');
  var w = container.width();
  var len = tm.text().length;
  if (len < 3) {
    len = 3;
  }
  tm.css('font-size', 1.5 * w / len + "px");
};

var changeTheme = function(theme) {
  $('body').removeClass('theme-classic theme-sunshine theme-forest theme-ocean').addClass(theme);
  currentTheme = theme;
  refreshTextColor();
};

var toggleBombMode = function() {
  isBombMode = !isBombMode;
  $('body').toggleClass('bomb-mode', isBombMode);
  $('#bomb-toggle').text(isBombMode ? 'Bomb mode ON' : 'Bomb mode');
  refreshTextColor();
  var currentValue = parseFloat($('#timer-text').text());
  if (isNaN(currentValue)) {
    currentValue = 0;
  }
  updateFuse(currentValue * 1000);
  applyExplosion(false);
  resize();
};

window.onload = function() {
  updateTimerText(delay);
  audioRemind = newAudio('audio/smb_warning.mp3');
  audioEnd = newAudio('audio/smb_mariodie.mp3');
};

window.onresize = function() {
  return resize();
};
