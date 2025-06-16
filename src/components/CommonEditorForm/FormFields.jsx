import React, { useCallback, useEffect, useState } from 'react';
import { getMediaDurationByUrl } from '@/utils';
import { useLocation } from 'react-router';
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
    Image,
    Select,
    Button,
    Tooltip
} from 'antd';
import {
    EyeOutlined,
    EyeInvisibleOutlined,
    InfoOutlined
} from '@ant-design/icons';
import FileUpload from '@/components/FileUpload/FileUpload';//文件上传组件
import NumberStepper from '@/components/NumberStepper/NumberStepper';//数字步进器组件
import TagSelector from '@/components/TagSelector/TagSelector';//标签选择器组件
import StructureList from '@/components/StructureList/StructureList';//结构化排序列表组件
import styles from './style.module.css';
import { dateRangeKeys } from '@/constants/app';
import { useStore } from "@/store/index.js";
import { optionsConstants } from '@/constants';
import settings from '@/config/settings';
const { file: fileSettings } = settings;
const { Option } = Select;

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
            type === 'date' || type === 'datepicker' || type === 'dateRange' || type === 'antdSelect'
            ? 'select'
            : type === 'upload' ? 'upload' : 'enter';

        finalRules.push({
            required: true,
            message: requiredMessage == undefined ? `Please ${action} ${label}` : requiredMessage
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
    const optionsBase = useStore.getState().optionsBase;
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
    const { form, formConnected, initialValues, mounted, moduleKey } = options;

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
            return field.displayFn ? (
                <div className="displayText" style={field.style}>{field.displayFn(form, initialValues)}</div>
            ) : (
                <div className={styles.displayText} style={{ ...field.style }}>
                    {fieldValue !== undefined ? fieldValue : ''}
                </div>
            )
        // return <div className={styles.displayText} style={{ ...field.style }}>
        //     {fieldValue !== undefined ? fieldValue : ''}
        // </div>;
        // 图片展示字段
        case 'displayImage':
            field.style = field.style || { width: '300px', height: '100px' };
            return field.content ? <Image className={styles.displayImg} src={field.content} style={{ ...field.style }} /> : '';
        case 'input':
            const { key: inputKey, style: inputStyle, ...inputRest } = field;

            return <ControlledInput
                field={field}
                name={name}
                form={options.form}
                label={label}
                disabled={disabled}
                placeholder={placeholder}
                {...inputRest}
            />;

        case 'line':
            return <div style={field.style || {}} className={styles.line}></div>;
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
            return <ControlledInput
                field={field}
                name={name}
                form={options.form}
                label={label}
                disabled={disabled}
                placeholder={placeholder}
                type="password"
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
                    format={field.format || 'YYYY-MM-DD'}
                    style={{ width: field.width || '100%' }}
                />
            );
        case 'switch':
            field.checkedChildren = field.checkedChildren || 'Enabled';
            field.unCheckedChildren = field.unCheckedChildren || 'Disabled';

            // 转换初始值为布尔值
            const initialChecked = fieldValue ? true : false;

            // 使用useEffect处理初始值设置
            useEffect(() => {
                if (fieldValue !== undefined) {
                    form.setFieldValue(name, initialChecked ? 1 : 0);
                }
            }, []);  // 仅在组件挂载时执行一次

            // 提取key属性，确保不会传递给Switch组件
            const { key: switchKey, ...switchRest } = field;

            return (
                <Switch
                    key={switchKey}
                    onChange={(checked) => {
                        const newValue = checked ? 1 : 0;
                        // 回传表单或状态更新逻辑
                        form.setFieldValue(name, newValue);
                    }}
                    {...switchRest}
                />
            )
        // antd模式select
        case 'antdSelect':
            const [isPlaying, setIsPlaying] = useState(null);
            return (
                <Select
                    maxTagCount={field.maxTagCount || 1}
                    name={field.name}
                    disabled={field.disabled}
                    mode={field.mode}
                    style={field.style || {}}
                    placeholder={field.placeholder || `Please select ${field.label}`}
                    allowClear
                >
                    {field.options.map((option) => (
                        <Option key={option.value} value={option.value}  >
                            {field.renderLabel ? field.renderLabel(option, isPlaying, setIsPlaying, form) : option.label}
                        </Option>
                    ))}
                </Select>
            )
        case 'select':

            //选项处理使用统一的options映射
            const fieldCopy = JSON.parse(JSON.stringify(field));
            if (field.options && typeof field.options === 'string') {
                fieldCopy.options = optionsBase[field.options];
            }

            // 确保完全移除key属性
            const { key: selectKey, ...selectRest } = fieldCopy;

            //自定义组件
            return <TagSelector
                key={selectKey}
                {...selectRest}
                defaultValue={field.defaultValue}
                onChange={(value) => {
                    // 调用字段自身的onChange（如果存在）
                    if (field.onChange) {
                        field.onChange(value, form);
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
                gutter,
                key: uploadKey,
                ...uploadRest
            } = field;
            const dirName = moduleKey || useLocation().pathname.split('/')[1];

            // 从options中解构出form对象
            // FileUpload 组件不需要在这里添加 Form.Item，因为 renderFormItem 已经创建了一个
            return (
                <FileUpload
                    dirKey={dirName}
                    form={options.form}
                    key={uploadKey}
                    value={fieldValue}
                    onChange={async (value, file) => {
                        //获取远程音频或视频 URL 的时长（单位：秒）
                        if (field.durationName) {
                            const duration = value ? await getMediaDurationByUrl(value) : null;//获取远程音频或视频 URL 的时长（单位：秒）
                            options.form.setFieldValue(field.durationName, duration * 1000); // 转换为毫秒
                            console.log(options.form)
                        }
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
                    uploadFn={uploadFn}
                    field={field}
                    style={style}
                    {...field.props}
                    {...uploadRest}
                />
            );
        //输入框组
        case 'inputGroup':
            const { inputConfig } = field;
            return (
                field.type == 'line' ? <div>{renderFormControl(field, options)}</div> :
                    <Form.Item className='inputGroup'>
                        <div style={{ display: 'flex', gap: '0 20px', maxWidth: '100%', overflowX: 'hidden' }}>
                            {inputConfig.map((config, index) => {
                                const itemRules = processValidationRules(config.rules || [], {
                                    required: config.required,
                                    label: config.label || label,
                                    type: config.type,
                                    requiredMessage: config.requiredMessage
                                });

                                return (
                                    <div style={{
                                        ...(config.flex ? { flex: config.flex } : {}),
                                        ...(config.width ? { minWidth: config.width } : {})
                                    }} key={index}>
                                        <Form.Item
                                            className='editorform-item'
                                            name={config.name}
                                            label={config.label}
                                            required={config.required}
                                            rules={itemRules}
                                        >
                                            {renderFormControl(config, options)}
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
        //结构化排序列表
        case 'structureList':
            // // 使用ref保存dataList的引用，避免直接依赖field对象
            // const dataListRef = React.useRef(field.dataList);

            // // 当field.dataList改变时更新ref
            // if (field.dataList !== dataListRef.current) {
            //     dataListRef.current = field.dataList;
            // }

            // 使用空依赖数组执行一次，通过ref访问最新值
            // useEffect(() => {
            //     // 使用函数来确保每次都能获取最新的值
            //     const updateFormValue = () => {
            //         const currentDataList = field.formterList ? field.formterList(field.dataList) : field.dataList.map(item => item.id)// 提取 ID 列表
            //     };

            //     // 立即执行一次
            //     updateFormValue();

            //     // 设置定时器检查变化
            //     const timer = setInterval(updateFormValue, 300);

            //     return () => clearInterval(timer);
            // }, []);
            return (
                <div>
                    {
                        field.type === 'structureList' && field.dataList && field.dataList.length > 0 && <div className='structureList-title'>{`${field.dataList?.length || 0} ${field.label}`}</div>
                    }
                    <StructureList
                        form={form}
                        field={field}
                        onCollapseChange={options.onCollapseChange}
                        isCollapse={options.isCollapse}
                        fields={options.fields}
                        activeKeys={options.activeKeys}
                        onItemAdded={options.onItemAdded}
                        onReplaceItem={options.onReplaceItem}
                        onIconChange={options.onIconChange}
                        onDeleteItem={options.onDeleteItem}
                        onCopyItem={options.onCopyItem}
                        onUpdateItem={options.onUpdateItem}
                        onSortItems={options.onSortItems}
                        onSelectedItemProcessed={options.onSelectedItemProcessed}
                        commonListConfig={options.commonListConfig}
                        selectedItemFromList={options.selectedItemFromList}
                        {...field}
                    />
                </div>
            );

    }
};

// 创建一个独立的输入框组件
const ControlledInput = ({ field, name, label, disabled: initialDisabled, placeholder, type = 'input', form, tooltipPlacement, tooltip, ...rest }) => {
    const [inputDisabled, setInputDisabled] = useState(initialDisabled);
    const InputComponent = type === 'password' ? Input.Password : Input;
    // 根据类型准备不同的属性
    const inputProps = {
        style: field.style,
        placeholder: placeholder || `Enter ${label || name}`,
        disabled: inputDisabled,
        allowClear: true,
        maxLength: field.maxLength,
        showCount: field.showCount !== undefined ? field.showCount : field.maxLength,
        autoComplete: "off",
        ...field.props,
        ...rest
    };

    // 只有在密码输入框时才添加 iconRender 属性
    if (type === 'password') {
        inputProps.iconRender = (visible) => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />;
    }
    const { buttonClick, ...newInputProps } = inputProps;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <InputComponent {...newInputProps} />
            {
                field.buttons && field.buttons.length > 1 && (
                    <Button
                        className='btn'
                        type={inputDisabled ? "primary" : "default"}
                        onClick={() => {
                            setInputDisabled(!inputDisabled);
                            //按钮点击事件
                            if (field.buttonClick) {
                                field.buttonClick(form, inputDisabled);
                            }
                        }}
                    >
                        {inputDisabled ? field.buttons[0] : field.buttons[1]}
                    </Button>
                )
            }
        </div>
    );
};

// 添加一个新的辅助函数来处理带 tooltip 的 label
const getLabelWithTooltip = ({ label, tooltip, tooltipPlacement }) => {
    if (!tooltip) return label;

    return (
        <span>
            {label}&nbsp;
            <Tooltip
                className={styles.tooltip}
                trigger={['click']}
                title={tooltip}
                placement={tooltipPlacement || 'bottom'}
            >
                <span className={styles.infoIcon}>
                    i
                </span>
            </Tooltip>
        </span>
    );
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
                {({ getFieldValue, form }) => {
                    // 1) 动态计算 content（可能是函数）
                    const content = typeof field.content === 'function'
                        ? field.content({ getFieldValue, form })
                        : field.content;
                    // 处理图片展示字段
                    if (field.type === 'displayImage') {
                        newField.content = content || null;
                    }
                    if (field.type === 'displayText') {
                        newField.content = content || null;
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
            field.type == 'line' || field.type == 'structureList' ?
                <div>{renderFormControl(field, options)}</div> :
                <Form.Item
                    key={name} // React key 直接传递
                    {...formItemRestProps} // 其余布局 props 展开
                    //上传控件隐藏label，添加tooltip支持
                    label={
                        field.type === 'upload' || field.type === 'structureList'
                            ? null
                            : getLabelWithTooltip(field)
                    }
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
                gutter={options.gutter}
                key={`group-${groupIndex}`}
            >
                {group.map((field) => {
                    // 确定列宽度，优先使用字段指定的colSpan，否则使用默认值
                    const colSpan = field.colSpan || (isOneColumn ? 24 : 24);

                    return (
                        <Col
                            key={field.name || `field-${Math.random()}`}
                            className={styles.formCol}
                            span={field.colSpan}
                            style={{ width: field.width || '100%' }}
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
                        style={{ width: field.width || '100%' }}
                    >
                        {renderFormItem(modifiedField, options)}
                    </div>
                );
            })}
        </div>
    );
}; 