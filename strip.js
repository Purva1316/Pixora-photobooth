const canvas = document.getElementById("stripCanvas");
const ctx = canvas.getContext("2d");
const buttons = document.querySelectorAll('.controls button');
let frameColor = "white";
let addedStickers = []; // {src, photoIndex, width, height}
let selectedSticker = null;
let offsetX = 0, offsetY = 0;


// ✅ Photos array from localStorage with debug
let photos = JSON.parse(localStorage.getItem("photos")) || [];

// ✅ Pose count fix 
let poseCount = parseInt(localStorage.getItem("poseCount")) || photos.length || 4;


// ✅ Layout
const layout = {
  photos: poseCount,
  spacing: 20,
  photoWidth: 170,
  photoHeight: 130
};

// ✅ Adjust canvas height dynamically
canvas.height = layout.photos * (layout.photoHeight + layout.spacing) + 40;



function drawStrip(callback) {
  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let startY = 20;
  let loaded = 0;
  let total = layout.photos;

  if (total === 0) {
    drawStickers();
    if (callback) callback();
    return;
  }

  for (let i = 0; i < layout.photos; i++) {
    let x = (canvas.width - layout.photoWidth) / 2;
    let y = startY;
    let src = photos[i] || "https://via.placeholder.com/170x130?text=Photo";

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      ctx.drawImage(img, x, y, layout.photoWidth, layout.photoHeight);
      loaded++;
      if (loaded === total) {
        drawStickers();
        if (callback) callback();
      }
    };

    img.onerror = () => {
      loaded++;
      if (loaded === total) {
        drawStickers();
        if (callback) callback();
      }
    };

    startY += layout.photoHeight + layout.spacing;
  }
}


function drawStickers() {
  addedStickers.forEach(s => {
    ctx.font = `${s.size}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(s.emoji, s.x, s.y);
  });

  // ✅ Add "Pixora" text watermark at bottom
  ctx.font = "bold 13px Poppins, sans-serif";
  ctx.fillStyle = "#ff6f91";   // pretty pink color
  ctx.textAlign = "center";
  ctx.fillText("Pixora", canvas.width / 2, canvas.height - 12);
}

// ✅ Download
document.getElementById("downloadStrip").addEventListener("click", () => {
  drawStrip(() => {
    const link = document.createElement("a");
    link.download = "photo-strip.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});


// ✅ Initial draw
drawStrip();

// ✅ Frame color change
document.querySelectorAll(".controls button").forEach(btn => {
  btn.addEventListener("click", () => {
    frameColor = btn.getAttribute("data-color");
    drawStrip();
  });
});

// Custom color picker
const colorPicker = document.getElementById("customColor");
colorPicker.addEventListener("input", () => {
  frameColor = colorPicker.value; // get selected color
  drawStrip(); // redraw strip with new color
 // remove highlight from buttons when custom color is chosen
});

// Preload images once
let loadedPhotos = [];

function preloadPhotos() {
  loadedPhotos = photos.map((src) => {
    const img = new Image();
    img.src = src;
    return img;
  });
}
preloadPhotos();
// Sticker adding
document.querySelectorAll(".sticker-option").forEach(sticker => {
  sticker.addEventListener("click", () => {
    const stickerEmoji = sticker.getAttribute("data-sticker");

    // Save sticker to array (instead of DOM)
    addedStickers.push({
      emoji: stickerEmoji,
      x: 50,  // default pos
      y: 50,
      size: 32
    });

    drawStrip(); // redraw strip with new sticker
  });
});


// Mouse down → check if clicked on a sticker
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // find topmost sticker under cursor
  for (let i = addedStickers.length - 1; i >= 0; i--) {
    const s = addedStickers[i];
    ctx.font = `${s.size}px Arial`;
    const width = ctx.measureText(s.emoji).width;
    const height = s.size; // rough estimate

    if (
      mouseX >= s.x &&
      mouseX <= s.x + width &&
      mouseY >= s.y &&
      mouseY <= s.y + height
    ) {
      isDragging = true;
      dragIndex = i;
      offsetX = mouseX - s.x;
      offsetY = mouseY - s.y;
      break;
    }
  }
});

// Mouse move → drag sticker
canvas.addEventListener("mousemove", (e) => {
  if (!isDragging || dragIndex === null) return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // update position
  addedStickers[dragIndex].x = mouseX - offsetX;
  addedStickers[dragIndex].y = mouseY - offsetY;

  drawStrip(); // redraw canvas with updated position
});

// Mouse up → stop dragging
canvas.addEventListener("mouseup", () => {
  isDragging = false;
  dragIndex = null;
});

// Double click → remove sticker
canvas.addEventListener("dblclick", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = 0; i < addedStickers.length; i++) {
    const s = addedStickers[i];
    ctx.font = `${s.size}px Arial`;
    const width = ctx.measureText(s.emoji).width;
    const height = s.size;

    if (
      mouseX >= s.x &&
      mouseX <= s.x + width &&
      mouseY >= s.y &&
      mouseY <= s.y + height
    ) {
      addedStickers.splice(i, 1); // remove
      drawStrip();
      break;
    }
  }
});

// Share Strip Function
document.getElementById("shareStrip").addEventListener("click", () => {
  // Pehle canvas redraw karao (agar aap drawStrip function use kar rahe ho)
  drawStrip(() => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("Could not generate image.");
        return;
      }

      const file = new File([blob], "photo-strip.png", { type: "image/png" });

      // ✅ Mobile par Share API use hoga (WhatsApp, Insta, Telegram, etc. dikhayega)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "My Photo Strip",
            text: "Check out my photo strip 🎉",
          });
        } catch (err) {
          console.log("Share cancelled:", err);
        }
      } else {
        // ❌ Agar share support nahi hai → fallback download
        const link = document.createElement("a");
        link.download = "photo-strip.png";
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }, "image/png");
  });
});

document.getElementById("resetStrip").addEventListener("click", () => {
  // Reset frame color
  frameColor = "white";

  // Clear stickers
  addedStickers = [];

  // Redraw fresh strip
  drawStrip();
});


