const Particles = require('./components/particles');

const FFT_SIZES = [ 64, 256, 1024, 2048, 4096, 8192 ];
const FFT_DIVIDE = [ 1e5, 1e6, 1e7, 1e7, 8e7, 2e8 ];

async function setupClassicVisualizer (sourceId) {
  console.log('Creating new classic visualizer')
  // If an existing visualizer already exists, stop it
  if (this.intervals && this.intervals.animation) {
    stop();
  }
  
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId
      }
    },
    // Before people ask, no, Auditory does not use your video devices whatsoever!
    // We're only requesting this permission because Electron is extremely weird and
    // inconsistent regarding streams and sometimes won't detect anything on some devices if this is not provided
    video: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    }
  });

  // Settings
  const brightness = this.settings.get('brightness');
  const beastiness = this.settings.get('beastiness');
  const color = this.settings.get('color');
  const mode = this.settings.get('mode');
  const amplitude = this.settings.get('amp');
  const shakeAmount = this.settings.get('shake');
  const image = this.settings.get('image');
  const rotation = this.settings.get('rotation');
  const important = false
  const ultra = this.settings.get('ultra');
  const useLowerQuality = { animation: beastiness < 5, audio: beastiness < 2 };

  // Create an analyser
  const audioCtx = new AudioContext();
  const audioStream = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  audioStream.connect(analyser);
  analyser.fftSize = FFT_SIZES[(beastiness || 1) - 1];
  analyser.frequencyBinCount = 1024;

  const hexToRGB = (hex) => {
    const bigint = parseInt(hex, 16);
    return { r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255 };
  };
  const customColor = hexToRGB((color || '').replace('#', '')) || hexToRGB('ef5350');
  let AudioAnalysis = {
    amount: 0,
    bass: 0,
    amp: 0
  }

  // Find the container to change the style
  body = document.querySelector('body');
  let visualizer = document.querySelector('.visualizer');
  const canvas = document.querySelector('.canvas');
  let fpsCounter = document.querySelector('.fps-counter');
  let fpsCounterMenu = document.querySelector('.fps-counter-menu');
  const ampValue = document.querySelector('#amp-value');
  const rotationValue = document.querySelector('#rotation-value');
  const visualizerCore = document.querySelector('.circle');
  visualizerCore.style.backgroundImage = `url('${image}')`;

  let red = 255,
    green = 0,
    blue = 0;
  let turnAround = false;
  let amountMultiplier = 1;
  let flipAmount = -1;
  let lastLoop = Date.now();

  const hexToRGB = (hex) => {
    const bigint = parseInt(hex, 16);
    return { r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255 };
  };
  const customColor = hexToRGB((color || '').replace('#', '')) || hexToRGB('ef5350');

  const audio = () => {
    // Audio analysis
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let amount = 0, bass = 0;
    for (let i = 0; i < dataArray.length; i++) {
      if (i < 16) {
        bass += dataArray[i] / 10;
      }
      amount += dataArray[i];
    }
    amount *= amountMultiplier;
    bass *= amountMultiplier;

    const amp = (mode === 'amp' 
    ? Math.abs(amount ** 2) / FFT_DIVIDE[(beastiness || 1) - 1] 
    : (amount / bufferLength) * 2) * amplitude;

    AudioAnalysis = { amount, amp, bass }
    if (this.game) this.game.transferAudioData({ amount, amp, bass })
    if (this.particles) this.particles.transferAudioData({ amount, amp, bass })
    return { amount, amp, bass };
  }

  // Perform style changes
  const animation = () => {
    const { amount, bass, amp } = AudioAnalysis
    if (!visualizer) {
      return;
    }
    let thisLoop = Date.now();
    let fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;
    
    if (flipAmount > rotation) {
      turnAround = false;
      flipAmount -= 0.01;
    }
    if (flipAmount < -rotation || turnAround) {
      turnAround = true;
      flipAmount += 0.01;
    } else {
      flipAmount -= 0.01;
    }

    // If the menu is open, update statistics
    if (window.menuOpened) {
      fpsCounterMenu.innerHTML = `${fps.toFixed(2)} FPS`;
      ampValue.innerHTML = `${amp.toFixed(0)} amplitude, ${bass.toFixed(0)} bass`;
      rotationValue.innerHTML = flipAmount.toFixed(2);
    }

    // Display static background if no music is playing
    if (!amp) {
      body.setAttribute('style', `background: rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, 1)`);
    } else {
      visualizer.style.transform = `rotate(${amp / 10 + flipAmount * 2}deg) scale(${(Math.max(0.1, amp / 100) * 1.35)})`
      canvas.style.transform = `scale(${1 + (Math.min(0.01, amp * 0.0001))})`
      if (bass > 325 && shakeAmount > 0) {
        visualizer.style.filter = `blur(${amp / (shakeAmount > 1 ? 300 : 500)}px)`;
        canvas.style.filter = `blur(${(amp * 3.5) / (shakeAmount > 1 ? 300 : 500)}px)`
        circle.classList.add(shakeAmount > 1 ? 'bigrumble' : 'rumble');
        canvas.classList.add(shakeAmount > 1 ? 'bigrumble' : 'rumble');
      } else {
        canvas.style.filter = visualizer.style.filter = `blur(0px)`;
        circle.classList.remove('rumble', 'bigrumble');
        canvas.classList.remove('rumble', 'bigrumble');
      }     

      // If no color is specified, cycle through rainbow
      if (!color) {
        const colorAmp = Math.max(0.5, Math.floor(amp / 100) / 2);
        if (red > 0 && blue <= 0) {
          red -= colorAmp;
          green += colorAmp;
        }
        if (green > 0 && red <= 0) {
          green -= colorAmp;
          blue += colorAmp;
        }
        if (blue > 0 && green <= 0) {
          red += colorAmp;
          blue -= colorAmp;
        }
        body.style.background = `rgba(${red}, ${green}, ${blue}, ${0.1 * (amp / 2 / (100.1 - (brightness || 0.1))).toString()}) ${important ? '!important' : ''}`;
      } else {
        body.style.background = `rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, ${0.1 * (amp / 2 / (100.1 - (brightness || 0.1))).toString()}) ${important ? '!important' : ''}`;
      }
      body.style.boxShadow = `inset 0px 0px ${10 + amp / 3}px ${40 + amp / 3}px ${body.style.background}`;
    }
    if (useLowerQuality.animation) {
      requestAnimationFrame(animation);
    }
  }

  // Begin animation
  if (!useLowerQuality.audio) {
    this.intervals.audio = setInterval(audio, 1);
  } else {
    this.intervals.audio = setInterval(audio, 16);
  }
  if (!useLowerQuality.animation) {
    this.intervals.animation = setInterval(animation, 1);
  } else {
    if (this.intervals) clearInterval(this.intervals.animation)
    requestAnimationFrame(animation);
  }
}

