import React, { useCallback, useEffect } from 'react';
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
import { optionsConstants } from '@/constants';
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
    // 删除不必要的console.log

    // 表单字段的标准属性
    const {
        type = 'input',
        label,
        name,
        initialValue,
        placeholder,
        disabled = false,
        width,
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
    if (field.render) {
        return field.render(formConnected ? form : null, field);
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
            field.style = field.style || { width: '300px', height: '100px' };
            return field.content ? <Image className={styles.displayImg} src={field.content} style={{ ...field.style }} /> : '';
        case 'input':
            const { key: inputKey, style: inputStyle, ...inputRest } = field;
            return <Input
                key={inputKey}
                style={inputStyle}
                placeholder={placeholder || `Enter ${label || name}`}
                disabled={disabled}
                allowClear
                maxLength={field.maxLength}
                showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
                autoComplete="off"
                {...field.props}
                {...inputRest}
            />;
        //文本输入框
        case 'textarea':
            const { key: textareaKey, ...textareaRest } = field;
            return <Input.TextArea
                key={textareaKey}
                placeholder={placeholder || `Enter ${label || name}`}
                disabled={disabled}
                maxLength={field.maxLength}
                showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
                allowClear
                autoComplete="off"
                {...field.props}
                {...textareaRest}
            />;
        //密码输入框
        case 'password':
            const { key: passwordKey, ...passwordRest } = field;
            return <Input.Password
                key={passwordKey}
                placeholder={placeholder || `Enter ${label || name}`}
                disabled={disabled}
                iconRender={(visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                allowClear
                maxLength={field.maxLength}
                showCount={field.showCount !== undefined ? field.showCount : field.maxLength}
                autoComplete="off"
                {...field.props}
                {...passwordRest}
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
            console.log(initialValues);

            const { keys = dateRangeKeys } = field;
            const handleChange = (dates, dateStrings) => {
                // 将日期字符串映射到keys中
                // keys.forEach((key, idx) => {
                //     form.setFieldValue(key, dateStrings[idx]);
                // });
                if (field.onChange) {
                    field.onChange(dates, dateStrings);
                }
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
            // 确保初始值为0或1
            useEffect(() => {
                form.setFieldValue(name, fieldValue === 1 || fieldValue === true ? 1 : 0);
            }, []);

            // 提取key属性，确保不会传递给Switch组件
            const { key: switchKey, ...switchRest } = field;

            return (
                <Switch
                    key={switchKey}
                    defaultChecked={field.defaultChecked || false}
                    onChange={(checked) => {
                        const newValue = checked ? 1 : 0;
                        // 回传表单或状态更新逻辑
                        form.setFieldValue(name, newValue);
                    }}
                    {...switchRest}
                />
            )
        case 'select':
            //选项处理使用统一的options映射
            const fieldCopy = JSON.parse(JSON.stringify(field));
            if (field.options && typeof field.options === 'string') {
                fieldCopy.options = optionsConstants[field.options];
            }

            // 确保完全移除key属性
            const { key: selectKey, ...selectRest } = fieldCopy;

            return <TagSelector
                key={selectKey}
                {...selectRest}
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
                style,
                key: uploadKey,
                ...uploadRest
            } = field;
            // 从options中解构出form对象
            // FileUpload 组件不需要在这里添加 Form.Item，因为 renderFormItem 已经创建了一个
            return (
                <FileUpload
                    form={options.form}
                    key={uploadKey}
                    value={fieldValue}
                    onChange={(value, file) => {
                        if (field.onChange) {
                            field.onChange(value, file, form);
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
                    style={style}
                    {...field.props}
                    {...uploadRest}
                />
            );
        //输入框组
        case 'inputGroup':
            const { inputConfig } = field;
            return (
                <Form.Item
                    label={label}
                >
                    <div style={{ display: 'flex', gap: '0 20px', maxWidth: '100%', overflowX: 'auto' }}>
                        {inputConfig.map((config, index) => {
                            // 处理每个子项的验证规则
                            const itemRules = processValidationRules(config.rules || [], {
                                required: config.required,
                                label: config.label || label,
                                type: config.type,
                                requiredMessage: config.requiredMessage
                            });

                            return (
                                <div style={{ flex: 1, minWidth: config.width || '' }} key={index}>
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
            // 提取key属性，确保其不会通过展开运算符传递
            const { key: stepperKey, ...stepperRest } = field;

            return (
                <NumberStepper
                    key={stepperKey}
                    {...stepperRest}
                />
            );
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
    // 删除不必要的console.log
    if (!field) {
        return null;
    }

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
        const newField = JSON.parse(JSON.stringify(field));
        delete newField.dependencies;

        return (
            <Form.Item
                noStyle
                dependencies={dependencies}
            >
                {({ getFieldValue }) => {
                    // 1) 动态计算 content（可能是函数）
                    const content = typeof field.content === 'function'
                        ? field.content({ getFieldValue })
                        : field.content;
                    // 处理图片展示字段
                    if (field.type === 'displayImage') {
                        newField.content = content ? fileSettings.baseURL + content : null;
                    }

                    // 渲染组件
                    return content ? renderFormItem(newField, options) : null
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