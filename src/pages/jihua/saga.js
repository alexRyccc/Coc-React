import { takeLatest, call, put } from 'redux-saga/effects';
import axios from 'axios';

// Keep same convention as existing sagas
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8082/api';

// API calls
const listPlansApi = () => axios.get(`${API_BASE_URL}/travel-plans`);
const getPlanApi = (id) => axios.get(`${API_BASE_URL}/travel-plans/${id}`);
const createPlanApi = (plan) => axios.post(`${API_BASE_URL}/travel-plans`, plan, { headers: { 'Content-Type': 'application/json' } });
const updatePlanApi = (id, plan) => axios.put(`${API_BASE_URL}/travel-plans/${id}`, plan, { headers: { 'Content-Type': 'application/json' } });
const deletePlanApi = (id) => axios.delete(`${API_BASE_URL}/travel-plans/${id}`);

// Workers
function* listPlansSaga() {
  try {
    yield put({ type: 'TRAVEL_PLANS_FETCH_REQUESTING' });
    const res = yield call(listPlansApi);
    yield put({ type: 'TRAVEL_PLANS_FETCH_SUCCESS', payload: res.data || [] });
  } catch (error) {
    let msg = '获取计划列表失败';
    if (error.response) msg = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
    else if (error.request) msg = '网络连接失败，请检查网络';
    else msg = error.message || msg;
    yield put({ type: 'TRAVEL_PLANS_FETCH_FAILURE', error: msg });
  }
}

function* getPlanSaga(action) {
  try {
    const id = action.payload;
    yield put({ type: 'TRAVEL_PLAN_FETCH_REQUESTING' });
    const res = yield call(getPlanApi, id);
    yield put({ type: 'TRAVEL_PLAN_FETCH_SUCCESS', payload: res.data || null });
  } catch (error) {
    let msg = '获取计划详情失败';
    if (error.response) msg = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
    else if (error.request) msg = '网络连接失败，请检查网络';
    else msg = error.message || msg;
    yield put({ type: 'TRAVEL_PLAN_FETCH_FAILURE', error: msg });
  }
}

function* savePlanSaga(action) {
  try {
    const plan = action.payload; // { id?, name, items }
    yield put({ type: 'TRAVEL_PLAN_SAVE_REQUESTING' });
    let res;
    if (plan.id) res = yield call(updatePlanApi, plan.id, plan);
    else res = yield call(createPlanApi, plan);
    const saved = res.data || plan;
    yield put({ type: 'TRAVEL_PLAN_SAVE_SUCCESS', payload: saved });
    // refresh list
    yield put({ type: 'TRAVEL_PLANS_FETCH_REQUEST' });
  } catch (error) {
    let msg = '保存计划失败';
    if (error.response) msg = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
    else if (error.request) msg = '网络连接失败，请检查网络';
    else msg = error.message || msg;
    yield put({ type: 'TRAVEL_PLAN_SAVE_FAILURE', error: msg });
  }
}

function* deletePlanSaga(action) {
  try {
    const id = action.payload;
    yield put({ type: 'TRAVEL_PLAN_DELETE_REQUESTING' });
    yield call(deletePlanApi, id);
    yield put({ type: 'TRAVEL_PLAN_DELETE_SUCCESS', payload: id });
    // refresh list
    yield put({ type: 'TRAVEL_PLANS_FETCH_REQUEST' });
  } catch (error) {
    let msg = '删除计划失败';
    if (error.response) msg = error.response.data?.message || error.response.data?.error || `服务器错误: ${error.response.status}`;
    else if (error.request) msg = '网络连接失败，请检查网络';
    else msg = error.message || msg;
    yield put({ type: 'TRAVEL_PLAN_DELETE_FAILURE', error: msg });
  }
}

// Watchers
export default function* jihuaSaga() {
  yield takeLatest('TRAVEL_PLANS_FETCH_REQUEST', listPlansSaga);
  yield takeLatest('TRAVEL_PLAN_FETCH_REQUEST', getPlanSaga);
  yield takeLatest('TRAVEL_PLAN_SAVE_REQUEST', savePlanSaga);
  yield takeLatest('TRAVEL_PLAN_DELETE_REQUEST', deletePlanSaga);
}
