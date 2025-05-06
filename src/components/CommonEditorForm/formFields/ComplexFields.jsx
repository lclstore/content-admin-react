import React, { useCallback, useEffect, useState } from 'react';
import { Transfer } from 'antd';
import FileUpload from '@/components/FileUpload/FileUpload';
import { Input, Select, DatePicker, Radio, Checkbox, Switch } from 'antd';
import moment from 'moment';
import styles from '../style.module.css';

/**
 * 穿梭框控件组件
 * 用于处理多项数据的选择和分配
 */
export const TransferField = React.memo(({ field, disabled, value, onChange }) => {
    // 用于内部状态管理，确保值被正确显示
    const [internalValue, setInternalValue] = useState(value || []);

    // 当外部value变化时，更新内部状态
    useEffect(() => {
        if (value && Array.isArray(value)) {
            setInternalValue(value);
        }
    }, [value]);

    // 值变化处理函数
    const handleChange = useCallback((newTargetKeys) => {
        // 更新内部状态
        setInternalValue(newTargetKeys);

        // 直接调用从 Form.Item 注入的 onChange
        if (onChange) {
            onChange(newTargetKeys);
        }

        // 触发自定义onChange
        if (field.onChange) {
            field.onChange(newTargetKeys);
        }
    }, [field, onChange]);

    // 使用内部状态作为targetKeys，确保实时更新
    const targetKeys = internalValue || [];

    return (
        <Transfer
            dataSource={field.dataSource || []}
            titles={field.titles || ['Source', 'Target']}
            targetKeys={targetKeys}
            onChange={handleChange}
            render={field.render || (item => item.title || item.label || item.value)}
            disabled={disabled}
            showSearch={field.showSearch !== false}
            filterOption={field.filterOption || ((inputValue, item) =>
                (item.title || item.label || '').indexOf(inputValue) !== -1)}
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

/**
 * 文件上传控件组件
 * 封装了外部文件上传组件
 */
export const UploadField = React.memo(({ field, disabled, name, messageApi, value, onChange }) => {
    return (
        <FileUpload
            field={field}
            disabled={disabled}
            name={name}
            messageApi={messageApi}
            value={value}
            onChange={onChange}
        />
    );
});

/**
 * 日期选择器字段
 * @param {Object} props 组件属性
 */
export const DateField = React.memo(({ fieldValue, onChange, disabled }) => {
    const handleChange = (date, dateString) => {
        if (onChange) {
            onChange(dateString);
        }
    };

    return (
        <DatePicker
            value={fieldValue ? moment(fieldValue) : null}
            onChange={handleChange}
            disabled={disabled}
            className={styles.fullWidth}
        />
    );
});

/**
 * 下拉选择字段
 * @param {Object} props 组件属性
 */
export const SelectField = React.memo(({ fieldValue, onChange, options = [], mode, disabled }) => {
    const handleChange = (value) => {
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <Select
            value={fieldValue}
            onChange={handleChange}
            options={options}
            mode={mode}
            disabled={disabled}
            className={styles.fullWidth}
        />
    );
}); 