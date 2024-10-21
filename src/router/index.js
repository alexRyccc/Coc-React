import loadable from '@loadable/component';
import React, { Component } from 'react';
import { HashRouter, Route, Switch } from "react-router-dom";

// 页面异步chunk优化
const Index = loadable(() => import('../pages/Index/index'));
const Login = loadable(() => import('../pages/Login/login'));
const History = loadable(() => import('../pages/History/history'));
const Home = loadable(() => import('../pages/Home/home'));
const newPerson = loadable(() => import('../pages/NewPerson/newPerson'));

export default class Root extends Component {
  render() {
    return (
      <HashRouter basename="/">
        <Switch>
          <Route path="/" exact component={Index} />
          <Route path="/index" component={Index} />
          <Route path="/login" component={Login} />
          <Route path="/history" component={History} />
          <Route path="/home" component={Home} />
          <Route path="/newPerson" component={newPerson} />
        </Switch>
      </HashRouter>
    );
  }
}