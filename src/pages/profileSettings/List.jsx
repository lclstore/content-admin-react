import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
    Form,
    Input,
    Button,
    Switch,
    Card,
    Typography,
    Row,
    Col,
    Upload,
    Space,
    Modal,
    message,
} from 'antd';
import {
    CameraOutlined,
    EditOutlined,
    SaveOutlined,
    LogoutOutlined,
    DeleteOutlined,
    KeyOutlined,
    MailOutlined,
    CheckCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import './list.css';

const { Title, Text, Paragraph } = Typography;

/**
 * 个人设置页面组件
 * 提供用户资料、头像、密码和邮箱通知的管理功能
 */
export default function ProfileSettings() {
    const navigate = useNavigate();
    // 表单实例
    const [form] = Form.useForm();

    // 获取消息实例
    const [messageApi, contextHolder] = message.useMessage();

    // 创建统一的用户数据状态
    const [userData, setUserData] = useState({
        firstName: 'qweqe',
        lastName: 'weqeq1',
        email: '2123131231@io.kl',
    });

    // UI状态管理
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isEmailEditing, setIsEmailEditing] = useState(false);
    const [isPasswordEditing, setIsPasswordEditing] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 获取HeaderContext的方法，用于控制全局头部按钮
    const { setButtons, setButton } = useContext(HeaderContext);

    // 创建Upload组件引用
    const uploadRef = useRef(null);

    /**
     * 处理表单变更
     * 当用户修改表单时，标记表单为已修改状态
     */
    const handleFormChange = (changedValues, allValues) => {
        setIsFormDirty(true);
        setSaveSuccess(false);
        setUserData({
            ...userData,
            ...changedValues
        });
    };

    /**
     * 处理保存表单操作
     * 验证表单并提交数据
     */
    const handleSaveChanges = () => {
        setSaveLoading(true);
        form.validateFields().then(values => {
            // 去除首尾空格
            const trimmedValues = Object.keys(values).reduce((acc, key) => {
                acc[key] = typeof values[key] === 'string' ? values[key].trim() : values[key];
                return acc;
            }, {});

            console.log('Form values:', trimmedValues);
            // 实现保存更改的逻辑
            setTimeout(() => {
                messageApi.success('Info Updated');
                setIsFormDirty(false);
                setSaveLoading(false);
                setSaveSuccess(true);

                // 1秒后重置成功状态，重新启用按钮
                setTimeout(() => {
                    setSaveSuccess(false);
                    setButton('save', { disabled: true });
                }, 1000);
            }, 800);
        }).catch(err => {
            console.error('Validation failed:', err);
            setSaveLoading(false);
        });
    };

    /**
     * 设置全局头部保存按钮
     * 控制按钮的显示、文本和加载状态
     */
    useEffect(() => {
        setButtons([
            {
                key: 'save',
                text: 'Save Changes',
                icon: <SaveOutlined />,
                type: 'primary',
                disabled: !isFormDirty || saveLoading,
                loading: saveLoading,
                onClick: handleSaveChanges
            }
        ]);

        return () => {
            setButtons([]); // 清空按钮
        };
    }, [isFormDirty, saveLoading, handleSaveChanges, setButtons]);

    /**
     * 处理头像上传变更
     * @param {Object} info - 上传文件信息
     */
    const handleProfilePictureChange = (info) => {
        if (info.file.status === 'uploading') {
            return;
        }

        if (info.file.status === 'done') {
            // 获取上传的文件URL
            const imageUrl = info.file.response.url || URL.createObjectURL(info.file.originFileObj);
            setAvatarUrl(imageUrl);
            messageApi.success('Profile Picture uploaded successfully');
            setIsFormDirty(true);
        } else if (info.file.status === 'error') {
            messageApi.error('Failed to upload Profile Picture');
        }
    };

    /**
     * 处理邮箱编辑
     */
    const handleEmailEdit = () => {
        if (isEmailEditing) {
            // 保存邮箱
            form.validateFields(['email']).then(values => {
                setUserData({
                    ...userData,
                    email: values.email
                });
                setIsEmailEditing(false);
                messageApi.success('Email updated successfully');
                setIsFormDirty(true);
            }).catch(err => {
                console.error('邮箱验证失败:', err);
            });
        } else {
            // 开始编辑
            setIsEmailEditing(true);
            form.setFieldsValue({
                email: userData.email
            });
        }
    };

    /**
     * 处理密码编辑
     */
    const handlePasswordEdit = () => {
        if (isPasswordEditing) {
            // 保存密码
            form.validateFields(['newPassword']).then(values => {
                console.log('密码已更新:', values);
                setIsPasswordEditing(false);
                messageApi.success('Password updated successfully');
                setIsFormDirty(true);
                // 清空密码字段
                form.setFieldsValue({
                    newPassword: ''
                });
            }).catch(err => {
                console.error('密码验证失败:', err);
            });
        } else {
            // 开始编辑
            setIsPasswordEditing(true);
            // 清空密码字段
            form.setFieldsValue({
                newPassword: ''
            });
        }
    };

    /**
     * 处理退出登录操作
     */
    const handleSignOut = () => {
        setIsModalOpen(true);
    };
    const logout = () => {
        console.log('Signing out...');
        messageApi.success('Signed out successfully');
        navigate('/login');
        // 实际退出登录操作
    }

    /**
     * 触发头像上传点击
     */
    const triggerUploadClick = () => {
        if (uploadRef.current) {
            // 查找Upload组件内部的input元素并触发点击
            const inputElement = uploadRef.current.querySelector('input[type="file"]');
            if (inputElement) {
                inputElement.click();
            }
        }
    };

    // 上传按钮组件
    const uploadButton = (
        <div className="upload-button">
            <CameraOutlined className="upload-icon" />
        </div>
    );

    return (
        <div className="editor-form-container">
            {contextHolder}

            <Form
                form={form}
                layout="vertical"
                className="profile-form"
                initialValues={userData}
                onValuesChange={handleFormChange}
            >
                <div className="edit-form-item flex justify-between align-center">
                    <div className="profile-avatar-container">
                        <div ref={uploadRef}>
                            <Upload
                                name="avatar"
                                listType="picture-card"
                                className="avatar-uploader"
                                showUploadList={false}
                                action="/api/upload" // 替换为实际的上传地址
                                onChange={handleProfilePictureChange}
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="avatar-img"
                                    />
                                ) : (
                                    uploadButton
                                )}
                            </Upload>
                        </div>
                        <div className="profile-info">
                            <Title level={4} className="profile-picture-title">Profile Picture</Title>
                            <Paragraph type="secondary" className="profile-picture-desc">
                                We recommend using a square image
                            </Paragraph>
                        </div>
                    </div>
                    <Button color="default" variant="filled" className='change-btn' onClick={triggerUploadClick}>Change</Button>
                </div>
                <Form.Item
                    className='edit-form-item'
                    name="Name"
                    label="Name"

                    rules={[
                        { required: true, message: 'Please input your name!' },
                        { max: 100, message: 'Name cannot exceed 100 characters!' }
                    ]}
                >
                    <Input maxLength={100} placeholder="Enter your name." />
                </Form.Item>

                {/* 邮箱地址 */}
                <Form.Item
                    label="Email Address"
                    className='edit-form-item'
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter email address' },
                        { type: 'email', message: 'Please enter a valid email address' },
                        { max: 100, message: 'Email cannot exceed 100 characters!' }
                    ]}
                >
                    <div className="input-container">
                        <Input
                            disabled={!isEmailEditing}
                            prefix={<MailOutlined />}
                            defaultValue={userData.email}
                            maxLength={100}
                            placeholder="Enter your email address."
                        />
                        <Button
                            className='btn'
                            type={isEmailEditing ? "primary" : "default"}
                            onClick={handleEmailEdit}
                        >
                            {isEmailEditing ? 'Save' : 'Edit'}
                        </Button>
                    </div>
                </Form.Item>

                {/* 密码设置 */}
                <Form.Item
                    className='edit-form-item'
                    label="Password"
                    name={isPasswordEditing ? "newPassword" : undefined}
                    rules={isPasswordEditing ? [
                        { required: true, message: 'Please enter new password' },
                        { max: 100, message: 'Password cannot exceed 100 characters!' }
                    ] : []}
                >
                    <div className="input-container">
                        <Input.Password
                            disabled={!isPasswordEditing}
                            prefix={<KeyOutlined />}
                            placeholder='Enter new password.'
                            value={!isPasswordEditing ? "password123" : undefined}
                            maxLength={100}
                        />
                        <Button
                            className='btn'
                            type={isPasswordEditing ? "primary" : "default"}
                            onClick={handlePasswordEdit}
                        >
                            {isPasswordEditing ? 'Save' : 'Edit'}
                        </Button>
                    </div>
                </Form.Item>
            </Form>
            <Button
                block
                onClick={handleSignOut}
            >
                Sign out
            </Button>
            <Modal centered title="Confirm Sign Out？" open={isModalOpen} onOk={logout} onCancel={() => setIsModalOpen(false)}>
                <p>Are you sure you want to sign out of your account?</p>
            </Modal>
        </div>
    );
}