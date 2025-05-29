import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
    PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { HeaderContext } from '@/contexts/HeaderContext';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { Modal, message } from 'antd';
import CommonEditorForm from '@/components/CommonEditorForm';

export default function WorkoutsList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const navigate = useNavigate();
    const [messageApi, contextHolder] = message.useMessage();

    // 发布相关状态
    const [isPublishModalVisible, setIsPublishModalVisible] = useState(false);
    const [editorRef, setEditorRef] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    // 新增：当前环境状态
    const [currentEnv, setCurrentEnv] = useState('PRODUCTION');

    // 表单字段配置
    const formFields = useMemo(() => [
        {
            type: 'textarea',
            name: 'remark',
            label: 'Comment',
            required: true,
            maxLength: 1000,
            showCount: true,
            rows: 4,
            placeholder: 'Enter comment...'
        }
    ], []);

    // 处理发布提交
    const handlePublish = useCallback(async () => {
        try {
            if (editorRef?.triggerSave) {
                const ret = await editorRef.triggerSave('ENABLED', false);
                if (ret.success) {
                    messageApi.success('Published successfully');
                    setIsPublishModalVisible(false);
                    setRefreshKey(2);
                    if (editorRef.form) {
                        editorRef.form.resetFields();
                    }
                }
            }
        } catch (error) {

        }
    }, [editorRef, messageApi]);

    // 新增：统一的发布处理函数
    const handlePublishClick = useCallback((env) => {
        setIsPublishModalVisible(true);
        setRefreshKey(null);
        setCurrentEnv(env);
        setInitialValues({
            env: env,
        });
    }, []);

    // 表格渲染配置项
    const allColumnDefinitions = useMemo(() => {
        return [
            { title: 'Version', dataIndex: 'version', key: 'version', width: 80, visibleColumn: 0 },
            { title: 'Comment', dataIndex: 'remark', key: 'remark', visibleColumn: 1 },
            {
                title: 'User',
                dataIndex: 'createUser',
                key: 'createUser',
                width: 150,
                visibleColumn: 1
            },
            {
                title: 'Time',
                dataIndex: 'createTime',
                key: 'createTime',
                showSorterTooltip: false,
                width: 220,
                visibleColumn: 0
            },
            {
                title: 'Result',
                showSorterTooltip: false,
                align: 'center',
                dataIndex: 'status',
                width: 220,
                key: 'status',
                options: 'publishStatus',
                visibleColumn: 2,
            }
        ];
    }, []);
    const [initialValues, setInitialValues] = useState({});

    /**
     * 设置导航栏按钮
     */
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Publish');

        // 设置头部按钮
        setButtons([
            {
                key: 'publish',
                text: 'Publish',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => handlePublishClick('PRODUCTION'),
            },
            {
                key: 'prePublish',
                text: 'Pre-Publish',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => handlePublishClick('PRE_PRODUCTION'),
            }
        ]);

        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate, handlePublishClick]);

    //渲染表格组件
    return (
        <div className="workoutsContainer page-list">
            {contextHolder}
            <ConfigurableTable
                refreshKey={refreshKey}
                columns={allColumnDefinitions}
                moduleKey="publish"
                noDataTip="You don't have any publish records yet"
                showColumnSettings={false}
                onRowClick={(record) => { }}
                rowKey={(record) => `${record.version}-${record.createTime}`}
            />
            {/* 发布确认弹框 */}
            <Modal
                title={currentEnv === 'PRODUCTION' ? 'Publish' : 'Pre-Publish'}
                open={isPublishModalVisible}
                onOk={handlePublish}
                width={850}
                onCancel={() => {
                    setIsPublishModalVisible(false);
                    if (editorRef?.form) {
                        editorRef.form.resetFields();
                    }
                }}
                okText="Confirm"
                cancelText="Cancel"
                destroyOnClose
            >
                <div style={{ width: '802px' }}>
                    <CommonEditorForm
                        changeHeader={false}
                        formType="basic"
                        isBack={false}
                        config={{
                            formName: 'publish',
                            hideSaveButton: true,
                            hideBackButton: true,
                            layout: 'vertical'
                        }}
                        fields={formFields}
                        initialValues={initialValues}
                        moduleKey='publish'
                        operationName='publish'
                        setFormRef={setEditorRef}
                    />
                </div>
            </Modal>
        </div>
    );
}   