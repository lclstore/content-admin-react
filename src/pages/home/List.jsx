import styles from './list.module.css';
import { useEffect, useContext, useState, useMemo, useRef } from 'react';
import { PlusOutlined, InfoCircleOutlined, QuestionCircleOutlined, ProfileOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { useNavigate } from 'react-router-dom';
import { Button, Image, Tag, Timeline, Pagination, Modal, Form, Input, message, } from 'antd';
import appIcon from '@/assets/images/app-icon.png';
import CommonEditorForm from '@/components/CommonEditorForm';

export default function Home() {
    const [messageApi, contextHolder] = message.useMessage();
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    // APP信息数据对象
    const [appInfo, setAppInfo] = useState({
        appIcon: appIcon, // 系统默认图片
        name: 'web 单体应用 OOG-001',
        appCode: 'OOG-001'
    });

    // 日志信息数据
    const [logs] = useState([
        {
            version: 'v1.1.0',
            date: '2025-05-15',
            new: '首个正式版本上线',
            improved: '提升首页加载速度',
            fixed: '修复导出文件名乱码问题'
        },
        {
            version: 'v1.0.1',
            date: '2025-05-01',
            new: '新增数据导出功能',
            improved: '优化表单验证逻辑',
            fixed: '修复列表排序异常'
        },
        {
            version: 'v1.1.0',
            date: '2025-05-15',
            new: '首个正式版本上线',
            improved: '提升首页加载速度',
            fixed: '修复导出文件名乱码问题'
        },
        {
            version: 'v1.0.1',
            date: '2025-05-01',
            new: '新增数据导出功能',
            improved: '优化表单验证逻辑',
            fixed: '修复列表排序异常'
        },
        {
            version: 'v1.1.0',
            date: '2025-05-15',
            new: '首个正式版本上线',
            improved: '提升首页加载速度',
            fixed: '修复导出文件名乱码问题'
        },
        {
            version: 'v1.0.1',
            date: '2025-05-01',
            new: '新增数据导出功能',
            improved: '优化表单验证逻辑',
            fixed: '修复列表排序异常'
        }
    ]);
    // 添加展开状态管理，默认展开第一条
    const [expandedItems, setExpandedItems] = useState({
        0: true // 默认展开第一条
    });
    // 添加分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5; // 每页显示的日志数量

    // 添加Help弹框状态
    const [helpModalVisible, setHelpModalVisible] = useState(false);
    // 添加 App Info 弹框状态
    const [appInfoModalVisible, setAppInfoModalVisible] = useState(false);
    // 表单实例
    const [form] = Form.useForm();
    const formRef = useRef(null);
    const helpFormRef = useRef(null);
    // 添加 App Info 表单引用
    const appInfoFormRef = useRef(null);

    // 添加日志编辑相关状态
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [editingLogId, setEditingLogId] = useState(null);

    // Help Document表单字段配置
    const helpFormFields = useMemo(() => [
        {
            type: 'input',
            name: 'url',
            label: 'URL',
            maxLength: 100,
            showCount: true,
        },
        {
            type: 'input',
            name: 'name',
            label: 'Name',
            maxLength: 100,
            showCount: true,
        }
    ], []);

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'input',
            name: 'version',
            label: 'Version',
            maxLength: 100,
            required: true,
        },
        {
            type: 'date',
            name: 'date',
            label: 'Date',
            required: true,
            style: {
                width: '100%'
            }
        },
        {
            type: 'textarea',
            name: 'new',
            label: 'New',
            maxLength: 100,
            showCount: true,
        },
        {
            type: 'textarea',
            name: 'improved',
            label: 'Improved',
            maxLength: 100,
            showCount: true,
        },
        {
            type: 'textarea',
            name: 'fixed',
            label: 'Fixed',
            maxLength: 100,
            showCount: true,
        },
    ], []);

    // App Info 表单字段配置
    const appInfoFields = useMemo(() => [
        {
            type: 'upload',
            name: 'appIcon',
            label: 'App Icon',
            maxFileSize: 1024 * 1024 * 1,
            acceptedFileTypes: 'png,webp',
            maxCount: 1,
        },
        {
            type: 'input',
            name: 'name',
            label: 'Apple Store Name',
            maxLength: 100,
            placeholder: 'Enter app name'
        },
        {
            type: 'input',
            name: 'appCode',
            label: 'App Code',
            required: true,
            maxLength: 50,
            placeholder: 'Enter app code'
        }
    ], []);

    // 切换展开状态
    const toggleExpand = (index) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // 处理页码变化
    const handlePageChange = (page) => {
        setCurrentPage(page);
        setExpandedItems({ [((page - 1) * pageSize)]: true }); // 默认展开新页第一条
    };

    // 计算当前页的日志
    const getCurrentPageLogs = () => {
        const start = (currentPage - 1) * pageSize;
        return logs.slice(start, start + pageSize);
    };

    // 渲染日志内容
    const renderLogContent = (log) => (
        <div className={styles.logsBody}>
            {log.new && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="success">New</Tag>
                    </div>
                    <div className={styles.logContent}>{log.new}</div>
                </div>
            )}
            {log.improved && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="processing">Improved</Tag>
                    </div>
                    <div className={styles.logContent}>{log.improved}</div>
                </div>
            )}
            {log.fixed && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="warning">Fixed</Tag>
                    </div>
                    <div className={styles.logContent}>{log.fixed}</div>
                </div>
            )}
        </div>
    );

    // 处理Help弹框提交
    const handleHelpSubmit = async () => {
        try {
            if (helpFormRef.current) {
                const { form } = helpFormRef.current;
                await form.validateFields();
                const values = form.getFieldsValue();
                console.log('Help提交的值:', values);
                setHelpModalVisible(false);
                messageApi.success('Link added');
                form.resetFields();
            }
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };

    // 处理 App Info 提交
    const handleAppInfoSubmit = async () => {
        try {
            if (appInfoFormRef.current) {
                const { form } = appInfoFormRef.current;
                await form.validateFields();
                const values = form.getFieldsValue();
                console.log('App Info 提交的值:', values);
                // TODO: 这里添加实际的保存逻辑
                // setAppInfo(values); // 更新 App Info
                messageApi.success('Info Updated');
                setAppInfo({
                    appIcon: appIcon, // 系统默认图片
                    name: 'web 单体应用 OOG-001',
                    appCode: 'OOG-001'
                })
                setAppInfoModalVisible(false);
                form.resetFields();

            }
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };

    // 打开日志编辑弹窗
    const showLogModal = (id = null) => {
        setEditingLogId(id);
        setLogModalVisible(true);
    };

    // 关闭日志编辑弹窗
    const handleLogModalCancel = () => {
        setLogModalVisible(false);
        setEditingLogId(null);
    };

    // 处理日志提交
    const handleLogSubmit = async () => {
        try {
            if (formRef.current) {
                const { form } = formRef.current;
                await form.validateFields();
                const values = form.getFieldsValue();
                console.log('提交的日志数据:', values);

                // TODO: 这里添加实际的保存逻辑

                handleLogModalCancel();
                form.resetFields();
                messageApi.success('Log Added');
            }
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };
    useEffect(() => {
        setAppInfo(null)
    }, []);

    return (
        <div className={styles.homeContainer}>
            {contextHolder}
            <div className={styles.homeSidebar}>
                <div className={`${styles.homeBox} ${styles.info}`}>
                    <div className={styles.titleBar}>
                        <div className={styles.titleBarLeft}>
                            <InfoCircleOutlined className={styles.titleIcon} />
                            <span>Info</span>
                        </div>
                        <span></span>
                    </div>
                    <div className={`${styles.homeContent} ${styles.infoContent}`}>
                        {appInfo ? (
                            // 当 appInfo 有值时渲染内容
                            <div className={styles.infoItem}>
                                <div className={styles.infoItemLeft}>
                                    <Image
                                        preview={{
                                            mask: null
                                        }}
                                        style={{
                                            cursor: 'pointer'
                                        }}
                                        src={appInfo.appIcon}
                                        alt="APP Icon"
                                        width={80}
                                        height={80}
                                        fallback="/default-app-icon.png"
                                    />
                                </div>
                                <div className={styles.infoItemRight}>
                                    <div className={styles.infoItemRightTitle}>{appInfo.name}</div>
                                    <div className={styles.infoItemRightContent}>{appInfo.appCode}</div>
                                </div>
                            </div>
                        ) : (
                            // 当 appInfo 为 null 时显示添加按钮
                            <div className={styles.emptyInfo}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAppInfoModalVisible(true)}
                                >
                                    Add App Info
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <div className={`${styles.homeBox} ${styles.help}`}>
                    <div className={styles.titleBar}>
                        <div className={styles.titleBarLeft}>
                            <QuestionCircleOutlined className={styles.titleIcon} />
                            <span> Help & Support</span>
                        </div>
                        <span className={styles.addIcon} onClick={() => setHelpModalVisible(true)}>
                            <PlusOutlined className={styles.titleIcon} />Add
                        </span>
                    </div>
                    <div className={`${styles.homeContent} ${styles.helpContent}`}>
                        <Button
                            type="primary"
                            className={styles.helpButton}
                            onClick={() => window.open('https://api-docs-url', '_blank')}
                        >
                            API Docs
                        </Button>
                        <Button
                            type="primary"
                            className={styles.helpButton}
                            onClick={() => window.open('https://prd-url', '_blank')}
                        >
                            PRD
                        </Button>
                    </div>
                </div>
            </div>
            <div className={`${styles.homeBox} ${styles.logs}`}>
                <div className={styles.titleBar}>
                    <div className={styles.titleBarLeft}>
                        <ProfileOutlined className={styles.titleIcon} />
                        <span>Changelogs</span>
                    </div>
                    <span className={styles.addIcon} onClick={() => showLogModal()}>
                        <PlusOutlined className={styles.titleIcon} />Add
                    </span>
                </div>
                <div className={`${styles.homeContent} ${styles.logsContent}`}>
                    {/* 使用时间轴展示所有日志 */}
                    <div className={styles.timelineContainer}>
                        <Timeline
                            items={getCurrentPageLogs().map((log, index) => ({
                                key: index,
                                children: (
                                    <div
                                        className={styles.timelineItem}
                                        onClick={() => toggleExpand(index)}
                                    >
                                        <div className={styles.timelineHeader}>
                                            <Tag color="blue" className={styles.versionTag}>{log.version}</Tag>
                                            <span className={styles.date}>{log.date}</span>
                                        </div>
                                        {expandedItems[index + ((currentPage - 1) * pageSize)] && renderLogContent(log)}
                                    </div>
                                )
                            }))}
                        />
                        <div className={styles.paginationContainer}>
                            <Pagination
                                current={currentPage}
                                total={logs.length}
                                pageSize={pageSize}
                                onChange={handlePageChange}
                                size="small"
                                showTotal={(total) => `${total} items`}
                                showSizeChanger={false}
                            />
                        </div>
                    </div>

                </div>

            </div>

            {/* Help & Support 添加弹框 */}
            <Modal
                title="Add Help Document"
                open={helpModalVisible}
                onOk={handleHelpSubmit}
                onCancel={() => setHelpModalVisible(false)}
                width={600}
                destroyOnClose
            >
                <div className={styles.formWrapper}>
                    <CommonEditorForm
                        changeHeader={false}
                        formType="basic"
                        isBack={false}
                        config={{
                            formName: 'Help Document',
                            hideSaveButton: true,
                            hideBackButton: true,
                            layout: 'vertical'
                        }}
                        fields={helpFormFields}
                        initialValues={{}}
                        moduleKey="help"
                        setFormRef={ref => helpFormRef.current = ref}
                    />
                </div>
            </Modal>

            {/* 日志编辑弹窗 */}
            <Modal
                title={editingLogId ? "Edit Log" : "Add Log"}
                open={logModalVisible}
                onCancel={handleLogModalCancel}
                onOk={handleLogSubmit}
                width={600}
                destroyOnClose
            >
                <div className={styles.formWrapper}>
                    <CommonEditorForm
                        changeHeader={false}
                        formType="basic"
                        isBack={false}
                        config={{
                            formName: 'Log',
                            hideSaveButton: true,
                            hideBackButton: true,
                            layout: 'vertical'
                        }}
                        fields={formFields}
                        initialValues={{}}
                        id={editingLogId}
                        moduleKey="log"
                        setFormRef={ref => formRef.current = ref}
                    />
                </div>
            </Modal>

            {/* App Info 编辑弹框 */}
            <Modal
                title="Add App Info"
                open={appInfoModalVisible}
                onOk={handleAppInfoSubmit}
                onCancel={() => setAppInfoModalVisible(false)}
                width={700}
                destroyOnClose
            >
                <div className={styles.formWrapper}>
                    <CommonEditorForm
                        changeHeader={false}
                        formType="basic"
                        isBack={false}
                        config={{
                            formName: 'App Info',
                            hideSaveButton: true,
                            hideBackButton: true,
                            layout: 'vertical'
                        }}
                        fields={appInfoFields}
                        initialValues={{}}
                        moduleKey="appInfo"
                        setFormRef={ref => appInfoFormRef.current = ref}
                    />
                </div>
            </Modal>
        </div>
    );
}