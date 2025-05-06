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
    TimePicker,
    Image,
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';
import FileUpload from '@/components/FileUpload/FileUpload'; // 导入外部文件上传组件
import { HeaderContext } from '@/contexts/HeaderContext';
import styles from './style.module.css';
import BasicForm from './BasicForm';
import AdvancedForm from './AdvancedForm';
import { SwitchField } from './formFields/BasicFields'; // 导入BasicFields中的SwitchField组件

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

    // 使用useForm创建表单实例
    const [form] = Form.useForm();
    const formInstance = form;

    // 表单状态管理
    const [formConnected, setFormConnected] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // 表单初始值的状态 - 使用useMemo缓存，避免不必要的重渲染
    const formValues = useMemo(() => ({ ...initialValues }), [JSON.stringify(initialValues)]);

    // 引用和标记
    const initialValuesRef = useRef(initialValues);
    const mounted = useRef(false);
    const initialized = useRef(false);

    // 复杂表单特有状态
    const [structurePanels, setStructurePanels] = useState(
        complexConfig.structurePanels || []
    );
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(['1']);
    const [expandedItems, setExpandedItems] = useState({});

    // 获取HeaderContext，用于设置全局头部按钮和标题
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext);

    // 初始化表单数据
    useEffect(() => {
        // 更新引用中的初始值
        initialValuesRef.current = { ...initialValues };

        // 只在表单连接后操作
        if (formInstance && formConnected && Object.keys(initialValues).length > 0) {
            // 确保按顺序执行重置和设置值
            formInstance.resetFields();
            formInstance.setFieldsValue(initialValues);
        }
    }, [initialValues, formInstance, formConnected]);

    // 监测表单实例挂载状态
    useEffect(() => {
        if (formInstance && typeof formInstance.getFieldsValue === 'function') {
            setFormConnected(true);
            mounted.current = true;

            // 手动标记表单实例已初始化
            if (!formInstance._init) {
                formInstance._init = true;
            }

            // 在表单连接后设置初始值
            if (Object.keys(initialValues).length > 0 && !initialized.current) {
                initialized.current = true;
                formInstance.setFieldsValue(initialValues);
            }
        }

        return () => {
            mounted.current = false;
        };
    }, [formInstance, initialValues]);

    // 保存按钮处理函数
    const handleSaveChanges = useCallback(() => {
        if (!formConnected) return;

        formInstance.validateFields()
            .then(values => {
                if (validate && !validate(values, formInstance)) {
                    return;
                }

                let dataToSave = { ...values };

                // 处理dateRange类型字段 - 确保分离字段模式下移除原字段值
                fields.forEach(field => {
                    if (field.type === 'dateRange' && field.props?.fieldNames) {
                        const fieldNameConfig = field.props.fieldNames;

                        // 如果使用分离字段模式，且字段名已在值中，则移除原timeRange字段
                        if (fieldNameConfig.start && fieldNameConfig.end &&
                            dataToSave[fieldNameConfig.start] !== undefined &&
                            dataToSave[fieldNameConfig.end] !== undefined &&
                            dataToSave[field.name] !== undefined) {
                            // 移除原始字段，仅保留分离字段值
                            delete dataToSave[field.name];
                        }
                    }

                    // 确保所有日期类型的值都被转换为字符串
                    if ((field.type === 'date' || field.type === 'datepicker') && dataToSave[field.name]) {
                        // 如果值是Moment/Dayjs对象，转换为字符串
                        const dateValue = dataToSave[field.name];
                        if (dateValue && typeof dateValue === 'object' && typeof dateValue.format === 'function') {
                            dataToSave[field.name] = dateValue.format('YYYY-MM-DD');
                        }
                    }

                    // 处理timeRange字段，确保其值是字符串数组而不是日期对象数组
                    if (field.type === 'dateRange' && dataToSave[field.name] && Array.isArray(dataToSave[field.name])) {
                        const format = field.props?.format || 'YYYY-MM-DD';
                        const dateRangeValue = dataToSave[field.name];

                        // 将数组中的每个日期对象转换为字符串
                        if (dateRangeValue.length === 2) {
                            if (typeof dateRangeValue[0] === 'object' && typeof dateRangeValue[0].format === 'function') {
                                dataToSave[field.name] = [
                                    dateRangeValue[0].format(format),
                                    dateRangeValue[1].format(format)
                                ];
                            }
                        }
                    }
                });

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
            .catch((error) => {
                messageApi.error(config.validationErrorMessage || 'Please check if the form is filled correctly');
            });
    }, [
        formConnected,
        formInstance,
        validate,
        fields,
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
            const formName = config.formName || '';
            const pageTitle = id ? `Edit ${formName}` : `Add ${formName}`;
            setCustomPageTitle(pageTitle);
        }

        // 设置头部按钮
        if (setButtons) {
            setButtons(headerButtons);
        }
    }, [
        config.formName,
        id,
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

        // 安全提取数据源
        const dataSource = field.dataSource || [];
        const titles = field.titles || ['Source', 'Target'];
        const render = field.render || (item => item.title);
        const showSearch = field.showSearch !== false;
        const filterOption = field.filterOption || ((inputValue, item) =>
            item.title.indexOf(inputValue) !== -1);
        const locale = field.locale || {
            itemUnit: 'item',
            itemsUnit: 'items',
            searchPlaceholder: 'Search here',
            notFoundContent: 'No data'
        };

        // 安全提取props
        const transferProps = {};
        if (field.props) {
            Object.keys(field.props).forEach(key => {
                const propValue = field.props[key];
                if (propValue === null || typeof propValue !== 'object') {
                    transferProps[key] = propValue;
                }
            });
        }

        return (
            <Transfer
                dataSource={dataSource}
                titles={titles}
                targetKeys={targetKeys}
                onChange={handleChange}
                render={render}
                disabled={disabled}
                showSearch={showSearch}
                filterOption={filterOption}
                locale={locale}
                {...transferProps}
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

        // 获取字段值，仅用于显示，不在渲染中更新状态
        let fieldValue = null;
        if (mounted.current && formConnected) {
            fieldValue = formInstance.getFieldValue(name);
        } else if (initialValues && name in initialValues) {
            fieldValue = initialValues[name];
        }

        // 如果提供了自定义渲染函数，使用它
        if (render) {
            return render(formConnected ? formInstance : null, field);
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
                // 合并样式，确保宽度设置不会被覆盖
                const datePickerStyle = {
                    width: '50%', // 百分比宽度
                    ...(fieldProps.style || {})
                };

                // 复制一份 fieldProps，移除 style 属性避免覆盖
                const datePickerProps = { ...fieldProps };
                delete datePickerProps.style; // 避免 style 被覆盖

                // 配置弹出层样式，防止撑开容器
                const popupStyle = {
                    position: 'absolute',
                    zIndex: 1050,
                };

                return (
                    <div className={styles.datePickerWrapper}>
                        <DatePicker
                            placeholder={placeholder || `Select ${label}`}
                            disabled={disabled}
                            style={datePickerStyle}
                            popupStyle={popupStyle}
                            getPopupContainer={triggerNode => triggerNode.parentNode}
                            {...datePickerProps}
                        />
                    </div>
                );

            case 'dateRange':
                // 获取字段属性，支持从item.props或fieldProps中获取
                const dateRangeProps = {
                    ...(fieldProps || {}),
                    format: (field.props?.format || fieldProps.format || 'YYYY-MM-DD'),
                    placeholder: (field.props?.placeholder || fieldProps.placeholder || ['startDate', 'endDate'])
                };

                // 获取字段名配置，支持从props或顶层配置获取
                const fieldNameConfig = field.props?.fieldNames || fieldProps.fieldNames;

                // 检查是否为分离字段模式
                const isSeparatedFields = fieldNameConfig && fieldNameConfig.start && fieldNameConfig.end;

                // 添加禁用日期配置
                if (field.props?.disabledDate || fieldProps.disabledDate) {
                    dateRangeProps.disabledDate = field.props?.disabledDate || fieldProps.disabledDate;
                }

                // 如果使用分离字段模式，我们需要在表单中隐式添加这些字段
                if (isSeparatedFields) {
                    // 如果表单连接成功，确保这些字段已经在表单中注册
                    const startFieldName = fieldNameConfig.start;
                    const endFieldName = fieldNameConfig.end;

                    // 添加隐藏的表单项，用于提交值
                    const hiddenFields = (
                        <>
                            <Form.Item name={startFieldName} hidden noStyle></Form.Item>
                            <Form.Item name={endFieldName} hidden noStyle></Form.Item>
                        </>
                    );

                    // 直接将表单实例和字段名传递给组件
                    return (
                        <div style={{ width: '100%', display: 'block' }}>
                            {hiddenFields}
                            <DateRangePickerField
                                placeholder={dateRangeProps.placeholder}
                                disabled={dateRangeProps.disabled}
                                componentProps={{
                                    ...dateRangeProps,
                                    name: field.name // 传递原字段名
                                }}
                                fieldNames={fieldNameConfig} // 直接传递字段名配置
                                form={formInstance} // 直接传递表单实例
                                onChange={(dates, dateStrings) => {
                                    // 处理onChange，确保更新表单字段
                                    if (!dates) {
                                        // 清除日期
                                        formInstance.setFieldsValue({
                                            [startFieldName]: null,
                                            [endFieldName]: null,
                                            [field.name]: null // 同时清除原字段
                                        });
                                    } else {
                                        // 设置日期 - 使用dateStrings而不是dates对象
                                        formInstance.setFieldsValue({
                                            [startFieldName]: dateStrings[0],
                                            [endFieldName]: dateStrings[1],
                                            [field.name]: dateStrings // 存储格式化的字符串数组，而不是日期对象
                                        });
                                    }

                                    // 调用原onChange
                                    if (dateRangeProps.onChange) {
                                        dateRangeProps.onChange(dates, dateStrings);
                                    }
                                }}
                            />
                        </div>
                    );
                }

                // 非分离模式，直接渲染单一字段
                return (
                    <div style={{ width: '100%', display: 'block' }}>
                        <DateRangePickerField
                            placeholder={dateRangeProps.placeholder}
                            disabled={dateRangeProps.disabled}
                            componentProps={dateRangeProps}
                            onChange={dateRangeProps.onChange}
                        />
                    </div>
                );

            case 'switch':
                // 优化SwitchField调用，避免传递整个field对象
                const switchProps = {};
                if (field.props) {
                    Object.keys(field.props).forEach(key => {
                        const propValue = field.props[key];
                        if (propValue === null || typeof propValue !== 'object') {
                            switchProps[key] = propValue;
                        }
                    });
                }

                return <SwitchField
                    name={name}
                    componentProps={switchProps}
                    disabled={disabled}
                    value={fieldValue}
                    onChange={field.onChange}
                    preview={field.preview}
                    previewStyle={field.previewStyle}
                />;

            case 'upload':
                // 优化FileUpload调用，提取关键属性
                const uploadProps = {
                    acceptedFileTypes: field.acceptedFileTypes,
                    maxFileSize: field.maxFileSize,
                    uploadDescription: field.uploadDescription,
                    uploadSuccessMessage: field.uploadSuccessMessage,
                    uploadFailMessage: field.uploadFailMessage,
                    uploadErrorMessage: field.uploadErrorMessage,
                    dirKey: field.dirKey,
                    uploadFn: field.uploadFn,
                    previewWidth: field.previewWidth,
                    previewHeight: field.previewHeight
                };

                // 使用FormItemRenderer处理表单项
                return renderFormItem({
                    ...field,
                    props: {
                        ...(field.props || {}),
                        ...uploadProps  // 确保上传属性包含在props中
                    },
                    // 确保规则被传递
                    rules: field.rules || []
                });

            case 'transfer':
                // 优化TransferField调用，提取关键属性
                const transferProps = {
                    dataSource: field.dataSource || [],
                    titles: field.titles || ['Source', 'Target'],
                    render: field.render,
                    showSearch: field.showSearch,
                    filterOption: field.filterOption,
                    locale: field.locale,
                    onChange: field.onChange,
                    props: {}
                };

                // 安全提取props
                if (field.props) {
                    Object.keys(field.props).forEach(key => {
                        const propValue = field.props[key];
                        if (propValue === null || typeof propValue !== 'object') {
                            transferProps.props[key] = propValue;
                        }
                    });
                }

                return <TransferField
                    field={transferProps}
                    disabled={disabled}
                />;

            case 'rangeTime':
                return (
                    <div style={{ width: '100%', display: 'block' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TimePicker.RangePicker
                                {...fieldProps}
                                style={{ width: '100%' }}
                                className='c-editorform-timepicker'
                            />
                        </div>
                    </div>
                );

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
                message: field.requiredMessage || `Please ${field.type === 'select' || field.type === 'single' || field.type === 'multiple' || field.type === 'date' || field.type === 'datepicker' || field.type === 'dateRange' ? 'select' : field.type === 'upload' ? 'upload' : 'input'} ${label}`
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
                <BasicForm
                    form={formInstance}
                    config={config}
                    fields={fields}
                    initialValues={formValues}
                    onFormChange={handleFormChange}
                    onFinish={handleSaveChanges}
                    messageApi={messageApi}
                    layout={config.layout || 'vertical'}
                />
            ) : (
                <AdvancedForm
                    form={formInstance}
                    config={config}
                    initialValues={formValues}
                    onFormChange={handleFormChange}
                    onFinish={handleSaveChanges}
                    complexConfig={complexConfig}
                    structurePanels={structurePanels}
                    expandedItems={expandedItems}
                    activeCollapseKeys={activeCollapseKeys}
                    onToggleExpandItem={handleToggleExpandItem}
                    onCollapseChange={handleCollapseChange}
                    layout={config.layout || 'vertical'}
                />
            )}
        </div>
    );
}