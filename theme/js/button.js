
const button = document.querySelector("button");
const fyeahBuffer = {};
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let fyeas = {};

function isOgSupported()
{
  const myAudio = document.createElement("audio");
  return myAudio.canPlayType("audio/ogg");
}

fetch("data.json").then((data) => data.json()).then((data) =>
{
  fyeas = data;
  const format = isOgSupported() ? ".ogg" : ".mp3";
  for (const filename of Object.keys(fyeas))
  {
    const {animation} = fyeas[filename];
    fetchSound(filename + format).then((audio) =>
    {
      fyeas[filename].audio = audio;
    });
    if (animation)
    {
      animation.elem = fetchImg(animation);
    }
  }
});

function fetchImg(animation)
{
  const {url, width, height} = animation;
  const img = document.createElement("img");
  img.setAttribute("src", url);
  if (width)
    img.width = width;
  if (height)
    img.height = height;
  img.style.zIndex = 2;
  img.style.marginLeft = "auto";
  img.style.marginRight = "auto";
  img.style.left = 0;
  img.style.right = 0;
  img.style.position = "absolute";
  return img;
}

function fetchSound(fileName)
{
  const subFolder = isOgSupported() ? "" : "fallback/";
  return fetch(`sounds/${subFolder}${fileName}`).then((sound) =>
  {
    return sound.arrayBuffer();
  }).then((buffer) =>
  {
    return new Promise((resolve, reject) => {
      audioCtx.decodeAudioData(buffer, (buffer) =>
      {
        resolve(buffer);
      });
    });
  });
}

function createListener(eventName, classname, action)
{
  button.addEventListener(eventName, () =>
  {
    audioCtx.resume();
    if (action)
    {
      clicked();
      button.classList.add(classname);
    }
    else
    {
      button.classList.remove(classname);
    }
  });
}

function getKey(obj)
{
  const urlKey = new URLSearchParams(window.location.search).get("play");
  if (urlKey)
    return urlKey;
  const keys = Object.keys(obj)
  return keys[keys.length * Math.random() << 0];
};

function playSound({audio, animation, volume, offset = 0})
{
  const gainNode = audioCtx.createGain();
  const source = audioCtx.createBufferSource();

  source.buffer = audio;
  gainNode.gain.value = 1;
  if (volume)
    gainNode.gain.value = volume;
  source.connect(gainNode);
  
  gainNode.connect(audioCtx.destination);
  source.start(0, offset);

  if (animation && animation.elem)
    playAnimation(animation, source, offset);
}

function playAnimation(animation, source, offset)
{
  const {elem} = animation;
  const imagesElem = document.querySelector("#images");
  imagesElem.appendChild(elem);
  elem.style.transition = "opacity ease-out 1s";
  const duration = source.buffer.duration * 1000;
  window.setTimeout(() => 
  {
    elem.style.opacity = 0;
  }, (duration - duration / 3) - offset * 1000);
  source.onended = () =>
  {
    if (imagesElem.contains(elem))
    {
      imagesElem.removeChild(elem);
      elem.style.opacity = 1;
    }
  };
}

function clicked()
{
  const fileName = getKey(fyeas);
  const data = fyeas[fileName];
  if (data.audio)
  {
    playSound(data);
  }
  else
  {
    fetchSound(fileName).then((audio) =>
    {
      data.audio = audio;
      playSound(data);
    })
  }
}

if ("ontouchstart" in document.documentElement)
{
  createListener("touchstart", "mousedown", true);
  createListener("touchend", "mousedown");
}
else
{
  createListener("mousedown", "mousedown", true);
  createListener("mouseup", "mousedown");
}
