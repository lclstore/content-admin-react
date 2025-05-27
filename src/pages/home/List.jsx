import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import HomeEditorWithCommon from './Editor';

export default function HomeList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const [actionClicked, setActionClicked] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [isEditorModalVisible, setIsEditorModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editorActionsRef, setEditorActionsRef] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // 0 表示不刷新 1. 表示当前页面刷新 2. 表示全局刷新

    // 编辑处理
    const handleEdit = useCallback((record) => {
        setEditingId(record?.id || null);
        setIsEditorModalVisible(true);
    }, []);

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        if (status === 'ENABLE' && ['disable'].includes(btnName)) return true;
        if (status === 'DISABLE' && ['enable'].includes(btnName)) return true;
        return false;
    }, []);

    // 表格列定义
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'App Code',
                dataIndex: 'appCode',
                key: 'appCode',
                width: 200,
                visibleColumn: 0
            },
            {
                title: 'Apple Store Name',
                dataIndex: 'appleStoreName',
                key: 'appleStoreName',
                width: 200,
                visibleColumn: 0
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                options: 'displayStatus',
                width: 120,
                visibleColumn: 0
            },
            {
                title: 'Create Time',
                dataIndex: 'createTime',
                key: 'createTime',
                showSorterTooltip: false,
                width: 180,
                visibleColumn: 0,
                render: (createTime) => formatDate(createTime, 'YYYY-MM-DD HH:mm:ss')
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                actionButtons: ['enable', 'disable'],
                isShow: isButtonVisible,
            }
        ];
    }, [isButtonVisible]);

    // 处理行点击
    const handleRowClick = useCallback((record, event) => {
        if (actionClicked) {
            setActionClicked(false);
            return;
        }

        const isActionClick = event.target.closest('.actions-container');
        if (isActionClick) {
            return;
        }

        handleEdit(record);
    }, [actionClicked, handleEdit]);

    // 提交form
    const handleModalSubmit = async () => {
        if (editorActionsRef && editorActionsRef.triggerSave) {
            const statusToSave = 'ENABLE'; // 默认为 ENABLE
            let ret = await editorActionsRef.triggerSave(statusToSave, false);
            if (ret.success) {
                messageApi.success(ret.message || 'Save successful!');
                setIsEditorModalVisible(false);
                setEditingId(null);
                setRefreshKey(editingId ? 1 : 2);
            }
        }
    };

    useEffect(() => {
        setCustomPageTitle && setCustomPageTitle('Home');

        setButtons([
            {
                key: 'create',
                text: 'Add',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => handleEdit(),
            }
        ]);
        return () => {
            setButtons([]);
            setCustomPageTitle && setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, handleEdit, refreshKey]);

    useEffect(() => {
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    return (
        <div className="homeContainer page-list">
            {contextHolder}
            <ConfigurableTable
                refreshKey={refreshKey}
                moduleKey={'home'}
                columns={allColumnDefinitions}
                showColumnSettings={false}
                onRowClick={handleRowClick}
                searchConfig={{
                    placeholder: "Search app code...",
                }}
            />
            {/* 编辑弹窗 */}
            <Modal
                title={editingId ? "Edit Info" : "Add Info"}
                open={isEditorModalVisible}
                onCancel={() => setIsEditorModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setIsEditorModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleModalSubmit}>
                        Confirm
                    </Button>
                ]}
                width={850}
                destroyOnClose
            >
                <HomeEditorWithCommon
                    id={editingId}
                    setFormRef={setEditorActionsRef}
                />
            </Modal>
        </div>
    );
} 