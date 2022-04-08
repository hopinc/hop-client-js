import * as mediasoup from 'mediasoup-client';
import {EventEmitter} from 'events';
import TypedEmitter from 'typed-emitter';

export type RTCManagerEvents = {
	CONNECTION_UPDATE: (status: {
		status: 'connecting' | 'connected' | 'disconnected';
	}) => void;
};

export class RTCManager extends (EventEmitter as new () => TypedEmitter<RTCManagerEvents>) {
	private readonly device: mediasoup.Device;
	private recvTransport: mediasoup.types.Transport | null;

	constructor() {
		// Issue with rule — not able to detect our type cast
		// eslint-disable-next-line constructor-super
		super();
		this.device = new mediasoup.Device();
		this.recvTransport = null;
	}

	async createRecvTransport(data: mediasoup.types.TransportOptions) {
		this.recvTransport = this.device.createRecvTransport(data);

		this.recvTransport.on('connect', (opts, callback: () => void) => {
			callback();
		});

		this.recvTransport.on('connectionstatechange', async state => {
			switch (state) {
				// We will throw events for each state change
				case 'connecting': {
					this.emit('CONNECTION_UPDATE', {status: 'connecting'});
					break;
				}

				case 'connected': {
					this.emit('CONNECTION_UPDATE', {status: 'connected'});
					break;
				}

				case 'failed':
				case 'closed':
				case 'disconnected': {
					this.emit('CONNECTION_UPDATE', {status: 'disconnected'});
					await this.destroy();
					break;
				}

				default: {
					break;
				}
			}
		});
	}

	async destroy() {
		if (this.recvTransport) {
			this.recvTransport.close();
		}

		this.recvTransport = null;
	}
}
