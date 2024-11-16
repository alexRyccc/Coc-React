import React from 'react';
import './Login.css';
import { withRouter } from 'react-router-dom';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showLoginForm: false, // 控制登录窗口的显示
      showCreateAccountModal: false, // 控制创建新账户弹窗
      showForgotPasswordModal: false, // 控制忘记密码弹窗
      username: '', // 用于保存输入的账号
      password: '', // 用于保存输入的密码
      email: '', // 新账户注册用邮箱
      mobile: '', // 新账户注册用手机号
      resetEmail: '', // 忘记密码用邮箱
    };
  }

  componentDidMount() {
    // 为入场动画添加class
    setTimeout(() => {
      document.querySelector('.login-container').classList.add('animate-entry');
    }, 100);
  }

  // 控制登录表单显示/隐藏
  toggleLoginForm = () => {
    this.setState({ showLoginForm: !this.state.showLoginForm });
  };

  // 打开/关闭创建新账户弹窗
  toggleCreateAccountModal = () => {
    this.setState({ showCreateAccountModal: !this.state.showCreateAccountModal });
  };

  // 打开/关闭忘记密码弹窗
  toggleForgotPasswordModal = () => {
    this.setState({ showForgotPasswordModal: !this.state.showForgotPasswordModal });
  };

  // 处理表单提交
  handleSubmit = (e) => {
    e.preventDefault();
    const { username, password } = this.state;

    // 模拟登录逻辑，检查用户名和密码
    if (username === '1' && password === '1') {
      // 登录成功，跳转到Home.js
      this.props.history.push('/home');
    } else {
      alert('账号或密码错误');
    }
  };

  // 处理输入框的变化
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
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">XX跑团馆</h1>
          <p className="login-subtitle">Welcome to the madness...</p>
          {!showLoginForm && (
            <button className="login-link" onClick={this.toggleLoginForm}>
              Enter the Abyss
            </button>
          )}
        </div>

        {showLoginForm && (
          <div className="login-form">
            <h2>登录</h2>
            <form onSubmit={this.handleSubmit}>
              <div className="form-group">
                <label>账号</label>
                <input
                  type="text"
                  name="username"
                  placeholder="请输入您的账号"
                  value={username}
                  onChange={this.handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  name="password"
                  placeholder="请输入您的密码"
                  value={password}
                  onChange={this.handleInputChange}
                />
              </div>
              <button type="submit" className="submit-btn">
                登录
              </button>
            </form>
            <div className="account-options">
              <button className="create-account-btn" onClick={this.toggleCreateAccountModal}>
                创建新账户
              </button>
              <button className="create-account-btn1" onClick={this.toggleForgotPasswordModal}>
                忘记密码
              </button>
            </div>
          </div>
        )}

        {/* 创建新账户弹窗 */}
        {showCreateAccountModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>创建新账户</h2>
              <form>
                <div className="form-group">
                  <label>用户名</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="请输入邮箱"
                    value={email}
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>手机号</label>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="请输入手机号"
                    value={mobile}
                    onChange={this.handleInputChange}
                  />
                </div>
                <button type="button" className="submit-btn">
                  注册
                </button>
              </form>
              <button className="close-btn" onClick={this.toggleCreateAccountModal}>
                关闭
              </button>
            </div>
          </div>
        )}

        {/* 忘记密码弹窗 */}
        {showForgotPasswordModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>忘记密码</h2>
              <form>
                <div className="form-group">
                  <label>注册邮箱</label>
                  <input
                    type="email"
                    name="resetEmail"
                    placeholder="请输入注册时的邮箱"
                    value={resetEmail}
                    onChange={this.handleInputChange}
                  />
                </div>
                <button type="button" className="submit-btn">
                  提交
                </button>
              </form>
              <button className="close-btn" onClick={this.toggleForgotPasswordModal}>
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
