import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Modal, message, Avatar, Button } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { formatDate } from '@/utils';
import ConfigurableTable from '@/components/ConfigurableTable/ConfigurableTable';
import { statusIconMap } from '@/constants';
import UserEditorWithCommon from './Editor';
import request from "@/request";

export default function UsersList() {
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);
    const [dataSource, setDataSource] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [actionClicked, setActionClicked] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [isEditorModalVisible, setIsEditorModalVisible] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editorActionsRef, setEditorActionsRef] = useState(null);


    // 编辑处理
    const handleEdit = useCallback((record) => {
        setEditingUserId(record?.id || null);
        setIsEditorModalVisible(true);
    }, []);

    // 状态变更处理
    const handleStatusChange = useCallback((record, newStatus) => {
        setActionInProgress(true);
        const updatedRecord = { ...record, status: newStatus };
        setDataSource(current =>
            current.map(item =>
                item.id === record.id ? updatedRecord : item
            )
        );
        setActionInProgress(false);
        messageApi.success(`Successfully ${newStatus} user "${record.name}"`);
    }, [messageApi]);

    // 处理按钮点击事件
    const handleActionClick = useCallback((actionName, record, event) => {
        if (event) event.stopPropagation();
        setCurrentRecord(record);
        if (actionName === 'edit') {
            handleEdit(record);
        } else {
            handleStatusChange(record, actionName);
        }
    }, [handleEdit, handleStatusChange]);

    // 定义按钮显示规则
    const isButtonVisible = useCallback((record, btnName) => {
        const status = record.status;
        if (status === 'ENABLE' && ['DISABLE'].includes(btnName)) return true;
        if (status === 'DISABLE' && ['ENABLE'].includes(btnName)) return true;
        return false;
    }, []);

    const UserCell = ({ record }) => {
        const [imgError, setImgError] = useState(false);

        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {!imgError && record.avatar ? (
                    <Avatar
                        src={record.avatar}
                        size={36}
                        onError={() => {
                            setImgError(true);
                            return false;
                        }}
                        style={{ marginRight: 12 }}
                    />
                ) : (
                    <Avatar
                        icon={<UserOutlined />}
                        size={36}
                        style={{ marginRight: 12, backgroundColor: '#f0f2f5', color: '#999' }}
                    />
                )}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4'
                    }}>{record.name}</span>
                    <span style={{
                        fontSize: 'var(--font-md-sm)',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                        fontWeight: 400
                    }}>{record.email}</span>
                </div>
            </div>
        );
    };



    // 表格列定义
    const allColumnDefinitions = useMemo(() => {
        return [
            {
                title: 'Name & Email',
                key: 'nameAndEmail',
                width: 350,
                visibleColumn: 0,
                render: (record) => <UserCell record={record} />
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                iconOptions: statusIconMap,
                options: 'userStatus',
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
                title: 'Create User',
                dataIndex: 'createUser',
                key: 'createUser',
                width: 350
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 70,
                align: 'center',
                actionButtons: ['ENABLE', 'DISABLE'],
                isShow: isButtonVisible,
                onActionClick: handleActionClick
            }
        ];
    }, [isButtonVisible, handleActionClick]);

    // 搜索处理
    const handleSearchInputChange = useCallback((e) => {
        const { value } = e.target;
        setSearchValue(value);
        getData(value);
    }, []);

    // 获取数据
    const getData = useCallback((searchText = '') => {
        return new Promise(resolve => {
            request.get({
                url: "/user/page",
                load: true,
                data: {
                    pageSize: 20,
                    searchText
                },
                callback(res) {
                    setDataSource(res.data.data)
                    resolve()
                }
            })
        })
    }, [])

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
            const currentRecord = dataSource.find(user => user.id === editingUserId);
            const statusToSave = currentRecord?.status || 'ENABLE'; // 默认为 ENABLE
            let ret = await editorActionsRef.triggerSave(statusToSave, false);// 返回保存结果
            if (ret.success) {
                messageApi.success(ret.message || 'Save successful!');
                setIsEditorModalVisible(false);
                setEditingUserId(null);
                getData(); // 刷新列表数据
            }
        }
    };



    useEffect(() => {
        setCustomPageTitle && setCustomPageTitle('User');

        setButtons([
            {
                key: 'create',
                text: 'Add',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => handleEdit(),
            }
        ]);

        getData();

        return () => {
            setButtons([]);
            setCustomPageTitle && setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, handleEdit, getData]);

    useEffect(() => {
        const handleGlobalClick = () => setActionClicked(false);
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    useEffect(() => {
        if (setEditorActionsRef && editorActionsRef) {
            const formActions = {
                form,
                triggerSave: handleStatusModalConfirmFromHook
            };
            setEditorActionsRef(formActions);
        }
    }, [setEditorActionsRef]);

    return (
        <div className="usersContainer page-list">
            {contextHolder}

            <ConfigurableTable
                uniqueId={'usersList'}
                columns={allColumnDefinitions}
                dataSource={dataSource}
                rowKey="id"
                loading={loading}
                showColumnSettings={false}
                onRowClick={handleRowClick}
                actionColumnKey="actions"
                searchConfig={{
                    placeholder: "Search name or email...",
                    searchValue: searchValue,
                    onSearchChange: handleSearchInputChange,
                }}
            />

            <Modal
                title={editingUserId ? "Edit User" : "Add User"}
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
                width={800}
                destroyOnClose
            >
                <UserEditorWithCommon
                    id={editingUserId}
                    setFormRef={setEditorActionsRef}
                />
            </Modal>
        </div>
    );
}