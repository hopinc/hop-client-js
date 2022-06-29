import type {API, Id} from '@onehop/js';
import {createContext, Dispatch, SetStateAction, useContext} from 'react';
import {LeapEdgeClient} from '@onehop/leap-edge-js';
import {useMap} from './maps';
import {ObservableMap, useObservableMap} from '../util/maps';
import {resolveSetStateAction} from '../util/state';

// TODO: Export these from leap-edge-js
type LeapEdgeAuthenticationParameters = ConstructorParameters<
	typeof LeapEdgeClient
>[0];

export class ClientContext {
	private static leap: LeapEdgeClient | null = null;

	private readonly stateCache = new ObservableMap<
		Id<'channel'>,
		API.Channels.State
	>();

	useChannelState(channel: Id<'channel'>) {
		return useObservableMap(this.stateCache).get(channel);
	}

	getStateCache() {
		return this.stateCache;
	}

	getLeap(auth?: LeapEdgeAuthenticationParameters) {
		if (ClientContext.leap) {
			return ClientContext.leap;
		}

		if (!auth) {
			throw new Error(
				'Cannot create a new Leap instance as no authentication params were provided',
			);
		}

		ClientContext.leap = new LeapEdgeClient(auth);
		ClientContext.leap.connect();

		return ClientContext.leap;
	}
}

export const clientContext = createContext(new ClientContext());

export function useClientContext() {
	return useContext(clientContext);
}

export function useReadChannelState<T extends API.Channels.State>(
	channel: Id<'channel'>,
): T {
	const client = useClientContext();
	const state = client.useChannelState(channel);

	return state as T;
}

export function useSetChannelState<T extends API.Channels.State>(
	channel: Id<'channel'>,
): Dispatch<SetStateAction<T>> {
	const client = useClientContext();
	const state = useObservableMap(client.getStateCache());
	const oldState = client.useChannelState(channel);

	return value => {
		const newState = resolveSetStateAction<T>(oldState as T, value);
		state.set(channel, newState);
	};
}

export function useChannelState<T extends API.Channels.State>(
	channel: Id<'channel'>,
) {
	return [
		useReadChannelState<T>(channel),
		useSetChannelState<T>(channel),
	] as const;
}