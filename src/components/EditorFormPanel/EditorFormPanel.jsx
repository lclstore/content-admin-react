import React, { useState } from 'react';
import { Form, Input, List, Button, Space, Divider, Avatar, Popover, Collapse, Select } from 'antd';
import { DeleteOutlined, PlusOutlined, InfoOutlined, ThunderboltOutlined, TagsOutlined, ShrinkOutlined, ArrowsAltOutlined } from '@ant-design/icons';
import { filterSections } from '../../pages/workouts/workoutsListData';
import TagSelector from '../TagSelector/TagSelector';
import './EditorFormPanel.css';

const getOptionsFromFilter = (key) => {
    const section = filterSections.find(section => section.key === key);
    return section ? section.options : [];
};

const EditorFormPanel = ({
    formInstance,
    structureItems,
    onFormChange,
    onAddRestTime,
    onDeleteItem,
    workoutData,
}) => {
    const [workoutNameHeader, setWorkoutNameHeader] = useState('');

    const handleFormChange = (changedValues, allValues) => {
        if (changedValues.workoutName !== undefined) {
            setWorkoutNameHeader(changedValues.workoutName || 'Workout Details');
        }
        onFormChange(changedValues, allValues);
    };

    React.useEffect(() => {
        const initialName = formInstance.getFieldValue('workoutName');
        setWorkoutNameHeader(initialName || 'Workout Details');
    }, [formInstance]);

    const difficultyOptions = getOptionsFromFilter('difficulty');
    const positionOptions = getOptionsFromFilter('position');
    const targetOptions = getOptionsFromFilter('target');

    const equipmentOptions = workoutData?.equipmentOptions || [];

    // Define items for Collapse component
    const collapseItems = [
        {
            key: '1',
            label: (
                <Space>
                    <ThunderboltOutlined className="collapse-left-icon" />
                    {'Name & Description'}
                </Space>
            ),
            children: (
                <>
                    <Form.Item
                        label="Name"
                        name="workoutName"
                        rules={[
                            { required: true, message: 'Please enter the workout name!' },
                            { max: 100, message: 'Workout name cannot exceed 100 characters!' },
                            {
                                pattern: /^[a-zA-Z0-9 ]*$/,
                                message: 'Workout name can only contain letters, numbers, or spaces!',
                            },
                        ]}
                        normalize={(value) => value?.trim()}
                        extra="Letters or Numbers or Spaces"
                    >
                        <Input placeholder="Enter workout name" />
                    </Form.Item>
                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[{ required: false }]}
                    >
                        <Input.TextArea rows={2} placeholder="Enter workout description" />
                    </Form.Item>
                </>
            ),
        },
        {
            key: '2',
            label: (
                <Space>
                    <TagsOutlined className="collapse-left-icon" />
                    Labels
                </Space>
            ),
            children: (
                <>
                    <Form.Item
                        label="Difficulty"
                        name="difficulty"
                        rules={[{ required: true, message: 'Please select the difficulty level!' }]}
                    >
                        <TagSelector
                            options={difficultyOptions}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Equipment"
                        name="equipment"
                        rules={[{ required: true, message: 'Please select the equipment!' }]}
                    >
                        <TagSelector
                            options={equipmentOptions}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Position"
                        name="position"
                        rules={[{ required: true, message: 'Please select the position!' }]}
                    >
                        <TagSelector
                            options={positionOptions}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Target"
                        name="target"
                        rules={[{ required: true, message: 'Please select at least one target area!' }]}
                    >
                        <TagSelector
                            options={targetOptions}
                            mode="multiple"
                            placeholder="Select target area(s)"
                        />
                    </Form.Item>
                </>
            ),
        },
    ];

    return (
        <div className={`editor-form-panel`}>
            <div className="title">
                <span>Workout details</span>
                <Popover
                    content="Create a workout video tailored to your clients' needs using our library of stock exercise clips."
                    trigger="click"
                    placement="bottom"
                >
                    <InfoOutlined className="info-icon" />
                </Popover>
            </div>

            <Form
                form={formInstance}
                layout="vertical"
                onValuesChange={handleFormChange}
                className="editor-form"
            >
                <Collapse
                    items={collapseItems}
                    defaultActiveKey={['1']}
                    ghost
                    accordion
                    expandIconPosition="end"
                    expandIcon={({ isActive }) => isActive
                        ? <ShrinkOutlined className="collapse-icon" />
                        : <ArrowsAltOutlined className="collapse-icon" />}
                    className="workout-details-collapse"
                />
            </Form>
        </div>
    );
};

export default EditorFormPanel;