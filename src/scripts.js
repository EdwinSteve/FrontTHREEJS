// =====================
// === CONFIGURACIÓN ===

//const { div } = require("three/tsl");

// =====================
const textureURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg"; 
const displacementURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg"; 
const worldURL = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg";
const LROCLogo = "https://lunaserv.im-ldi.com/images/lroc_logo.png";

import missions from './assets/luna_lroc_nac(1).json';

//console.log(lrocData);

const scene = new THREE.Scene();
let rotatingMoon = true;
var hiddenCard = true;
let isLaunching = false, launchProgress = 0, floatTime = 0;

// =====================
// === MISIÓN EN LA LUNA ===
const missions2 = [
  { name: "Apolo 11", info: "Primer alunizaje tripulado (1969)", lat: 0.674, lon: 23.473 },
  { name: "Apolo 12", info: "Segunda misión tripulada (1969)", lat: -3.012, lon: -23.421 },
  { name: "Change 4", info: "Primera misión en el lado oculto (2019)", lat: -45.5, lon: 178.8 },
  { name: "Luna 2", info: "Primera nave en impactar la Luna (1959)", lat: 29.1, lon: 0.0 },
  { name: "LROC", info: "In the moon breaks. Concentric Garben", lat: -26.47, lon: 330.21}
];

// =====================
// === CÁMARA Y RENDERER ===
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// =====================
// === TEXTURAS ===
const loader = new THREE.TextureLoader();
const moonTexture = loader.load(textureURL);
const displacementMap = loader.load(displacementURL);
const worldTexture = loader.load(worldURL);

// =====================
// === LUNA ===
const moonMaterial = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  map: moonTexture,
  displacementMap: displacementMap,
  displacementScale: 0.06,
  bumpMap: displacementMap,
  bumpScale: 0.04,
  reflectivity: 0,
  shininess: 0
});
const moon = new THREE.Mesh(new THREE.SphereGeometry(2, 100, 100), moonMaterial);
moon.position.set(-2, 0, 0);
moon.rotation.x = Math.PI * 0.02;
moon.rotation.y = Math.PI * 1.54;
scene.add(moon);

// =====================
// === LUCES ===
const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(100, 10, 10);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 4);
scene.add(ambientLight);

// =====================
// === FONDO ===
const world = new THREE.Mesh(
  new THREE.SphereGeometry(1000, 60, 60),
  new THREE.MeshBasicMaterial({ map: worldTexture, side: THREE.BackSide })
);
scene.add(world);

// =====================
// === FUNCIONES UTILES ===
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function getVividColor() {
  const r = Math.floor(Math.random() * 156 + 100);
  const g = Math.floor(Math.random() * 156 + 100);
  const b = Math.floor(Math.random() * 156 + 100);
  return (r << 16) + (g << 8) + b;
}

// =====================
// === MARCADORES DE MISIONES ===
const missionGroup = new THREE.Group();
missions.forEach(m => {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 16, 16),
    new THREE.MeshBasicMaterial({ color: getVividColor() })
  );
  marker.position.copy(latLonToVector3(m.latitude, m.longitude, 2.03));
  marker.userData = m;
  missionGroup.add(marker);
});
moon.add(missionGroup);

// =====================
// === POPUP ===
const popup = document.createElement("div");
popup.className = "mission-popup";
popup.style.display = "none";
document.body.appendChild(popup);

let osdViewer = null;

async function getData(identifier) {
  const url = 'http://localhost:4000/api/v1/data?title=' + identifier;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);

    // Acceder al primer elemento de result.data (si existe)
    return result.data && result.data.length > 0 ? result.data[0] : null;
  } catch (error) {
    console.error('Error al obtener datos:', error.message);
  }
}


function showMissionPopup(mission, x, y) {
  popup.innerHTML = `<strong>${mission.identifier}</strong><br>${mission.dataset}`;
  popup.style.left = `${x + 10}px`;
  popup.style.top = `${y - 20}px`;
  popup.style.display = "block";

  h2.textContent = mission.identifier;
  getData(mission.identifier)
    .then(description => {
      console.log(description.description_image);
      h3.textContent = description.description_image;
      h3.fontSize = 1;
    })
    .catch(error => console.error(error));
  p.textContent = `Lat: ${mission.latitude}, Lon: ${mission.longitude}`;
  console.log(`Lat: ${mission.latitude}, Lon: ${mission.longitude}`);
  console.log(mission.tiffUrl);

  // Mostrar contenedor
  document.querySelector(".container-iframe").hidden = false;

  // Destruir visor previo si existía
  if (osdViewer) osdViewer.destroy();

  // Inicializar OpenSeadragon
  osdViewer = OpenSeadragon({
    element: "openseadragon1",
    prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",

    tileSources: {
      type: "zoomifytileservice",
      width: mission.width,
      height: mission.height,
      tilesUrl: mission.tiffUrl
    }, // puede ser .dzi, Deep Zoom o un tileSource compatible
  });
  console.log(" WIDHT " + mission.width + " HEIGHT " + parseInt(mission.height) + " URL " + mission.tiffUrl);
}

