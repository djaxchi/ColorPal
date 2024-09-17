let dropArea = document.getElementById('drop-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight');
}

function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  let dt = e.dataTransfer;
  let files = dt.files;

  handleFiles(files);
}

function handleFiles(files) {
  ([...files]).forEach(uploadFile);
}

function hideModal() {
  const modal = document.getElementById('modal-overlay');
  modal.classList.add('hidden');
}

function hideModal() {
  const modal = document.getElementById('modal-overlay');
  
  // Add the hidden class to start the transition
  modal.classList.add('hidden');
  
  // Wait for the transition to finish, then fully hide it
  modal.addEventListener('transitionend', () => {
    modal.style.display = 'none'; // This ensures the modal doesn't take space in the layout
  }, { once: true });
}

function showModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  // Show modal overlay (remove hidden class and reset display)
  modalOverlay.classList.remove('hidden');
  modalOverlay.style.display = 'flex'; // Ensure it's visible
}

function uploadFile(file) {
  const loadingSpinner = document.getElementById('loading-spinner');
  const gallery = document.getElementById('gallery');
  const palette = document.getElementById('palette');
  
  showModal(); // Show the modal overlay

  // Clear previous gallery and palette content
  gallery.innerHTML = '';
  palette.innerHTML = '';

  // Show loading spinner
  loadingSpinner.style.display = 'block'; 

  // Prepare form data to send the image
  let url = '/upload';
  let formData = new FormData();
  formData.append('image', file);

  // Send the image to the backend
  fetch(url, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    displayImage(file, result.colors); // Display the uploaded image
    displayPalette(result.colors);     // Display the generated palette
  })
  .catch((error) => { 
      console.error('Error uploading Image:', error);
  });
}

function displayPalette(colorData) {
  const paletteDiv = document.getElementById('palette');
  paletteDiv.innerHTML = '';  // Clear previous palette

  const colors = Object.keys(colorData);

  // Create color swatches
  colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    const span = document.createElement('span');
    span.textContent = color;
    swatch.appendChild(span);

    // Add click-to-copy functionality
    swatch.addEventListener('click', () => copyToClipboard(color));
    paletteDiv.appendChild(swatch);
  });

  // Add the 6th swatch for displaying JSON
  const jsonSwatch = document.createElement('div');
  jsonSwatch.className = 'color-copie';
  jsonSwatch.style.backgroundColor = '#000';  // You can set any color for the button
  const jsonSpan = document.createElement('span');
  jsonSpan.textContent = 'Show JSON';
  jsonSwatch.appendChild(jsonSpan);

  // When clicked, show the JSON modal
  jsonSwatch.addEventListener('click', () => showJsonModal(colors));
  paletteDiv.appendChild(jsonSwatch);

  console.log('Palette displayed:', colors);
  
  // Hide the loading spinner after palette is shown
  const loadingSpinner = document.getElementById('loading-spinner');
  loadingSpinner.style.display = 'none'; 

  // Hide the modal overlay after displaying the palette
  hideModal();
}

function displayRandomPalette(colorData) {
  const paletteDiv = document.getElementById('random-palette');
  paletteDiv.innerHTML = '';  // Clear previous palette

  const colors = colorData;

  // Create color swatches
  colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    const span = document.createElement('span');
    span.textContent = color;
    swatch.appendChild(span);

    // Add click-to-copy functionality
    swatch.addEventListener('click', () => copyToClipboard(color));
    paletteDiv.appendChild(swatch);
  });

  // Add the 6th swatch for displaying JSON
  const jsonSwatch = document.createElement('div');
  jsonSwatch.className = 'color-copie';
  jsonSwatch.style.backgroundColor = '#000';  // You can set any color for the button
  const jsonSpan = document.createElement('span');
  jsonSpan.textContent = 'Show JSON';
  jsonSwatch.appendChild(jsonSpan);

  // When clicked, show the JSON modal
  jsonSwatch.addEventListener('click', () => showJsonModal(colors));
  paletteDiv.appendChild(jsonSwatch);

  console.log('Palette displayed:', colors);
}

// Function to show the JSON modal
function showJsonModal(colors) {
  const modal = document.getElementById('json-modal');
  const jsonOutput = document.getElementById('json-output');
  modal.style.display = 'flex';  // Show the modal
  jsonOutput.value = JSON.stringify(colors, null, 2);  // Format the colors in JSON

  // Disable scrolling on the background
  document.body.style.overflow = 'hidden';
}

// Close modal when clicking the close button
document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('json-modal').style.display = 'none';

  // Disable scrolling on the background
  document.body.style.overflow = '';
});

