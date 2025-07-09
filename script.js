class PhotoBooth {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.capturedImage = document.getElementById('capturedImage');
        this.photoPreview = document.getElementById('photoPreview');
        this.galleryContainer = document.getElementById('galleryContainer');
        
        this.stream = null;
        this.currentFilter = 'none';
        this.photos = JSON.parse(localStorage.getItem('photoBoothGallery')) || [];
        this.selectedPhotos = [];
        this.currentLayout = 'grid2x2';
        this.collageCanvas = document.getElementById('collageCanvas');
        this.collageCtx = this.collageCanvas.getContext('2d');
        
        this.initializeEventListeners();
        this.loadGallery();
    }
    
    initializeEventListeners() {
        // Camera controls
        document.getElementById('startCamera').addEventListener('click', () => this.startCamera());
        document.getElementById('stopCamera').addEventListener('click', () => this.stopCamera());
        document.getElementById('capturePhoto').addEventListener('click', () => this.capturePhoto());
        document.getElementById('downloadPhoto').addEventListener('click', () => this.downloadPhoto());
        document.getElementById('clearPhoto').addEventListener('click', () => this.clearPhoto());
        document.getElementById('createCollage').addEventListener('click', () => this.openCollageModal());
        
        // Filter controls
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyFilter(e.target.dataset.filter));
        });
        
        // Collage controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('layout-btn')) {
                this.selectLayout(e.target.dataset.layout);
            }
        });
        
        document.getElementById('generateCollage').addEventListener('click', () => this.generateCollage());
        document.getElementById('downloadCollage').addEventListener('click', () => this.downloadCollage());
        document.getElementById('addToGallery').addEventListener('click', () => this.addCollageToGallery());
    }
    
    async startCamera() {
        try {
            const startBtn = document.getElementById('startCamera');
            startBtn.innerHTML = '<span class="loading"></span> Starting...';
            startBtn.disabled = true;
            
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            this.video.srcObject = this.stream;
            
            // Enable controls after camera starts
            this.video.addEventListener('loadedmetadata', () => {
                startBtn.innerHTML = '📹 Camera Active';
                startBtn.style.background = 'linear-gradient(45deg, #56ab2f, #a8e6cf)';
                startBtn.disabled = true;
                document.getElementById('stopCamera').disabled = false;
                document.getElementById('capturePhoto').disabled = false;
                
                // Set canvas size to match video
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            });
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showMessage('Error accessing camera. Please check permissions.', 'error');
            this.resetCameraControls();
        }
    }
    
    applyFilter(filter) {
        this.currentFilter = filter;
        
        // Remove all filter classes
        this.video.className = '';
        
        // Add selected filter class
        if (filter !== 'none') {
            this.video.classList.add(`filter-${filter}`);
        }
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    }
    
    capturePhoto() {
        if (!this.stream) {
            this.showMessage('Camera not started!', 'error');
            return;
        }
        
        if (!this.video.videoWidth || !this.video.videoHeight) {
            this.showMessage('Camera not ready yet. Please wait a moment!', 'error');
            return;
        }
        
        // Show countdown
        this.showCountdown(() => {
            // Set canvas size to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Apply filter to canvas context
            this.applyCanvasFilter();
            
            // Draw video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Convert to data URL
            const dataURL = this.canvas.toDataURL('image/jpeg', 0.9);
            
            // Display captured image
            this.capturedImage.src = dataURL;
            this.photoPreview.style.display = 'block';
            
            // Enable download and clear buttons
            document.getElementById('downloadPhoto').disabled = false;
            document.getElementById('clearPhoto').disabled = false;
            
            // Add to gallery
            this.addToGallery(dataURL);
            
            // Enable collage button if we have photos
            this.updateCollageButton();
            
            // Show success message
            this.showMessage('Photo captured successfully!', 'success');
            
            // Scroll to preview
            this.photoPreview.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    showCountdown(callback) {
        let count = 3;
        const countdownElement = document.createElement('div');
        countdownElement.className = 'countdown';
        document.querySelector('.camera-section').appendChild(countdownElement);
        
        const updateCountdown = () => {
            if (count > 0) {
                countdownElement.textContent = count;
                countdownElement.style.animation = 'countdown 1s ease-in-out';
                count--;
                setTimeout(updateCountdown, 1000);
            } else {
                countdownElement.textContent = 'Say Cheese! 📸';
                setTimeout(() => {
                    countdownElement.remove();
                    callback();
                }, 500);
            }
        };
        
        updateCountdown();
    }
    
    applyCanvasFilter() {
        this.ctx.filter = this.getCanvasFilter(this.currentFilter);
    }
    
    getCanvasFilter(filter) {
        switch (filter) {
            case 'grayscale':
                return 'grayscale(100%)';
            case 'sepia':
                return 'sepia(100%)';
            case 'invert':
                return 'invert(100%)';
            case 'blur':
                return 'blur(2px)';
            case 'vintage':
                return 'sepia(50%) contrast(1.2) brightness(1.1) saturate(1.2)';
            case 'bright':
                return 'brightness(1.5)';
            case 'dark':
                return 'brightness(0.6)';
            case 'contrast':
                return 'contrast(1.8)';
            case 'saturate':
                return 'saturate(2)';
            case 'hue-rotate':
                return 'hue-rotate(90deg)';
            case 'cyberpunk':
                return 'contrast(1.5) brightness(1.2) saturate(1.5) hue-rotate(270deg)';
            case 'cool':
                return 'brightness(1.1) contrast(1.2) saturate(1.3) hue-rotate(180deg)';
            case 'warm':
                return 'brightness(1.2) contrast(1.1) saturate(1.4) hue-rotate(30deg)';
            case 'warm-green':
                return 'brightness(1.15) contrast(1.2) saturate(1.3) hue-rotate(80deg) sepia(0.1)';
            case 'purple':
                return 'brightness(1.1) contrast(1.3) saturate(1.5) hue-rotate(270deg) sepia(0.2)';
            case 'matrix':
                return 'brightness(0.8) contrast(1.5) saturate(0.8) hue-rotate(120deg)';
            case 'nostalgia':
                return 'sepia(70%) contrast(1.1) brightness(1.2) saturate(0.8)';
            case 'dreamy':
                return 'brightness(1.3) contrast(0.8) saturate(1.2) blur(0.5px)';
            default:
                return 'none';
        }
    }
    
    downloadPhoto() {
        if (!this.capturedImage.src) {
            this.showMessage('No photo to download!', 'error');
            return;
        }
        
        try {
            // Create a more descriptive filename
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filterName = this.currentFilter !== 'none' ? `_${this.currentFilter}` : '';
            const filename = `photo-booth_${timestamp}${filterName}.jpg`;
            
            const link = document.createElement('a');
            link.download = filename;
            link.href = this.capturedImage.src;
            
            // Ensure the link is added to the DOM for better browser compatibility
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showMessage(`Photo downloaded as: ${filename}`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showMessage('Error downloading photo. Please try again.', 'error');
        }
    }
    
    clearPhoto() {
        this.capturedImage.src = '';
        this.photoPreview.style.display = 'none';
        document.getElementById('downloadPhoto').disabled = true;
        document.getElementById('clearPhoto').disabled = true;
        
        this.showMessage('Photo cleared!', 'success');
    }
    
    addToGallery(dataURL) {
        const photoData = {
            id: Date.now(),
            src: dataURL,
            timestamp: new Date().toLocaleString(),
            filter: this.currentFilter
        };
        
        this.photos.unshift(photoData);
        
        // Limit gallery to 20 photos
        if (this.photos.length > 20) {
            this.photos = this.photos.slice(0, 20);
        }
        
        // Save to localStorage
        localStorage.setItem('photoBoothGallery', JSON.stringify(this.photos));
        
        // Update gallery display
        this.loadGallery();
        
        // Update collage button
        this.updateCollageButton();
    }
    
    loadGallery() {
        this.galleryContainer.innerHTML = '';
        
        if (this.photos.length === 0) {
            this.galleryContainer.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No photos yet. Start capturing!</p>';
            return;
        }
        
        this.photos.forEach(photo => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            const filterText = photo.isCollage ? 
                `Collage (${photo.layout}, ${photo.photoCount} photos)` : 
                `Filter: ${photo.filter}`;
            
            galleryItem.innerHTML = `
                <img src="${photo.src}" alt="Photo taken on ${photo.timestamp}">
                <button class="delete-btn" onclick="photoBooth.deletePhoto(${photo.id})">×</button>
                <button class="download-btn" onclick="photoBooth.downloadGalleryPhoto(${photo.id})">⬇</button>
                <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
                    ${photo.timestamp}<br>
                    ${filterText}
                </div>
            `;
            
            // Add click to enlarge functionality
            galleryItem.querySelector('img').addEventListener('click', () => {
                this.enlargePhoto(photo.src);
            });
            
            this.galleryContainer.appendChild(galleryItem);
        });
        
        // Update collage button
        this.updateCollageButton();
    }
    
    deletePhoto(photoId) {
        if (confirm('Are you sure you want to delete this photo?')) {
            this.photos = this.photos.filter(photo => photo.id !== photoId);
            localStorage.setItem('photoBoothGallery', JSON.stringify(this.photos));
            this.loadGallery();
            this.updateCollageButton();
            this.showMessage('Photo deleted!', 'success');
        }
    }
    
    enlargePhoto(src) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            cursor: pointer;
        `;
        
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 10px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        `;
        
        modal.appendChild(img);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    showMessage(message, type) {
        // Remove existing messages
        document.querySelectorAll('.error-message, .success-message').forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.container').firstChild.nextSibling);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
    
    // Clean up resources
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
            
            // Reset camera controls
            this.resetCameraControls();
            
            // Clear any applied filters
            this.video.className = '';
            this.currentFilter = 'none';
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-filter="none"]').classList.add('active');
            
            this.showMessage('Camera stopped successfully!', 'success');
        }
    }
    
    resetCameraControls() {
        const startBtn = document.getElementById('startCamera');
        const stopBtn = document.getElementById('stopCamera');
        const captureBtn = document.getElementById('capturePhoto');
        
        startBtn.innerHTML = 'Start Camera';
        startBtn.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        startBtn.disabled = false;
        
        stopBtn.disabled = true;
        captureBtn.disabled = true;
    }
    
    // Collage functionality
    updateCollageButton() {
        const collageBtn = document.getElementById('createCollage');
        if (this.photos.length >= 2) {
            collageBtn.disabled = false;
        } else {
            collageBtn.disabled = true;
        }
    }
    
    openCollageModal() {
        if (this.photos.length < 2) {
            this.showMessage('You need at least 2 photos to create a collage!', 'error');
            return;
        }
        
        document.getElementById('collageModal').style.display = 'flex';
        this.setupCollageModal();
    }
    
    closeCollageModal() {
        document.getElementById('collageModal').style.display = 'none';
        this.selectedPhotos = [];
        this.resetCollageControls();
    }
    
    setupCollageModal() {
        this.populatePhotoSelection();
        this.selectLayout('grid2x2');
        this.resetCollageControls();
    }
    
    populatePhotoSelection() {
        const container = document.getElementById('collagePhotoSelection');
        container.innerHTML = '';
        
        this.photos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'collage-photo-item';
            photoItem.dataset.photoId = photo.id;
            photoItem.innerHTML = `
                <img src="${photo.src}" alt="Photo ${index + 1}">
                <div class="selection-number" style="display: none;"></div>
            `;
            
            photoItem.addEventListener('click', () => this.togglePhotoSelection(photo.id));
            container.appendChild(photoItem);
        });
    }
    
    togglePhotoSelection(photoId) {
        const photoItem = document.querySelector(`[data-photo-id="${photoId}"]`);
        const photo = this.photos.find(p => p.id === photoId);
        
        if (this.selectedPhotos.includes(photoId)) {
            // Remove from selection
            this.selectedPhotos = this.selectedPhotos.filter(id => id !== photoId);
            photoItem.classList.remove('selected');
            photoItem.querySelector('.selection-number').style.display = 'none';
        } else {
            // Add to selection (max 9 photos)
            if (this.selectedPhotos.length < 9) {
                this.selectedPhotos.push(photoId);
                photoItem.classList.add('selected');
                const numberDiv = photoItem.querySelector('.selection-number');
                numberDiv.textContent = this.selectedPhotos.length;
                numberDiv.style.display = 'flex';
            } else {
                this.showMessage('Maximum 9 photos can be selected for a collage!', 'error');
            }
        }
        
        this.updateSelectionNumbers();
    }
    
    updateSelectionNumbers() {
        this.selectedPhotos.forEach((photoId, index) => {
            const photoItem = document.querySelector(`[data-photo-id="${photoId}"]`);
            const numberDiv = photoItem.querySelector('.selection-number');
            numberDiv.textContent = index + 1;
        });
    }
    
    selectLayout(layout) {
        this.currentLayout = layout;
        
        // Update active layout button
        document.querySelectorAll('.layout-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-layout="${layout}"]`).classList.add('active');
        
        // Update canvas size based on layout
        this.updateCanvasSize();
    }
    
    updateCanvasSize() {
        const canvas = this.collageCanvas;
        switch (this.currentLayout) {
            case 'grid2x2':
                canvas.width = 800;
                canvas.height = 800;
                break;
            case 'grid3x3':
                canvas.width = 900;
                canvas.height = 900;
                break;
            case 'strip':
                canvas.width = 1200;
                canvas.height = 400;
                break;
            case 'polaroid':
                canvas.width = 800;
                canvas.height = 600;
                break;
        }
    }
    
    generateCollage() {
        if (this.selectedPhotos.length === 0) {
            this.showMessage('Please select at least one photo!', 'error');
            return;
        }
        
        const generateBtn = document.getElementById('generateCollage');
        generateBtn.innerHTML = '<span class="loading"></span> Generating...';
        generateBtn.disabled = true;
        
        // Clear canvas
        this.collageCtx.fillStyle = '#ffffff';
        this.collageCtx.fillRect(0, 0, this.collageCanvas.width, this.collageCanvas.height);
        
        // Load images and create collage
        const imagePromises = this.selectedPhotos.map(photoId => {
            const photo = this.photos.find(p => p.id === photoId);
            return this.loadImageFromDataURL(photo.src);
        });
        
        Promise.all(imagePromises).then(images => {
            this.drawCollage(images);
            generateBtn.innerHTML = 'Generate Collage';
            generateBtn.disabled = false;
            document.getElementById('downloadCollage').disabled = false;
            document.getElementById('addToGallery').disabled = false;
            this.showMessage('Collage generated successfully!', 'success');
        }).catch(error => {
            console.error('Error generating collage:', error);
            this.showMessage('Error generating collage!', 'error');
            generateBtn.innerHTML = 'Generate Collage';
            generateBtn.disabled = false;
        });
    }
    
    loadImageFromDataURL(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataURL;
        });
    }
    
    drawCollage(images) {
        const ctx = this.collageCtx;
        const canvas = this.collageCanvas;
        
        switch (this.currentLayout) {
            case 'grid2x2':
                this.drawGrid2x2(images, ctx, canvas);
                break;
            case 'grid3x3':
                this.drawGrid3x3(images, ctx, canvas);
                break;
            case 'strip':
                this.drawStrip(images, ctx, canvas);
                break;
            case 'polaroid':
                this.drawPolaroid(images, ctx, canvas);
                break;
        }
    }
    
    drawGrid2x2(images, ctx, canvas) {
        const cellWidth = canvas.width / 2;
        const cellHeight = canvas.height / 2;
        const padding = 10;
        
        images.slice(0, 4).forEach((img, index) => {
            const x = (index % 2) * cellWidth + padding;
            const y = Math.floor(index / 2) * cellHeight + padding;
            const w = cellWidth - padding * 2;
            const h = cellHeight - padding * 2;
            
            ctx.drawImage(img, x, y, w, h);
        });
    }
    
    drawGrid3x3(images, ctx, canvas) {
        const cellWidth = canvas.width / 3;
        const cellHeight = canvas.height / 3;
        const padding = 8;
        
        images.slice(0, 9).forEach((img, index) => {
            const x = (index % 3) * cellWidth + padding;
            const y = Math.floor(index / 3) * cellHeight + padding;
            const w = cellWidth - padding * 2;
            const h = cellHeight - padding * 2;
            
            ctx.drawImage(img, x, y, w, h);
        });
    }
    
    drawStrip(images, ctx, canvas) {
        const cellWidth = canvas.width / Math.min(images.length, 6);
        const cellHeight = canvas.height;
        const padding = 5;
        
        images.slice(0, 6).forEach((img, index) => {
            const x = index * cellWidth + padding;
            const y = padding;
            const w = cellWidth - padding * 2;
            const h = cellHeight - padding * 2;
            
            ctx.drawImage(img, x, y, w, h);
        });
    }
    
    drawPolaroid(images, ctx, canvas) {
        const polaroidWidth = 180;
        const polaroidHeight = 220;
        const photoWidth = 160;
        const photoHeight = 160;
        const cols = Math.ceil(Math.sqrt(images.length));
        const rows = Math.ceil(images.length / cols);
        
        images.forEach((img, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const x = col * (polaroidWidth + 20) + 20;
            const y = row * (polaroidHeight + 20) + 20;
            
            // Draw polaroid background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, polaroidWidth, polaroidHeight);
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, polaroidWidth, polaroidHeight);
            
            // Draw photo
            const photoX = x + (polaroidWidth - photoWidth) / 2;
            const photoY = y + 10;
            ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight);
            
            // Add date text
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(new Date().toLocaleDateString(), x + polaroidWidth / 2, y + polaroidHeight - 15);
        });
    }
    
    downloadCollage() {
        const link = document.createElement('a');
        link.download = `photo-collage-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
        link.href = this.collageCanvas.toDataURL('image/jpeg', 0.9);
        link.click();
        
        this.showMessage('Collage downloaded!', 'success');
    }
    
    addCollageToGallery() {
        const dataURL = this.collageCanvas.toDataURL('image/jpeg', 0.9);
        const collageData = {
            id: Date.now(),
            src: dataURL,
            timestamp: new Date().toLocaleString(),
            filter: 'collage',
            isCollage: true,
            layout: this.currentLayout,
            photoCount: this.selectedPhotos.length
        };
        
        this.photos.unshift(collageData);
        
        // Limit gallery to 20 photos
        if (this.photos.length > 20) {
            this.photos = this.photos.slice(0, 20);
        }
        
        localStorage.setItem('photoBoothGallery', JSON.stringify(this.photos));
        this.loadGallery();
        this.closeCollageModal();
        
        this.showMessage('Collage added to gallery!', 'success');
    }
    
    resetCollageControls() {
        document.getElementById('downloadCollage').disabled = true;
        document.getElementById('addToGallery').disabled = true;
        
        // Clear canvas
        this.collageCtx.fillStyle = '#f0f0f0';
        this.collageCtx.fillRect(0, 0, this.collageCanvas.width, this.collageCanvas.height);
        this.collageCtx.fillStyle = '#999';
        this.collageCtx.font = '24px Arial';
        this.collageCtx.textAlign = 'center';
        this.collageCtx.fillText('Select photos and click Generate', this.collageCanvas.width / 2, this.collageCanvas.height / 2);
    }
    
    downloadGalleryPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) {
            this.showMessage('Photo not found!', 'error');
            return;
        }
        
        try {
            // Create filename based on photo metadata
            const timestamp = new Date(photo.timestamp).toISOString().slice(0, 19).replace(/:/g, '-');
            const filterName = photo.filter && photo.filter !== 'none' ? `_${photo.filter}` : '';
            const photoType = photo.isCollage ? 'collage' : 'photo';
            const filename = `${photoType}-booth_${timestamp}${filterName}.jpg`;
            
            const link = document.createElement('a');
            link.download = filename;
            link.href = photo.src;
            
            // Ensure the link is added to the DOM for better browser compatibility
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showMessage(`${photoType} downloaded as: ${filename}`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showMessage('Error downloading photo. Please try again.', 'error');
        }
    }
}

// Initialize the photo booth when the page loads
let photoBooth;
document.addEventListener('DOMContentLoaded', () => {
    photoBooth = new PhotoBooth();
});

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (photoBooth) {
        photoBooth.stopCamera();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (!document.getElementById('capturePhoto').disabled) {
            photoBooth.capturePhoto();
        }
    }
    
    if (e.code === 'Escape') {
        if (photoBooth.photoPreview.style.display !== 'none') {
            photoBooth.clearPhoto();
        } else if (document.getElementById('collageModal').style.display === 'flex') {
            photoBooth.closeCollageModal();
        } else if (photoBooth.stream) {
            photoBooth.stopCamera();
        }
    }
    
    // Start camera with 'C' key
    if (e.code === 'KeyC' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (!document.getElementById('startCamera').disabled) {
            photoBooth.startCamera();
        }
    }
    
    // Stop camera with 'S' key
    if (e.code === 'KeyS' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (!document.getElementById('stopCamera').disabled) {
            photoBooth.stopCamera();
        }
    }
    
    // Download photo with 'D' key
    if (e.code === 'KeyD' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (!document.getElementById('downloadPhoto').disabled) {
            photoBooth.downloadPhoto();
        }
    }
});
