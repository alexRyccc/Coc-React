import React from 'react';
import { Link } from 'react-router-dom';
import './index.less'; // 确保有相应的 CSS 样式
import trpgImage from './images/trpg-background.jpg'; // 跑团相关图片

export default class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (

      <div className="index-mobile-container" style={{ backgroundImage: `url(${trpgImage})`, backgroundSize: 'cover', minHeight: '100vh', padding: '12px 0', position: 'relative', zIndex: 1 }}>
        <div className="index-card">
          <div className="index-header">欢迎来到迷雾巷！</div>
          <p className="index-description">
            在这里你可以体验最刺激的跑团冒险！无论是新手还是老手，都能找到属于自己的乐趣。
          </p>
          <Link to="/login" className="index-login-btn">立即登录</Link>
        </div>
      </div>
    );
  }
}




