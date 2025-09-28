import React from 'react';
import './Login.css';
import { withRouter } from 'react-router-dom';
import trpgImage from './trpg-background.jpg'; // 跑团相关图片

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showLoginForm: false,
      showCreateAccountModal: false,
      showForgotPasswordModal: false,
      username: '',
      password: '',
      email: '',
      mobile: '',
      resetEmail: '',
    };
  }
  toggleLoginForm = () => {
    this.setState({ showLoginForm: !this.state.showLoginForm });
  };

  toggleCreateAccountModal = () => {
    this.setState({ showCreateAccountModal: !this.state.showCreateAccountModal });
  };

  toggleForgotPasswordModal = () => {
    this.setState({ showForgotPasswordModal: !this.state.showForgotPasswordModal });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { username, password } = this.state;
    if (username === '1' && password === '1') {
      this.props.history.push('/home');
    } else {
      alert('账号或密码错误');
    }
  };

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const {
      showLoginForm,
      showCreateAccountModal,
      showForgotPasswordModal,
      username,
      password,
      email,
      mobile,
      resetEmail,
    } = this.state;
    return (
      <div className="login-mobile-container" style={{ backgroundImage: `url(${trpgImage})`, backgroundSize: 'cover', minHeight: '100vh', padding: '12px 0', position: 'relative', zIndex: 1 }}>
          <div className="login-mobile-card">
              {!showLoginForm && (
            <>
          <h1 className="login-mobile-title">迷雾巷跑团馆</h1>
          <p className="login-mobile-subtitle">Welcome to the Misty Alley Running Group Pavilion</p>
          <button className="login-mobile-link" onClick={this.toggleLoginForm}>
            {showLoginForm ? '返回' : 'Enter the Abyss'}
          </button>
          </>
              )}
          {showLoginForm && (
            <div className="login-mobile-form-box">
              <h2 className="login-mobile-form-title">登录</h2>
              <form className="login-mobile-form" onSubmit={this.handleSubmit}>
                <input
                  type="text"
                  name="username"
                  placeholder="账号"
                  value={username}
                  onChange={this.handleInputChange}
                  className="login-mobile-input"
                  autoComplete="username"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="密码"
                  value={password}
                  onChange={this.handleInputChange}
                  className="login-mobile-input"
                  autoComplete="current-password"
                />
                <button type="submit" className="login-mobile-btn">登录</button>
              </form>
              <div className="login-mobile-account-options">
                <button className="login-mobile-account-btn" onClick={this.toggleCreateAccountModal}>
                  创建新账户
                </button>
                <button className="login-mobile-account-btn" onClick={this.toggleForgotPasswordModal}>
                  忘记密码
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 创建新账户弹窗 */}
        {showCreateAccountModal && (
          <div className="login-mobile-modal">
            <div className="login-mobile-modal-content">
              <h2 className="login-mobile-modal-title">创建新账户</h2>
              <form className="login-mobile-modal-form">
                <input
                  type="text"
                  name="username"
                  placeholder="用户名"
                  value={username}
                  onChange={this.handleInputChange}
                  className="login-mobile-input"
                  autoComplete="username"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="邮箱"
                  value={email}
                  onChange={this.handleInputChange}
                  className="login-mobile-input"
                  autoComplete="email"
                />
                <input
                  type="text"
                  name="mobile"
                  placeholder="手机号"
                  value={mobile}
                  onChange={this.handleInputChange}
                  className="login-mobile-input"
                  autoComplete="tel"
                />
                <button type="button" className="login-mobile-btn" onClick={this.toggleCreateAccountModal}>
                  注册
                </button>
              </form>
              <button className="login-mobile-close-btn" onClick={this.toggleCreateAccountModal}>
                关闭
              </button>
            </div>
          </div>
        )}

        {/* 忘记密码弹窗 */}
        {showForgotPasswordModal && (
          <div className="login-mobile-modal">
            <div className="login-mobile-modal-content">
              <h2 className="login-mobile-modal-title">忘记密码</h2>
              <form className="login-mobile-modal-form">
                <input
                  type="email"
                  name="resetEmail"
                  placeholder="注册邮箱"
                  value={resetEmail}
                  onChange={this.handleInputChange}
                  className="login-mobile-input"
                  autoComplete="email"
                />
                <button type="button" className="login-mobile-btn" onClick={this.toggleForgotPasswordModal}>
                  提交
                </button>
              </form>
              <button className="login-mobile-close-btn" onClick={this.toggleForgotPasswordModal}>
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Login);
