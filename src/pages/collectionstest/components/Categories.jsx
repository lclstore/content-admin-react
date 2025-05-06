export default function Categories() {
    return (
        <div style={{
            width: '100%',
            padding: '16px'
            // 不设置overflow属性，让父容器控制滚动
        }}>
            {/* 分类列表内容 */}
            <h1>分类列表</h1>

            {/* 测试内容 - 生成多个项目以测试滚动效果 */}
            {Array.from({ length: 50 }).map((_, index) => (
                <div
                    className="category-item"
                    key={index}
                    style={{
                        padding: '10px',
                        margin: '10px 0',
                        background: '#f0f0f0',
                        borderRadius: '4px'
                    }}
                >
                    分类项 #{index + 1}
                </div>
            ))}
        </div>
    )
}   
