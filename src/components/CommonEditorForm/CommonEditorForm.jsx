import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
    Form,
    Input,
    Button,
    Switch,
    Select,
    DatePicker,
    Upload,
    Typography,
    Space,
    Spin,
    message,
    Transfer
} from 'antd';
import {
    PlusOutlined,
    SaveOutlined,
    ArrowLeftOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    FileOutlined
} from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import EditorFormPanel from '@/components/EditorFormPanel/EditorFormPanel';
import ContentLibraryPanel from '@/components/ContentLibrary/ContentLibraryPanel';
import styles from './CommonEditorForm.module.css';

const { Text } = Typography;

/**
 * 通用编辑器组件
 * 支持简单表单和复杂表单，根据配置动态渲染
 * 支持的表单类型：基本表单字段、穿梭框表单
 * 
 * @param {Object} props 组件属性
 * @param {string} props.formType 表单类型：'basic'(基础表单)或'advanced'(高级表单)
 * @param {Object} props.config 表单配置
 * @param {Array} props.fields 表单字段配置数组
 * @param {Object} props.initialValues 初始值
 * @param {Function} props.onSave 保存回调函数
 * @param {Function} props.validate 自定义验证函数
 * @param {boolean} props.loading 加载状态
 * @param {Object} props.complexConfig 复杂表单特有配置（如workouts编辑器）
 */

/**
 * 表单字段命名规范：
 * 1. 基本类型字段：
 *    - text/input: 普通文本 - 使用驼峰命名，如 userName, postTitle
 *    - textarea: 多行文本 - 使用驼峰命名，如 description, longContent
 *    - password: 密码字段 - 使用驼峰命名，如 userPassword, secretKey
 *    - select: 选择框 - 使用驼峰命名，如 userRole, categoryId
 *    - date/datepicker: 日期选择器 - 使用驼峰命名，如 startDate, publishTime
 *    - switch: 开关 - 使用is或has前缀的布尔值，如 isActive, hasPermission
 *    - upload: 上传组件 - 使用Url后缀，如 avatarUrl, imageUrl
 * 
 * 2. 穿梭框字段：
 *    - transfer: 穿梭框 - 使用复数名词或Selected后缀，如 selectedRoles, assignedPermissions
 * 
 * 3. 复杂表单字段：
 *    - 结构化数据 - 使用有意义的复数名词，如 workoutItems, mediaContent
 *    - 嵌套数据 - 使用层次结构命名，如 workout.exercises, user.contactInfo
 */
