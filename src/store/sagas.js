import { takeLatest, call, put, select, all } from 'redux-saga/effects';
import axios from 'axios';
import jihuaSaga from '../pages/jihua/saga';

// API基础URL配置
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8082';

function loginApi(payload) {
  return axios.post(`${API_BASE_URL}/user/login`, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function* loginSaga(action) {
  try {
    console.log('Login request payload:', action.payload);
    const response = yield call(loginApi, action.payload);
    console.log('Login API response:', response);
    console.log('Login response data:', response.data);
    
    // 检查响应状态
    if (response.status === 200 && response.data) {
      yield put({ type: 'LOGIN_SUCCESS', payload: response.data });
    } else {
      yield put({ type: 'LOGIN_FAILURE', error: 'Login failed: Invalid response' });
    }
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error response:', error.response);
    
    // 处理不同类型的错误
    let errorMessage = '登录失败';
    if (error.response) {
      // 服务器返回了错误状态码
      errorMessage = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
    } else if (error.request) {
      // 请求发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络';
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误';
    }
    
    yield put({ type: 'LOGIN_FAILURE', error: errorMessage });
  }
}

function fetchCharactersApi(id) {
  return axios.get(`${API_BASE_URL}/character/info?userId=${id}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function* fetchCharactersSaga() {
  try {
    const user = yield select(state => state.user);
    console.log('Fetching characters for user:', user);
    
    // 检查用户是否已登录
    if (!user) {
      console.log('User not logged in');
      yield put({ type: 'CHARACTERS_FAILURE', error: 'User not logged in' });
      return;
    }
    
    // 如果 user 是对象，使用 user.id；如果是数字，直接使用
    const userId = typeof user === 'object' && user.id ? user.id : user;
    console.log('Using userId:', userId);
    
    const response = yield call(fetchCharactersApi, userId);
    console.log('Characters API response:', response);
    console.log('Characters response data:', response.data);
    
    // 检查响应是否成功
    if (response.status === 200) {
      yield put({ type: 'CHARACTERS_SUCCESS', payload: response.data || [] });
    } else {
      console.error('Characters API returned non-200 status:', response.status);
      yield put({ type: 'CHARACTERS_FAILURE', error: `API返回状态码: ${response.status}` });
    }
  } catch (error) {
    console.error('Fetch characters error:', error);
    console.error('Error response:', error.response);
    
    // 处理不同类型的错误
    let errorMessage = '获取角色失败';
    if (error.response) {
      errorMessage = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
      console.log('Server returned error:', errorMessage);
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络';
      console.log('Network error');
    } else {
      errorMessage = error.message || '未知错误';
      console.log('Unknown error:', errorMessage);
    }
    
    yield put({ type: 'CHARACTERS_FAILURE', error: errorMessage });
  }
}

function registerApi(payload) {
  return axios.post(`${API_BASE_URL}/user/register`, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function* registerSaga(action) {
  try {
    yield put({ type: 'REGISTER_REQUEST' }); // 添加 loading 状态
    console.log('Register request payload:', action.payload);
    const response = yield call(registerApi, action.payload);
    console.log('Register API response:', response);
    console.log('Register response data:', response.data);
    
    // 检查响应状态
    if (response.status === 200 && response.data) {
      yield put({ type: 'REGISTER_SUCCESS', payload: response.data });
    } else {
      yield put({ type: 'REGISTER_FAILURE', error: 'Registration failed: Invalid response' });
    }
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error response:', error.response);
    
    // 处理不同类型的错误
    let errorMessage = '注册失败';
    if (error.response) {
      // 服务器返回了错误状态码
      errorMessage = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
    } else if (error.request) {
      // 请求发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络';
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误';
    }
    
    yield put({ type: 'REGISTER_FAILURE', error: errorMessage });
  }
}

function forgotPasswordApi(payload) {
  return axios.post(`${API_BASE_URL}/user/forgot-password`, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function* forgotPasswordSaga(action) {
  try {
    yield put({ type: 'FORGOT_PASSWORD_REQUEST' }); // 添加 loading 状态
    console.log('Forgot password request payload:', action.payload);
    const response = yield call(forgotPasswordApi, action.payload);
    console.log('Forgot password API response:', response);
    console.log('Forgot password response data:', response.data);
    
    // 检查响应状态
    if (response.status === 200 && response.data) {
      yield put({ type: 'FORGOT_PASSWORD_SUCCESS', payload: response.data });
    } else {
      yield put({ type: 'FORGOT_PASSWORD_FAILURE', error: 'Password reset failed: Invalid response' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error response:', error.response);
    
    // 处理不同类型的错误
    let errorMessage = '密码重置失败';
    if (error.response) {
      errorMessage = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络';
    } else {
      errorMessage = error.message || '未知错误';
    }
    
    yield put({ type: 'FORGOT_PASSWORD_FAILURE', error: errorMessage });
  }
}

function createCharacterApi(payload) {
  return axios.post(`${API_BASE_URL}/character/create`, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function* createCharacterSaga(action) {
  try {
    const response = yield call(createCharacterApi, action.payload);
    yield put({ type: 'CREATE_CHARACTER_SUCCESS', payload: response.data });
    // 创建成功后重新获取角色列表
    yield put({ type: 'FETCH_CHARACTERS' });
  } catch (error) {
    yield put({ type: 'CREATE_CHARACTER_FAILURE', error });
  }
}

export default function* rootSaga() {
  yield all([
    takeLatest('LOGIN_REQUEST', loginSaga),
    takeLatest('REGISTER_REQUEST', registerSaga),
    takeLatest('FORGOT_PASSWORD_REQUEST', forgotPasswordSaga),
    takeLatest('FETCH_CHARACTERS', fetchCharactersSaga),
    takeLatest('CREATE_CHARACTER_REQUEST', createCharacterSaga),
    jihuaSaga(),
  ]);
}
