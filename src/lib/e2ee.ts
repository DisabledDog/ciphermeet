/**
 * End-to-End Encryption for CipherMeet
 *
 * Uses WebRTC Insertable Streams to encrypt/decrypt media frames
 * with AES-128-GCM before they leave the sender's device.
 * The server only sees encrypted data.
 *
 * Key is derived from a secret shared via URL hash fragment (never sent to server).
 */

let encryptionKey: CryptoKey | null = null;
let isE2EEEnabled = false;

// Generate a random room secret (called when host creates a room)
export function generateRoomSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Extract secret from URL hash fragment
export function getSecretFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  // Format: #e2e=<secret>
  const match = hash.match(/#e2e=([a-f0-9]+)/);
  return match ? match[1] : null;
}

// Initialize E2EE with a shared secret
export async function initE2EE(secret: string, roomId: string): Promise<boolean> {
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(`ciphermeet-e2ee-${roomId}`),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt', 'decrypt']
    );

    isE2EEEnabled = true;
    console.log('[E2EE] Encryption initialized');
    return true;
  } catch (err) {
    console.error('[E2EE] Failed to initialize:', err);
    isE2EEEnabled = false;
    return false;
  }
}

export function getE2EEEnabled(): boolean {
  return isE2EEEnabled;
}

export function cleanupE2EE(): void {
  encryptionKey = null;
  isE2EEEnabled = false;
}

// How many bytes to leave unencrypted (codec headers the SFU needs to route)
function getUnencryptedBytes(frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame): number {
  // @ts-ignore - type field exists on encoded frames
  if (frame.type === 'key') return 10;     // VP8 key frame header
  // @ts-ignore
  if (frame.type === 'delta') return 3;    // VP8 delta frame header
  return 1;                                 // Opus audio header
}

// Encrypt a media frame
async function encryptFrame(
  frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame,
  controller: TransformStreamDefaultController
) {
  if (!encryptionKey) {
    controller.enqueue(frame);
    return;
  }

  const data = new Uint8Array(frame.data);
  const skip = getUnencryptedBytes(frame);

  if (data.byteLength <= skip) {
    controller.enqueue(frame);
    return;
  }

  try {
    // Random IV for each frame
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const header = data.subarray(0, skip);
    const payload = data.subarray(skip);

    const encrypted = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: header },
        encryptionKey,
        payload
      )
    );

    // Output: [header][encrypted+authTag][iv (12 bytes)]
    const output = new Uint8Array(skip + encrypted.byteLength + 12);
    output.set(header);
    output.set(encrypted, skip);
    output.set(iv, skip + encrypted.byteLength);

    frame.data = output.buffer;
  } catch {
    // Encryption failed — drop frame rather than send unencrypted
    return;
  }

  controller.enqueue(frame);
}

// Decrypt a media frame
async function decryptFrame(
  frame: RTCEncodedVideoFrame | RTCEncodedAudioFrame,
  controller: TransformStreamDefaultController
) {
  if (!encryptionKey) {
    controller.enqueue(frame);
    return;
  }

  const data = new Uint8Array(frame.data);
  const skip = getUnencryptedBytes(frame);

  if (data.byteLength <= skip + 12) {
    controller.enqueue(frame);
    return;
  }

  try {
    // Extract IV from last 12 bytes
    const iv = data.subarray(data.byteLength - 12);
    const header = data.subarray(0, skip);
    const encrypted = data.subarray(skip, data.byteLength - 12);

    const decrypted = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData: header },
        encryptionKey,
        encrypted
      )
    );

    // Output: [header][decrypted payload]
    const output = new Uint8Array(skip + decrypted.byteLength);
    output.set(header);
    output.set(decrypted, skip);

    frame.data = output.buffer;
  } catch {
    // Decryption failed — likely wrong key or corrupted, drop frame
    return;
  }

  controller.enqueue(frame);
}

// Apply encryption transform to an RTCRtpSender
export function setupSenderEncryption(sender: RTCRtpSender): boolean {
  if (!isE2EEEnabled || !encryptionKey) return false;

  try {
    // @ts-ignore - createEncodedStreams not in TS types yet
    if (typeof sender.createEncodedStreams !== 'function') {
      console.warn('[E2EE] createEncodedStreams not supported');
      return false;
    }

    // @ts-ignore
    const { readable, writable } = sender.createEncodedStreams();
    const transform = new TransformStream({ transform: encryptFrame });
    readable.pipeThrough(transform).pipeTo(writable);
    return true;
  } catch (err) {
    console.error('[E2EE] Failed to setup sender encryption:', err);
    return false;
  }
}

// Apply decryption transform to an RTCRtpReceiver
export function setupReceiverDecryption(receiver: RTCRtpReceiver): boolean {
  if (!isE2EEEnabled || !encryptionKey) return false;

  try {
    // @ts-ignore
    if (typeof receiver.createEncodedStreams !== 'function') {
      console.warn('[E2EE] createEncodedStreams not supported');
      return false;
    }

    // @ts-ignore
    const { readable, writable } = receiver.createEncodedStreams();
    const transform = new TransformStream({ transform: decryptFrame });
    readable.pipeThrough(transform).pipeTo(writable);
    return true;
  } catch (err) {
    console.error('[E2EE] Failed to setup receiver decryption:', err);
    return false;
  }
}
