import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
    Form,
    Input,
    Switch,
    Select,
    DatePicker,
    Typography,
    Space,
    message,
    Transfer,
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';
import FileUpload from '@/components/FileUpload/FileUpload'; // 导入外部文件上传组件
import { HeaderContext } from '@/contexts/HeaderContext';
import EditorFormPanel from '@/components/EditorFormPanel/EditorFormPanel';
import ContentLibraryPanel from '@/components/ContentLibrary/ContentLibraryPanel';
import styles from './style.module.css';

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
 * @param {Object} props.complexConfig 复杂表单特有配置
 * @param {string} props.formName 表单名称
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
        config = {
        },
        fields = [],
        initialValues = {},
        onSave,
        validate,
        complexConfig = {} // 高级表单专用配置
    } = props;

    // 路由相关hooks
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    // 表单实例
    const formInstance = Form.useForm()[0];

    // 表单状态管理
    const [formConnected, setFormConnected] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // 引用和标记
    const initialValuesRef = useRef(initialValues);
    const mounted = useRef(false);

    // 复杂表单特有状态
    const [structurePanels, setStructurePanels] = useState(
        complexConfig.structurePanels || []
    );
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(['1']);
    const [expandedItems, setExpandedItems] = useState({});

    // 获取HeaderContext，用于设置全局头部按钮和标题
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);

    // 监测表单实例挂载状态
    useEffect(() => {
        if (formInstance && typeof formInstance.getFieldsValue === 'function') {
            setFormConnected(true);
            mounted.current = true;
        }
        return () => {
            mounted.current = false;
        };
    }, [formInstance]);

    // 初始值变化时，更新引用和表单
    useEffect(() => {
        if (formConnected && JSON.stringify(initialValues) !== JSON.stringify(initialValuesRef.current)) {
            initialValuesRef.current = { ...initialValues };

            formInstance.resetFields();
            formInstance.setFieldsValue(initialValues);

            setIsFormDirty(false);
        }
    }, [formConnected, formInstance, initialValues]);

    // 保存按钮处理函数
    const handleSaveChanges = useCallback(() => {
        if (!formConnected) return;

        formInstance.validateFields()
            .then(values => {
                if (validate && !validate(values, formInstance)) {
                    return;
                }

                let dataToSave = { ...values };

                // 处理高级表单的结构化数据
                if (formType === 'advanced' && complexConfig.includeStructurePanels) {
                    dataToSave.structurePanels = JSON.parse(JSON.stringify(structurePanels));

                    if (complexConfig.flattenStructurePanels) {
                        dataToSave.structure = dataToSave.structurePanels.flatMap(
                            panel => panel.items || []
                        );
                    }
                }

                if (onSave) {
                    const editId = id
                    const callbackUtils = {
                        setDirty: setIsFormDirty,
                        messageApi,
                        navigate
                    };
                    onSave(dataToSave, editId, callbackUtils);
                } else {
                    messageApi.success(config.saveSuccessMessage || 'Save successful!');
                    setIsFormDirty(false);

                    if (config.navigateAfterSave) {
                        navigate(config.afterSaveUrl || -1);
                    }
                }
            })
            .catch(() => {
                messageApi.error(config.validationErrorMessage || 'Please check if the form is filled correctly');
            });
    }, [
        formConnected,
        formInstance,
        validate,
        formType,
        complexConfig.includeStructurePanels,
        complexConfig.flattenStructurePanels,
        structurePanels,
        onSave,
        id,
        messageApi,
        navigate,
        config.saveSuccessMessage,
        config.validationErrorMessage,
        config.navigateAfterSave,
        config.afterSaveUrl
    ]);

    // 返回按钮处理函数
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

    // 头部按钮配置
    const headerButtons = useMemo(() => {
        return [
            {
                key: 'save',
                text: config.saveButtonText || 'Save',
                icon: <SaveOutlined />,
                type: 'primary',
                onClick: handleSaveChanges,
                disabled: !config.allowEmptySave && !isFormDirty,
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
        isFormDirty,
        handleSaveChanges,
        handleBackClick
    ]);

    // 设置页面标题和头部按钮
    useEffect(() => {
        if (setCustomPageTitle) {
            // 设置自定义页面标题
            const formName = config.formName || ''


            const pageTitle = id ? `Edit ${formName}` : `Add ${formName}`;
            setCustomPageTitle(pageTitle);
        }

        // 设置头部按钮
        if (setButtons) {
            setButtons(headerButtons);
        }
    }, [
        config.formName,
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
            config.onFormChange(changedValues, allValues, formConnected ? formInstance : null);
        }
    };

    // 处理展开/折叠项的函数
    const handleToggleExpandItem = useCallback((itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    }, []);

    // 处理折叠面板变化的函数
    const handleCollapseChange = useCallback((keys) => {
        setActiveCollapseKeys(keys);
    }, []);

    // Switch控件组件
    const SwitchField = React.memo(({ name, field, disabled, value, onChange }) => {
        // 值变化处理函数
        const handleSwitchChange = useCallback((newChecked) => {
            // 将布尔值转换为 0 或 1
            const numericValue = newChecked ? 1 : 0;

            // 调用 Form.Item 注入的 onChange 来更新表单状态
            if (typeof onChange === 'function') {
                onChange(numericValue);
            }

            // 调用字段配置中自定义的 onChange (如果存在)
            if (typeof field?.onChange === 'function') {
                try {
                    field.onChange(numericValue);
                } catch (error) {
                    console.error(`Error executing custom field.onChange for switch '${name}':`, error);
                }
            }
        }, [onChange, field, name]);

        // 将传入的 value (0 或 1) 转换为布尔值
        const switchEnabled = value === 1;

        return (
            <Space>
                <Switch
                    disabled={disabled}
                    checked={switchEnabled}
                    onChange={handleSwitchChange}
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

    // 穿梭框控件组件
    const TransferField = React.memo(({ field, disabled, value, onChange }) => {
        // 值变化处理函数
        const handleChange = useCallback((newTargetKeys) => {
            // 直接调用从 Form.Item 注入的 onChange
            if (onChange) {
                onChange(newTargetKeys);
            }

            // 触发自定义onChange
            if (field.onChange) {
                field.onChange(newTargetKeys);
            }
        }, [field, onChange]);

        // 使用传入的 value 作为 targetKeys
        const targetKeys = value || [];

        return (
            <Transfer
                dataSource={field.dataSource || []}
                titles={field.titles || ['Source', 'Target']}
                targetKeys={targetKeys}
                onChange={handleChange}
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
            render,
        } = field;

        // 如果提供了自定义渲染函数，使用它
        if (render) {
            return render(formConnected ? formInstance : null, field);
        }

        // 获取字段值，仅用于显示，不在渲染中更新状态
        let fieldValue = null;
        if (mounted.current && formConnected) {
            fieldValue = formInstance.getFieldValue(name);
        } else if (initialValues && name in initialValues) {
            fieldValue = initialValues[name];
        }

        // 根据类型渲染不同控件
        switch (type) {
            case 'text':
                return <div className={styles.textField}>
                    {fieldValue !== undefined ? fieldValue : ''}
                </div>;

            case 'input':
                return <Input
                    placeholder={placeholder || `Please input ${label}`}
                    disabled={disabled}
                    allowClear
                    maxLength={field.maxLength}
                    showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
                    autoComplete="off"
                    {...fieldProps}
                />;

            case 'textarea':
                return <Input.TextArea
                    placeholder={placeholder || `Please input ${label}`}
                    disabled={disabled}
                    maxLength={field.maxLength}
                    showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
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
                    maxLength={field.maxLength}
                    showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
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
                // SwitchField 由 Form.Item 管理 value 和 onChange
                return <SwitchField
                    name={name}
                    field={field}
                    disabled={disabled}
                    value={fieldValue}
                />;

            case 'upload':
                // FileUpload 由 Form.Item 管理 value 和 onChange
                return <FileUpload
                    field={field}
                    disabled={disabled}
                    name={name}
                    messageApi={messageApi}
                />;

            case 'transfer':
                // TransferField 由 Form.Item 管理 value 和 onChange
                return <TransferField
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
                    {() => field.render(formConnected ? formInstance : null)}
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
                    {() => field.render(formConnected ? formInstance : null)}
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
                valuePropName={valuePropName || 'value'}
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

            {formType === 'basic' ? (
                <Form
                    form={formInstance}
                    layout={config.layout || "vertical"}
                    onValuesChange={handleFormChange}
                    onFinish={handleSaveChanges}
                    initialValues={initialValuesRef.current}
                    name="common-editor-form-basic"
                    preserve={false}
                >
                    {fields.map(renderFormItem)}
                </Form>
            ) : (
                <Form
                    form={formInstance}
                    layout={config.layout || "vertical"}
                    onValuesChange={handleFormChange}
                    onFinish={handleSaveChanges}
                    initialValues={initialValuesRef.current}
                    name="common-editor-form-advanced"
                    preserve={false}
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
                                formInstance={formConnected ? formInstance : null}
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
        </div>
    );
} 