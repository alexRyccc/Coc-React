import React from 'react';
import './Login.css';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import store from '../../store';
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
      successMessage: '',
      errorMessage: '',
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
    if (this.props.isLoginLoading) return; // 防止重复提交
    
    const { username, password } = this.state;
    if (!username || !password) {
      this.setState({ errorMessage: '请输入账号和密码' });
      return;
    }
    
    this.setState({ errorMessage: '' });
    
    this.props.dispatch({
      type: 'LOGIN_REQUEST',
      payload: {
        userName: username,
        password: password,
      },
    });
  };

  componentDidUpdate(prevProps) {
    // 登录处理
    if (this.props.user && this.props.user !== prevProps.user) {
      // 登录成功，跳转
      console.log('Login successful, user:', this.props.user);
      this.setState({ 
        successMessage: '登录成功！正在跳转...',
        errorMessage: '' 
      });
      setTimeout(() => {
        this.props.history.push('/home');
      }, 1000);
    }
    if (this.props.error && this.props.error !== prevProps.error) {
      console.log('Login error:', this.props.error);
      this.setState({ 
        errorMessage: this.props.error,
        successMessage: '' 
      });
    }

    // 注册处理
    if (this.props.registerSuccess && this.props.registerSuccess !== prevProps.registerSuccess) {
      this.setState({
        successMessage: '注册成功！',
        errorMessage: '',
        showCreateAccountModal: false,
        username: '',
        email: '',
        mobile: '',
      });
    }
    if (this.props.registerError && this.props.registerError !== prevProps.registerError) {
      this.setState({
        errorMessage: this.props.registerError,
        successMessage: ''
      });
    }

    // 忘记密码处理
    if (this.props.forgotPasswordSuccess && this.props.forgotPasswordSuccess !== prevProps.forgotPasswordSuccess) {
      this.setState({
        successMessage: '重置密码邮件已发送！',
        errorMessage: '',
        showForgotPasswordModal: false,
        resetEmail: '',
      });
    }
    if (this.props.forgotPasswordError && this.props.forgotPasswordError !== prevProps.forgotPasswordError) {
      this.setState({
        errorMessage: this.props.forgotPasswordError,
        successMessage: ''
      });
    }

    // 注册处理
    if (this.props.registerSuccess && this.props.registerSuccess !== prevProps.registerSuccess) {
      this.setState({ 
        isRegisterLoading: false,
        successMessage: '注册成功！',
        errorMessage: '',
        showCreateAccountModal: false,
        username: '',
        email: '',
        mobile: '',
      });
    }
    if (this.props.registerError && this.props.registerError !== prevProps.registerError) {
      this.setState({ 
        isRegisterLoading: false,
        errorMessage: '注册失败，请重试',
        successMessage: '' 
      });
    }

    // 忘记密码处理
    if (this.props.forgotPasswordSuccess && this.props.forgotPasswordSuccess !== prevProps.forgotPasswordSuccess) {
      this.setState({ 
        isForgotPasswordLoading: false,
        successMessage: '重置密码邮件已发送！',
        errorMessage: '',
        showForgotPasswordModal: false,
        resetEmail: '',
      });
    }
    if (this.props.forgotPasswordError && this.props.forgotPasswordError !== prevProps.forgotPasswordError) {
      this.setState({ 
        isForgotPasswordLoading: false,
        errorMessage: '发送失败，请重试',
        successMessage: '' 
      });
    }
  }

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  // 处理注册
  handleRegister = (e) => {
    e.preventDefault();
    if (this.props.isRegisterLoading) return; // 防止重复提交
    
    const { username, email, mobile } = this.state;
    if (!username || !email || !mobile) {
      this.setState({ errorMessage: '请填写完整的注册信息' });
      return;
    }
    
    this.setState({ errorMessage: '', successMessage: '' });
    
    this.props.dispatch({
      type: 'REGISTER_REQUEST',
      payload: {
        username,
        email,
        mobile,
      },
    });
  };

  // 处理忘记密码
  handleForgotPassword = (e) => {
    e.preventDefault();
    if (this.props.isForgotPasswordLoading) return; // 防止重复提交
    
    const { resetEmail } = this.state;
    if (!resetEmail) {
      this.setState({ errorMessage: '请输入邮箱地址' });
      return;
    }
    
    this.setState({ errorMessage: '', successMessage: '' });
    
    this.props.dispatch({
      type: 'FORGOT_PASSWORD_REQUEST',
      payload: {
        email: resetEmail,
      },
    });
  };

  // 清除消息
  clearMessages = () => {
    this.setState({ successMessage: '', errorMessage: '' });
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
      successMessage,
      errorMessage,
    } = this.state;
    
    const { 
      isLoginLoading, 
      isRegisterLoading, 
      isForgotPasswordLoading 
    } = this.props;
    
    return (
      <div className="login-mobile-container" style={{ backgroundImage: `url(${trpgImage})`, backgroundSize: 'cover', minHeight: '100vh', padding: '12px 0', position: 'relative', zIndex: 1 }}>
        
        {/* 消息提示 */}
        {(successMessage || errorMessage) && (
          <div className={`login-message ${successMessage ? 'success' : 'error'}`}>
            {successMessage || errorMessage}
            <button className="login-message-close" onClick={this.clearMessages}>×</button>
          </div>
        )}
        
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
                <button type="submit" className="login-mobile-btn" disabled={isLoginLoading}>
                  {isLoginLoading ? '登录中...' : '登录'}
                </button>
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
              <form className="login-mobile-modal-form" onSubmit={this.handleRegister}>
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
                <button type="submit" className="login-mobile-btn" disabled={isRegisterLoading}>
                  {isRegisterLoading ? '注册中...' : '注册'}
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
              <form className="login-mobile-modal-form" onSubmit={this.handleForgotPassword}>
                <input
                  type="email"
                  name="resetEmail"
                  placeholder="注册邮箱"
                  value={resetEmail}
                  onChange={this.handleInputChange}
                  className="login-mobile-input"
                  autoComplete="email"
                />
                <button type="submit" className="login-mobile-btn" disabled={isForgotPasswordLoading}>
                  {isForgotPasswordLoading ? '提交中...' : '提交'}
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

export default withRouter(connect((state) => ({ 
  user: state.user, 
  error: state.error,
  isLoginLoading: state.isLoginLoading,
  registerSuccess: state.registerSuccess,
  registerError: state.registerError,
  isRegisterLoading: state.isRegisterLoading,
  forgotPasswordSuccess: state.forgotPasswordSuccess,
  forgotPasswordError: state.forgotPasswordError,
  isForgotPasswordLoading: state.isForgotPasswordLoading
}))(Login));
