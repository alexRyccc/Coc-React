import loadable from '@loadable/component';
import React, { Component } from 'react';
import { HashRouter, Route, Switch, Redirect } from "react-router-dom";

// 页面异步chunk优化
const Index = loadable(() => import('../pages/Index/index'));
const Login = loadable(() => import('../pages/Login/login'));
const History = loadable(() => import('../pages/History/history'));
const Home = loadable(() => import('../pages/Home/home'));
const newPerson = loadable(() => import('../pages/NewPerson/newPerson'));
const study = loadable(() => import('../pages/Study/study'));
const achievements = loadable(() => import('../pages/Achievements/achievements'));
const jihua = loadable(() => import('../pages/jihua/jahua'));

// 简单的权限路由：仅用于需要登录的页面，/jihua 等公共页面不受影响
const isAuthed = () => {
  try {
    const raw = localStorage.getItem('coc-react-state');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed && !!parsed.user;
  } catch (e) {
    return false;
  }
};

const PrivateRoute = ({ component: Comp, ...rest }) => (
  <Route
    {...rest}
    render={(props) => (isAuthed() ? <Comp {...props} /> : <Redirect to="/login" />)}
  />
);


export default class Root extends Component {
  render() {
    return (
      <HashRouter basename="/">
        <Switch>
          <Route path="/" exact component={Index} />
          <Route path="/index" component={Index} />
          <Route path="/login" component={Login} />
          {/* 公开页面：/jihua */}
          <Route path="/jihua" component={jihua} />
          {/* 需要登录的页面 */}
          <PrivateRoute path="/history" component={History} />
          <PrivateRoute path="/home" component={Home} />
          <PrivateRoute path="/newPerson" component={newPerson} />
          <PrivateRoute path="/study" component={study} />
          <PrivateRoute path="/achievements" component={achievements} />
        </Switch>
      </HashRouter>
    );
  }
}