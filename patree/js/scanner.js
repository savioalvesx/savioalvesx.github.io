/**
 * PATree QR & Barcode Scanner Controller
 */

class PATreeScanner {
  constructor() {
    this.videoElement = null;
    this.isScanning = false;
    this.scanInterval = null;
    this.barcodeDetector = null;
    this.onDetectCallback = null;

    this.initBarcodeDetector();
  }

  async initBarcodeDetector() {
    if ('BarcodeDetector' in window) {
      try {
        const formats = await BarcodeDetector.getSupportedFormats();
        this.barcodeDetector = new BarcodeDetector({
          formats: formats.length > 0 ? formats : ['qr_code', 'code_128', 'ean_13', 'code_39']
        });
      } catch (e) {
        console.log('Native BarcodeDetector not active:', e);
      }
    }
  }

  async startScanning(videoElement, onDetect) {
    this.videoElement = videoElement;
    this.onDetectCallback = onDetect;
    this.isScanning = true;

    // Start Camera via patreeCamera
    const started = await window.patreeCamera.startCamera(videoElement, 'environment');
    if (!started) {
      console.warn('Could not launch live camera stream for scanning.');
    }

    this.scanLoop();
  }

  stopScanning() {
    this.isScanning = false;
    if (this.scanInterval) {
      cancelAnimationFrame(this.scanInterval);
      this.scanInterval = null;
    }
    window.patreeCamera.stopCamera();
  }

  async scanLoop() {
    if (!this.isScanning) return;

    if (this.videoElement && this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      if (this.barcodeDetector) {
        try {
          const barcodes = await this.barcodeDetector.detect(this.videoElement);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              this.handleDetection(rawValue);
              return;
            }
          }
        } catch (err) {
          // Frame skip
        }
      }
    }

    if (this.isScanning) {
      this.scanInterval = requestAnimationFrame(() => this.scanLoop());
    }
  }

  handleDetection(codeText) {
    this.playBeepSound();
    if (this.onDetectCallback) {
      this.onDetectCallback(codeText);
    }
  }

  playBeepSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch(e) {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Scan image from file upload
   */
  async scanImageFile(file) {
    if (!this.barcodeDetector) {
      throw new Error('Leitor de código nativo não disponível para este arquivo.');
    }
    const img = new Image();
    const dataUrl = await window.patreeCamera.processImageFile(file);
    img.src = dataUrl;
    await img.decode();
    const barcodes = await this.barcodeDetector.detect(img);
    if (barcodes && barcodes.length > 0) {
      return barcodes[0].rawValue;
    }
    throw new Error('Nenhum QR Code ou código de barras identificado na imagem.');
  }
}

// Global Scanner Instance
window.patreeScanner = new PATreeScanner();
