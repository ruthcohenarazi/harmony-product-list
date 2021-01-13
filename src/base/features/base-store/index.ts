import { createStore, applyMiddleware, compose } from 'redux';
import Immutable from 'seamless-immutable';
import { persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import { globalStoreListener, STORE_ACTION_LISTENERS } from '@base/features/base-services';
import { config } from 'config';
import reducers, { ApplicationState } from 'actions/redux';
import rootSaga from 'actions/sagas';

/* --------- define middleware ---------- */

export const globalActionListener = (/* store */) => (next: any) => (action: any) => {
	const result = next(action);
	globalStoreListener.publish(STORE_ACTION_LISTENERS, action);
	return result;
};

const sagaMiddleware = createSagaMiddleware();

/* -------- create the store with middleware ---------- */
const customCompose = compose(
	applyMiddleware(sagaMiddleware, globalActionListener),
	window.devToolsExtension && window.devToolsExtension({
		name: config.appName,
		deserializeState: (state: ApplicationState) => {
			return Immutable(state);
		},
	})
);

const store = createStore(reducers, customCompose);

/* -------- run root saga ---------- */
sagaMiddleware.run(rootSaga);

/* -------- expose store functionality to page level ------------- */
export const persistor = persistStore(store);
export default store;
