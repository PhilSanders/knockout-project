// assets / js / render / audio

window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

const path = require('path')

const style = require(path.resolve('./assets/js/render/style'))
let themePallete = style.themePallete

const feedback = require(path.resolve('./assets/js/render/feedback'))
let updateConsole = feedback.updateConsole;

let audioPlayer = document.querySelector('#AudioPlayer')
let audioSource = document.querySelector('#AudioMp3')
let audioVolInput = document.querySelector('#VolumeSlider')

audioVolInput.value = audioPlayer.volume;

audioVolInput.addEventListener('input', (e) => {
  audioPlayer.volume = audioVolInput.value;
})

audioPlayer.onloadedmetadata = () => {
  audioPlayer.ontimeupdate = () => {
    const trackTime = document.querySelector('#TrackTime')
    const trackDuration = document.querySelector('#TrackDuration')

    let curmins = Math.floor(audioPlayer.currentTime / 60)
    let cursecs = Math.floor(audioPlayer.currentTime - curmins * 60)
    let durmins = Math.floor(audioPlayer.duration / 60)
    let dursecs = Math.floor(audioPlayer.duration - durmins * 60)

    if(cursecs < 10) { cursecs = '0' + cursecs; }
    if(dursecs < 10) { dursecs = '0' + dursecs; }
    if(curmins < 10) { curmins = '0' + curmins; }
    if(durmins < 10) { durmins = '0' + durmins; }

    trackTime.innerHTML = curmins + ':' + cursecs
    trackDuration.innerHTML = durmins + ':' + dursecs

    $('#seekbar').attr('value', audioPlayer.currentTime / audioPlayer.duration);
  }
}

audioPlayer.onplay = () => {
  updateConsole('<i class="glyphicon glyphicon-play"></i> Playing')
}

audioPlayer.onpause = () => {
  updateConsole('<i class="glyphicon glyphicon-pause"></i> Paused')
}

audioPlayer.onended = () => {
  // get the next item in the playlist, if there is one
  const playlistData = Library.viewModel.playlistCoreData()

  if (playlistData.length > 1) {
    const nextItemId = currentAudioFile.id + 1;

    playlistData.forEach((item) => {
      if (item.id === nextItemId && item.id - 1 < playlistData.length) {
        Library.viewModel.playThisItem(item, true)
      }
    })
  }
  else {
    updateConsole('<i class="glyphicon glyphicon-stop"></i> Ready')
  }
}

let ctx = new AudioContext();
const analyser = ctx.createAnalyser();
const audioSrc = ctx.createMediaElementSource(audioPlayer);

audioSrc.connect(analyser);
analyser.connect(ctx.destination);
// analyser.fftSize = 64;
// frequencyBinCount tells you how many values you'll receive from the analyser
const frequencyData = new Uint8Array(analyser.frequencyBinCount);

const canvas = document.getElementById('canvas'),
    cwidth = canvas.width,
    cheight = canvas.height - 2,
    meterWidth = 11, //width of the meters in the spectrum
    gap = 1, //gap between meters
    capHeight = 1,
    capStyle = themePallete.highlight,
    meterNum = 800 / (6 + 2), //count of the meters
    capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame

ctx = canvas.getContext('2d'),
gradient = ctx.createLinearGradient(0, 0, 0, 300);
gradient.addColorStop(1, themePallete.primary);
gradient.addColorStop(0.5, themePallete.primary);
gradient.addColorStop(0, themePallete.light);

const visualizer = () => {
    const array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    const step = Math.round(array.length / meterNum); //sample limited data from the total array
    ctx.clearRect(0, 0, cwidth, cheight);
    for (let i = 0; i < meterNum; i++) {
        const value = array[i * step];
        if (capYPositionArray.length < Math.round(meterNum)) {
            capYPositionArray.push(value);
        };
        ctx.fillStyle = capStyle;
        //draw the cap, with transition effect
        if (value < capYPositionArray[i]) {
            ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
        } else {
            ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
            capYPositionArray[i] = value;
        };
        ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
        ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
    }
    requestAnimationFrame(visualizer);
}

module.exports = {
  audioPlayer: audioPlayer,
  audioSource: audioSource,
  visualizer: visualizer
}
