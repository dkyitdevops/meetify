// Virtual Background Module for Meetify
// Uses MediaPipe Selfie Segmentation for background blur and replacement

(function() {
    'use strict';

    // ==================== VIRTUAL BACKGROUND MANAGER ====================
    
    const VirtualBackground = {
        // State
        isInitialized: false,
        isProcessing: false,
        currentMode: 'none', // 'none', 'blur', 'image', 'color'
        backgroundImage: null,
        backgroundColor: '#1a1a2e',
        blurAmount: 8,
        
        // MediaPipe components
        selfieSegmentation: null,
        camera: null,
        
        // Canvas elements
        inputCanvas: null,
        outputCanvas: null,
        inputCtx: null,
        outputCtx: null,
        
        // Video elements
        originalVideo: null,
        processedStream: null,
        
        // Processing loop
        animationId: null,
        lastFrameTime: 0,
        targetFPS: 30,
        frameInterval: 1000 / 30,
        
        // Initialize the virtual background system
        async init() {
            if (this.isInitialized) return true;
            
            try {
                // Check if MediaPipe is available
                if (typeof window.SelfieSegmentation === 'undefined') {
                    console.error('MediaPipe SelfieSegmentation not loaded');
                    return false;
                }
                
                // Create canvas elements
                this.inputCanvas = document.createElement('canvas');
                this.outputCanvas = document.createElement('canvas');
                this.inputCtx = this.inputCanvas.getContext('2d');
                this.outputCtx = this.outputCanvas.getContext('2d');
                
                // Initialize MediaPipe Selfie Segmentation
                this.selfieSegmentation = new window.SelfieSegmentation({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
                    }
                });
                
                this.selfieSegmentation.setOptions({
                    modelSelection: 1, // 1 = landscape model (better quality)
                    selfieMode: true
                });
                
                this.selfieSegmentation.onResults(this.onResults.bind(this));
                
                this.isInitialized = true;
                console.log('Virtual Background initialized successfully');
                return true;
                
            } catch (error) {
                console.error('Failed to initialize Virtual Background:', error);
                return false;
            }
        },
        
        // Handle segmentation results
        onResults(results) {
            if (!this.outputCtx || !this.inputCanvas) return;
            
            const width = this.inputCanvas.width;
            const height = this.inputCanvas.height;
            
            // Clear output canvas
            this.outputCtx.clearRect(0, 0, width, height);
            
            // Draw based on current mode
            switch (this.currentMode) {
                case 'blur':
                    this.drawBlurredBackground(results, width, height);
                    break;
                case 'image':
                    this.drawImageBackground(results, width, height);
                    break;
                case 'color':
                    this.drawColorBackground(results, width, height);
                    break;
                default:
                    // No processing - draw original
                    this.outputCtx.drawImage(results.image, 0, 0, width, height);
            }
        },
        
        // Draw with blurred background
        drawBlurredBackground(results, width, height) {
            // Draw the original frame with blur
            this.outputCtx.filter = `blur(${this.blurAmount}px)`;
            this.outputCtx.drawImage(results.image, 0, 0, width, height);
            this.outputCtx.filter = 'none';
            
            // Create temporary canvas for the person (sharp)
            const personCanvas = document.createElement('canvas');
            personCanvas.width = width;
            personCanvas.height = height;
            const personCtx = personCanvas.getContext('2d');
            
            // Draw the person
            personCtx.drawImage(results.image, 0, 0, width, height);
            
            // Apply segmentation mask
            personCtx.globalCompositeOperation = 'destination-in';
            personCtx.drawImage(results.segmentationMask, 0, 0, width, height);
            
            // Draw the sharp person on top of blurred background
            this.outputCtx.globalCompositeOperation = 'source-over';
            this.outputCtx.drawImage(personCanvas, 0, 0, width, height);
        },
        
        // Draw with custom image background
        drawImageBackground(results, width, height) {
            if (!this.backgroundImage) {
                // Fallback to blur if no image
                this.drawBlurredBackground(results, width, height);
                return;
            }
            
            // Draw background image (cover mode)
            this.drawCoverImage(this.outputCtx, this.backgroundImage, width, height);
            
            // Create temporary canvas for the person
            const personCanvas = document.createElement('canvas');
            personCanvas.width = width;
            personCanvas.height = height;
            const personCtx = personCanvas.getContext('2d');
            
            // Draw the person
            personCtx.drawImage(results.image, 0, 0, width, height);
            
            // Apply segmentation mask
            personCtx.globalCompositeOperation = 'destination-in';
            personCtx.drawImage(results.segmentationMask, 0, 0, width, height);
            
            // Draw the person on top of background
            this.outputCtx.globalCompositeOperation = 'source-over';
            this.outputCtx.drawImage(personCanvas, 0, 0, width, height);
        },
        
        // Draw with solid color background
        drawColorBackground(results, width, height) {
            // Fill with background color
            this.outputCtx.fillStyle = this.backgroundColor;
            this.outputCtx.fillRect(0, 0, width, height);
            
            // Create temporary canvas for the person
            const personCanvas = document.createElement('canvas');
            personCanvas.width = width;
            personCanvas.height = height;
            const personCtx = personCanvas.getContext('2d');
            
            // Draw the person
            personCtx.drawImage(results.image, 0, 0, width, height);
            
            // Apply segmentation mask
            personCtx.globalCompositeOperation = 'destination-in';
            personCtx.drawImage(results.segmentationMask, 0, 0, width, height);
            
            // Draw the person on top of colored background
            this.outputCtx.globalCompositeOperation = 'source-over';
            this.outputCtx.drawImage(personCanvas, 0, 0, width, height);
        },
        
        // Helper: draw image with cover mode
        drawCoverImage(ctx, img, width, height) {
            const imgRatio = img.width / img.height;
            const canvasRatio = width / height;
            
            let drawWidth, drawHeight, offsetX, offsetY;
            
            if (imgRatio > canvasRatio) {
                drawHeight = height;
                drawWidth = img.width * (height / img.height);
                offsetX = (width - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = width;
                drawHeight = img.height * (width / img.width);
                offsetX = 0;
                offsetY = (height - drawHeight) / 2;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        },
        
        // Start processing video stream
        async start(videoElement, mode = 'blur', options = {}) {
            if (!videoElement) {
                console.error('No video element provided');
                return false;
            }
            
            // Initialize if needed
            if (!this.isInitialized) {
                const success = await this.init();
                if (!success) return false;
            }
            
            // Stop any existing processing
            this.stop();
            
            this.originalVideo = videoElement;
            this.currentMode = mode;
            
            // Apply options
            if (options.blurAmount) this.blurAmount = options.blurAmount;
            if (options.backgroundImage) this.backgroundImage = options.backgroundImage;
            if (options.backgroundColor) this.backgroundColor = options.backgroundColor;
            
            // Wait for video to be ready
            if (videoElement.readyState < 2) {
                await new Promise(resolve => {
                    videoElement.addEventListener('loadeddata', resolve, { once: true });
                });
            }
            
            // Set canvas dimensions
            const width = videoElement.videoWidth || 640;
            const height = videoElement.videoHeight || 480;
            this.inputCanvas.width = width;
            this.inputCanvas.height = height;
            this.outputCanvas.width = width;
            this.outputCanvas.height = height;
            
            // Create output stream from canvas
            this.processedStream = this.outputCanvas.captureStream(this.targetFPS);
            
            // Start processing loop
            this.isProcessing = true;
            this.processFrame();
            
            console.log(`Virtual Background started: ${mode}`);
            return true;
        },
        
        // Process a single frame
        async processFrame() {
            if (!this.isProcessing || !this.originalVideo) return;
            
            const now = performance.now();
            const elapsed = now - this.lastFrameTime;
            
            if (elapsed >= this.frameInterval) {
                this.lastFrameTime = now - (elapsed % this.frameInterval);
                
                // Draw video to input canvas
                this.inputCtx.drawImage(this.originalVideo, 0, 0, 
                    this.inputCanvas.width, this.inputCanvas.height);
                
                // Send to MediaPipe for segmentation
                await this.selfieSegmentation.send({ image: this.inputCanvas });
            }
            
            this.animationId = requestAnimationFrame(() => this.processFrame());
        },
        
        // Stop processing
        stop() {
            this.isProcessing = false;
            
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            if (this.processedStream) {
                this.processedStream.getTracks().forEach(track => track.stop());
                this.processedStream = null;
            }
            
            console.log('Virtual Background stopped');
        },
        
        // Change mode without stopping
        setMode(mode, options = {}) {
            this.currentMode = mode;
            
            if (options.blurAmount) this.blurAmount = options.blurAmount;
            if (options.backgroundImage) this.backgroundImage = options.backgroundImage;
            if (options.backgroundColor) this.backgroundColor = options.backgroundColor;
            
            console.log(`Virtual Background mode changed to: ${mode}`);
        },
        
        // Get the processed stream
        getProcessedStream() {
            return this.processedStream;
        },
        
        // Check if system is ready
        isReady() {
            return this.isInitialized && this.isProcessing;
        }
    };

    // ==================== INTEGRATION WITH MEETIFY ====================
    
    // Store reference globally
    window.MeetifyVirtualBackground = VirtualBackground;
    
    // UI Helper functions
    window.VirtualBackgroundUI = {
        // Apply virtual background to local video
        async apply(mode, options = {}) {
            const localVideo = document.getElementById('video-local');
            if (!localVideo) {
                console.error('Local video element not found');
                return false;
            }
            
            // Get the original stream from the video element
            const originalStream = localVideo.srcObject;
            if (!originalStream) {
                console.error('No stream found on local video');
                return false;
            }
            
            if (mode === 'none') {
                // Stop virtual background and restore original
                VirtualBackground.stop();
                localVideo.srcObject = originalStream;
                
                // Update peer connections with original stream
                updatePeerConnections(originalStream);
                return true;
            }
            
            // Start virtual background processing
            const success = await VirtualBackground.start(localVideo, mode, options);
            if (!success) return false;
            
            // Get processed stream
            const processedStream = VirtualBackground.getProcessedStream();
            if (!processedStream) return false;
            
            // Add audio track from original stream
            const audioTrack = originalStream.getAudioTracks()[0];
            if (audioTrack) {
                processedStream.addTrack(audioTrack);
            }
            
            // Update peer connections with processed stream
            updatePeerConnections(processedStream);
            
            return true;
        },
        
        // Load image from file
        async loadImage(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        
        // Get available preset images
        getPresetImages() {
            return {
                office: '/images/bg-office.jpg',
                nature: '/images/bg-nature.jpg',
                space: '/images/bg-space.jpg',
                books: '/images/bg-books.jpg'
            };
        }
    };
    
    // Helper to update all peer connections with new stream
    function updatePeerConnections(newStream) {
        if (typeof peerConnections === 'undefined') return;
        
        Object.keys(peerConnections).forEach(userId => {
            const pc = peerConnections[userId];
            if (!pc) return;
            
            const senders = pc.getSenders();
            const videoSender = senders.find(s => 
                s.track && s.track.kind === 'video'
            );
            
            if (videoSender) {
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (newVideoTrack) {
                    videoSender.replaceTrack(newVideoTrack);
                }
            }
        });
    }
    
    console.log('Virtual Background module loaded');
})();