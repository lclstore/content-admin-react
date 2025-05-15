import { EditFilled, CheckCircleFilled, CloseCircleFilled, CheckOutlined, CloseOutlined } from '@ant-design/icons';
export const optionsConstants = {
    displayStatus: [
        { name: <div>Draftad <EditFilled style={{ marginLeft: '5px', color: "#889e9e" }} /></div>, value: 0 },
        { name: <div>Enabled <CheckCircleFilled style={{ marginLeft: '5px', color: "#52c41a" }} /></div>, value: 1 },
        { name: <div>Disabled <CloseCircleFilled style={{ marginLeft: '5px', color: "#ff4d4f" }} /></div>, value: 2 },
    ],
    resultStatus: [
        { name: <div>success <CheckCircleFilled style={{ marginLeft: '5px', color: "#52c41a" }} /></div>, value: 1 },
        { name: <div>faild <CloseCircleFilled style={{ marginLeft: '5px', color: "#ff4d4f" }} /></div>, value: 2 },
    ],
    defaultStatus: [
        { name: <div><CheckOutlined style={{ color: "#889e9e", fontSize: '18px' }} /></div>, value: 1 },
        { name: <div><CloseOutlined style={{ color: "#ff4d4f", fontSize: '18px' }} /></div>, value: 0 },
    ],
    testStatus: ['Draft1', 'Enabled1', 'Disabled1'],//用于测试后期删除
    status: [
        { name: 'Draft', value: 0 },
        { name: 'Enabled', value: 1 },
        { name: 'Disabled', value: 2 },
    ],
    difficulty: [
        { name: 'Beginner', value: 0 },
        { name: 'Intermediate', value: 1 },
        { name: 'Advanced', value: 2 },
    ],
    equipment: [
        { name: 'Dumbbells', value: 0 },
        { name: 'Resistance band', value: 1 },
        { name: 'None', value: 2 },
    ],
    position: [
        { name: <span style={{ color: '#1abc9c' }}>Standing</span>, value: 0 },
        { name: <span style={{ color: '#3498db' }}>Lying</span>, value: 1 },
        { name: <span style={{ color: '#9b59b6' }}>Seated</span>, value: 2 },
        { name: <span style={{ color: '#e67e22' }}>Prone</span>, value: 3 },
        { name: <span style={{ color: '#e74c3c' }}>Kneeling</span>, value: 4 },
    ],
};