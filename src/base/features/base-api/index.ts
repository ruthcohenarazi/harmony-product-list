import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config as appConfig } from 'config';
import { dispatchErrorHandler } from '@base/features/base-error-handler';
import { endSpinner, startSpinner } from '@base/features/base-global-spinner';

interface Context {
	appId: string;
	subAppId: string;
}

export class Request {
	private readonly appContext?: Context;

	constructor(appContext?: Context) {
		this.appContext = appContext;

		if (appConfig.COMMON_URL_PARAMS) {
			this.setCommonParams(appConfig.COMMON_URL_PARAMS);
		}
	}

	setCommonHeader(key: string, value: string) {
		axios.defaults.headers.common[key] = value;
	}

	setCommonParams(commonParams: Array<{key: string; value: string}>) {
		axios.defaults.params = {};

		commonParams.forEach((param) => {
			axios.defaults.params[param.key] = param.value;
		});
	}

	broadcastAction(action: any): any {
		if (!action) return null;

		const callConfig = {
			method: 'post',
			baseURL: appConfig.ROOT_SERVER_URL,
			url: '/users/broadcastAction',
			data: {
				action,
				token: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('wsa_token') : {}
			}
		};

		return this.call(callConfig);
	}

	async call(config: AxiosRequestConfig) {
		let response: AxiosResponse;
		const uuid = uuidv4();
		const appId = this?.appContext?.appId || 'mainApp';
		const subAppId = this?.appContext?.subAppId || 'subMainApp';

		try {
			const commonAuthHeader = appConfig.COMMON_AUTHORIZATION_HEADER;

			startSpinner(appId, subAppId, config.url, uuid);
			response = await axios(config);
			endSpinner(appId, subAppId, config.url, uuid);

			if (commonAuthHeader && response?.headers && response.headers[commonAuthHeader]) {
				this.setCommonHeader(commonAuthHeader, response.headers[commonAuthHeader]);
			}

			return response;
		} catch (e) {
			const error = e.response || {};
			error.appId = appId;
			error.subAppId = subAppId;

			endSpinner(appId, subAppId, config.url, uuid);
			dispatchErrorHandler(error);

			return e;
		}
	}
}

const request = new Request();

export default request;
