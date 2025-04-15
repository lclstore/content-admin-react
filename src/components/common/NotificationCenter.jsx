import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  Button, 
  Dropdown, 
  Space, 
  List, 
  Avatar, 
  Tabs, 
  Typography,
  Empty 
} from 'antd';
import { BellOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';

const mockNotifications = [
  {
    id: 1,
    title: '系统通知',
    message: '您的账号已激活',
    time: '2023-12-01 10:00',
    read: false,
    type: 'system'
  },
  {
    id: 2,
    title: '任务完成',
    message: '您的导出任务已完成',
    time: '2023-12-01 11:30',
    read: true,
    type: 'task'
  },
  {
    id: 3,
    title: '新消息',
    message: '收到来自管理员的新消息',
    time: '2023-12-01 14:15',
    read: false,
    type: 'message'
  }
];

const { Text } = Typography;

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const renderNotificationItem = (item) => (
    <List.Item
      key={item.id}
      onClick={() => markAsRead(item.id)}
      style={{ 
        backgroundColor: item.read ? 'transparent' : 'rgba(0, 123, 255, 0.05)',
        padding: '10px 16px',
        cursor: 'pointer'
      }}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<BellOutlined />} />}
        title={<Text strong={!item.read}>{item.title}</Text>}
        description={
          <div>
            <div>{item.message}</div>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px', marginTop: '4px' }}>
              {item.time}
            </div>
          </div>
        }
      />
    </List.Item>
  );

  const notificationContent = (
    <div style={{ width: 300 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Text strong>通知中心</Text>
        <Space>
          <Button type="text" size="small" onClick={markAllAsRead}>
            全部已读
          </Button>
          <Button type="text" size="small" onClick={clearAll}>
            清空
          </Button>
        </Space>
      </div>
      
      <Tabs
        defaultActiveKey="all"
        items={[
          {
            key: 'all',
            label: '全部',
            children: notifications.length > 0 ? (
              <List
                dataSource={notifications}
                renderItem={renderNotificationItem}
                style={{ maxHeight: '300px', overflow: 'auto' }}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />
            )
          },
          {
            key: 'unread',
            label: '未读',
            children: notifications.filter(n => !n.read).length > 0 ? (
              <List
                dataSource={notifications.filter(n => !n.read)}
                renderItem={renderNotificationItem}
                style={{ maxHeight: '300px', overflow: 'auto' }}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无未读通知" />
            )
          }
        ]}
      />
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationContent}
      placement="bottomRight"
      arrow
      trigger={['click']}
    >
      <Badge count={unreadCount} offset={[-2, 10]}>
        <Button 
          icon={<BellOutlined />} 
          type="text" 
          shape="circle" 
          size="large"
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter; 