function selectSource (source) {
  setupClassicVisualizer(source.id).catch(() => {
    const modalHeader = document.createElement('div');
    modalHeader.innerText = 'Oh no!';
    modalHeader.classList.add('modal-header');
    const modalDiv = document.createElement('div');
    const modalText = document.createElement('div');
    modalDiv.appendChild(modalHeader);
    modalDiv.appendChild(modalText);
    modalDiv.classList.add('modal');
    modalText.classList.add('modal-text');
    modalText.innerText = 'We weren\'t able to capture audio for some reason :(\nCheck the console if you want to troubleshoot this'
    document.body.appendChild(modalDiv)
  });
}

function start () {
  const canvas = document.querySelector('.canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (this.particles) {
    this.particles.stop();
  }

  const ParticleField = new Particles(canvas);
  this.particles = ParticleField;
  ParticleField.start();

  this.CANVAS_RESIZE_OBSERVER = new ResizeObserver(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.particles.recenterParticles();
  }).observe(document.body)

  const { desktopCapturer } = require('electron');
  desktopCapturer.getSources({ types: [ 'window', 'screen' ] }, async (_, sources) => {
    for (const source of sources) {
      if (source.name.includes('Screen 1') || source.name.includes('Entire Screen')) {
        try {
          setupClassicVisualizer();
        } catch (e) {
          const modalSubtext = document.createElement('div');
          modalSubtext.innerText = `If you\'re not sure which to pick, try "${sources[0].name}"`;
          modalSubtext.classList.add('modal-subtext');
          const modalHeader = document.createElement('div');
          modalHeader.innerText = 'Select a window/screen to capture audio';
          modalHeader.classList.add('modal-header');
          const modalDiv = document.createElement('div');
          modalDiv.appendChild(modalHeader);
          modalHeader.appendChild(modalSubtext);
          document.body.appendChild(modalDiv)
          modalDiv.classList.add('modal');
          sources.map(source => {
            const nameDiv = document.createElement('div');
            nameDiv.classList.add('modal-item');
            nameDiv.innerText = source.name;
            nameDiv.onclick = () => {
              modalDiv.remove();
              selectSource(source);
            }
            modalDiv.appendChild(nameDiv);
          })
        }
        return;
      }
      return;
    }
  });
}

function requestPlayGame () {
  this.particles.stop()
  const Game = require('./components/game');
  const GameField = new Game(canvas, {
    endCallback: () => {
      const canvas = document.querySelector('.canvas');
      const ParticleField = new Particles(canvas);
      this.particles = ParticleField;
      ParticleField.start();
    }
  });
  this.game = GameField;
  GameField.start();
}

