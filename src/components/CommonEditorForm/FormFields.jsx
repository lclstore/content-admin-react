import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
    Input,
    DatePicker,
    Form,
    Switch,
    Transfer,
    TimePicker,
    Divider,
    Row,
    Col,
    Image
} from 'antd';
import {
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';
import FileUpload from '@/components/FileUpload/FileUpload';//文件上传组件
import NumberStepper from '@/components/NumberStepper/NumberStepper';//数字步进器组件
import TagSelector from '@/components/TagSelector/TagSelector';//标签选择器组件
import styles from './style.module.css';
import { dateRangeKeys } from '@/constants/app';
import settings from '@/config/settings';
const { file: fileSettings } = settings;


/**
 * 统一处理表单验证规则
 * @param {Array} rules 原始规则数组
 * @param {Boolean} required 是否必填
 * @param {String} label 字段标签
 * @param {String} type 字段类型
 * @param {String} requiredMessage 自定义必填消息
 * @returns {Array} 处理后的规则数组
 */
export const processValidationRules = (rules = [], { required, label, type, requiredMessage } = {}) => {
    // 复制规则数组，避免修改原始数组
    const finalRules = [...rules];

    // 添加必填规则（如果需要且不存在）
    if (required && !finalRules.some(rule => rule.required)) {
        // 根据字段类型确定动词
        const action = type === 'select' || type === 'single' || type === 'multiple' ||
            type === 'date' || type === 'datepicker' || type === 'dateRange'
            ? 'select'
            : type === 'upload' ? 'upload' : 'enter';

        finalRules.push({
            required: true,
            message: requiredMessage || `Please ${action} ${label}`
        });
    }

    return finalRules;
};


/**
 * 穿梭框控件组件
 * 用于多选项的双向选择
 */
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
    const titles = field.titles || ['来源', '目标'];
    const render = field.render || (item => item.title);
    const showSearch = field.showSearch !== false;
    const filterOption = field.filterOption || ((inputValue, item) =>
        item.title.indexOf(inputValue) !== -1);
    const locale = field.locale || {
        itemUnit: '项',
        itemsUnit: '项',
        searchPlaceholder: '在这里搜索',
        notFoundContent: '无数据'
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

// ==========================
// 字段渲染逻辑
// ==========================

/**
 * 根据字段类型渲染表单控件
 * @param {Object} field 字段配置
 * @param {Object} options 渲染选项
 * @returns {ReactNode} 渲染的表单控件
 */
export const renderFormControl = (field, options = {}) => {
    const {
        type,
        name,
        label,
        placeholder,
        options: fieldOptions,
        disabled,
        props: fieldProps = {},
        render,
    } = field;

    const { form, formConnected, initialValues, mounted } = options;

    // 获取字段值，仅用于显示，不在渲染中更新状态
    let fieldValue = '';
    if (mounted?.current && formConnected && form) {
        fieldValue = form.getFieldValue(name);
    } else if (initialValues && name in initialValues) {
        fieldValue = initialValues[name];
    }

    // 如果提供了自定义渲染函数，使用它
    if (render) {
        return render(formConnected ? form : null, field);
    }

    // 根据类型渲染不同控件
    switch (type) {
        // 文本展示字段
        case 'displayText':
            return <div className={styles.displayText} style={{ ...field.style }}>
                {fieldValue !== undefined ? fieldValue : ''}
            </div>;
        // 图片展示字段
        case 'displayImage':
            return field.src ? <Image className={styles.displayImg} src={field.src} style={{ ...field.style }} /> : '';
        case 'input':
            return <Input
                placeholder={placeholder || `Enter ${label}`}
                disabled={disabled}
                allowClear
                maxLength={field.maxLength}
                showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
                autoComplete="off"
                {...fieldProps}
            />;
        //文本输入框
        case 'textarea':
            return <Input.TextArea
                placeholder={placeholder || `Enter ${label}`}
                disabled={disabled}
                maxLength={field.maxLength}
                showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
                allowClear
                autoComplete="off"
                {...fieldProps}
            />;
        //密码输入框
        case 'password':
            return <Input.Password
                placeholder={placeholder || `Enter ${label}`}
                disabled={disabled}
                iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                allowClear
                maxLength={field.maxLength}
                showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
                autoComplete="off"
                {...fieldProps}
            />;


        case 'date':
            // 合并样式，确保宽度设置不会被覆盖
            const datePickerStyle = {
                width: '50%', // 百分比宽度
                position: 'relative',
                ...(field.style || {})
            };


            // 配置弹出层样式，防止撑开容器
            const popupStyle = {
                position: 'absolute',
                zIndex: 1050,
            };
            field.placeholder = field.placeholder || `Select ${field.label}`;
            return (
                <DatePicker
                    style={datePickerStyle}
                    popupStyle={popupStyle}
                    getPopupContainer={triggerNode => triggerNode.parentNode}
                    {...field}
                />
            );

        case 'dateRange':
            const { keys = dateRangeKeys } = field;
            const handleChange = (dates, dateStrings) => {
                // 将日期字符串映射到keys中
                const mapped = keys.reduce((acc, key, idx) => {
                    acc[key] = dateStrings[idx];
                    return acc;
                }, {});
                console.log(mapped);

            };
            return (
                <DatePicker.RangePicker
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={handleChange}
                    style={{ width: '100%' }}
                />
            );
        case 'switch':
            field.checkedChildren = field.checkedChildren || 'Enabled';
            field.unCheckedChildren = field.unCheckedChildren || 'Disabled';
            field.defaultChecked = fieldValue === 1 || fieldValue === true;
            console.log(fieldValue);

            return (
                <Switch
                    defaultChecked={fieldValue === 1 || fieldValue === true}
                    onChange={(checked) => {
                        const newValue = checked ? 1 : 0;
                        // 回传表单或状态更新逻辑
                        form.setFieldValue(name, newValue);
                    }}
                    {...field}
                />
            )
        case 'select':
            return <TagSelector
                {...field}
                onChange={(value) => {
                    // 调用字段自身的onChange（如果存在）
                    if (field.onChange) {
                        field.onChange(value);
                    }

                    // 表单的onChange由Form.Item注入（通过options.onChange）
                    if (options && options.onChange) {
                        options.onChange(value);
                    }
                }}
            />;


        // 文件上传并预览
        case 'upload':
            const {
                acceptedFileTypes,
                maxFileSize,
                uploadDescription,
                uploadSuccessMessage,
                uploadFailMessage,
                uploadErrorMessage,
                dirKey,
                uploadFn,
                previewWidth,
                previewHeight,
            } = field;

            // FileUpload 组件不需要在这里添加 Form.Item，因为 renderFormItem 已经创建了一个
            return (
                <FileUpload
                    value={fieldValue}
                    onChange={(value) => {
                        if (field.onChange) {
                            field.onChange(value);
                        }
                    }}
                    acceptedFileTypes={acceptedFileTypes}
                    maxFileSize={maxFileSize}
                    uploadDescription={uploadDescription}
                    uploadSuccessMessage={uploadSuccessMessage}
                    uploadFailMessage={uploadFailMessage}
                    uploadErrorMessage={uploadErrorMessage}
                    dirKey={dirKey}
                    uploadFn={uploadFn}
                    previewWidth={previewWidth}
                    previewHeight={previewHeight}
                    {...fieldProps}
                />
            );
        //输入框组
        case 'inputGroup':
            const { componentConfig } = field;
            return (
                <Form.Item
                    label={label}
                >
                    <div style={{ display: 'flex', gap: '0 40px', maxWidth: '100%', overflowX: 'auto' }}>
                        {componentConfig.map((config, index) => {
                            // 处理每个子项的验证规则
                            const itemRules = processValidationRules(config.rules || [], {
                                required: config.required,
                                label: config.label || label,
                                type: config.type,
                                requiredMessage: config.requiredMessage
                            });

                            return (
                                <div style={{ flex: 1, minWidth: config.previewWidth }} key={index}>
                                    <Form.Item
                                        className='editorform-item'
                                        name={config.name}
                                        label={config.label}
                                        required={config.required}
                                        rules={itemRules}
                                    >
                                        {renderFormControl(config)}
                                    </Form.Item>
                                </div>
                            );
                        })}
                    </div>
                </Form.Item>
            );
        //数字步进器
        case 'numberStepper':

            return (
                <NumberStepper
                    {...field}
                />
            );
        case 'transfer':
            // 优化TransferField调用，提取关键属性
            const transferProps = {
                dataSource: field.dataSource || [],
                titles: field.titles || ['来源', '目标'],
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
                            style={{ width: '100%' }}
                            className='c-editorform-timepicker'
                        />
                    </div>
                </div>
            );

        default:
            return <Input
                placeholder={placeholder || `Enter ${label}`}
                disabled={disabled}
                {...fieldProps}
            />;
    }
};

/**
 * 渲染表单项
 * 处理表单项的props和规则
 * 
 * @param {Object} field 字段配置
 * @param {Object} options 渲染选项
 * @returns {ReactNode} 渲染的表单项
 */
export const renderFormItem = (field, options = {}) => {
    const {
        name, // 字段的标识符
        label,
        rules = [], // 字段的原始规则
        labelCol,
        wrapperCol,
        dependencies,
        shouldUpdate,
        valuePropName: initialValuePropName, // 用户指定的 valuePropName
        hidden,
        noStyle,
        className,
        required // 字段级别的必填标记
    } = field;

    const { form, formConnected } = options;

    // 特殊渲染情况：当 shouldUpdate 为 true 时
    // 这些情况通常自定义渲染逻辑，并且 Form.Item 的 name 属性不用于表单值收集
    if (shouldUpdate) {
        return (
            <Form.Item
                key={name || `item-${Math.random()}`} // key 仍然需要 name 或一个回退值
                shouldUpdate={shouldUpdate}
                className={`${className || ''} editorform-item`} // 确保 className 安全处理
                hidden={hidden}
            // 注意：原始代码中此场景下没有 noStyle，保持一致
            >
                {() => field.render(formConnected ? form : null)}
            </Form.Item>
        );
    }

    // 特殊渲染情况：当存在 dependencies 时
    // 同上，这些情况的 Form.Item 的 name 属性不用于表单值收集
    if (dependencies) {
        console.log(field, options);
        const newField = JSON.parse(JSON.stringify(field));
        delete newField.dependencies;

        return (
            <Form.Item
                noStyle
                dependencies={['status221']}
            >
                {({ getFieldValue }) => {
                    // 1) 动态计算 content（可能是函数）
                    const content = typeof field.content === 'function'
                        ? field.content({ getFieldValue })
                        : field.content;
                    // 2) 拼接完整 URL
                    const src = fileSettings.baseURL + content;
                    console.log(src);
                    newField.src = src;
                    // 3) 根据 status221 决定是否渲染
                    // return <Image
                    //     className={styles.displayImg}
                    //     src={src}
                    //     style={field.style}
                    // />
                    return renderFormItem(newField, options)
                }}
            </Form.Item>
        );
    }

    // Form.Item 的通用基础属性 (不包含 key)
    const formItemRestProps = {
        label: label,
        labelCol: labelCol,
        wrapperCol: wrapperCol,
        // 确保 className 的拼接是安全的，并处理 field.type 对 className 的影响
        className: `${className || ''} ${field.type === 'inputGroup' ? '' : 'editorform-item'}`.trim(),
        hidden: hidden,
        noStyle: noStyle,
    };

    // 判断是否为纯展示类型的字段
    const isDisplayType = field.type === 'displayText' || field.type === 'displayImage';

    if (isDisplayType) {
        // 对于纯展示类型，Form.Item 仅用于布局
        // 不应传递 name, rules, valuePropName，因为它们不参与表单控制
        return (
            <Form.Item key={name} {...formItemRestProps}> {/* key 直接传递, 其余 props 展开 */}
                {renderFormControl(field, options)}
            </Form.Item>
        );
    } else {
        // 对于需要表单控制的输入/交互型字段

        // 处理表单验证规则 (仅对非展示型字段有意义)
        const finalRules = processValidationRules(rules, {
            required,
            label,
            type: field.type,
            requiredMessage: field.requiredMessage
        });

        // 根据字段类型确定 valuePropName (仅对非展示型字段有意义)
        let finalValuePropName = initialValuePropName;
        if (!finalValuePropName) {
            if (field.type === 'switch') {
                finalValuePropName = 'checked';
            } else {
                finalValuePropName = 'value'; // 默认为 'value'
            }
        }

        return (
            <Form.Item
                key={name} // React key 直接传递
                {...formItemRestProps} // 其余布局 props 展开
                name={name} // AntD Form.Item 'name' prop 仍然需要，用于表单控制和校验
                rules={finalRules}
                valuePropName={finalValuePropName}
            >
                {renderFormControl(field, options)}
            </Form.Item>
        );
    }
};

/**
 * 基础表单渲染
 * 渲染一组表单字段
 */
export const renderBasicForm = (fields, options) => {
    const { oneColumnKeys = [] } = options || {};

    if (!fields || fields.length === 0) {
        return null;
    }

    const groups = [];
    let currentGroup = [];

    fields.forEach((field, index) => {
        // 特殊处理：如果字段是分割线，创建一个新的分组
        if (field.type === 'divider') {
            if (currentGroup.length > 0) {
                groups.push([...currentGroup]);
                currentGroup = [];
            }

            // 将分割线字段单独作为一个分组
            groups.push([field]);
        } else {
            // 检查是否需要强制单列显示
            const isOneColumn = oneColumnKeys.includes(field.name) || field.oneColumn;

            // 如果是单列字段且当前分组不为空，添加当前分组并开始新分组
            if (isOneColumn && currentGroup.length > 0) {
                groups.push([...currentGroup]);
                currentGroup = [field];
            }
            // 如果是单列字段且当前分组为空，直接添加到当前分组
            else if (isOneColumn) {
                currentGroup.push(field);
                groups.push([...currentGroup]);
                currentGroup = [];
            }
            // 常规字段添加到当前分组
            else {
                currentGroup.push(field);

                // 如果当前是最后一个字段，将剩余字段作为一个分组
                if (index === fields.length - 1 && currentGroup.length > 0) {
                    groups.push([...currentGroup]);
                }
            }
        }
    });

    return groups.map((group, groupIndex) => {
        // 特殊处理：分割线
        if (group.length === 1 && group[0].type === 'divider') {
            const dividerField = group[0];
            return (
                <Divider
                    key={`divider-${groupIndex}`}
                    orientation={dividerField.orientation || 'left'}
                    style={dividerField.style}
                    className={`${styles.formDivider} ${dividerField.className || ''}`}
                >
                    {dividerField.label}
                </Divider>
            );
        }

        // 常规字段分组 - 使用网格布局
        // 如果是单列字段，span设为24，否则为12
        const isOneColumn = group.length === 1 && (oneColumnKeys.includes(group[0].name) || group[0].oneColumn);

        return (
            <Row
                key={`group-${groupIndex}`}
            >
                {group.map((field) => {
                    // 确定列宽度，优先使用字段指定的colSpan，否则使用默认值
                    const colSpan = field.colSpan || (isOneColumn ? 24 : 24);

                    return (
                        <Col
                            key={field.name || `field-${Math.random()}`}
                            className={styles.formCol}
                            style={{ width: `${colSpan === 24 ? '100%' : '50%'}` }}
                        >
                            {renderFormItem(field, options)}
                        </Col>
                    );
                })}
            </Row>
        );
    });
};

/**
 * 高级表单字段渲染
 * 渲染结构化面板中的字段
 */
export const renderPanelFields = (panel, panelIndex, item, itemIndex, options) => {
    if (!item.fields || item.fields.length === 0) {
        return <div className={styles.emptyItem}>No fields in this item</div>;
    }

    return (
        <div className={styles.panelItemFields}>
            {item.fields.map((field, fieldIndex) => {
                // 计算字段名 - 结构化格式
                const fieldName = `structurePanels[${panelIndex}].items[${itemIndex}].${field.name}`;

                // 复制字段配置，更新字段名
                const modifiedField = {
                    ...field,
                    name: fieldName
                };

                // 确定列宽，默认为一半宽度
                const span = field.span || field.colSpan || 12;

                return (
                    <div
                        key={`field-${fieldIndex}`}
                        className={styles.panelItemField}
                        style={{ width: `${span === 24 ? '100%' : '50%'}` }}
                    >
                        {renderFormItem(modifiedField, options)}
                    </div>
                );
            })}
        </div>
    );
}; 