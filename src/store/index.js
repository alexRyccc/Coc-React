import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';

// 从 localStorage 加载状态
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('coc-react-state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return undefined;
  }
};

// 保存状态到 localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify({
      user: state.user,
      characters: state.characters
    });
    localStorage.setItem('coc-react-state', serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
};

// 简单reducer
const initialState = {
  user: null,
  error: null,
  isLoginLoading: false,
  registerSuccess: null,
  registerError: null,
  isRegisterLoading: false,
  forgotPasswordSuccess: null,
  forgotPasswordError: null,
  isForgotPasswordLoading: false,
  characters: [],
  isCreatingCharacter: false,
  createCharacterError: null,
  // jihua module state
  travelPlans: [],
  travelPlansLoading: false,
  travelPlansError: null,
  currentPlan: null,
  currentPlanLoading: false,
  currentPlanError: null,
  planSaving: false,
  planSaveError: null,
  planDeleting: false,
  planDeleteError: null,
};

// 加载持久化状态
const persistedState = loadState();
const preloadedState = persistedState ? { ...initialState, ...persistedState } : initialState;
function reducer(state = preloadedState, action) {
  switch (action.type) {
    case 'LOGOUT':
      // 清除 localStorage
      localStorage.removeItem('coc-react-state');
      return { ...initialState };
    case 'LOGIN_REQUEST':
      return { ...state, isLoginLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, error: null, isLoginLoading: false };
    case 'LOGIN_FAILURE':
      return { ...state, user: null, error: action.error, isLoginLoading: false };
    case 'REGISTER_REQUEST':
      return { ...state, isRegisterLoading: true, registerError: null, registerSuccess: null };
    case 'REGISTER_SUCCESS':
      return { ...state, registerSuccess: action.payload, registerError: null, isRegisterLoading: false };
    case 'REGISTER_FAILURE':
      return { ...state, registerError: action.error, registerSuccess: null, isRegisterLoading: false };
    case 'FORGOT_PASSWORD_REQUEST':
      return { ...state, isForgotPasswordLoading: true, forgotPasswordError: null, forgotPasswordSuccess: null };
    case 'FORGOT_PASSWORD_SUCCESS':
      return { ...state, forgotPasswordSuccess: action.payload, forgotPasswordError: null, isForgotPasswordLoading: false };
    case 'FORGOT_PASSWORD_FAILURE':
      return { ...state, forgotPasswordError: action.error, forgotPasswordSuccess: null, isForgotPasswordLoading: false };
    case 'CHARACTERS_SUCCESS':
      console.log('CHARACTERS_SUCCESS action received:', action.payload);
      return { ...state, characters: action.payload, error: null };
    case 'CHARACTERS_FAILURE':
      console.log('CHARACTERS_FAILURE action received:', action.error);
      return { ...state, characters: [], error: action.error };
    case 'CREATE_CHARACTER_REQUEST':
      return { ...state, isCreatingCharacter: true, createCharacterError: null };
    case 'CREATE_CHARACTER_SUCCESS':
      return { 
        ...state, 
        isCreatingCharacter: false, 
        createCharacterError: null,
        characters: [...state.characters, action.payload]
      };
    case 'CREATE_CHARACTER_FAILURE':
      return { 
        ...state, 
        isCreatingCharacter: false, 
        createCharacterError: action.error 
      };
    // jihua reducers
    case 'TRAVEL_PLANS_FETCH_REQUESTING':
      return { ...state, travelPlansLoading: true, travelPlansError: null };
    case 'TRAVEL_PLANS_FETCH_SUCCESS':
      return { ...state, travelPlansLoading: false, travelPlans: action.payload || [], travelPlansError: null };
    case 'TRAVEL_PLANS_FETCH_FAILURE':
      return { ...state, travelPlansLoading: false, travelPlansError: action.error };

    case 'TRAVEL_PLAN_FETCH_REQUESTING':
      return { ...state, currentPlanLoading: true, currentPlanError: null };
    case 'TRAVEL_PLAN_FETCH_SUCCESS':
      return { ...state, currentPlanLoading: false, currentPlan: action.payload, currentPlanError: null };
    case 'TRAVEL_PLAN_FETCH_FAILURE':
      return { ...state, currentPlanLoading: false, currentPlanError: action.error };

    case 'TRAVEL_PLAN_SAVE_REQUESTING':
      return { ...state, planSaving: true, planSaveError: null };
    case 'TRAVEL_PLAN_SAVE_SUCCESS':
      return { ...state, planSaving: false, currentPlan: action.payload, planSaveError: null };
    case 'TRAVEL_PLAN_SAVE_FAILURE':
      return { ...state, planSaving: false, planSaveError: action.error };

    case 'TRAVEL_PLAN_DELETE_REQUESTING':
      return { ...state, planDeleting: true, planDeleteError: null };
    case 'TRAVEL_PLAN_DELETE_SUCCESS':
      return { ...state, planDeleting: false, currentPlan: null };
    case 'TRAVEL_PLAN_DELETE_FAILURE':
      return { ...state, planDeleting: false, planDeleteError: action.error };
    default:
      return state;
  }
}

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, preloadedState, applyMiddleware(sagaMiddleware));

// 监听 store 变化并保存到 localStorage
store.subscribe(() => {
  saveState(store.getState());
});

sagaMiddleware.run(rootSaga);

export default store;