// Close modal if clicking outside the modal content
window.addEventListener('click', (event) => {
  const modal = document.getElementById('json-modal');
  if (event.target == modal) {
    modal.style.display = 'none';
    // Disable scrolling on the background
    document.body.style.overflow = '';
  }
});

// Function to copy JSON to clipboard
document.getElementById('copy-json').addEventListener('click', () => {
  const jsonOutput = document.getElementById('json-output');
  jsonOutput.select();
  document.execCommand('copy');
  alert('JSON copied to clipboard!');
});


function displayImage(file) {
  let img = document.createElement('img');
  img.id = 'uploaded-image';
  img.src = URL.createObjectURL(file);
  
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  img.style.objectFit = 'contain';


  img.onload = function () {
      let formData = new FormData();
      formData.append('image', file);
      fetch('/upload', {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(result => {
          console.log('Colors:', result.colors);

          createDraggableCircles(result.colors, img);
          displayPalette(result.colors);
      })
      .catch((error) => { 
          console.error('Error fetching palette:', error); 
      });
  };
  
  const container = document.createElement('div');
  container.id = 'image-container';

  container.appendChild(img);
  
  gallery.appendChild(container);

}


function createDraggableCircles(colorData, img) {
  const container = document.getElementById('image-container');
  const imgRect = img.getBoundingClientRect();

  const imgWidth = imgRect.width;
  const imgHeight = imgRect.height;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

  const existingCircles = document.querySelectorAll('.color-picker-circle');
  existingCircles.forEach(circle => circle.remove());

  Object.keys(colorData).forEach((color, index) => {
      const position = colorData[color];
      
      if (position) {
          const x = position.x;
          const y = position.y;
          
          const circle = document.createElement('div');
          circle.className = 'color-picker-circle';
          circle.style.left = `${(x / img.naturalWidth) * imgWidth}px`;
          circle.style.top = `${(y / img.naturalHeight) * imgHeight}px`;
          circle.style.backgroundColor = color;
          circle.dataset.index = index;

          makeDraggable(circle, ctx, img.naturalWidth, img.naturalHeight, imgRect);

          container.appendChild(circle);
      }
  });
}


function makeDraggable(circle, ctx, imgWidth, imgHeight, imgRect) {
  let isDragging = false;
  let startX, startY, initialX, initialY;

  circle.addEventListener('mousedown', (e) => {
      isDragging = true;
      initialX = parseInt(circle.style.left, 10);
      initialY = parseInt(circle.style.top, 10);
      startX = e.clientX;
      startY = e.clientY;
      circle.style.transition = 'none'; 
  });

  document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newX = initialX + dx;
      const newY = initialY + dy;

      if (newX >= 0 && newX <= imgRect.width&&
          newY >= 0 && newY <= imgRect.height) {
          circle.style.left = `${newX}px`;
          circle.style.top = `${newY}px`;

          updateColor(circle, ctx, imgWidth, imgHeight, newX, newY);
      }
  });

  document.addEventListener('mouseup', () => {
      isDragging = false;
      circle.style.transition = '';
  });

}


function updateColor(circle, ctx, imgWidth, imgHeight, x, y) {
  const imgRect = document.getElementById('uploaded-image').getBoundingClientRect();

  const imgX = Math.floor((x / imgRect.width) * imgWidth);
  const imgY = Math.floor((y / imgRect.height) * imgHeight);
  
  const color = getColorAtPosition(imgX, imgY, ctx);

  circle.style.backgroundColor = color;

  updatePalette(circle.dataset.index, color);
}

function getColorAtPosition(x, y, ctx) {
  const imageData = ctx.getImageData(x, y, 1, 1).data;

  const r = imageData[0];
  const g = imageData[1];
  const b = imageData[2];

  return rgbToHex(r, g, b);
}



function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Color code copied to clipboard!');
  }, () => {
    alert('Failed to copy color code');
  });
}

  


  function updatePalette(index, newColor) {
    const paletteDiv = document.getElementById('palette');
    const colorSwatches = paletteDiv.getElementsByClassName('color-swatch');
    if (colorSwatches[index]) {
        colorSwatches[index].style.backgroundColor = newColor;
        colorSwatches[index].querySelector('span').textContent = newColor;
    }
}


  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

document.getElementById('generate-palette-button').addEventListener('click', function() {
  const url = '/generate-random-palette'; // The Flask route to get the random palette

  // Fetch the random palette from the backend
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      if (result.colors) {
        displayRandomPalette(result.colors); // Use the existing displayPalette function to show the palette
      } else {
        console.error('Unexpected response format:', result);
      }
    })
    .catch(error => {
      console.error('Error generating random palette:', error);
    });
});