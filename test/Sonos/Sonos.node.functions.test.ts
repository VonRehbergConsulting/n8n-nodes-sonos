import { createMock } from '@golevelup/ts-jest';
import { promisify } from 'util';
import {
	loadHouseholds,
	loadPlayers,
	getFirstGroup,
	loadFavorites,
} from '../../nodes/Sonos/GenericFunctions';
import { readFile } from 'fs';
import { OptionsWithUrl, RequestPromiseOptions } from 'request-promise-native';
import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-core';
import { ICredentialDataDecryptedObject, INodeParameters } from 'n8n-workflow';
import { INodeExecutionData, INodeType } from 'n8n-workflow/dist';
import { Sonos } from '../../nodes/Sonos/Sonos.node';
import { SonosOAuth2Api } from '../../credentials/SonosOAuth2Api.credentials';

const readFileAsync = promisify(readFile);

describe('Sonos Node', () => {
	let credentials: Map<string, ICredentialDataDecryptedObject>;
	let nodeParameters: INodeParameters = {};
	let optionsStub: ILoadOptionsFunctions;
	let executeStub: IExecuteFunctions;
	let node: Sonos;
	beforeEach(() => {
		credentials = new Map<string, ICredentialDataDecryptedObject>();
		optionsStub = createMock<ILoadOptionsFunctions>({
			getCredentials: (type: string) => Promise.resolve(credentials.get(type) as any),
			getNodeParameter: (parameterName) => nodeParameters[parameterName],
		});
		executeStub = createMock<IExecuteFunctions>({
			getCredentials: (type: string) => Promise.resolve(credentials.get(type) as any),
			getNodeParameter: (parameterName) => nodeParameters[parameterName],
		});
		executeStub.helpers.returnJsonArray = (jsonData) => {
			return [{ json: jsonData }] as INodeExecutionData[];
		};
		credentials.set('sonosOAuth2Api', {});
		node = new Sonos();

		new SonosOAuth2Api();
	});
	describe('Configuration', () => {
		it('Fetches households', async () => {
			optionsStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation(() => readFileAsync('./test/Sonos/households.response.json', 'utf-8'));
			const result = await loadHouseholds.call(optionsStub);

			expect(result.length).toEqual(1);
			expect(result[0].name).toEqual('Sonos_MyHouseholdId');
			expect(result[0].value).toEqual('Sonos_MyHouseholdId');
		});
		it('Fetches players', async () => {
			optionsStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation(() => readFileAsync('./test/Sonos/groups.response.json', 'utf-8'));
			const result = await loadPlayers.call(optionsStub);

			expect(result.length).toEqual(4);
			expect(result[0].name).toEqual('Sonos Roam');
			expect(result[0].value).toEqual('RINCON_123456');
			expect(result[1].name).toEqual('Sonos Move');
			expect(result[1].value).toEqual('RINCON_1234567');
			expect(result[2].name).toEqual('Hometheater Beam');
			expect(result[2].value).toEqual('RINCON_1234568');
			expect(result[3].name).toEqual('Hometheater Arc');
			expect(result[3].value).toEqual('RINCON_1234569');
		});
		it('Fetches players based on action and capabilities', async () => {
			optionsStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation(() => readFileAsync('./test/Sonos/groups.response.json', 'utf-8'));
			nodeParameters.action = 'loadHomeTheaterPlayback';
			const result = await loadPlayers.call(optionsStub);

			expect(result.length).toEqual(2);
			expect(result[0].name).toEqual('Hometheater Beam');
			expect(result[0].value).toEqual('RINCON_1234568');
			expect(result[1].name).toEqual('Hometheater Arc');
			expect(result[1].value).toEqual('RINCON_1234569');
		});
		it('Fetches players based on action and capabilities', async () => {
			optionsStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation(() => readFileAsync('./test/Sonos/groups.response.json', 'utf-8'));
			nodeParameters.action = 'setTVPowerState';
			const result = await loadPlayers.call(optionsStub);

			expect(result.length).toEqual(1);
			expect(result[0].name).toEqual('Hometheater Arc');
			expect(result[0].value).toEqual('RINCON_1234569');
		});
		it('Fetches the first group', async () => {
			optionsStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation(() => readFileAsync('./test/Sonos/groups.response.json', 'utf-8'));
			const result = await getFirstGroup.call(optionsStub);

			expect(result).toEqual('RINCON_1234567:1234');
		});
		it('Fetches Sonos Favorites', async () => {
			optionsStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation(() => readFileAsync('./test/Sonos/favorites.response.json', 'utf-8'));
			const result = await loadFavorites.call(optionsStub);

			expect(result.length).toEqual(2);
			expect(result[0].name).toEqual(
				'"Kill Your Darlings" // [DJ-Mix] By Dennis Kruissen - 10/2013',
			);
			expect(result[0].value).toEqual('10');
			expect(result[1].name).toEqual('10Hz Bass Test');
			expect(result[1].value).toEqual('41');
		});
	});

	describe('Action', () => {
		it('Plays an Audio Clip', async () => {
			nodeParameters['action'] = 'playAudioClip';
			let callOptions: OptionsWithUrl | any = {};
			nodeParameters['player'] = 'PLAYER_1';
			nodeParameters['url'] = 'https://url';
			nodeParameters['volume'] = 50;
			executeStub.helpers.requestOAuth2 = jest.fn().mockImplementation((...args: any[]) => {
				callOptions = args[1];
				return readFileAsync('./test/Sonos/playAudioClip.response.json', 'utf-8');
			});
			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');

			const responseBody = JSON.parse(callOptions.body);
			expect(responseBody.streamUrl).toEqual('https://url');
			expect(responseBody.volume).toEqual(50);
			expect(callOptions.uri).toEqual(
				'https://api.ws.sonos.com/control/api/v1/players/PLAYER_1/audioClip',
			);
		});

		it('Groups all Players', async () => {
			nodeParameters['action'] = 'groupAll';
			let callOptions: OptionsWithUrl | any = {};
			nodeParameters['household'] = 'HOUSEHOLD_1';
			executeStub.helpers.requestOAuth2 = jest.fn().mockImplementation((...args: any[]) => {
				callOptions = args[1];
				if (callOptions.uri.endsWith('/groups')) {
					return readFileAsync('./test/Sonos/groups.response.json', 'utf-8');
				} else {
					return '{}';
				}
			});
			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');

			const responseBody = JSON.parse(callOptions.body);
			expect(responseBody.playerIds.length).toEqual(4);
			expect(callOptions.uri).toEqual(
				'https://api.ws.sonos.com/control/api/v1/households/HOUSEHOLD_1/groups/createGroup',
			);
		});

		it('Executes Group Action on First Group', async () => {
			nodeParameters['action'] = 'play';
			let callOptions: OptionsWithUrl | any = {};
			nodeParameters['household'] = 'HOUSEHOLD_1';
			executeStub.helpers.requestOAuth2 = jest.fn().mockImplementation((...args: any[]) => {
				callOptions = args[1];
				if (callOptions.uri.endsWith('/groups')) {
					return readFileAsync('./test/Sonos/groups.response.json', 'utf-8');
				} else {
					return '{}';
				}
			});

			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');

			expect(callOptions.body).toEqual(undefined);
			expect(callOptions.uri).toEqual(
				'https://api.ws.sonos.com/control/api/v1/groups/RINCON_1234567:1234/playback/play',
			);
		});

		it('Sets Group Volume', async () => {
			nodeParameters['action'] = 'groupVolume';
			let callOptions: OptionsWithUrl | any = {};
			nodeParameters['household'] = 'HOUSEHOLD_1';
			executeStub.helpers.requestOAuth2 = jest.fn().mockImplementation((...args: any[]) => {
				callOptions = args[1];
				if (callOptions.uri.endsWith('/groups')) {
					return readFileAsync('./test/Sonos/groups.response.json', 'utf-8');
				} else {
					return '{}';
				}
			});

			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');

			expect(callOptions.body).toEqual(JSON.stringify({ volume: 50 }));
			expect(callOptions.uri).toEqual(
				'https://api.ws.sonos.com/control/api/v1/groups/RINCON_1234567:1234/groupVolume',
			);
		});

		it('Plays Sonos Favorite on First Group', async () => {
			nodeParameters['action'] = 'playFavorite';
			let callOptions: OptionsWithUrl | any = {};
			nodeParameters['household'] = 'HOUSEHOLD_1';
			nodeParameters['favorite'] = '1';
			nodeParameters['shuffle'] = true;
			nodeParameters['repeat'] = true;
			nodeParameters['crossfade'] = true;
			executeStub.helpers.requestOAuth2 = jest.fn().mockImplementation((...args: any[]) => {
				callOptions = args[1];
				if (callOptions.uri.endsWith('/groups')) {
					return readFileAsync('./test/Sonos/groups.response.json', 'utf-8');
				} else {
					return '{}';
				}
			});

			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');

			const responseBody = JSON.parse(callOptions.body);
			expect(responseBody.favoriteId).toEqual('1');
			expect(responseBody.playModes.shuffle).toEqual(true);
			expect(responseBody.playModes.repeat).toEqual(true);
			expect(responseBody.playModes.crossfade).toEqual(true);
			expect(callOptions.uri).toEqual(
				'https://api.ws.sonos.com/control/api/v1/groups/RINCON_1234567:1234/favorites',
			);
		});

		it('Sets Home Theater Options', async () => {
			nodeParameters['action'] = 'setHomeTheaterOptions';
			nodeParameters['household'] = 'HOUSEHOLD_1';
			nodeParameters['player'] = '1';
			nodeParameters['nightMode'] = true;
			nodeParameters['enhanceDialog'] = true;
			executeStub.helpers.requestOAuth2 = jest.fn().mockImplementation((...args: any[]) =>
				Promise.resolve(
					JSON.stringify({
						nightMode: false,
						enhanceDialog: false,
						groupingLatency: 75,
					}),
				),
			);

			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');
		});

		it('Loads Home Theater Playback', async () => {
			nodeParameters['action'] = 'loadHomeTheaterPlayback';
			nodeParameters['household'] = 'HOUSEHOLD_1';
			nodeParameters['player'] = '1';
			executeStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation((...args: any[]) => Promise.resolve(''));

			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');
		});

		it('Sets TV Power State', async () => {
			nodeParameters['action'] = 'setTVPowerState';
			nodeParameters['household'] = 'HOUSEHOLD_1';
			nodeParameters['player'] = '1';
			executeStub.helpers.requestOAuth2 = jest
				.fn()
				.mockImplementation((...args: any[]) => Promise.resolve('{}'));

			const result = await node.execute.apply(executeStub);
			const executionResponse = result[0][0] as any;
			expect(executionResponse?.json[0].message).toEqual('ok');
		});
	});
});
