const start = () => {
  const { desktopCapturer } = require('electron');

  desktopCapturer.getSources({ types: [ 'window', 'screen' ] }, async (_, sources) => {
    for (const source of sources) {
      if (source.name.includes('Screen 1')) {
        try {
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

          const brightness = this.settings.get('brightness');
          const beastiness = this.settings.get('beastiness');
          const color = this.settings.get('color');
          const mode = this.settings.get('mode');
          const important = false
          const defaultcolor = '#202225';

          // Create an analyser
          const analyser = audioCtx.createAnalyser();
          audio.connect(analyser);
          const FFT_SIZES = [ 32, 64, 128, 256, 1024 ];
          const FFT_DIVIDE = [ 1e5, 1e5, 1e6, 1e6, 1e7 ];
          analyser.fftSize = FFT_SIZES[(beastiness || 1) - 1];
          let visualizer = document.querySelector('body');

          const hexToRGB = (hex) => {
            const bigint = parseInt(hex, 16);
            return { r: (bigint >> 16) & 255,
              g: (bigint >> 8) & 255,
              b: bigint & 255 };
          };
          const customColor = hexToRGB((color || '').replace('#', '')) || hexToRGB('ef5350');
          const customBGColor = hexToRGB((defaultcolor || '').replace('#', '')) || hexToRGB('202225');

          // Find the container to change the style
          body = document.querySelector('body');
          visualizer = document.querySelector('.visualizer');

          // Perform style changes
          const style = setInterval(() => {
            if (!visualizer) {
              return;
            }
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);
            const amount = dataArray.reduce((a, b) => a + b);
            const xDFT_psd = Math.abs(amount ** 2);
            const amp = mode === 'amp' ? xDFT_psd / FFT_DIVIDE[(beastiness || 1) - 1] : (amount / bufferLength) * 2;

            if (!amp) {
              body.setAttribute('style', `background: rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, 1)`);
            } else {
              visualizer.style.transform = `rotate(${amp / 10}deg) scale(${(amp / 100) * 1.35})`
              body.setAttribute('style', `background: rgba(${customColor.r}, ${customColor.g}, ${customColor.b},  ${2 / (amp / 2 / (100.1 - (brightness || 0.1))).toString()}) ${important ? '!important' : ''}`);
            }
          }, 1000 / (15 * ((beastiness || 1) * 2)));
          this.intervals = [ style ];
        } catch (e) {
          console.error(e);
        }
        return;
      }
    }
  });
}

const create = () => {
  console.log('New instance created')
  this.settings = new Map([
    ['brightness', 80],
    ['beastiness', 5],
    ['color', '#212121'],
    ['mode', 'amp'],
  ])
  start();
}

const stop = () => {
  for (const interval of this.intervals) {
    clearInterval(interval);
  }
}

const reload = () => {
  stop();
  start();
}

const changeSetting = (setting, value) => {
  this.settings.set(setting, value);

  reload();
}

module.exports = {
  create, start, stop, reload, changeSetting, settings: this.settings
}