function hideMissionPopup() { popup.style.display = "none"; }

// =====================
// === RAYCASTER ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function updateMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener("click", event => {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(missionGroup.children);
  if (intersects.length > 0) {
    showMissionPopup(intersects[0].object.userData, event.clientX, event.clientY);

    rotatingMoon = false;
    document.querySelector(".container-iframe").hidden = false;
  } else {
    hideMissionPopup();
    rotatingMoon = true;
    document.querySelector(".container-iframe").hidden = true;
  }
});

window.addEventListener("mousemove", event => {
  updateMouse(event);
  raycaster.setFromCamera(mouse, camera);
  document.body.style.cursor = raycaster.intersectObjects(missionGroup.children).length > 0 ? "pointer" : "default";
});

// =====================
// === ROTACION MANUAL ===
let isMouseDown = false, prevMouseX = 0, prevMouseY = 0;
document.addEventListener("mousedown", e => { isMouseDown = true; prevMouseX = e.clientX; prevMouseY = e.clientY; });
document.addEventListener("mouseup", () => isMouseDown = false);
document.addEventListener("mousemove", e => {
  if (!isMouseDown) return;
  const deltaX = e.clientX - prevMouseX;
  const deltaY = e.clientY - prevMouseY;
  moon.rotation.y += deltaX * 0.005;
  moon.rotation.x += deltaY * 0.005;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Recalcular posición del cohete respecto a la Luna
  rocketGroup.position.x = moon.position.x * Math.cos(orbitAngle);
  rocketGroup.position.z = moon.position.z * Math.sin(orbitAngle);
  rocketGroup.position.y = moon.position.y + 0.3 * Math.sin(orbitAngle * 2);

  // Mantener orientación hacia la Luna
  rocketGroup.lookAt(moon.position);
});


// =====================
// === COHETE ===
const rocketGroup = new THREE.Group();

const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 32),
  new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 })
);
rocketGroup.add(rocketBody);

const rocketNose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 32),
  new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.5, roughness: 0.4 })
);
rocketNose.position.y = 0.8;
rocketGroup.add(rocketNose);

// Ventana
const rocketWindow = new THREE.Mesh(new THREE.CircleGeometry(0.06, 32),
  new THREE.MeshStandardMaterial({ color: 0x0033ff, metalness: 0.2, roughness: 0.1 })
);
rocketWindow.position.set(0, 0.2, 0.21);
rocketGroup.add(rocketWindow);

// Anillos
for (let i = -0.5; i <= 0.5; i += 0.5) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.01, 16, 100),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = i;
  rocketGroup.add(ring);
}

// Aletas
for (let i = 0; i < 4; i++) {
  const angle = (i / 4) * Math.PI * 2;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.5, roughness: 0.3 }));
  fin.position.set(Math.cos(angle) * 0.15, -0.6, Math.sin(angle) * 0.15);
  fin.rotation.y = -angle;
  rocketGroup.add(fin);
}

// Llama
const rocketFlame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 32),
  new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 }));
rocketFlame.position.y = -0.8; rocketFlame.rotation.x = Math.PI;
rocketGroup.add(rocketFlame);

const rocketFlame2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 32),
  new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.7 }));
rocketFlame2.position.y = -0.85; rocketFlame2.rotation.x = Math.PI;
rocketGroup.add(rocketFlame2);

rocketGroup.position.set(1.5, -0.5, 0);
scene.add(rocketGroup);

// =====================
// === ANIMACIÓN ===
function animateRocketFlame() {
  rocketFlame.scale.y = 1 + Math.sin(Date.now() * 0.05) * 0.5;
  rocketFlame2.scale.y = 0.8 + Math.sin(Date.now() * 0.07) * 0.4;
}

