import React from 'react';
const onChange = (date, dateString) => {
    console.log(date, dateString);
};
const Programs = () => {
    return (
        <div style={{
            width: '100%',
            padding: '16px'
            // 不设置overflow属性，让父容器控制滚动
        }}>
            {/* 测试内容 - 生成多个项目以测试滚动效果 */}
            {Array.from({ length: 100 }).map((_, index) => (
                <div
                    className="page-list"
                    key={index}
                    style={{
                        padding: '10px',
                        margin: '10px 0',
                        background: '#f0f0f0',
                        borderRadius: '4px'
                    }}
                >
                    测试内容项 #{index + 1}
                </div>
            ))}
        </div>
    );
}
export default Programs;