function continuouslyUpdateMediabar (currentTime, totalTime) {
  if (this.mediaBarInterval) {
    clearInterval(this.mediaBarInterval);
  }
  const mediabar = document.querySelector('.song-mediabar-progress');
  const mediabarTimes = [ ...document.querySelectorAll('.song-mediabar-time') ];
  this.mediaBarInterval = setInterval(() => {
    currentTime += 27;
    mediabar.style.width = `${(currentTime / totalTime) * 350}px`;

    const currentTimeClean = (currentTime / 1000).toFixed(0);
    const totalTimeClean = (totalTime / 1000).toFixed(0);
    const pad = (num, size) => ('000' + num).slice(size * -1);
    const currentTimeMinutes = pad(Math.floor(currentTimeClean / 60) % 60, 2);
    const friendlyCurrentTime = `${currentTimeMinutes}:${pad(Math.floor(currentTimeClean - currentTimeMinutes * 60), 2)}`;
    const totalTimeMinutes = pad(Math.floor(totalTimeClean / 60) % 60, 2);
    const friendlyTotalTime = `${totalTimeMinutes}:${pad(Math.floor(totalTimeClean - totalTimeMinutes * 60), 2)}`;
    mediabarTimes[0].innerHTML = friendlyCurrentTime;
    mediabarTimes[1].innerHTML = friendlyTotalTime;
  }, 30)
}

function startLyrics (name, lyrics, songProgress) {
  function round (value, precision) {
    let multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }
  const lyricsText = document.querySelector('.lyrics');
  let timeSinceLastLyric = 0;
  let lastLyric = null;
  let time = songProgress || 0;
  this.lyrics = { started: true, name };
  this.lyricsInterval = setInterval(() => {
    time += 50;
    const seconds = round(time / 1000, 1).toFixed(1);
    const lyric = lyrics[seconds];
    if (lyric) {
      if (lastLyric !== lyric) {
        lyricsText.classList.remove('fade-new-lyrics')
        lyricsText.classList.add('fade-new-lyrics')
        setTimeout(() => lyricsText.classList.remove('fade-new-lyrics'), 20)
      }
      
      timeSinceLastLyric = Date.now();
      lyricsText.innerHTML = lyric;
      lastLyric = lyric;
    }
    if (Date.now() - timeSinceLastLyric > 3.5e3) {
      lyricsText.classList.remove('fade-in-lyrics')
      lyricsText.classList.add('fade-out-lyrics')
    } else {
      lyricsText.classList.remove('fade-out-lyrics')
      lyricsText.classList.add('fade-in-lyrics')
    }
  }, 50)
}

async function create () {
  console.log('New instance created')
  this.intervals = {};
  this.lyrics = { started: false, name: null };
  this.settings = new Map([
    ['brightness', 75],
    ['beastiness', 2],
    ['color', ''],
    ['mode', 'amp'],
    ['amp', 1], // 1 to 10
    ['shake', 1], // 0 to 2, 0 = off, 1 = normal, 2 = fucked
    ['image', 'https://eadvice.co/wp-content/uploads/2018/01/animat-cube-color.gif'],
    ['rotation', 13],
    ['ultra', false]
  ])
  start();

  // Spotify Integration
  const SpotifyInstance = require('./components/spotify/spotify.js')
  let spotify = null;
  try {
    spotify = new SpotifyInstance();
  } catch (e) {
    spotify = null;
  }
  console.log(spotify)
  const updateSpotify = async () => {
    const song = await spotify.getCurrentAlbumArt(true);
    if (!song) {
      return document.querySelector('.song').style.display = 'none';
    }
    let name = song.item.name;
    if (!this.lyrics.started || this.lyrics.name !== name) {
      clearInterval(this.lyricsInterval);
      const Lyrics = require('./components/lyrics.js');
      let lyrics = null;
      try {
        lyrics = new Lyrics(name);
      } catch (e) {
        console.log(e)
        lyrics = null;
      }

      if (lyrics) {
        //startLyrics(name, lyrics, song.progress_ms + 200);
      }
    }
    let artists = song.item.artists.map(a => a.name).join(', ');
    if (!song.is_playing) {
      name = '.'
      artists = '... nothing playing'
    }
    document.querySelector('.song-name').innerHTML = name;
    const artistsText = document.querySelector('.song-artists');
    if (artists.includes('DROELOE')) {
      artistsText.style.color = '#f9a825';
      artists += ' 💕'
    } else {
      artistsText.style.color = '#d3d3d3';
    }
    artistsText.innerHTML = artists;
    if (song.is_playing) {
      continuouslyUpdateMediabar(song.progress_ms, song.item.duration_ms);
      if (song.item.duration_ms - song.progress_ms < 10e3) {
        setTimeout(() => updateSpotify(), song.item.duration_ms - song.progress_ms + 100)
      }
    }
  }
  if (spotify) {
    updateSpotify();
    setInterval(() => updateSpotify(), 1000 * 10);
  } else {
    document.querySelector('.song').style.display = 'none';
  }
}

function stop () {
  for (const interval of Object.values(this.intervals)) {
    clearInterval(interval);
  }
}

function reload () {
  stop();
  start();
}

function changeSetting (setting, value) {
  this.settings.set(setting, value);
  reload();
}

window.onload = () => create();

module.exports = {
  create, start, stop, reload, changeSetting, settings: this.settings
}
