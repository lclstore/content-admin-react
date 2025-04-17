import React, { useContext, useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Form,
    Input,
    Button,
    Card,
    Row,
    Col,
    message,
    Spin,
    Select,
    InputNumber,
    DatePicker,
    Radio,
    Image,
    Upload,
    Typography
} from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import dayjs from 'dayjs';
// Potentially reuse styles if applicable
import '../profile-settings/ProfileSettings.css';

// Mock data (should ideally be shared or fetched)
const mockWorkouts = [
    {
        id: 1,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'Morning Run',
        status: 'Enabled',
        difficulty: 'Medium',
        equipment: 'Running Shoes',
        position: 1,
        target: 'Cardio',
        newStartTime: '2024-07-26 06:00:00',
        newEndTime: '2024-07-26 07:00:00',
    },
    {
        id: 2,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'Weight Lifting',
        status: 'Disabled',
        difficulty: 'Hard',
        equipment: 'Dumbbells, Barbell',
        position: 3,
        target: 'Strength',
        newStartTime: '2024-07-27 18:00:00',
        newEndTime: '2024-07-27 19:30:00',
    },
    {
        id: 3,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'Yoga Session',
        status: 'Enabled',
        difficulty: 'Easy',
        equipment: 'Yoga Mat',
        position: 2,
        target: 'Flexibility',
        newStartTime: '2024-07-28 08:00:00',
        newEndTime: '2024-07-28 09:00:00',
    },
    {
        id: 4,
        image: null,
        name: 'Cycling',
        status: 'Draft',
        difficulty: 'Medium',
        equipment: 'Bicycle, Helmet',
        position: 5,
        target: 'Cardio, Endurance',
        newStartTime: '2024-07-29 17:00:00',
        newEndTime: '2024-07-29 18:30:00',
    },
    {
        id: 5,
        image: 'https://amber.7mfitness.com/cms/fitnessVideo/img/6379cf54631c41469b5fedb0900bbb42.png?alt=media&name=f3683cc7-f759-4ed2-a9f3-4f1d10123c6d.png',
        name: 'HIIT Workout',
        status: 'Deprecated',
        difficulty: 'Hard',
        equipment: 'None',
        position: 4,
        target: 'Fat Loss, Fitness',
        newStartTime: '2024-07-30 12:00:00',
        newEndTime: '2024-07-30 12:30:00',
    },
];

const initialWorkoutData = {
    id: null,
    name: '',
    status: 'Draft', // Default status for new workouts
    difficulty: 'Medium',
    equipment: '',
    position: null,
    target: '',
    image: null,
    newStartTime: null,
    newEndTime: null,
};

// Helper function for Upload component value
const normFile = (e) => {
    console.log('Upload event:', e);
    if (Array.isArray(e)) {
        return e;
    }
    return e?.fileList;
};

