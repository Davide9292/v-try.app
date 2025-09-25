// Simple icon creator using HTML5 Canvas
function createIcons() {
  const sizes = [16, 48, 128];
  
  sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    // Draw rounded rectangle background
    ctx.fillStyle = gradient;
    roundRect(ctx, 0, 0, size, size, size * 0.2);
    ctx.fill();
    
    // Draw white border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = size * 0.02;
    roundRect(ctx, size * 0.01, size * 0.01, size * 0.98, size * 0.98, size * 0.18);
    ctx.stroke();
    
    // Draw text (M for MirrorMe)
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', size / 2, size / 2);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `icon${size}.png`;
    link.href = canvas.toDataURL();
    link.textContent = `Download ${size}x${size} icon`;
    link.style.display = 'block';
    link.style.margin = '10px';
    link.style.padding = '10px';
    link.style.background = '#667eea';
    link.style.color = 'white';
    link.style.textDecoration = 'none';
    link.style.borderRadius = '5px';
    
    document.body.appendChild(link);
    
    // Show preview
    canvas.style.margin = '10px';
    canvas.style.border = '1px solid #ccc';
    document.body.appendChild(canvas);
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Create icons when page loads
document.addEventListener('DOMContentLoaded', createIcons);
