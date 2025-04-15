import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button, Space, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import './style.css';

/**
 * 通用表格组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element}
 */
const DataTable = ({
  dataSource,
  columns,
  rowKey = 'id',
  pagination = {},
  loading = false,
  bordered = true,
  size = 'middle',
  scroll,
  showActions = true,
  showView = true,
  showEdit = true,
  showDelete = true,
  actionWidth = 150,
  actionFixed = 'right',
  actionTitle = '操作',
  onView,
  onEdit,
  onDelete,
  actionRender,
  onChange,
  rowSelection,
  expandable,
  ...restProps
}) => {
  // 默认操作列渲染
  const defaultActionRender = (_, record) => (
    <Space size="small">
      {showView && (
        <Tooltip title="查看">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => onView && onView(record)} 
            size="small"
          >
            查看
          </Button>
        </Tooltip>
      )}
      
      {showEdit && (
        <Tooltip title="编辑">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => onEdit && onEdit(record)} 
            size="small"
          >
            编辑
          </Button>
        </Tooltip>
      )}
      
      {showDelete && (
        <Tooltip title="删除">
          <Popconfirm
            title="确定删除该记录吗?"
            onConfirm={() => onDelete && onDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Tooltip>
      )}
    </Space>
  );

  // 生成列配置
  const tableColumns = [...columns];
  
  // 添加操作列
  if (showActions) {
    tableColumns.push({
      title: actionTitle,
      key: 'action',
      width: actionWidth,
      fixed: actionFixed,
      align: 'center',
      render: actionRender || defaultActionRender,
    });
  }

  return (
    <div className="data-table-wrapper">
      <Table
        dataSource={dataSource}
        columns={tableColumns}
        rowKey={rowKey}
        pagination={pagination}
        loading={loading}
        bordered={bordered}
        size={size}
        scroll={scroll}
        onChange={onChange}
        rowSelection={rowSelection}
        expandable={expandable}
        {...restProps}
      />
    </div>
  );
};

DataTable.propTypes = {
  dataSource: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  pagination: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  loading: PropTypes.bool,
  bordered: PropTypes.bool,
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  scroll: PropTypes.object,
  showActions: PropTypes.bool,
  showView: PropTypes.bool,
  showEdit: PropTypes.bool,
  showDelete: PropTypes.bool,
  actionWidth: PropTypes.number,
  actionFixed: PropTypes.oneOf(['left', 'right']),
  actionTitle: PropTypes.string,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  actionRender: PropTypes.func,
  onChange: PropTypes.func,
  rowSelection: PropTypes.object,
  expandable: PropTypes.object
};

export default DataTable; 