export default function WorkoutsEditor() {
    const { setSaveButtonState, setCustomPageTitle } = useContext(HeaderContext);
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const workoutId = searchParams.get('id');
    const [form] = Form.useForm();
    const [workoutData, setWorkoutData] = useState(initialWorkoutData);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false); // Loading state for fetching data
    const [messageApi, contextHolder] = message.useMessage();
    const { Title, Text } = Typography;
    const imageFileList = Form.useWatch('image', form);
    const uploadRef = useRef(null); // Create ref for Upload component

    // 定义选项
    const statusOptions = ['Draft', 'Enabled', 'Disabled', 'Deprecated'];
    const difficultyOptions = ['Easy', 'Medium', 'Hard'];

    // Fetch data if workoutId exists
    useEffect(() => {
        const currentId = workoutId ? parseInt(workoutId, 10) : null;
        if (currentId !== null) {
            setPageLoading(true);
            console.log('Editing workout with ID:', currentId);
            // Simulate API Call
            setTimeout(() => {
                const workoutToEdit = mockWorkouts.find(w => w.id === currentId);
                if (workoutToEdit) {
                    setWorkoutData(workoutToEdit);
                    form.setFieldsValue({
                        name: workoutToEdit.name,
                        equipment: workoutToEdit.equipment,
                        target: workoutToEdit.target,
                        status: workoutToEdit.status,
                        difficulty: workoutToEdit.difficulty,
                        position: workoutToEdit.position,
                        newStartTime: workoutToEdit.newStartTime ? dayjs(workoutToEdit.newStartTime) : null,
                        newEndTime: workoutToEdit.newEndTime ? dayjs(workoutToEdit.newEndTime) : null,
                        image: workoutToEdit.image ? [{
                            uid: '-1',
                            name: 'image.png',
                            status: 'done',
                            url: workoutToEdit.image,
                        }] : [],
                    });
                    setIsFormDirty(false);
                } else {
                    console.error("Workout not found with ID:", currentId);
                    messageApi.error("Workout not found. Redirecting...");
                    setTimeout(() => navigate('/workouts'), 1500);
                }
                setPageLoading(false);
            }, 300);
            // --- Replace with actual API call ---
            // fetchWorkoutData(currentId).then(data => { ... }).catch(err => { ... });
        } else {
            // Add mode: reset form and state
            setWorkoutData(initialWorkoutData);
            form.resetFields();
            setIsFormDirty(false);
        }
    }, [workoutId, form, messageApi, navigate]);

    // Setup Header
    useEffect(() => {
        const title = workoutId ? 'Edit Workout' : 'Add Workout';
        setCustomPageTitle(title);
        setSaveButtonState({
            showSaveButton: true,
            saveButtonText: 'Save',
            saveButtonLoading: saveLoading,
            saveButtonDisabled: !isFormDirty,
            onSaveButtonClick: handleSaveChanges,
            showBackButton: true,
            onBackButtonClick: handleBackClick,
        });
        // Cleanup
        return () => {
            setSaveButtonState({ showSaveButton: false, showBackButton: false });
            setCustomPageTitle(null);
        };
    }, [workoutId, saveLoading, isFormDirty, setSaveButtonState, setCustomPageTitle, navigate]);

    const handleFormChange = () => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }
    };

    const handleSaveChanges = () => {
        setSaveLoading(true);
        form.validateFields()
            .then(values => {
                const imageUrl = values.image && values.image.length > 0
                    ? (values.image[0].url || values.image[0].response?.url) // Handle existing or newly uploaded file
                    : null;

                const dataToSave = {
                    ...(workoutId && { id: parseInt(workoutId, 10) }),
                    ...workoutData,
                    ...values, // Overwrite with form values (excluding raw fileList)
                    image: imageUrl, // Save the extracted image URL
                    newStartTime: values.newStartTime ? values.newStartTime.toISOString() : null,
                    newEndTime: values.newEndTime ? values.newEndTime.toISOString() : null,
                };
                // Remove fileList from data before logging/saving if desired
                delete dataToSave.fileList;

                console.log('Saving workout data:', dataToSave);

                // Simulate API call
                setTimeout(() => {
                    messageApi.success('Workout saved successfully!');
                    setSaveLoading(false);
                    setIsFormDirty(false);
                    // navigate('/workouts');
                }, 800);
                // --- Replace with actual API call ---
                // const saveApiCall = workoutId ? updateWorkout(dataToSave) : createWorkout(dataToSave);
                // saveApiCall.then(() => { ... }).catch(() => { ... });
            })
            .catch(err => {
                console.error('Validation failed:', err);
                setSaveLoading(false);
                messageApi.error('Please check the form fields.');
            });
    };

    const handleBackClick = () => {
        // TODO: Add confirmation if form is dirty
        navigate(-1);
    };

    /**
     * 触发头像上传点击
     */
    const triggerUploadClick = () => {
        if (uploadRef.current) {
            // 查找Upload组件内部的input元素并触发点击
            // 使用 antd Upload 实例的方法来触发点击可能更健壮
            const internalInput = uploadRef.current?.upload?.uploader?.fileInput;
            if (internalInput) {
                internalInput.click();
            } else {
                // Fallback if internal structure changes
                const inputElement = uploadRef.current.querySelector('input[type="file"]');
                if (inputElement) {
                    inputElement.click();
                }
            }
        }
    };

    return (
        <div className="editor-form-container"> {/* Use a generic class or reuse profile-container */}
            {contextHolder}
            <Spin spinning={pageLoading}> {/* Show spinner while fetching data */}
                <Card className="profile-card"> {/* Use a generic class or reuse profile-card */}
                    <Form
                        form={form}
                        layout="vertical"
                        onValuesChange={handleFormChange}
                        initialValues={{
                            ...initialWorkoutData,
                            newStartTime: null,
                            newEndTime: null,
                        }}
                    >
                        <div className="edit-form-item flex justify-between align-center" style={{ marginBottom: '24px' }}>
                            <div className="profile-avatar-container">
                                <Form.Item
                                    name="image"
                                    valuePropName="fileList"
                                    getValueFromEvent={normFile}
                                    noStyle
                                >
                                    <Upload
                                        ref={uploadRef}
                                        name="workout-image"
                                        action="/api/upload/workout"
                                        listType="picture-card"
                                        className="avatar-uploader"
                                        showUploadList={false}
                                        maxCount={1}
                                        accept=".jpg,.jpeg,.png,.gif"
                                    >
                                        {(imageFileList && imageFileList.length > 0 && (imageFileList[0].url || imageFileList[0].thumbUrl)) ? (
                                            <img
                                                src={imageFileList[0].url || imageFileList[0].thumbUrl}
                                                alt="Workout"
                                                className="avatar-img"
                                            />
                                        ) : (
                                            <div className="upload-button">
                                                <PlusOutlined />
                                                <div style={{ marginTop: 8 }}>Upload</div>
                                            </div>
                                        )}
                                    </Upload>
                                </Form.Item>
                                <div className="profile-info">
                                    <Title level={5} className="profile-picture-title" style={{ marginBottom: '4px' }}>Workout Image</Title>
                                    <Text type="secondary" className="profile-picture-desc">
                                        JPG, PNG, GIF. Max size 2MB recommended.
                                    </Text>
                                </div>
                            </div>
                            <Button color="default" variant="filled" className='change-btn' onClick={triggerUploadClick}>Change</Button>
                        </div>
                        <Form.Item
                            name="name"
                            label="Workout Name"
                            rules={[{ required: true, message: 'Please enter the workout name!' }]}
                        >
                            <Input placeholder="e.g., Morning Run" />
                        </Form.Item>
                        <Form.Item
                            name="equipment"
                            label="Equipment"
                        >
                            <Input placeholder="e.g., Running Shoes, Yoga Mat" />
                        </Form.Item>
                        <Form.Item
                            name="target"
                            label="Target Muscles/Goals"
                        >
                            <Input placeholder="e.g., Cardio, Strength, Flexibility" />
                        </Form.Item>
                        <Form.Item
                            name="status"
                            label="Status"
                            rules={[{ required: true, message: 'Please select the status!' }]}
                        >
                            <Select placeholder="Select status">
                                {statusOptions.map(opt => (
                                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="difficulty"
                            label="Difficulty"
                        >
                            <Radio.Group>
                                {difficultyOptions.map(opt => (
                                    <Radio key={opt} value={opt}>{opt}</Radio>
                                ))}
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            name="position"
                            label="Position (Order)"
                        >
                            <InputNumber min={1} placeholder="Enter position number" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            name="newStartTime"
                            label="Start Time"
                        >
                            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            name="newEndTime"
                            label="End Time"
                        >
                            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                </Card>
            </Spin>
        </div>
    );
}   