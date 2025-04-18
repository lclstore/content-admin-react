import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input, Button, Modal } from 'antd';
import { UserOutlined, LockOutlined, QuestionCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import loginApi from '@/api/login.js';
import { validateEmail } from '@/utils/index.js';

import lionImg from '@/assets/images/lion.png';
import loginLeftImg from '@/assets/images/login-left.svg';
import './login.css'; // 将样式移到单独的CSS文件中

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // 状态管理
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [accountError, setAccountError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    // 本地存储token
    const localDown = (token) => {
        localStorage.setItem("cms-token", token);
    };

    // 登录逻辑
    const login = () => {
        // 本地开发环境跳过登录
        if (process.env.NODE_ENV === 'local') {
            const token = "123456789";
            dispatch({ type: 'modifyData', payload: { name: "token", newdata: token } });
            localDown(token);
            navigate('/dashboard'); // 假设路由路径
            return;
        }

        // 表单验证
        let hasError = false;

        if (!account) {
            setAccountError("Email cannot be empty.");
            hasError = true;
        } else if (!validateEmail(account)) {
            setAccountError("email is not valid.");
            hasError = true;
        }

        if (!password) {
            setPasswordError("Password cannot be empty.");
            hasError = true;
        }

        if (hasError) {
            return false;
        }

        // 清除错误提示
        setAccountError('');
        setPasswordError('');
        setLoading(true);

        // 使用API登录
        loginApi.login({
            userName: account,
            password: password
        })
            .then(res => {
                setLoading(false);
                if (res.data && res.data.token) {
                    const token = res.data.token;
                    dispatch({ type: 'modifyData', payload: { name: "token", newdata: token } });
                    localDown(token);
                    navigate('/exercises-list');
                } else {
                    // 处理登录失败情况
                    setAccountError("Your email or password seem to be incorrect. Please try again.");
                }
            })
            .catch(error => {
                setLoading(false);
                navigate('/exercises-list');
                console.error('Login error:', error);
                setAccountError("Your email or password seem to be incorrect. Please try again.");
            });
    };

    // 处理账号输入变化
    const handleAccountChange = (e) => {
        const value = e.target.value;
        setAccount(value);

        // 实时验证
        if (value && !validateEmail(value)) {
            setAccountError("email is not valid.");
        } else {
            setAccountError('');
        }
    };

    // 渲染浮动圆圈
    const renderFloatingCircles = () => {
        const circles = [];
        for (let i = 1; i <= 6; i++) {
            circles.push(
                <div key={i} className={`floating-circle circle-${i}`}></div>
            );
        }
        return circles;
    };

    return (
        <div>
            <div className="login-container">
                {renderFloatingCircles()}
                <div className="login-content">
                    <div className="login-left-panel login-panel">
                        <div className="title-decoration"></div>
                        <div className="login-title">
                            <div className="title-line first-line">Content</div>
                            <div className="highlight">Management</div>
                            <div className="title-line last-line">System</div>
                        </div>
                        <div className="login-description">Streamline your workflow with our powerful CMS</div>

                        <img className="login-img" src={loginLeftImg} alt="" />
                        <div className="login-company-info">成都莱嗯信息技术有限公司</div>
                    </div>

                    <div className="login-right-panel login-panel">
                        <div className="login-form">
                            <div className="login-header">
                                <img src={lionImg} alt="Logo" />
                                <div>CMS</div>
                            </div>
                            <div className="login-title">Welcome Back</div>
                            <div className="login-subtitle">Please sign in to continue</div>

                            <form onKeyDown={(e) => e.key === 'Enter' && login()}>
                                <div className="input-label">Email Address</div>
                                <div className="login-input-wrapper">
                                    <Input
                                        prefix={<UserOutlined />}
                                        className={accountError ? 'errorInput' : ''}
                                        placeholder="Enter email address..."
                                        value={account}
                                        onChange={handleAccountChange}
                                        onFocus={() => setAccountError('')}
                                    />
                                </div>
                                <div className="login-form-error">{accountError}</div>

                                <div className="input-label">Password</div>
                                <div className="login-input-wrapper">
                                    <Input.Password
                                        className={passwordError ? 'errorInput' : ''}
                                        prefix={<LockOutlined />}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setPasswordError('')}
                                        visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                                        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                                    />
                                </div>
                                <div className="login-form-error">{passwordError}</div>

                                <Button
                                    className="login-submit-button"
                                    type="primary"
                                    onClick={login}
                                    loading={loading}
                                    block
                                >
                                    <span className="btn-text">SIGN IN</span>
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* 密码重置对话框 */}
            <Modal
                title="Password Recovery"
                open={dialogVisible}
                onCancel={() => setDialogVisible(false)}
                footer={null}
                width={500}
                className="custom-dialog"
            >
                <div className="dialog-content">
                    <QuestionCircleOutlined style={{ fontSize: 64, color: '#4158d0', marginBottom: 24 }} />
                    <p>Please contact your system administrator for password reset assistance.</p>
                </div>
            </Modal>
        </div>
    );
};

export default Login;