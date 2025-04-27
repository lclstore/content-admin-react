import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
    Collapse,
    message
} from 'antd';
import {
    CameraOutlined,
    SaveOutlined,
    ArrowLeftOutlined,
    EyeOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import EditorFormPanel from '@/components/EditorFormPanel/EditorFormPanel';
import ContentLibraryPanel from '@/components/ContentLibrary/ContentLibraryPanel';

const { Title, Text } = Typography;

/**
 * 通用编辑器组件
 * 支持简单表单和复杂表单，根据配置动态渲染
 * 
 * @param {Object} props 组件属性
 * @param {string} props.formType 表单类型：'simple'或'complex'
 * @param {Object} props.config 表单配置
 * @param {Array} props.fields 表单字段配置数组
 * @param {Object} props.initialValues 初始值
 * @param {Function} props.onSave 保存回调函数
 * @param {Function} props.validate 自定义验证函数
 * @param {boolean} props.loading 加载状态
 * @param {Object} props.complexConfig 复杂表单特有配置（如workouts编辑器）
 */
export default function CommonEditor(props) {
    const {
        formType = 'simple', // 默认为简单表单
        config = {},
        fields = [],
        initialValues = {},
        onSave,
        validate,
        loading: externalLoading = false,
        complexConfig = {} // 复杂表单专用配置
    } = props;

    // 路由相关hooks
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    // 表单实例
    const [form] = Form.useForm();

    // 状态管理
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(externalLoading);
    const [messageApi, contextHolder] = message.useMessage();
    const uploadRef = useRef(null);

    // 复杂表单特有状态
    const [structurePanels, setStructurePanels] = useState(
        complexConfig.structurePanels || []
    );
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(['1']);
    const [expandedItems, setExpandedItems] = useState({});

    // 获取HeaderContext，用于设置全局头部按钮和标题
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);

    // 初始化表单
    useEffect(() => {
        // 设置初始值
        if (Object.keys(initialValues).length > 0) {
            form.setFieldsValue(initialValues);
        }

        // 如果有自定义的初始化逻辑，执行它
        if (config.onInitialize) {
            config.onInitialize(form, {
                params,
                searchParams,
                location
            });
        }
    }, [form, initialValues, config, params, searchParams, location]);

    // 设置页面标题和头部按钮
    useEffect(() => {
        const isEditing = !!params.id || !!searchParams.get('id');
        const title = isEditing
            ? `${config.editTitle || '编辑'}${config.itemName || ''}`
            : `${config.addTitle || '新增'}${config.itemName || ''}`;

        setCustomPageTitle(title);

        // 设置头部按钮
        setButtons([
            {
                key: 'save',
                text: config.saveButtonText || '保存',
                icon: <SaveOutlined />,
                type: 'primary',
                loading: saveLoading,
                onClick: handleSaveChanges,
                disabled: pageLoading || (!config.allowEmptySave && !isFormDirty),
            },
            {
                key: 'back',
                text: config.backButtonText || '返回',
                icon: <ArrowLeftOutlined />,
                onClick: handleBackClick,
            }
        ]);

        // 清理函数
        return () => {
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [
        config,
        saveLoading,
        pageLoading,
        isFormDirty,
        params,
        searchParams,
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

    // 返回按钮处理
    const handleBackClick = () => {
        if (isFormDirty && config.confirmUnsavedChanges !== false) {
            if (window.confirm(config.unsavedChangesMessage || "你有未保存的更改，确定要离开吗？")) {
                navigate(config.backUrl || -1);
            }
        } else {
            navigate(config.backUrl || -1);
        }
    };

    // 保存表单处理
    const handleSaveChanges = () => {
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

                if (formType === 'complex' && complexConfig.includeStructurePanels) {
                    // 根据配置处理结构面板数据
                    dataToSave.structurePanels = structurePanels;

                    // 如果需要展平结构数据
                    if (complexConfig.flattenStructurePanels) {
                        dataToSave.structure = structurePanels.flatMap(
                            panel => panel.items || []
                        );
                    }
                }

                // 执行保存回调
                if (onSave) {
                    const editId = params.id || searchParams.get('id');
                    onSave(dataToSave, editId, {
                        setLoading: setSaveLoading,
                        setDirty: setIsFormDirty,
                        messageApi,
                        navigate
                    });
                } else {
                    // 默认保存成功处理
                    setTimeout(() => {
                        messageApi.success(config.saveSuccessMessage || '保存成功！');
                        setSaveLoading(false);
                        setIsFormDirty(false);

                        if (config.navigateAfterSave) {
                            navigate(config.afterSaveUrl || -1);
                        }
                    }, 800);
                }
            })
            .catch(err => {
                console.error('表单验证失败:', err);
                messageApi.error(config.validationErrorMessage || '请检查表单填写是否正确');
                setSaveLoading(false);
            });
    };

    // 处理头像/图片上传
    const handleImageUpload = (info, fieldName) => {
        if (info.file.status === 'uploading') {
            return;
        }

        if (info.file.status === 'done') {
            // 从响应中获取URL或创建本地预览URL
            const imageUrl = info.file.response?.url || URL.createObjectURL(info.file.originFileObj);

            if (imageUrl) {
                // 更新表单字段
                form.setFieldValue(fieldName, imageUrl);
                setIsFormDirty(true);
                messageApi.success(`${config.uploadSuccessMessage || '上传成功'}`);
            } else {
                messageApi.error(config.uploadFailMessage || '无法获取图片URL');
            }
        } else if (info.file.status === 'error') {
            messageApi.error(`${config.uploadErrorMessage || '上传失败'}: ${info.file.error?.message || '未知错误'}`);
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

    // 复杂表单特有方法：处理结构变化
    const handleStructureChange = (newPanels) => {
        setStructurePanels(newPanels);
        if (!isFormDirty) {
            setIsFormDirty(true);
        }

        // 执行自定义结构变化处理
        if (complexConfig.onStructureChange) {
            complexConfig.onStructureChange(newPanels);
        }
    };

    // 复杂表单特有方法：处理折叠面板变化
    const handleCollapseChange = (keys) => {
        if (!keys || keys.length === 0) {
            setActiveCollapseKeys([]);
        } else {
            const latestKey = keys[keys.length - 1];
            setActiveCollapseKeys([latestKey]);
        }

        // 执行自定义折叠面板变化处理
        if (complexConfig.onCollapseChange) {
            complexConfig.onCollapseChange(keys);
        }
    };

    // 复杂表单特有方法：处理展开/折叠项
    const handleToggleExpandItem = (panelId, itemId) => {
        setExpandedItems(prev => {
            const isCurrentlyExpanded = prev[panelId] === itemId;
            return isCurrentlyExpanded ? {} : { [panelId]: itemId };
        });

        // 执行自定义项展开/折叠处理
        if (complexConfig.onToggleExpandItem) {
            complexConfig.onToggleExpandItem(panelId, itemId);
        }
    };

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
            case 'input':
                return <Input
                    placeholder={placeholder || `请输入${label}`}
                    disabled={disabled}
                    {...fieldProps}
                />;

            case 'textarea':
                return <Input.TextArea
                    placeholder={placeholder || `请输入${label}`}
                    disabled={disabled}
                    {...fieldProps}
                />;

            case 'password':
                return <Input.Password
                    placeholder={placeholder || `请输入${label}`}
                    disabled={disabled}
                    iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    {...fieldProps}
                />;

            case 'select':
                return (
                    <Select
                        placeholder={placeholder || `请选择${label}`}
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
                    placeholder={placeholder || `请选择${label}`}
                    disabled={disabled}
                    {...fieldProps}
                />;

            case 'switch':
                return (
                    <Space>
                        <Switch
                            disabled={disabled}
                            {...fieldProps}
                        />
                        {field.showStatus && (
                            <Form.Item dependencies={[name]} noStyle>
                                {({ getFieldValue }) => {
                                    const isEnabled = getFieldValue(name);
                                    return (
                                        <Text style={{
                                            color: isEnabled
                                                ? 'var(--success-color)'
                                                : 'var(--error-color)'
                                        }}>
                                            {isEnabled ? field.enableText || '启用' : field.disableText || '禁用'}
                                        </Text>
                                    );
                                }}
                            </Form.Item>
                        )}
                    </Space>
                );

            case 'upload':
            case 'avatar':
                const uploadRef = field.ref || useRef(null);

                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}>
                        <div ref={uploadRef} style={{ display: 'flex', alignItems: 'center' }}>
                            <Upload.Dragger
                                name={name}
                                className="avatar-uploader"
                                showUploadList={false}
                                action={field.uploadUrl || "/api/upload"}
                                beforeUpload={field.beforeUpload}
                                onChange={(info) => handleImageUpload(info, name)}
                                accept={field.accept || ".jpg,.jpeg,.png"}
                                style={{
                                    width: field.width || '96px',
                                    height: field.height || '96px',
                                    minHeight: field.minHeight || '96px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                multiple={false}
                                disabled={disabled}
                                {...fieldProps}
                            >
                                {form.getFieldValue(name) ? (
                                    <img
                                        src={form.getFieldValue(name)}
                                        alt={label || "图片"}
                                        className="avatar-img"
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                    />
                                ) : (
                                    <div className="upload-button">
                                        <CameraOutlined style={{ fontSize: '32px', color: '#999' }} />
                                    </div>
                                )}
                            </Upload.Dragger>
                            {field.showUploadInfo !== false && (
                                <div className="profile-info">
                                    <Title level={5} className="profile-picture-title" style={{ marginBottom: '4px' }}>
                                        {field.required && <span style={{ color: 'red' }}>* </span>}
                                        {label || "上传图片"}
                                    </Title>
                                    <div>{field.uploadText || "点击或拖拽文件上传"}</div>
                                    <Text type="secondary" className="profile-picture-desc">
                                        {field.uploadDescription || "JPG 或 PNG 格式，最大 2MB"}
                                    </Text>
                                </div>
                            )}
                        </div>
                        {field.showChangeButton !== false && (
                            <Button
                                onClick={() => triggerUploadClick(uploadRef)}
                                disabled={disabled}
                                {...(field.changeButtonProps || {})}
                            >
                                {field.changeButtonText || "更改"}
                            </Button>
                        )}
                    </div>
                );

            default:
                return <Input
                    placeholder={placeholder || `请输入${label}`}
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
                message: field.requiredMessage || `请${field.type === 'select' ? '选择' : '输入'}${label}`
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
                valuePropName={valuePropName || (field.type === 'switch' ? 'checked' : 'value')}
                className={className}
                hidden={hidden}
                noStyle={noStyle}
            >
                {renderFormControl(field)}
            </Form.Item>
        );
    };

    // 渲染简单表单
    const renderSimpleForm = () => (
        <Form
            form={form}
            layout={config.layout || "vertical"}
            onValuesChange={handleFormChange}
            onFinish={handleSaveChanges}
            initialValues={initialValues}
        >
            {fields.map(renderFormItem)}
        </Form>
    );

    // 渲染复杂表单（如Workouts编辑器）
    const renderComplexForm = () => {
        if (!complexConfig.ContentLibraryPanel || !complexConfig.EditorFormPanel) {
            console.error('复杂表单缺少必要组件配置');
            return <div>配置错误：缺少必要组件</div>;
        }

        return (
            <div className={complexConfig.containerClassName || "complex-editor-container"}>
                {/* 内容库面板 */}
                {complexConfig.showContentLibrary && (
                    <ContentLibraryPanel
                        className={complexConfig.contentLibraryClassName || "content-library-panel"}
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
                <EditorFormPanel
                    className={complexConfig.editorPanelClassName || "editor-form-panel"}
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
            </div>
        );
    };

    return (
        <div className={config.containerClassName || "common-editor-container"}>
            {contextHolder}

            {pageLoading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    {formType === 'simple' ? renderSimpleForm() : renderComplexForm()}
                </>
            )}
        </div>
    );
} 