import React from 'react';
import { Spin } from 'antd';

const Loading = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return <Spin />;
};

export default Loading; 