function animate() {
  requestAnimationFrame(animate);

  // Rotación de la luna
  if (rotatingMoon) {
    moon.rotation.y += 0.0009;
    world.rotation.y += 0.00005;
  }

  // Flotación del cohete
  if (!isLaunching) {
    floatTime += 0.02;
    rocketGroup.position.y = 0.3 * Math.sin(floatTime);
    rocketGroup.rotation.y += 0.01;
  } else {
    launchProgress += 0.01;
    rocketGroup.position.y += 0.1;
    rocketGroup.position.z -= 0.1;
    rocketGroup.rotation.x -= 0.02;
    animateRocketFlame();

    if (launchProgress > 1) {
      isLaunching = false;
      setTimeout(window.location.href = "http://localhost:5174/", 100);
    }
  }

  renderer.render(scene, camera);
}
animate();

// =====================
// === BOTÓN ===
const button = document.createElement("button");
button.innerText = "🚀 NASA Missions";
button.className = "floating-button";
document.body.appendChild(button);

// =====================
// === CREAR DIV PRINCIPAL ===
// Supongamos que tienes estos datos
//const lroc = { title: "Título LROC", url_badge: badgeImg};

//const data = { identifier: "Misión 1", latitude: 12.34, longitude: 56.78 };
const iframeSrc = "https://example.com/map";

// Crear el div principal
const container = document.createElement("div");
container.className = "container-iframe";


// Crear el header interno
const headerDiv = document.createElement("div");
headerDiv.className = "container-iframe--header";

// Título
const h2 = document.createElement("h2");
h2.style.color = "white";

// Imagen del badge
const img = document.createElement("img");
img.width = 120;
img.height = 120;
img.src = LROCLogo;

// Añadir título e imagen al header
headerDiv.appendChild(h2);
headerDiv.appendChild(img);

// Identificador
const h3 = document.createElement("h3");
h3.style.color = "white";
h3.style.fontSize = 4;

// Iframe
const iframe = document.createElement("div");
iframe.id = "openseadragon1";
//iframe.style.width = "100%";
//iframe.style.height = "400px";
//iframe.src = iframeSrc;
iframe.style.border = "none";
iframe.title = "Map";

// Coordenadas
const p = document.createElement("p");


// Armar todo dentro del contenedor principal
container.appendChild(headerDiv);
container.appendChild(h3);
container.appendChild(iframe);
container.appendChild(p);

// Añadir al body o a cualquier div contenedor existente
document.body.appendChild(container);
document.querySelector(".container-iframe").hidden = true;

button.addEventListener("click", () => {
  if (isLaunching) return;
  isLaunching = true;
  launchProgress = 0;
  button.disabled = true;
  button.innerText = "🌌 Taking off...";
});

// =====================
// === ESTILOS ===
const style = document.createElement("style");


style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&display=swap');
.floating-button {
  position: fixed; top: 90%; right: 180px; transform: translateY(-50%);
  background: transparent; color: #00eaff; border: 2px solid rgba(0,234,255,0.4);
  border-radius: 8px; padding: 12px 28px; font-family: 'Nasa', sans-serif;
  font-weight: 600; font-size: 17px; letter-spacing: 2px; cursor: pointer;
  text-transform: uppercase; box-shadow: 0 0 12px rgba(0,234,255,0.4);
  transition: all 0.3s ease; z-index: 10; backdrop-filter: blur(6px);
  animation: pulseGlow 2.5s infinite ease-in-out;
}
.floating-button:hover {
  color: #fff; background: rgba(0,234,255,0.1); border-color: #00eaff;
  box-shadow: 0 0 20px #00eaff, 0 0 40px #008cff; transform: translateY(-50%) scale(1.08);
}
.floating-button:active {
  transform: translateY(-50%) scale(0.96); opacity: 0.9;
}
@keyframes pulseGlow {
  0% { box-shadow: 0 0 10px rgba(0,234,255,0.5); }
  50% { box-shadow: 0 0 25px rgba(0,234,255,0.9); }
  100% { box-shadow: 0 0 10px rgba(0,234,255,0.5); }
}
.mission-popup {
  position: absolute; background: rgba(0,0,0,0.85); color: #00eaff;
  padding: 10px 15px; border: 1px solid #00eaff; border-radius: 10px;
  font-family: 'Nasa', sans-serif; font-size: 13px;
  pointer-events: none; z-index: 20; text-shadow: 0 0 8px #00eaff;
}
  
#openseadragon1 {
        position: fixed;
        top: 0;
        right: 0;
        border: 2px solid #fff;
        width: 20vw;
        height: 45vh;
        box-shadow: 0 0 20px rgba(255,255,255,0.2);
        }
.container-iframe{
position: fixed;
        top: 0;
        right: 0;}`;
document.head.appendChild(style);