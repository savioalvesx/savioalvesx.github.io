/**
 * PATree Camera Module
 * Live WebRTC camera capture, front/rear camera toggle, compression and fallback file upload
 */

class PATreeCamera {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.currentFacingMode = 'environment'; // 'environment' (back) or 'user' (front)
    this.isCameraRunning = false;
    this.onPhotoCapturedCallback = null;
  }

  /**
   * Start camera video stream in a specific video element
   */
  async startCamera(videoElement, facingMode = 'environment') {
    this.videoElement = videoElement;
    this.currentFacingMode = facingMode;

    this.stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported in this browser environment. Using file capture fallback.');
      return false;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: this.currentFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
        this.isCameraRunning = true;
        return true;
      }
    } catch (err) {
      console.warn('Could not start live video stream:', err.message);
      // Try with basic fallback constraints
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (this.videoElement) {
          this.videoElement.srcObject = this.stream;
          await this.videoElement.play();
          this.isCameraRunning = true;
          return true;
        }
      } catch (fallbackErr) {
        console.warn('Camera access denied or unavailable:', fallbackErr);
        return false;
      }
    }
    return false;
  }

  /**
   * Toggle between front and rear cameras
   */
  async toggleCamera() {
    this.currentFacingMode = (this.currentFacingMode === 'environment') ? 'user' : 'environment';
    if (this.videoElement) {
      return await this.startCamera(this.videoElement, this.currentFacingMode);
    }
    return false;
  }

  /**
   * Stop active camera stream
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isCameraRunning = false;
  }

  /**
   * Capture snapshot from current video stream and compress
   */
  takeSnapshot(maxWidth = 900, quality = 0.82) {
    if (!this.videoElement || !this.isCameraRunning) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const video = this.videoElement;
    
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Draw mirrored if front camera
    if (this.currentFacingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Compress to JPEG Data URL
    return canvas.toDataURL('image/jpeg', quality);
  }

  /**
   * Process and compress image file from input or drag-and-drop
   */
  processImageFile(file, maxWidth = 1000, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Arquivo inválido. Selecione uma imagem.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Erro ao decodificar a imagem.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  }
}

// Global Camera Instance
window.patreeCamera = new PATreeCamera();
