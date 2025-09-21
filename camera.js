// Get elements
const cameraBtn = document.getElementById("cameraBtn");
const uploadBtn = document.getElementById("uploadBtn");
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const startBtn = document.getElementById("startBtn");
const preview = document.getElementById("preview");
const filterBtns = document.querySelectorAll(".filter-btn");
const timerSelect = document.getElementById("timerSelect");
const countdownDisplay = document.getElementById("countdownDisplay");

let stream = null;
let currentFilter = "none";
let poseCount = parseInt(localStorage.getItem("poseCount")) || 1; // from layout.html
let capturedPhotos = [];

// ======== CAMERA ========
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not access the camera.");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
}

// ======== UPLOAD ========
// ======== UPLOAD ========
function triggerUpload() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;

  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    preview.innerHTML = "";
    capturedPhotos = [];
    
    // Show loading message
    const loadingDiv = document.createElement("div");
    loadingDiv.textContent = "Processing images...";
    preview.appendChild(loadingDiv);
    
    try {
      // Process all files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataURL = await fileToDataURL(file);
        
        // Display in preview
        const img = document.createElement("img");
        img.src = dataURL;
        img.style.maxWidth = "200px";
        img.style.margin = "10px";
        
        // Remove loading message on first image
        if (i === 0) {
          preview.innerHTML = "";
        }
        
        preview.appendChild(img);
        capturedPhotos.push(dataURL);
      }
      
      // Save to localStorage
      localStorage.setItem("photos", JSON.stringify(capturedPhotos));
      console.log("✅ Upload successful! Photos saved:", capturedPhotos.length);
      
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert("Error processing images. Please try again.");
    }
  };

  input.click();
}

// Helper function to convert file to data URL
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// ======== BUTTON EVENTS ========
cameraBtn.addEventListener("click", () => {
  stopCamera(); // stop if already running
  startCamera();
});

uploadBtn.addEventListener("click", () => {
  stopCamera();
  triggerUpload();
});

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    video.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    video.style.filter = currentFilter;
  });
});

// ======== CAPTURE SEQUENCE ========
startBtn.addEventListener("click", () => {
  if (!stream) return;

  capturedPhotos = [];
  preview.innerHTML = "";

  let countdownTime = parseInt(timerSelect.value);
  let photosTaken = 0;

  function runCapture() {
    let currentTime = countdownTime;
    countdownDisplay.style.display = "block";
    countdownDisplay.textContent = currentTime;

    const countdownInterval = setInterval(() => {
      currentTime--;
      if (currentTime > 0) {
        countdownDisplay.textContent = currentTime;
      } else {
        clearInterval(countdownInterval);
        countdownDisplay.textContent = "📸";

        setTimeout(() => {
          countdownDisplay.style.display = "none";
          takePhoto();
          photosTaken++;

          if (photosTaken < poseCount) {
            setTimeout(runCapture, 1000);
          } else {
            // Save all captured photos
            localStorage.setItem("photos", JSON.stringify(capturedPhotos));
          }
        }, 800);
      }
    }, 1000);
  }

  runCapture();
});

// ======== TAKE PHOTO ========
function takePhoto() {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.filter = currentFilter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const img = document.createElement("img");
  img.src = canvas.toDataURL("image/png");
  img.style.maxWidth = "200px";
  img.style.margin = "10px";
  preview.appendChild(img);

  capturedPhotos.push(img.src);
  localStorage.setItem("photos", JSON.stringify(capturedPhotos));
}

// ======== NEXT BUTTON ========
document.querySelectorAll(".next-btn").forEach(item => {
  item.addEventListener("click", () => {
    console.log("Next button clicked");
    console.log("Captured photos:", capturedPhotos.length);
    console.log("Photos in localStorage:", JSON.parse(localStorage.getItem("photos") || "[]").length);
    
    if (capturedPhotos.length === 0) {
      alert("Please capture or upload at least one photo!");
      return;
    }
    
    // Make sure photos are saved
    localStorage.setItem("photos", JSON.stringify(capturedPhotos));
    console.log("Photos saved before redirect");
    
    window.location.href = "strip.html";
  });
});

// ======== START CAMERA IMMEDIATELY ========
startCamera();
