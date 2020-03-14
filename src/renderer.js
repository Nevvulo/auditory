// i would like to personally apologize to anyone trying to read this
// not the cleanest thing i've ever made
let flipAmount = -1;
async function setupClassicVisualizer () {
  console.log('Creating new classic visualizer')
  if (this.intervals) {
    stop();
  }
  
  const brightness = this.settings.get('brightness');
  const beastiness = this.settings.get('beastiness');
  const color = this.settings.get('color');
  const mode = this.settings.get('mode');
  const amplitude = this.settings.get('amp');
  const shakeAmount = this.settings.get('shake');
  const image = this.settings.get('image');
  const rotation = this.settings.get('rotation');
  const important = false
  const defaultcolor = '#202225';

  const FFT_SIZES = [ 32, 64, 128, 256, 1024 ];
  const FFT_DIVIDE = [ 1e5, 1e5, 1e6, 1e6, 1e7 ];

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    },
    video: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    }
  });

  const audioCtx = new AudioContext();
  const audio = audioCtx.createMediaStreamSource(stream);

  // Create an analyser
  const analyser = audioCtx.createAnalyser();
  audio.connect(analyser);
  
  analyser.fftSize = FFT_SIZES[(beastiness || 1) - 1];

  const hexToRGB = (hex) => {
    const bigint = parseInt(hex, 16);
    return { r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255 };
  };
  const customColor = hexToRGB((color || '').replace('#', '')) || hexToRGB('ef5350');

  // Find the container to change the style
  body = document.querySelector('body');
  let visualizer = document.querySelector('.visualizer');
  let fpsCounter = document.querySelector('.fps-counter');
  let fpsCounterMenu = document.querySelector('.fps-counter-menu');
  const visualizerContainer = document.querySelector('.visualizer-container');
  const box = visualizer.getBoundingClientRect();
  let visualizerContainerBox = visualizerContainer.getBoundingClientRect();
  const ampValue = document.querySelector('#amp-value');
  const particleCounter = document.querySelector('#particle-count');
  const rotationValue = document.querySelector('#rotation-value');
  const visualizerCore = document.querySelector('.circle');

  visualizerCore.style.backgroundImage = `url('${image}')`;

  let red = 255,
    green = 0,
    blue = 0;

  let turnAround = false;

  let particles = [];
  const PARTICLE_TYPES = ['star', 'star-1', 'sparkle', 'confetti']
  const particleInterval = setInterval(() => {
    visualizerContainerBox = visualizerContainer.getBoundingClientRect();
    const particleElements = document.querySelectorAll('.particle');
    for (const particle of [ ...particleElements ]) {
      if (Date.now() - particle.timestamp > 5e3) {
        particle.remove();
      }
    }
  }, 5e3);
  let amountMultiplier = 1;
  let lastLoop = Date.now();

  const keys = {};
  window.onkeyup = function(e) { keys[e.keyCode] = false; }
  window.onkeydown = function(e) { keys[e.keyCode] = true; }

  // Perform style changes
  const style = setInterval(() => {
    if (!visualizer) {
      return;
    }
    let thisLoop = Date.now();
    let fps = 1000 / (thisLoop - lastLoop);
    lastLoop = thisLoop;
    if (fps < 60) {
      fpsCounter.style.display = 'block';
      fpsCounter.innerHTML = `!  ${fps.toFixed(2)} FPS`;
      fpsCounter.style.background = `rgba(252, 3, 3, ${((60 - fps) / 100)})`
    } else {
      fpsCounter.style.display = 'none';
    }
    fpsCounterMenu.innerHTML = `${fps.toFixed(2)} FPS`;
    
    const bufferLength = analyser.frequencyBinCount;
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

    if (keys[90]) {
      amountMultiplier += amountMultiplier < 4 ? 0.005 : 0;
    } else {
      amountMultiplier -= amountMultiplier > 1 ? 0.005 : 0;
    }

    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const amount = dataArray.reduce((a, b) => a + b) * amountMultiplier;
    const bass = (dataArray.slice(0, 16).reduce((a, b) => a + b) * amountMultiplier) / 10;
    
    const xDFT_psd = Math.abs(amount ** 2);
    const amp = (mode === 'amp' ? xDFT_psd / FFT_DIVIDE[(beastiness || 1) - 1] : (amount / bufferLength) * 2) * amplitude;
    ampValue.innerHTML = `${amp.toFixed(0)} amplitude, ${bass.toFixed(0)} bass`;
    rotationValue.innerHTML = flipAmount.toFixed(2);

    if (!amp) {
      body.setAttribute('style', `background: rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, 1)`);
    } else {
      particleCounter.innerHTML = `${particles.filter(m => m.lifespan < 4.5e3).length} active, ${particles.length} total`;
      if (bass > 325 && shakeAmount > 0) {
        visualizer.style.filter = `blur(${amp / (shakeAmount > 1 ? 300 : 500)}px)`;
        circle.classList.add(shakeAmount > 1 ? 'bigrumble' : 'rumble');
      } else {
        visualizer.style.filter = `blur(0px)`;
        circle.classList.remove('rumble', 'bigrumble');
      }
      if ((amp > 120 && bass > 300) || keys[88]) { // x key
        let particleCount = ((amp / (amp / 22.5)) * beastiness) * 2.5;

        let spawned = 0;
        while (!keys[88] ? (particles.length < particleCount || spawned > 35) : spawned < 100) {
          if (!keys[88] && particles.length > particleCount) break;
          spawned++;
          const particle = document.createElement('div');
          visualizerContainer.append(particle)
          const type = Math.random() > 0.75 ? PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)] : '';
          const size = Math.floor(Math.random() * (13 * !type ? 1 : 5)); // size in px

          particle.classList.add('particle', type ? 'custom-particle' : 'normal-particle', `particle-${type}`);
          particle.style.width = particle.style.height = `${size}px !important`;
          particle._own = {
            pos: {
              x: 50,
              y: -50
            },
            vel: {
              x: -0.5 + Math.random() * (Math.random() * 4),
              y: -0.5 + Math.random() * (Math.random() * 4)
            },
            speed: {
              x: Math.min(0.6, (amp / 70) / 10),
              y: Math.min(0.6, (amp / 70) / 10)
            },
            dir: {
              x: Math.random() > 0.5 ? 4 : -4,
              y: Math.random() > 0.5 ? 4 : -4
            }
          };
          particle.lifespan = 0;
          particle.timestamp = Date.now();
          particles.push(particle)
        }
        if (keys[88]) {
          keys[88] = false;
          console.log(`Spawning ${Math.floor((particleCount - particles.length) < 0 ? 0 : particleCount - particles.length)} particles through debug key (max ${particleCount})`)
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const speedAmp = Math.max(0.4, Math.floor(amp / 100) / 2);
        particle._own.pos.x += (particle._own.vel.x * particle._own.speed.x * speedAmp) * particle._own.dir.x;
        particle._own.pos.y += (particle._own.vel.y * particle._own.speed.y * speedAmp) * particle._own.dir.y;
        particle.lifespan += Math.random() * (Math.random() * 60);
        particle.style.transform = `translateX(${particle._own.pos.x}px) translateY(${particle._own.pos.y}px) rotate(${particle.lifespan / 50}deg)`;
        if (particle.lifespan > Math.max(4.5e3, 6e3 + Math.random() * 2e3)) {
          particle.remove();
          particles.splice(particles.indexOf(particle), 1);
        }
      }

      visualizer.style.transform = `rotate(${amp / 10 + flipAmount * 2}deg) scale(${(Math.max(0.1, amp / 100) * 1.35)})`

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
        body.setAttribute('style', `background: rgba(${red}, ${green}, ${blue}, ${0.1 * (amp / 2 / (100.1 - (brightness || 0.1))).toString()}) ${important ? '!important' : ''}`);
      } else {
        body.setAttribute('style', `background: rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, ${0.1 * (amp / 2 / (100.1 - (brightness || 0.1))).toString()}) ${important ? '!important' : ''}`);
      }
      body.style.boxShadow = `inset 0px 0px ${10 + amp / 3}px ${40 + amp / 3}px ${body.style.background}`;
    }
  }, 1000 / (15 * ((beastiness || 1) * 5))); // runs at about 250 fps, if too laggy change
  this.intervals = [ style, particleInterval ];
}

function start () {
  const { desktopCapturer } = require('electron');
  desktopCapturer.getSources({ types: [ 'window', 'screen' ] }, async (_, sources) => {
    for (const source of sources) {
      if (source.name.includes('Screen 1')) {
        try {
          setupClassicVisualizer();
        } catch (e) {
          console.error(e);
          reload();
        }
        return;
      }
    }
  });
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

async function create () {
  console.log('New instance created')
  this.settings = new Map([
    ['brightness', 75],
    ['beastiness', 5],
    ['color', ''],
    ['mode', 'amp'],
    ['amp', 1], // 1 to 10
    ['shake', 1], // 0 to 2, 0 = off, 1 = normal, 2 = fucked
    ['image', 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/microsoft/74/party-popper_1f389.png'],
    ['rotation', 13]
  ])
  start();

  // Spotify Integration
  const SpotifyInstance = require('./spotify.js')
  let spotify = null;
  try {
    spotify = new SpotifyInstance();
  } catch (e) {
    spotify = null;
  }

  const updateSpotify = async () => {
    const song = await spotify.getCurrentAlbumArt(true);
    let name = song.item.name;
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
  for (const interval of this.intervals) {
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