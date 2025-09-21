document.querySelectorAll(".faq-item").forEach(item => {
    item.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  });

  document.querySelectorAll(".start-btn").forEach(item => {
    item.addEventListener("click", ()=>{
        window.location.href = "layout.html";
    })
  })

  const layoutCards = document.querySelectorAll(".layout-card");
  const nextBtn = document.getElementById("nextBtn");
  let selectedLayout = null;


  

  // When a layout is clicked
  layoutCards.forEach(card => {
    card.addEventListener("click", () => {
      // Remove "selected" class from others
      layoutCards.forEach(c => c.classList.remove("selected"));

      // Mark current as selected
      card.classList.add("selected");

      // Store the chosen pose count
      selectedLayout = card.getAttribute("data-poses");
    });
  });

  // On NEXT click
  nextBtn.addEventListener("click", () => {
    if (!selectedLayout) {
      alert("Please select a layout before proceeding!");
      return;
    }

    // Save selection
    localStorage.setItem("poseCount", selectedLayout);

    // Clear old photos if any
    localStorage.removeItem("photos");

    // Redirect to camera page
    window.location.href = "camera.html";
  });


