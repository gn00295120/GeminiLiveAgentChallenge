class PlaybackWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    // Ring buffer for efficient O(1) read/write
    this.bufferSize = 24000 * 5; // 5 seconds at 24kHz
    this.ringBuffer = new Float32Array(this.bufferSize);
    this.readIndex = 0;
    this.writeIndex = 0;
    this.available = 0;

    this.port.onmessage = (event) => {
      // Receive Int16 PCM data
      const int16Data = new Int16Array(event.data);
      for (let i = 0; i < int16Data.length; i++) {
        if (this.available < this.bufferSize) {
          this.ringBuffer[this.writeIndex] = int16Data[i] / (int16Data[i] < 0 ? 0x8000 : 0x7fff);
          this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
          this.available++;
        }
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output.length > 0) {
      const channel = output[0];
      for (let i = 0; i < channel.length; i++) {
        if (this.available > 0) {
          channel[i] = this.ringBuffer[this.readIndex];
          this.readIndex = (this.readIndex + 1) % this.bufferSize;
          this.available--;
        } else {
          channel[i] = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('playback-worklet', PlaybackWorklet);