export default function CommonEditor(props) {
    const {
        formType = 'basic', // 默认为基础表单
        config = {},
        fields = [],
        initialValues = {},
        onSave,
        validate,
        loading: externalLoading = false,
        complexConfig = {} // 高级表单专用配置
    } = props;

    // 路由相关hooks
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();

    // 表单实例
    const [form] = Form.useForm();

    // 状态管理
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(externalLoading);
    const [formMounted, setFormMounted] = useState(true); // 默认为true，避免不必要的loading状态
    const [messageApi, contextHolder] = message.useMessage();

    // 初始值引用
    const initialValuesRef = useRef(initialValues);

    // 挂载标记
    const mounted = useRef(false);

    // 复杂表单特有状态
    const [structurePanels, setStructurePanels] = useState(
        complexConfig.structurePanels || []
    );
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(['1']);
    const [expandedItems, setExpandedItems] = useState({});

    // 获取HeaderContext，用于设置全局头部按钮和标题
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);

    // 表单挂载时初始化
    useEffect(() => {
        mounted.current = true;

        // 直接设置表单值
        if (Object.keys(initialValuesRef.current).length > 0) {
            form.setFieldsValue(initialValuesRef.current);
        }

        return () => {
            mounted.current = false;
        };
    }, [form]);

    // 初始值变化时，更新引用和表单
    useEffect(() => {
        initialValuesRef.current = initialValues;
        if (mounted.current && Object.keys(initialValues).length > 0) {
            form.setFieldsValue(initialValues);
        }
    }, [form, initialValues]);

    // 缓存保存按钮处理函数
    const handleSaveChanges = useCallback(() => {
        setSaveLoading(true);

        // 执行表单验证
        form.validateFields()
            .then(values => {
                // 额外验证（如果提供）
                if (validate && !validate(values, form)) {
                    setSaveLoading(false);
                    return;
                }

                // 处理复杂表单的额外数据
                let dataToSave = { ...values };

                if (formType === 'advanced' && complexConfig.includeStructurePanels) {
                    // 创建结构面板数据的深拷贝，避免循环引用
                    dataToSave.structurePanels = JSON.parse(JSON.stringify(structurePanels));

                    // 如果需要展平结构数据
                    if (complexConfig.flattenStructurePanels) {
                        dataToSave.structure = dataToSave.structurePanels.flatMap(
                            panel => panel.items || []
                        );
                    }
                }

                // 执行保存回调
                if (onSave) {
                    const editId = params.id;
                    const callbackUtils = {
                        setLoading: setSaveLoading,
                        setDirty: setIsFormDirty,
                        messageApi,
                        navigate
                    };
                    onSave(dataToSave, editId, callbackUtils);
                } else {
                    // 默认保存成功处理
                    messageApi.success(config.saveSuccessMessage || 'Save successful!');
                    setSaveLoading(false);
                    setIsFormDirty(false);

                    if (config.navigateAfterSave) {
                        navigate(config.afterSaveUrl || -1);
                    }
                }
            })
            .catch(err => {
                console.error('Form validation failed:', err);
                messageApi.error(config.validationErrorMessage || 'Please check if the form is filled correctly');
                setSaveLoading(false);
            });
    }, [
        form,
        validate,
        formType,
        complexConfig.includeStructurePanels,
        complexConfig.flattenStructurePanels,
        structurePanels,
        onSave,
        params.id,
        messageApi,
        navigate,
        config.saveSuccessMessage,
        config.validationErrorMessage,
        config.navigateAfterSave,
        config.afterSaveUrl
    ]);

    // 缓存返回按钮处理函数
    const handleBackClick = useCallback(() => {
        if (isFormDirty && config.confirmUnsavedChanges !== false) {
            if (window.confirm(config.unsavedChangesMessage || "You have unsaved changes, are you sure you want to leave?")) {
                navigate(config.backUrl || -1);
            }
        } else {
            navigate(config.backUrl || -1);
        }
    }, [
        isFormDirty,
        config.confirmUnsavedChanges,
        config.unsavedChangesMessage,
        config.backUrl,
        navigate
    ]);

    // 使用useMemo缓存按钮配置
    const headerButtons = useMemo(() => {
        return [
            {
                key: 'save',
                text: config.saveButtonText || 'Save',
                icon: <SaveOutlined />,
                type: 'primary',
                loading: saveLoading,
                onClick: handleSaveChanges,
                disabled: pageLoading || (!config.allowEmptySave && !isFormDirty),
            },
            {
                key: 'back',
                text: config.backButtonText || 'Back',
                icon: <ArrowLeftOutlined />,
                onClick: handleBackClick,
            }
        ];
    }, [
        config.saveButtonText,
        config.backButtonText,
        config.allowEmptySave,
        saveLoading,
        pageLoading,
        isFormDirty,
        handleSaveChanges,
        handleBackClick
    ]);

    // 初始化表单
    useEffect(() => {
        if (!formMounted) return; // 确保表单已挂载

        // 如果有自定义的初始化逻辑，执行它
        if (config.onInitialize) {
            config.onInitialize(form, {
                params,
                location
            });
        }
    }, [form, config, params, location, formMounted]);

    // 设置页面标题和头部按钮
    useEffect(() => {
        const isEditing = !!params.id;
        const title = isEditing
            ? `${config.editTitle || 'Edit'}${config.itemName || ''}`
            : `${config.addTitle || 'Add'}${config.itemName || ''}`;

        // 设置自定义页面标题
        if (setCustomPageTitle) {
            setCustomPageTitle(title);
        }

        // 设置头部按钮
        if (setButtons) {
            setButtons(headerButtons);
        }
    }, [
        config.editTitle,
        config.addTitle,
        config.itemName,
        params,
        headerButtons,
        setButtons,
        setCustomPageTitle
    ]);

    // 表单变化处理
    const handleFormChange = (changedValues, allValues) => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }

        // 执行自定义表单变化处理
        if (config.onFormChange) {
            config.onFormChange(changedValues, allValues, form);
        }
    };

    // 将Switch控件封装为独立组件并使用React.memo优化性能
    const SwitchField = React.memo(({ name, field, disabled }) => {
        // 避免直接访问form导致警告，改用Form.Item的内部机制
        const [switchEnabled, setSwitchEnabled] = useState(false);

        // 确保初始化
        useEffect(() => {
            if (mounted.current) {
                const value = form.getFieldValue(name);
                setSwitchEnabled(!!value);
            }
        }, [name]);

        return (
            <Space>
                <Switch
                    disabled={disabled}
                    checked={switchEnabled}
                    onChange={(checked) => {
                        // 更新本地状态
                        setSwitchEnabled(checked);
                        // 更新表单值 - 使用setFieldsValue更可靠
                        if (mounted.current) {
                            form.setFieldsValue({ [name]: checked });
                            setIsFormDirty(true);
                        }
                        // 触发自定义onChange
                        if (field.onChange) {
                            field.onChange(checked);
                        }
                    }}
                    {...(field.props || {})}
                />
                {field.showStatus && (
                    <Text style={{
                        color: switchEnabled
                            ? 'var(--success-color)'
                            : 'var(--error-color)'
                    }}>
                        {switchEnabled ? field.enableText || 'enabled' : field.disableText || 'disabled'}
                    </Text>
                )}
            </Space>
        );
    });

    // 将Upload控件封装为独立组件并使用React.memo优化性能
    const UploadField = React.memo(({ name, field, disabled }) => {
        const uploadRef = useRef(null);

        // 获取字段值，确保安全访问form
        let fieldValue;

        // 从表单实例中获取，确保form存在
        if (mounted.current && form) {
            fieldValue = form.getFieldValue(name);
        }
        // 从初始值中获取
        else if (initialValues && initialValues[name] !== undefined) {
            fieldValue = initialValues[name];
        }

        const hasFile = !!fieldValue;

        // 处理可能是字符串格式的acceptedFileTypes
        const acceptedTypes = field.acceptedFileTypes
            ? (typeof field.acceptedFileTypes === 'string'
                ? field.acceptedFileTypes.split(',').map(t => t.trim())
                : field.acceptedFileTypes)
            : [];

        // 构建accept属性，用于文件选择对话框
        const acceptAttr = acceptedTypes.length > 0
            ? acceptedTypes.map(t => t.startsWith('.') ? t : `.${t}`).join(',')
            : "";

        // 动态生成上传说明文本
        const uploadDescription = field.uploadDescription || (
            acceptedTypes.length > 0 && field.maxFileSize
                ? `${acceptedTypes.join('/')} format, max ${field.maxFileSize}KB`
                : acceptedTypes.length > 0
                    ? `${acceptedTypes.join('/')} format`
                    : field.maxFileSize
                        ? `Max size ${field.maxFileSize}KB`
                        : "Supports common file formats"
        );

        // 判断文件类型以确定预览方式
        const getFileType = (url) => {
            if (!url) return 'unknown';

            try {
                // 检查文件扩展名
                const extension = url.split('.').pop().toLowerCase();

                // 图片类型
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
                    return 'image';
                }

                // 视频类型
                if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
                    return 'video';
                }

                // 音频类型
                if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) {
                    return 'audio';
                }

                // 检查是否是base64编码的图片
                if (url.startsWith('data:image/')) {
                    return 'image';
                }
            } catch (error) {
                console.error('Error determining file type:', error);
            }

            return 'unknown';
        };

        // 根据文件类型渲染预览
        const renderFilePreview = (url) => {
            const fileType = getFileType(url);

            switch (fileType) {
                case 'image':
                    return (
                        <img
                            src={url}
                            alt={field.label || "Image preview"}
                            className={styles.avatarImg}
                            style={{
                                maxWidth: '100%',
                                maxHeight: field.previewHeight || '200px',
                                ...field.previewStyle
                            }}
                            onError={(e) => {
                                console.error('Image loading failed:', url);
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iY3VycmVudENvbG9yIiBjbGFzcz0iYmkgYmktaW1hZ2UiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTYuMDAyIDUuNWExLjUgMS41IDAgMSAxLTMgMCAxLjUgMS41IDAgMCAxIDMgMHoiLz48cGF0aCBkPSJNMi41IDFhLjUuNSAwIDAgMC0uNS41djEzYS41LjUgMCAwIDAgLjUuNWgxMWEuNS41IDAgMCAwIC41LS41di0xM2EuNS41IDAgMCAwLS41LS41aC0xMXptMTEgMWExIDEgMCAwIDEgMSAxdjEyYTEgMSAwIDAgMS0xIDFoLTEwYTEgMSAwIDAgMS0xLTF2LTEyYTEgMSAwIDAgMSAxLTFoMTB6Ii8+PHBhdGggZD0iTTEwLjY0OCA4LjU0OGwtLjI4OC0uMTQ0YS41LjUgMCAwIDAtLjUzNC4wNTJMNyAxMVY4LjVhLjUuNSAwIDAgMC0xIDB2NEg1LjVhLjUuNSAwIDAgMCAwIDFoNGEuNS41IDAgMCAwIC41LS41di0xLjVhLjUuNSAwIDAgMC0uMTU0LS4zNmwtLjY5Ni0uNjk4LS41NDcuNTQ2Ljk5Ljk5OXYuNWgtM1Y5LjcwOWwyLjE0Ni0yLjE0NWEuNS41IDAgMCAwIC4wNzItLjUzNHoiLz48L3N2Zz4=';
                            }}
                        />
                    );

                case 'video':
                    return (
                        <video
                            src={url}
                            className={styles.videoPreview}
                            controls={field.showControls !== false}
                            autoPlay={field.autoPlay || false}
                            loop={field.loop || false}
                            muted={field.muted || false}
                            style={{
                                maxWidth: '100%',
                                maxHeight: field.previewHeight || '200px',
                                ...field.previewStyle
                            }}
                        />
                    );

                case 'audio':
                    return (
                        <div className={styles.audioPreviewContainer}>
                            <audio
                                src={url}
                                className={styles.audioPreview}
                                controls={field.showControls !== false}
                                autoPlay={field.autoPlay || false}
                                loop={field.loop || false}
                                style={field.previewStyle}
                            />
                            <div className={styles.audioFileName}>
                                {url.split('/').pop()}
                            </div>
                        </div>
                    );

                default:
                    return (
                        <div className={styles.filePreview}>
                            <FileOutlined className={styles.fileIcon} />
                            <div className={styles.fileName}>
                                {url.split('/').pop()}
                            </div>
                        </div>
                    );
            }
        };

        // 触发上传点击
        const triggerUploadClick = (ref) => {
            if (ref.current) {
                const internalInput = ref.current?.upload?.uploader?.fileInput;
                if (internalInput) {
                    internalInput.click();
                } else {
                    const inputElement = ref.current.querySelector('input[type="file"]');
                    if (inputElement) {
                        inputElement.click();
                    }
                }
            }
        };

        // 上传前验证处理函数
        const handleBeforeUpload = (file) => {
            let isValid = true;
            const errorMessages = [];

            // 验证文件类型（如果指定了）
            if (field.acceptedFileTypes) {
                // 处理可能是字符串格式的acceptedFileTypes
                const acceptedTypes = typeof field.acceptedFileTypes === 'string'
                    ? field.acceptedFileTypes.split(',').map(t => t.trim())
                    : field.acceptedFileTypes;

                const fileExt = file.name.split('.').pop().toLowerCase();
                const fileType = file.type;

                // 检查文件扩展名或MIME类型
                const isAcceptedType = acceptedTypes.some(type =>
                    fileExt === type.replace('.', '') ||
                    fileType === type ||
                    fileType.startsWith(`${type}/`)
                );

                if (!isAcceptedType) {
                    isValid = false;
                    const typesText = acceptedTypes.join(', ');
                    errorMessages.push(`Only ${typesText} files are allowed`);
                }
            }

            // 验证文件大小（如果指定了），maxFileSize单位为KB
            if (field.maxFileSize) {
                // 将KB转换为bytes进行比较
                const maxSizeInBytes = field.maxFileSize * 1024;
                if (file.size > maxSizeInBytes) {
                    isValid = false;
                    errorMessages.push(`File size must be smaller than ${field.maxFileSize}KB`);
                }
            }

            // 显示错误信息
            if (!isValid && errorMessages.length > 0) {
                messageApi.error(errorMessages.join('. '));
            }

            // 如果指定了自定义验证函数，也执行它
            if (field.beforeUpload) {
                return isValid && field.beforeUpload(file);
            }

            return isValid;
        };

        // 处理图片上传
        const handleImageUpload = (info) => {
            if (info.file.status === 'uploading') {
                return;
            }

            if (info.file.status === 'done') {
                // 从响应中获取URL或创建本地预览URL
                let imageUrl;

                // 尝试从响应中获取URL
                if (info.file.response) {
                    imageUrl = info.file.response.url ||
                        info.file.response.data?.url ||
                        info.file.response.imageUrl ||
                        info.file.response.path;
                }

                // 如果响应中没有URL，则创建本地预览URL
                if (!imageUrl && info.file.originFileObj) {
                    imageUrl = URL.createObjectURL(info.file.originFileObj);
                }

                // 如果已上传文件有URL，则使用它
                if (!imageUrl && info.file.url) {
                    imageUrl = info.file.url;
                }

                if (imageUrl && form) {
                    // 确保form存在再调用
                    // 更新表单字段
                    form.setFieldValue(name, imageUrl);
                    setIsFormDirty(true);
                    messageApi.success(`Upload successful`);
                } else if (!imageUrl) {
                    messageApi.error('Unable to get image URL');
                }
            } else if (info.file.status === 'error') {
                messageApi.error(`Upload failed: ${info.file.error?.message || 'Unknown error'}`);
            }
        };

        return (
            <div className={`${styles.uploadContainer} ${styles.editFormItem}`}>
                <div className={styles.uploadContentWrapper}>
                    <div className={styles.uploadLeftSection}>
                        <div ref={uploadRef} className={styles.uploadPreviewArea}>
                            {hasFile && fieldValue ? (
                                <div className={styles.previewContainer}>
                                    {renderFilePreview(fieldValue)}
                                </div>
                            ) : (
                                <Upload.Dragger
                                    name={name}
                                    className={styles.avatarUploader}
                                    showUploadList={false}
                                    action={field.uploadUrl || "/api/upload"}
                                    beforeUpload={handleBeforeUpload}
                                    onChange={(info) => handleImageUpload(info)}
                                    accept={acceptAttr}
                                    multiple={false}
                                    disabled={disabled}
                                    {...(field.props || {})}
                                >
                                    <div className={styles.uploadButton}>
                                        <PlusOutlined className={styles.uploadIcon} />
                                    </div>
                                </Upload.Dragger>
                            )}
                        </div>

                        <div className={styles.uploadInfo}>
                            <div className={styles.uploadTitle}>
                                {/* {field.label || "Upload File"} */}
                                Click or drag file to upload
                            </div>
                            <Text type="secondary" className={styles.uploadDescription}>
                                {uploadDescription}
                            </Text>
                        </div>
                    </div>

                    {field.showChangeButton !== false && (
                        <Button
                            className={styles.changeButton}
                            onClick={() => triggerUploadClick(uploadRef)}
                            disabled={disabled}
                            {...(field.changeButtonProps || {})}
                        >
                            {hasFile ? (field.changeButtonText || "Change") : (field.uploadButtonText || "Upload")}
                        </Button>
                    )}
                </div>

                {field.showDebugInfo && (
                    <div className={styles.debugInfo}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Value: {fieldValue || 'Not set'}
                        </Text>
                    </div>
                )}
            </div>
        );
    });

    // 将Transfer控件封装为独立组件并使用React.memo优化性能
    const TransferField = React.memo(({ name, field, disabled }) => {
        // 确保form实例可用且组件挂载后再调用getFieldValue
        const targetKeys = mounted.current && form ? (form.getFieldValue(name) || []) : [];

        return (
            <Transfer
                dataSource={field.dataSource || []}
                titles={field.titles || ['Source', 'Target']}
                targetKeys={targetKeys}
                onChange={(newTargetKeys) => {
                    // 安全地设置字段值
                    if (mounted.current && form) {
                        form.setFieldValue(name, newTargetKeys);
                        if (field.onChange) {
                            // 避免传递可能导致循环引用的参数
                            field.onChange(newTargetKeys);
                        }
                        if (!isFormDirty) {
                            setIsFormDirty(true);
                        }
                    }
                }}
                render={field.render || (item => item.title)}
                disabled={disabled}
                showSearch={field.showSearch !== false}
                filterOption={field.filterOption || ((inputValue, item) =>
                    item.title.indexOf(inputValue) !== -1)}
                locale={field.locale || {
                    itemUnit: 'item',
                    itemsUnit: 'items',
                    searchPlaceholder: 'Search here',
                    notFoundContent: 'No data'
                }}
                {...(field.props || {})}
            />
        );
    });

    // 根据字段类型渲染表单控件
    const renderFormControl = (field) => {
        const {
            type,
            name,
            label,
            placeholder,
            options,
            disabled,
            props: fieldProps = {},
            render
        } = field;

        // 如果提供了自定义渲染函数，使用它
        if (render) {
            return render(form, field);
        }

        // 根据类型渲染不同控件
        switch (type) {
            case 'text':
                return <div className={styles.textField}>
                    {mounted.current ? form.getFieldValue(name) : (initialValues?.[name] || '')}
                </div>
            case 'input':
                return <Input
                    placeholder={placeholder || `Please input ${label}`}
                    disabled={disabled}
                    allowClear
                    autoComplete="off"
                    {...fieldProps}
                />;

            case 'textarea':
                return <Input.TextArea
                    placeholder={placeholder || `Please input ${label}`}
                    disabled={disabled}
                    allowClear
                    autoComplete="off"
                    {...fieldProps}
                />;

            case 'password':
                return <Input.Password
                    placeholder={placeholder || `Please input ${label}`}
                    disabled={disabled}
                    iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    allowClear
                    autoComplete="off"
                    {...fieldProps}
                />;

            case 'select':
                return (
                    <Select
                        placeholder={placeholder || `Select ${label}`}
                        disabled={disabled}
                        {...fieldProps}
                    >
                        {(options || []).map(option => (
                            <Select.Option
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </Select.Option>
                        ))}
                    </Select>
                );

            case 'date':
            case 'datepicker':
                return <DatePicker
                    placeholder={placeholder || `Select ${label}`}
                    disabled={disabled}
                    {...fieldProps}
                />;

            case 'switch':
                return <SwitchField
                    name={name}
                    field={field}
                    disabled={disabled}
                />;

            case 'upload':
                return <UploadField
                    name={name}
                    field={field}
                    disabled={disabled}
                />;

            case 'transfer':
                return <TransferField
                    name={name}
                    field={field}
                    disabled={disabled}
                />;

            default:
                return <Input
                    placeholder={placeholder || `Please input ${label}`}
                    disabled={disabled}
                    {...fieldProps}
                />;
        }
    };

    // 渲染表单项
    const renderFormItem = (field) => {
        const {
            name,
            label,
            rules = [],
            labelCol,
            wrapperCol,
            dependencies,
            shouldUpdate,
            valuePropName,
            hidden,
            noStyle,
            className,
            required
        } = field;

        // 处理必填规则
        const finalRules = [...rules];
        if (required && !finalRules.some(rule => rule.required)) {
            finalRules.push({
                required: true,
                message: field.requiredMessage || `Please ${field.type === 'select' ? 'select' : field.type === 'upload' ? 'upload' : 'input'} ${label}`
            });
        }

        // 特殊渲染情况处理
        if (shouldUpdate) {
            return (
                <Form.Item
                    key={name || `item-${Math.random()}`}
                    shouldUpdate={shouldUpdate}
                    className={className}
                    hidden={hidden}
                    noStyle={noStyle}
                >
                    {field.render(form)}
                </Form.Item>
            );
        }

        if (dependencies) {
            return (
                <Form.Item
                    key={name || `item-${Math.random()}`}
                    dependencies={dependencies}
                    className={className}
                    hidden={hidden}
                    noStyle={noStyle}
                >
                    {(form) => field.render(form)}
                </Form.Item>
            );
        }

        // 标准表单项渲染
        return (
            <Form.Item
                key={name}
                name={name}
                label={label}
                rules={finalRules}
                labelCol={labelCol}
                wrapperCol={wrapperCol}
                valuePropName={(field.type === 'switch') ? 'checked' : (valuePropName || 'value')}
                className={className}
                hidden={hidden}
                noStyle={noStyle}
            >
                {renderFormControl(field)}
            </Form.Item>
        );
    };

    return (
        <div className={styles.commonEditorContainer}>
            {contextHolder}

            {pageLoading ? (
                <div className={styles.loadingContainer}>
                    <Spin size="large" />
                    <div className={styles.loadingTip}>Loading form data...</div>
                </div>
            ) : (
                <>
                    {formType === 'basic' ? (
                        <Form
                            form={form}
                            layout={config.layout || "vertical"}
                            onValuesChange={handleFormChange}
                            onFinish={handleSaveChanges}
                            initialValues={initialValuesRef.current}
                            name="common-editor-form-basic"
                            preserve={true}
                        >
                            {fields.map(renderFormItem)}
                        </Form>
                    ) : (
                        <Form
                            form={form}
                            layout={config.layout || "vertical"}
                            onValuesChange={handleFormChange}
                            onFinish={handleSaveChanges}
                            initialValues={initialValuesRef.current}
                            name="common-editor-form-advanced"
                            preserve={true}
                        >
                            <div className={complexConfig.containerClassName || styles.advancedEditorContainer}>
                                {/* 内容库面板 */}
                                {complexConfig.showContentLibrary && complexConfig.ContentLibraryPanel && (
                                    <ContentLibraryPanel
                                        className={complexConfig.contentLibraryClassName || styles.contentLibraryPanel}
                                        contentLibraryData={complexConfig.contentLibraryData || []}
                                        onAddItem={complexConfig.onAddItem}
                                        searchValue={complexConfig.contentSearchValue}
                                        onSearchChange={complexConfig.onContentSearchChange}
                                        onFilterChange={complexConfig.onContentFilterChange}
                                        hasActiveFilters={complexConfig.hasActiveContentFilters}
                                        activeFilters={complexConfig.contentFilters}
                                    />
                                )}

                                {/* 编辑表单面板 */}
                                {complexConfig.EditorFormPanel && (
                                    <EditorFormPanel
                                        className={complexConfig.editorPanelClassName || styles.editorFormPanel}
                                        formInstance={form}
                                        onFinish={handleSaveChanges}
                                        structurePanelsData={structurePanels}
                                        onFormChange={handleFormChange}
                                        onDeleteItem={complexConfig.onDeleteItem}
                                        onRoundChange={complexConfig.onRoundChange}
                                        onReplaceItem={complexConfig.onReplaceItem}
                                        onSortItems={complexConfig.onSortItems}
                                        onItemChange={complexConfig.onItemChange}
                                        onCopyItem={complexConfig.onCopyItem}
                                        onStructureNameChange={complexConfig.onStructureNameChange}
                                        onAddStructurePanel={complexConfig.onAddStructurePanel}
                                        workoutData={complexConfig.workoutData}

                                        // 展开/折叠状态
                                        expandedItems={expandedItems}
                                        onToggleExpandItem={handleToggleExpandItem}

                                        // 折叠面板状态
                                        activeCollapseKeys={activeCollapseKeys}
                                        onCollapseChange={handleCollapseChange}

                                        // 内容库模态框属性
                                        contentLibraryData={complexConfig.contentLibraryData}
                                        contentSearchValue={complexConfig.contentSearchValue}
                                        contentFilters={complexConfig.contentFilters}
                                        onContentSearchChange={complexConfig.onContentSearchChange}
                                        onContentFilterChange={complexConfig.onContentFilterChange}
                                        hasActiveContentFilters={complexConfig.hasActiveContentFilters}
                                    />
                                )}
                            </div>
                        </Form>
                    )}
                </>
            )}
        </div>
    );
} 