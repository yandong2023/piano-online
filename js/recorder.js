class PianoRecorder {
    constructor(piano) {
        console.log('PianoRecorder constructor called');
        this.piano = piano;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.audioChunks = [];
        this.recordingStartTime = null;
        this.recordingTimer = null;
        this.audioBlob = null;
        this.audioUrl = null;

        // 等待 DOM 加载完成后再初始化
        if (document.readyState === 'complete') {
            console.log('DOM already loaded, initializing recorder UI immediately');
            this.initializeUI();
        } else {
            console.log('Waiting for DOM to load before initializing recorder UI');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded, initializing recorder UI');
                this.initializeUI();
            });
        }
    }

    initializeUI() {
        console.log('Initializing recorder UI...');
        
        // 获取 UI 元素
        this.startButton = document.getElementById('start-recording');
        this.stopButton = document.getElementById('stop-recording');
        this.recordingStatus = document.getElementById('recording-status');
        this.recordingTime = document.getElementById('recording-time');
        this.sharePanel = document.getElementById('share-panel');
        this.recordingPreview = document.getElementById('recording-preview');
        this.shareJikeButton = document.getElementById('share-jike');
        this.shareTwitterButton = document.getElementById('share-twitter');
        this.downloadButton = document.getElementById('download-recording');

        // 检查是否所有元素都存在
        if (!this.startButton || !this.stopButton || !this.recordingStatus || 
            !this.recordingTime || !this.sharePanel || !this.recordingPreview || 
            !this.shareJikeButton || !this.shareTwitterButton || !this.downloadButton) {
            console.error('Some recorder UI elements are missing');
            return;
        }

        console.log('All recorder UI elements found, setting up event listeners');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
        this.shareJikeButton.addEventListener('click', () => this.shareToJike());
        this.shareTwitterButton.addEventListener('click', () => this.shareToTwitter());
        this.downloadButton.addEventListener('click', () => this.downloadRecording());
        console.log('Recorder event listeners set up');
    }

    async initAudioContext() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建音频处理节点
            const destination = this.audioContext.createMediaStreamDestination();
            
            // 连接钢琴音频到录音目标
            this.piano.audio.gainNode.connect(destination);
            
            // 创建 MediaRecorder
            this.mediaRecorder = new MediaRecorder(destination.stream);
            
            // 设置数据处理
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.finalizeRecording();
            };

            return true;
        } catch (error) {
            console.error('初始化录音失败:', error);
            alert('无法初始化录音功能。请确保您的浏览器支持音频录制。');
            return false;
        }
    }

    async startRecording() {
        try {
            if (!this.audioContext && !(await this.initAudioContext())) {
                return;
            }

            // 重置录音数据
            this.audioChunks = [];
            this.recordingStartTime = Date.now();
            
            // 开始录音
            this.mediaRecorder.start();
            this.startTimer();

            // 更新 UI
            this.startButton.classList.add('hidden');
            this.stopButton.classList.remove('hidden');
            this.recordingStatus.classList.remove('hidden');
            this.sharePanel.classList.add('hidden');

            console.log('开始录音');
        } catch (error) {
            console.error('开始录音失败:', error);
            alert('无法开始录音。请确保已授予录音权限。');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.stopTimer();

            // 更新 UI
            this.startButton.classList.remove('hidden');
            this.stopButton.classList.add('hidden');
            this.recordingStatus.classList.add('hidden');

            console.log('停止录音');
        }
    }

    startTimer() {
        this.stopTimer(); // 清除可能存在的旧计时器
        this.recordingTimer = setInterval(() => {
            const duration = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            this.recordingTime.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    finalizeRecording() {
        // 创建音频 Blob
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        
        // 创建音频 URL
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        
        // 设置预览
        this.recordingPreview.src = this.audioUrl;
        
        // 显示分享面板
        this.sharePanel.classList.remove('hidden');
    }

    async shareToJike() {
        try {
            // 创建一个 FormData 对象来上传音频文件
            const formData = new FormData();
            formData.append('audio', this.audioBlob, 'piano-recording.wav');
            formData.append('text', '我在 Piano Online 上录制了一段钢琴演奏！');

            // 这里需要替换成实际的即刻 API 端点
            const response = await fetch('YOUR_JIKE_API_ENDPOINT', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': 'Bearer YOUR_JIKE_TOKEN'
                }
            });

            if (response.ok) {
                alert('成功分享到即刻！');
            } else {
                throw new Error('分享失败');
            }
        } catch (error) {
            console.error('分享到即刻失败:', error);
            alert('分享到即刻失败，请稍后重试。');
        }
    }

    shareToTwitter() {
        // 创建分享链接
        const text = encodeURIComponent('我在 Piano Online 上录制了一段钢琴演奏！');
        const url = encodeURIComponent(window.location.href);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        
        // 打开 Twitter 分享窗口
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    }

    downloadRecording() {
        if (!this.audioBlob) {
            alert('没有可下载的录音');
            return;
        }

        // 创建下载链接
        const downloadUrl = window.URL.createObjectURL(this.audioBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = 'piano-recording.wav';
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        }, 100);
    }

    // 释放资源
    dispose() {
        this.stopRecording();
        this.stopTimer();
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

export { PianoRecorder };
