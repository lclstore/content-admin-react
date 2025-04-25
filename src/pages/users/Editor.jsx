import React, { useContext, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 导入 useLocation 和 useNavigate
import {
    Form,
    Input,
    Button,
    Avatar,
    Upload,
    Card,
    Row,
    Col,
    Switch,
    Typography,
    message,
    Space, // Import Space
} from 'antd';
import { UserOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import '@/pages/profileSettings/list.css'; // 引入样式

const { Title, Text } = Typography;
const { useWatch } = Form; // 导入 useWatch

// 模拟用户数据 (与 UsersList.jsx 中的数据保持一致)
const mockUsers = [
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Admin',
        createTime: '2024-01-15 10:00:00',
        status: 'Enable'
    },
    {
        id: 2,
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        avatar: '',
        createUser: 'Admin',
        createTime: '2024-01-16 14:30:00',
        status: 'Enable'
    },
    {
        id: 3,
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        avatar: null,
        createUser: 'Manager',
        createTime: '2024-01-17 09:15:00',
        status: 'Disable'
    },
    {
        id: 4,
        name: 'Sarah Davis',
        email: 'sarah.davis@example.com',
        avatar: 'https://hhcontent.s3.eu-central-1.amazonaws.com/u/67e4f264b1cc900012418c93/profile/i/5bfa5d43a78441ee8b20be70b7ce56c0%20%281%29.png-320x320.png',
        createUser: 'Manager',
        createTime: '2024-01-18 16:45:00',
        status: 'Enable'
    }
];

// 初始用户数据结构
const initialUserData = {
    id: null, // 新增用户时 id 为 null
    name: '',
    email: '',
    avatar: '',
    status: true, // 默认状态为 Enable (true)
    createUser: '', // 模拟创建者
    createTime: '', // 模拟创建时间
};

export default function UsersEditor() {
    // 获取header上下文中的保存按钮状态设置函数和自定义标题设置函数
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const location = useLocation(); // 获取 location 对象
    const searchParams = new URLSearchParams(location.search); // 解析查询字符串
    const userId = searchParams.get('id'); // 获取 'id' 参数的值 (重命名为 userId 避免与 HTML id 冲突)
    const navigate = useNavigate(); // 获取 navigate 函数
    // 表单实例
    const [form] = Form.useForm();
    // 用户数据状态
    const [userData, setUserData] = useState(initialUserData); // 使用 initialUserData
    // 头像 URL 状态
    const [avatarUrl, setAvatarUrl] = useState(userData.avatar || '');
    // 表单是否被修改
    const [isFormDirty, setIsFormDirty] = useState(false);
    // 保存按钮 loading 状态
    const [saveLoading, setSaveLoading] = useState(false);
    // 保存成功状态
    const [saveSuccess, setSaveSuccess] = useState(false);
    // antd 消息提示
    const [messageApi, contextHolder] = message.useMessage();
    const uploadRef = useRef(null); // Create ref for Upload component

    // 如果是编辑模式 (userId 存在)，加载用户数据
    useEffect(() => {
        const currentId = userId ? parseInt(userId, 10) : null; // 将 id 字符串转为数字，若不存在则为 null
        if (currentId !== null) {
            console.log('Editing user with ID:', currentId);
            // --- 从模拟数据中查找用户 ---
            const userToEdit = mockUsers.find(user => user.id === currentId);

            if (userToEdit) {
                setUserData(userToEdit); // 更新 userData 状态
                form.setFieldsValue({ // 使用获取的数据填充表单
                    name: userToEdit.name,
                    email: userToEdit.email,
                    status: userToEdit.status === 'Enable', // 将状态字符串转为布尔值
                });
                setAvatarUrl(userToEdit.avatar || ''); // 更新头像 URL
                setIsFormDirty(false); // 加载数据后，表单初始状态不是脏的
            } else {
                console.error("User not found with ID:", currentId);
                messageApi.error("User not found. Redirecting to user list.");
                // 如果用户不存在，可以跳转回列表页
                setTimeout(() => navigate('/users'), 2000);
            }
            // --- 实际场景替换为 API 调用 ---
            // fetchUserData(currentId).then(data => {
            //     setUserData(data);
            //     form.setFieldsValue({
            //         name: data.name,
            //         email: data.email,
            //         status: data.status === 'Enable',
            //     });
            //     setAvatarUrl(data.avatar || '');
            //     setIsFormDirty(false);
            // }).catch(error => {
            //     console.error("Failed to fetch user data:", error);
            //     messageApi.error("Failed to load user data.");
            //     // 可选：跳转回列表页
            //     // setTimeout(() => navigate('/users'), 2000);
            // });
        } else {
            // 新增模式，重置状态和表单
            console.log('Adding new user');
            setUserData(initialUserData);
            form.resetFields(); // 重置表单为 initialValues (如果定义了) 或空值
            setAvatarUrl('');
            setIsFormDirty(false); // 新表单初始不是脏的
        }
    }, [userId, form, messageApi, navigate]); // 添加 navigate 到依赖项

    // 处理返回按钮点击
    const handleBackClick = () => {
        navigate(-1); // 返回上一页
    };

    // 设置顶部保存按钮状态和页面标题
    useEffect(() => {
        const title = userId ? 'Edit User' : 'Add User';
        setCustomPageTitle(title);

        setButtons([
            {
                key: 'save',
                text: 'Save',
                type: 'primary',
                loading: saveLoading,
                disabled: !isFormDirty || saveSuccess,
                onClick: handleSaveChanges,
                icon: SaveOutlined
            },
            {
                key: 'back',
                text: 'Back',
                onClick: () => navigate('/users')
            }
        ]);

        return () => {
            setButtons([]); // 清空按钮
            setCustomPageTitle(null);
        };
    }, [userId, saveLoading, isFormDirty, saveSuccess, setButtons, setCustomPageTitle, navigate]); // 依赖更新

    /**
     * 处理表单字段变化
     */
    const handleFormChange = (changedValues, allValues) => {
        setIsFormDirty(true);
        setSaveSuccess(false);
    };

    /**
     * 处理保存操作
     */
    const handleSaveChanges = () => {
        setSaveLoading(true);
        form.validateFields()
            .then(values => {
                const dataToSave = {
                    ...(userId && { id: parseInt(userId, 10) }), // 编辑模式下添加数字类型的 id
                    ...values,
                    avatar: avatarUrl,
                    status: values.status ? 'Enable' : 'Disable',
                    // 编辑模式保留创建信息，新增模式不包含
                    ...(userId ? { createUser: userData.createUser, createTime: userData.createTime } : {}),
                };
                const trimmedData = Object.keys(dataToSave).reduce((acc, key) => {
                    acc[key] = typeof dataToSave[key] === 'string' ? dataToSave[key].trim() : dataToSave[key];
                    return acc;
                }, {});

                console.log('Saving user data:', trimmedData);
                // TODO: 调用 API 保存用户数据 (区分新增和编辑)
                // const saveApiCall = userId ? updateUser(parseInt(userId, 10), trimmedData) : createUser(trimmedData);
                // saveApiCall.then(() => { ... }).catch(() => { ... });

                // 模拟 API 调用
                setTimeout(() => {
                    messageApi.success('User data saved successfully!');
                    setSaveLoading(false);
                    setIsFormDirty(false);
                    setSaveSuccess(true);
                    // setUserData(prev => ({ ...prev, ...trimmedData })); // 可选：更新本地状态
                    setTimeout(() => setSaveSuccess(false), 1000);
                    // TODO: 保存成功后跳转回列表页
                    // navigate('/users');
                }, 800);
            })
            .catch(err => {
                console.error('Validation failed:', err);
                setSaveLoading(false);
                messageApi.error('Please check the form fields.');
            });
    };

    /**
     * 处理头像上传
     */
    const handleProfilePictureChange = (info) => {
        if (info.file.status === 'uploading') {
            return;
        }
        if (info.file.status === 'done') {
            // const imageUrl = info.file.response?.url; // 尝试从 response 获取 URL
            const imageUrl = URL.createObjectURL(info.file.originFileObj); // 本地预览
            if (imageUrl) {
                setAvatarUrl(imageUrl);
                setIsFormDirty(true);
                setSaveSuccess(false);
                messageApi.success('Avatar uploaded successfully');
            } else {
                messageApi.error('Failed to get image URL');
            }
        } else if (info.file.status === 'error') {
            messageApi.error(`Avatar upload failed: ${info.file.error?.message || 'Unknown error'}`);
        }
    };

    /**
     * 上传前的校验 (示例)
     */
    const beforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!'); // 直接使用 message
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!'); // 直接使用 message
        }
        return isJpgOrPng && isLt2M;
    };

    /**
     * 触发头像上传点击
     */
    const triggerUploadClick = () => {
        if (uploadRef.current) {
            const internalInput = uploadRef.current?.upload?.uploader?.fileInput;
            if (internalInput) {
                internalInput.click();
            } else {
                const inputElement = uploadRef.current.querySelector('input[type="file"]');
                if (inputElement) {
                    inputElement.click();
                }
            }
        }
    };

    return (
        <div className="editor-form-container">
            {contextHolder}
            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleFormChange} // 监听表单变化
                initialValues={{ // 设置表单初始值 (主要用于新增模式)
                    name: initialUserData.name,
                    email: initialUserData.email,
                    status: initialUserData.status, // 直接使用布尔值
                }}
            >

                <div className="edit-form-item flex justify-between align-center" style={{ marginBottom: '24px' }}> {/* Use consistent class */}
                    <div className="profile-avatar-container"> {/* 容器包裹头像和信息 */}
                        <Form.Item noStyle> {/* Use Form.Item for consistency, but no data binding needed here */}
                            <div ref={uploadRef}>
                                <Upload
                                    name="avatar" // 后端接收文件的字段名
                                    listType="picture-card" // 卡片样式
                                    className="avatar-uploader" // 复用样式类
                                    showUploadList={false} // 不显示默认的文件列表
                                    action="/api/upload/avatar" // TODO: 替换为你的上传 API 地址
                                    beforeUpload={beforeUpload} // 添加上传前的校验
                                    onChange={handleProfilePictureChange} // 处理上传状态变化
                                    accept=".jpg,.jpeg,.png" // 限制文件类型
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="avatar-img" /> // 显示头像
                                    ) : (
                                        <div className="upload-button"> {/* 上传按钮占位 */}
                                            <UserOutlined style={{ fontSize: '32px', color: '#999' }} />
                                        </div>
                                    )}
                                </Upload>
                            </div>
                        </Form.Item>
                        <div className="profile-info"> {/* 文字信息 */}
                            <Title level={5} className="profile-picture-title" style={{ marginBottom: '4px' }}>User Avatar</Title> {/* 调整标题样式 */}
                            <Text type="secondary" className="profile-picture-desc">
                                JPG or PNG. Max size 2MB. {/* 更新提示文字 */}
                            </Text>
                        </div>
                    </div>
                    {/* Add Change Button */}
                    <Button color="default" variant="filled" className='change-btn' onClick={triggerUploadClick}>Change</Button>
                </div>

                {/* 分隔线 (可选) */}
                {/* <Divider className="divider" /> */}

                {/* 基本信息表单项 - 移除 Row 和 Col */}
                <Form.Item
                    name="name"
                    label="Name" // 中文注释：姓名
                    rules={[{ required: true, message: 'Please input the user name!' }]}
                >
                    <Input placeholder="Enter user name" />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email Address" // 中文注释：邮箱地址
                    rules={[
                        { required: true, message: 'Please input the email!' },
                        { type: 'email', message: 'The input is not valid E-mail!' },
                    ]}
                >
                    <Input placeholder="Enter email address" />
                </Form.Item>

                {/* 状态 - Corrected Structure */}
                <Form.Item label="Status">
                    <Space>
                        {/* Form.Item for the Switch control */}
                        <Form.Item
                            name="status"
                            valuePropName="checked"
                            noStyle // Remove default margin/style
                        >
                            <Switch />
                        </Form.Item>
                        {/* Form.Item for the dependent Text display */}
                        <Form.Item dependencies={['status']} noStyle>
                            {({ getFieldValue }) => {
                                const isEnabled = getFieldValue('status');
                                return (
                                    <Text style={{ color: isEnabled ? 'var(--success-color)' : 'var(--error-color)' }}>
                                        {isEnabled ? 'Enable' : 'Disable'}
                                    </Text>
                                );
                            }}
                        </Form.Item>
                    </Space>
                </Form.Item>

                {/* 创建信息 (只在编辑模式下显示) */}
                {userId && userData.id && ( // 确保 userId 和 userData.id 都存在
                    <>
                        {/* 移除 Row 和 Col */}
                        <Form.Item label="Create User" style={{ marginTop: '16px' }}> {/* 中文注释：创建用户 */}
                            {/* 注意：userData 可能在编辑模式下延迟加载 */}
                            <Input value={userData?.createUser || 'N/A'} disabled />
                        </Form.Item>

                        <Form.Item label="Create Time"> {/* 中文注释：创建时间 */}
                            <Input value={userData?.createTime ? new Date(userData.createTime).toLocaleString() : 'N/A'} disabled />
                        </Form.Item>
                    </>
                )}

                {/* 页面底部的保存按钮已移至 HeaderContext 控制的全局 Header */}
            </Form>
        </div >
    );
}