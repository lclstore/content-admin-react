import styles from './list.module.css';
import { useEffect, useContext, useState, useMemo, useRef, useCallback } from 'react';
import { PlusOutlined, InfoCircleOutlined, QuestionCircleOutlined, ProfileOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { useNavigate } from 'react-router';
import { Button, Image, Tag, Timeline, Pagination, Modal, Form, Input, message, } from 'antd';
import appIcon from '@/assets/images/app-icon.png';
import CommonEditorForm from '@/components/CommonEditorForm';
import request from '@/request';
export default function Home() {
    const [messageApi, contextHolder] = message.useMessage();
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    // APP信息数据对象
    const [appInfo, setAppInfo] = useState();
    const [logs, setLogs] = useState([]);
    const [helps, setHelps] = useState([]);
    // 添加分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5; // 每页显示的日志数量

    // 添加展开状态管理，默认展开第一条
    const [expandedItems, setExpandedItems] = useState({
        0: true // 默认展开第一条
    });


    // 获取appInfo
    const getInfo = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/home/info`,
                load: true,
                callback: res => {
                    if (res.data.success) {
                        setAppInfo(res?.data?.data || null);
                    }
                }
            });
        })
    }
    // 日志分页参数
    const logsParams = useRef({
        pageIndex: 1,
        pageSize: 10,
        totalCount: 0
    })
    // 获取logs
    const getLogs = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/home/changelogs/page`,
                load: true,
                data: logsParams.current,
                callback: res => {
                    if (res.data.success) {
                        setLogs(res?.data?.data || []);
                        logsParams.current.totalCount = res?.data?.totalCount || 0;
                    }
                }
            });
        })
    }
    // 获取helps
    const getHelps = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/home/helps/page`,
                load: true,
                data: {
                    page: 1,
                    pageSize: 99999
                },
                callback: res => {
                    if (res.data.success) {
                        setHelps(res?.data?.data || []);
                    }
                }
            });
        })
    }


    useEffect(() => {
        getInfo();
        getLogs();
        getHelps();
        setCustomPageTitle('Home');
    }, [])
    // 切换展开状态
    const toggleExpand = (index) => {
        // 创建新的展开状态对象，所有项都设置为false
        const newExpandedItems = {};
        Object.keys(expandedItems).forEach(key => {
            newExpandedItems[key] = false;
        });

        // 只设置当前点击项的状态
        newExpandedItems[index] = !expandedItems[index];
        setExpandedItems(newExpandedItems);
    };

    // 处理页码变化
    const handlePageChange = (page) => {
        setCurrentPage(page);
        // 切换页面时，默认展开新页第一条，其他收起
        const newExpandedItems = {};
        const firstItemIndex = (page - 1) * pageSize;
        newExpandedItems[firstItemIndex] = true;
        setExpandedItems(newExpandedItems);
    };

    // 计算当前页的日志
    const getCurrentPageLogs = () => {
        const start = (currentPage - 1) * pageSize;
        return logs.slice(start, start + pageSize);
    };
    // Help Document表单字段配置
    const helpFormFields = useMemo(() => [

        {
            type: 'input',
            name: 'name',
            label: 'Name',
            required: true,
            maxLength: 100,
            showCount: true,
        },
        {
            type: 'input',
            name: 'url',
            label: 'URL',
            required: true,
            maxLength: 1000,
            showCount: true,
            rules: [{
                pattern: /^(https?:\/\/)([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
                message: 'Please enter a valid URL'
            }]
        },
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
            name: 'newInfo',
            label: 'New Info',
            maxLength: 1000,
            showCount: true,
        },
        {
            type: 'textarea',
            name: 'improvedInfo',
            label: 'Improved Info',
            maxLength: 1000,
            showCount: true,
        },
        {
            type: 'textarea',
            name: 'fixedInfo',
            label: 'Fixed Info',
            maxLength: 1000,
            showCount: true,
        },
    ], []);

    // App Info 表单字段配置
    const appInfoFields = useMemo(() => [
        {
            type: 'upload',
            name: 'appIcon',
            label: 'App Icon',
            maxFileSize: 1024 * 1,
            acceptedFileTypes: 'png,webp',
            maxCount: 1,
        },
        {
            type: 'input',
            name: 'appStoreName',
            label: 'Apple Store Name',
            maxLength: 100,
        },
        {
            type: 'input',
            name: 'appCode',
            label: 'App Code',
            required: true,
            maxLength: 50,
        }
    ], []);

    // 统一的弹框配置
    const modalConfigs = useMemo(() => ({
        help: {
            title: 'Add Help Document',
            width: 600,
            formName: 'Help Document',
            fields: helpFormFields,
            successMessage: 'Link added',
            operationName: 'addHelps'
        },
        log: {
            title: 'Add Log',
            width: 600,
            formName: 'Log',
            fields: formFields,
            successMessage: 'Log Added',
            operationName: 'addChangeLogs'
        },
        appInfo: {
            title: 'Add App Info',
            width: 700,
            formName: 'App Info',
            fields: appInfoFields,
            successMessage: 'Info Updated',
            operationName: 'save'
        }
    }), [helpFormFields, formFields, appInfoFields]);

    // 当前激活的弹框类型
    const [activeModalType, setActiveModalType] = useState(null);

    // 统一的弹框状态管理
    const [modalStates, setModalStates] = useState({
        help: false,
        log: false,
        appInfo: false
    });

    // 统一的编辑器引用
    const [editorRef, setEditorRef] = useState(null);

    // 渲染日志内容
    const renderLogContent = (log) => (
        <div className={styles.logsBody}>
            {log.newInfo && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="success">New</Tag>
                    </div>
                    <div className={styles.logContent}>{log.newInfo}</div>
                </div>
            )}
            {log.improvedInfo && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="processing">Improved</Tag>
                    </div>
                    <div className={styles.logContent}>{log.improvedInfo}</div>
                </div>
            )}
            {log.fixedInfo && (
                <div className={styles.logSection}>
                    <div className={styles.logLabel}>
                        <Tag color="warning">Fixed</Tag>
                    </div>
                    <div className={styles.logContent}>{log.fixedInfo}</div>
                </div>
            )}
        </div>
    );

    // 统一的打开弹框方法
    const showModal = (type) => {
        setActiveModalType(type);
        setModalStates(prev => ({
            ...prev,
            [type]: true
        }));
    };

    // 统一的关闭弹框方法
    const hideModal = (type) => {
        setModalStates(prev => ({
            ...prev,
            [type]: false
        }));
        setActiveModalType(null);
        setEditorRef(null); // 清空编辑器引用
    };

    // 统一的表单提交处理方法
    const handleModalSubmit = async (type) => {
        try {
            if (editorRef?.triggerSave) {
                const ret = await editorRef.triggerSave('ENABLED', false);
                if (ret.success) {
                    messageApi.success(modalConfigs[type].successMessage);

                    // 特殊处理 appInfo 的情况
                    if (type === 'appInfo') {
                        getInfo()// 获取appInfo
                    } else if (type === 'log') {
                        getLogs()// 获取logs
                    } else if (type === 'help') {
                        getHelps()// 获取helps
                    }

                    hideModal(type);
                    editorRef.form.resetFields();
                }
            }
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };


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
                                            cursor: 'pointer',
                                            borderRadius: '6px'
                                        }}
                                        src={appInfo.appIcon}
                                        alt="APP Icon"
                                        width={80}
                                        height={80}
                                        fallback={appIcon}
                                    />
                                </div>
                                <div className={styles.infoItemRight}>
                                    <div className={styles.infoItemRightTitle}>{appInfo.appStoreName}</div>
                                    <div className={styles.infoItemRightContent}>{appInfo.appCode}</div>
                                </div>
                            </div>
                        ) : (
                            // 当 appInfo 为 null 时显示添加按钮
                            <div className={styles.emptyInfo}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => showModal('appInfo')}
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
                        <span className={styles.addIcon} onClick={() => showModal('help')}>
                            <Button type="primary" icon={<PlusOutlined />}  >Add</Button>
                        </span>
                    </div>
                    <div className={`${styles.homeContent} ${styles.helpContent}`}>
                        {helps.map((help, index) => (
                            <Button
                                key={index}
                                style={{
                                    color: '#243636b3',
                                }}
                                className={styles.helpButton}
                                onClick={() => window.open(help.url, '_blank')}
                            >
                                {help.name}
                            </Button>
                        ))}

                    </div>
                </div>
            </div>
            <div className={`${styles.homeBox} ${styles.logs}`}>
                <div className={styles.titleBar}>
                    <div className={styles.titleBarLeft}>
                        <ProfileOutlined className={styles.titleIcon} />
                        <span>Changelogs</span>
                    </div>
                    <span className={styles.addIcon} onClick={() => showModal('log')}>
                        <Button type="primary" icon={<PlusOutlined />}  >Add</Button>
                    </span>
                </div>
                <div className={`${styles.homeContent} ${styles.logsContent}`}>
                    {/* 使用时间轴展示所有日志 */}
                    <div className={styles.timelineContainer}>
                        <Timeline
                            items={logs.map((log, index) => ({
                                key: index,
                                children: (
                                    <div
                                        className={styles.timelineItem}
                                        onClick={() => toggleExpand(index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.timelineHeader}>
                                            <Tag color="blue" className={styles.versionTag}>{log.version}</Tag>
                                            <span className={styles.date}>{log.date}</span>
                                        </div>
                                        {expandedItems[index] && renderLogContent(log)}
                                    </div>
                                )
                            }))}
                        />
                    </div>
                    <div className={styles.paginationContainer}>
                        <Pagination
                            current={logsParams.current.pageIndex}
                            total={logsParams.current.totalCount}
                            pageSize={logsParams.current.pageSize}
                            onChange={handlePageChange}
                            size="small"
                            showTotal={(total) => `${total} items`}
                            showSizeChanger={false}
                        />
                    </div>
                </div>
            </div>

            {/* 统一的弹框组件 */}
            {activeModalType && (
                <Modal
                    title={modalConfigs[activeModalType].title}
                    open={modalStates[activeModalType]}
                    okText="Confirm"
                    cancelText="Cancel"
                    onOk={() => handleModalSubmit(activeModalType)}
                    onCancel={() => hideModal(activeModalType)}
                    width={850}
                    destroyOnClose
                >
                    <div  >
                        <CommonEditorForm
                            changeHeader={false}
                            formType="basic"
                            isBack={false}
                            config={{
                                formName: modalConfigs[activeModalType].formName,
                                hideSaveButton: true,
                                hideBackButton: true,
                                layout: 'vertical'
                            }}
                            fields={modalConfigs[activeModalType].fields}
                            initialValues={{}}
                            moduleKey='home'
                            operationName={modalConfigs[activeModalType].operationName}
                            setFormRef={setEditorRef}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}