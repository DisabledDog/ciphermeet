import { Device } from 'mediasoup-client';
import type { Transport, RtpCapabilities } from 'mediasoup-client/types';
import { Socket } from 'socket.io-client';
import { getE2EEEnabled } from './e2ee';

// Check if browser supports Insertable Streams (needed for E2EE)
function supportsInsertableStreams(): boolean {
  return typeof RTCRtpSender !== 'undefined' &&
    'createEncodedStreams' in RTCRtpSender.prototype;
}

export async function loadDevice(
  routerRtpCapabilities: RtpCapabilities
): Promise<Device> {
  const device = new Device();
  await device.load({ routerRtpCapabilities });
  return device;
}

export function createSendTransport(
  device: Device,
  transportParams: any,
  socket: Socket
): Transport {
  const useInsertable = getE2EEEnabled() && supportsInsertableStreams();
  const transport = device.createSendTransport({
    ...transportParams,
    ...(useInsertable ? { additionalSettings: { encodedInsertableStreams: true } } : {}),
  });

  transport.on('connect', ({ dtlsParameters }, callback, errback) => {
    socket.emit(
      'connect-transport',
      { direction: 'send', dtlsParameters },
      (response: any) => {
        if (response.error) {
          errback(new Error(response.error));
        } else {
          callback();
        }
      }
    );
  });

  transport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
    socket.emit(
      'produce',
      { kind, rtpParameters, appData },
      (response: any) => {
        if (response.error) {
          errback(new Error(response.error));
        } else {
          callback({ id: response.id });
        }
      }
    );
  });

  return transport;
}

export function createRecvTransport(
  device: Device,
  transportParams: any,
  socket: Socket
): Transport {
  const useInsertable = getE2EEEnabled() && supportsInsertableStreams();
  const transport = device.createRecvTransport({
    ...transportParams,
    ...(useInsertable ? { additionalSettings: { encodedInsertableStreams: true } } : {}),
  });

  transport.on('connect', ({ dtlsParameters }, callback, errback) => {
    socket.emit(
      'connect-transport',
      { direction: 'recv', dtlsParameters },
      (response: any) => {
        if (response.error) {
          errback(new Error(response.error));
        } else {
          callback();
        }
      }
    );
  });

  return transport;
}
