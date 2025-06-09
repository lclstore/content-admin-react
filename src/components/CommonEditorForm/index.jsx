import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Form, Button, Card, Space, Spin, FloatButton } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import styles from './style.module.css';
import { useFormState, useHeaderConfig } from './hooks';
import { renderBasicForm, renderPanelFields } from './FormFields';
import CommonList from './CommonList'; //左侧列表数据
import CollapseForm from './CollapseForm'; //右侧折叠表单
import dayjs from 'dayjs';
import { dateRangeKeys } from '@/constants/app';
import { arrayMove } from '@dnd-kit/sortable';
import { getformDataById } from '@/config/api.js'; //公共方法--根据id获取表单数据
/**
 * 通用编辑器组件
 * 支持简单表单和复杂表单，根据配置动态渲染
 * 
 * @param {Object} props 组件属性
 * @param {string} props.formType 表单类型: 'basic' 或 'advanced'
 * @param {Object} props.config 表单配置
 * @param {Array} props.fields 表单字段配置数组
 * @param {Object} props.initialValues 初始值
 * @param {Function} props.onSave 保存回调函数
 * @param {Function} props.validate 自定义验证函数
 * @param {Object} props.complexConfig 复杂表单特定配置
 * @param {Object} props.collapseFormConfig 折叠表单配置
 * @param {string} props.formName 表单名称
 * @param {Object} props.initFormData 初始化表单数据
 * @param {Function} props.renderItemMata 自定义渲染列表项
 * @param {string} props.defaultActiveKeys 默认激活的折叠面板key all:所有面板，array:指定面板 null:默认第一个面板
 * @param {Array} props.formFields 表单字段配置（从Editor传入的完整formFields）
 * @param {Function} props.onFormFieldsChange 表单字段变更回调函数
 * @param {Function} props.onCollapseChange 折叠面板变化回调函数
 * @param {boolean} props.enableDraft 是否启用草稿功能
 * @param {Array} props.fieldsToValidate 需要验证的表单字段
 * @param {boolean} props.changeHeader 是否改变头部
 * @param {Function} props.onSubmit 提交函数
 * @param {Function} props.setFormRef 表单引用设置函数
 * @param {string} props.id 从props中获取id，用于覆盖从URL获取的id
 * @param {string} props.moduleKey 模块key
 * @param {boolean} props.isBack 是否返回上一级
 * @param {boolean} props.isTabs 是否为标签页
 * @param {string} props.operationName 操作名称
 * @param {Function} props.getDataAfter 获取数据后回调函数
 * @param {Function} props.saveBeforeTransform 保存前回调函数
 * @param {boolean} props.confirmSucess 是否确认保存成功
 * @param {Function} props.onFormValuesChange 表单值变化回调函数
 */
export default function CommonEditor(props) {
    const {
        formType = 'basic', // 默认为基础表单
        config = {},
        operationName,
        isTabs = false,
        isBack = true,
        confirmSucess,
        moduleKey,
        onSubmit,
        fields = [],
        changeHeader = true,
        fieldsToValidate = ['name'],
        isCollapse = false,
        initialValues = {},
        enableDraft = false,
        initFormData,
        onSave,
        renderItemMata,
        validate,
        commonListConfig = null,
        complexConfig = {}, // 高级表单特定配置
        collapseFormConfig = {},  // 折叠表单配置
        formFields, // 向后兼容：支持旧的formFields属性
        onFormFieldsChange = null, // 字段变更回调
        onCollapseChange = null, // 折叠面板变化回调
        setFormRef, // 添加表单引用设置属性
        id: propId, // 从props中获取id，用于覆盖从URL获取的id
        getDataAfter,
        saveBeforeTransform,
        onFormValuesChange, // 添加新的 prop
    } = props;
    // 添加选中项状态管理 - 存储从列表中选择的当前项
    const [selectedItemFromList, setSelectedItemFromList] = useState(null); // 左侧列表添加item
    // 添加onSubmitCallback状态
    const [onSubmitCallback, setOnSubmitCallback] = useState(null);
    // 内部维护一份formFields状态，优先使用父组件传入的
    const [internalFormFields, setInternalFormFields] = useState(
        collapseFormConfig.fields || formFields || fields || []
    );
    // scroll ref
    const scrollableContainerRef = useRef(null);
    // 每当外部formFields/fields变化时，更新内部状态
    useEffect(() => {
        // 优先使用fields，然后是formFields，最后是collapseFormConfig.fields
        if (fields && fields.length > 0) {
            setInternalFormFields(fields);
        } else if (formFields && formFields.length > 0) {
            setInternalFormFields(formFields);
        } else if (collapseFormConfig.fields && collapseFormConfig.fields.length > 0) {
            setInternalFormFields(collapseFormConfig.fields);
        }
    }, [fields, formFields, collapseFormConfig.fields]);

    // 找到第一个有isShowAdd属性的面板（用于生成新面板）
    const newField = useMemo(() =>
        internalFormFields.find(item => item.isShowAdd),
        [internalFormFields]
    );

    // 计算有dataList的面板数量
    const [dataListPanels, setDataListPanels] = useState([]);
    useEffect(() => {
        const panels = internalFormFields.filter(
            item => item.isShowAdd && Array.isArray(item.dataList)
        );
        setDataListPanels(panels);
    }, [internalFormFields]);

    // if (!setActiveKey) {
    //     setActiveKey = (key) => {

    //     }
    // }
    // 路由相关的钩子
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const idFromUrl = params.get('id'); // 从url获取id
    const isDuplicate = params.get('isDuplicate'); // 是否是复制
    const id = propId !== undefined ? propId : idFromUrl; // 优先使用propId
    const [loading, setLoading] = useState(true);
    // 使用自定义钩子管理表单状态
    const {
        form,
        formConnected,
        isFormDirty,
        setIsFormDirty,
        formValues,
        messageApi,
        contextHolder,
        mounted,
        getLatestValues,

    } = useFormState(initialValues);


    // 复杂表单特定状态
    const [structurePanels, setStructurePanels] = useState(
        complexConfig.structurePanels || []
    );
    const [activeCollapseKeys, setActiveCollapseKeys] = useState(() => {

        if (!collapseFormConfig || !internalFormFields || internalFormFields.length === 0) {
            return [];
        }
        if (collapseFormConfig.defaultActiveKeys === 'all') {
            return internalFormFields.map(field => field.name);
        }
        if (Array.isArray(collapseFormConfig.defaultActiveKeys)) {
            return collapseFormConfig.defaultActiveKeys;
        }
        return [internalFormFields[0].name]; // 默认使用第一个面板
    });
    const [expandedItems, setExpandedItems] = useState({});

    // 获取HeaderContext
    const headerContext = useContext(HeaderContext);

    // 添加handleEditorSubmit方法
    const handleEditorSubmit = () => {
        // 设置onSubmitCallback来触发验证
        setOnSubmitCallback(() => async (values) => {
            try {
                // 执行表单验证
                await form.validateFields();

                // 如果有自定义验证函数，执行它
                if (validate && !validate(values, form)) {
                    return;
                }

                // 获取表单数据
                const dataToSave = form.getFieldsValue(true);

                // 如果是折叠面板，处理特殊字段
                if (isCollapse && internalFormFields) {
                    processFields(internalFormFields, dataToSave);
                }

                // 执行保存操作
                if (onSave) {
                    const editId = id;
                    const callbackUtils = {
                        setDirty: setIsFormDirty,
                        messageApi,
                        navigate
                    };
                    onSave(dataToSave, editId, callbackUtils);
                } else {
                    messageApi.success(config.saveSuccessMessage || '保存成功!');
                    setIsFormDirty(false);

                    if (config.navigateAfterSave) {
                        navigate(config.afterSaveUrl || -1);
                    }
                }
            } catch (error) {
                // 处理验证错误
                console.error('表单验证失败:', error);
                if (error.errorFields) {
                    // 显示第一个错误信息
                    messageApi.error(error.errorFields[0]?.errors?.[0] || '请检查表单填写是否正确');

                    // 如果是折叠面板，展开包含错误字段的面板
                    if (isCollapse && setActiveCollapseKeys) {
                        const errorFieldName = error.errorFields[0]?.name?.[0];
                        const matchedPanel = internalFormFields.find(panel =>
                            Array.isArray(panel.fields) &&
                            panel.fields.some(field => field.name === errorFieldName)
                        );

                        if (matchedPanel) {
                            setActiveCollapseKeys([matchedPanel.name]);
                        }
                    }
                } else {
                    messageApi.error('表单验证失败，请检查填写内容');
                }
            }
        });
    };

    // 使用自定义钩子管理头部配置
    const { headerButtons, handleStatusModalConfirm: handleStatusModalConfirmFromHook, setHeaderButtons } = useHeaderConfig({
        config,
        isBack,
        id: id || idFromUrl,
        moduleKey,
        operationName,
        onSubmit: onSubmitCallback,
        fieldsToValidate,
        enableDraft,
        isFormDirty,
        form,
        formConnected,
        validate,
        onSave,
        confirmSucess,
        navigate,
        setActiveCollapseKeys,
        isCollapse,
        messageApi,
        fields,
        formFields,
        formType,
        complexConfig,
        collapseFormConfig,
        commonListConfig,
        structurePanels,
        headerContext,
        setIsFormDirty,
        getLatestValues,
        setLoading,
        getDataAfter,
        saveBeforeTransform
    });

    // 左侧列表添加item - 在组件内部处理选中项
    const handleCommonListItemAdd = (item) => {
        setSelectedItemFromList(item); // 更新内部状态

        // 如果传入了外部回调函数，也调用它
        if (commonListConfig && commonListConfig.onSelectItem && typeof commonListConfig.onSelectItem === 'function') {
            commonListConfig.onSelectItem(item);
        }
    };

    // 清空选中项的回调函数 - 项目添加到表单后调用
    const handleSelectedItemProcessed = () => {
        console.log('清空选中项');
        setSelectedItemFromList(null);

        // 如果传入了外部回调函数，也调用它
        if (collapseFormConfig.onSelectedItemProcessed && typeof collapseFormConfig.onSelectedItemProcessed === 'function') {
            collapseFormConfig.onSelectedItemProcessed();
        }
    };

    // ==================== FormFields 操作方法（重构） ====================

    // 添加自定义面板的回调函数
    const handleAddCustomPanel = (newPanel) => {

        // 内部面板有isShowAdd的数量
        if (!newField) return;
        //  切换到添加数据当前的panel
        // const lastIndexWithDatalist = [...internalFormFields]
        //     .map((item, index) => item.dataList ? index : -1)
        //     .filter(index => index !== -1)
        //     .pop();

        // let updatedFields;
        // if (lastIndexWithDatalist !== undefined && lastIndexWithDatalist !== -1) {
        //     updatedFields = [...internalFormFields];
        //     updatedFields.splice(lastIndexWithDatalist + 1, 0, newPanel);
        // } else {
        //     // 如果没有任何项包含 datalist，则默认追加到末尾
        //     updatedFields = [...internalFormFields, newPanel];
        // }
        const updatedFields = [...internalFormFields, newPanel];
        // 更新内部状态
        setInternalFormFields(updatedFields);
        setActiveCollapseKeys(newPanel.name);
        //通知父组件面板状态变化
        if (onCollapseChange) {
            onCollapseChange(newActiveKeys);
        }
        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }


        // 如果父组件提供了handleAddCustomPanel，也调用它（向后兼容）
        // if (collapseFormConfig.handleAddCustomPanel) {
        //     collapseFormConfig.handleAddCustomPanel(newPanel);
        // }
    };

    // 删除面板的回调函数
    const handleDeletePanel = (panelName) => {
        const updatedFields = internalFormFields.filter(item => item.name !== panelName);

        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 如果父组件提供了handleDeletePanel，也调用它（向后兼容）
        if (collapseFormConfig.handleDeletePanel) {
            collapseFormConfig.handleDeletePanel(panelName);
        }
    };

    // 处理选中项被添加到表单后的回调
    const [pendingItems, setPendingItems] = useState([]); // 用于存储待处理的项
    const debounceTimerRef = useRef(null); // 用于存储定时器引用

    // 处理项目添加的防抖函数
    const debouncedHandleItems = (items) => {
        if (items.length === 1) {
            // 如果只有一个项目，直接处理
            const [item] = items;
            processItemAdd(item.panelName, item.fieldName, item.itemData, item.expandedItemIndex);
        } else {
            // 如果有多个项目，只处理最后一个
            const lastItem = items[items.length - 1];
            processItemAdd(lastItem.panelName, lastItem.fieldName, lastItem.itemData, lastItem.expandedItemIndex);
        }
        // 清空待处理项
        setPendingItems([]);
    };

    // 实际处理添加项目的函数
    const processItemAdd = (panelName, fieldName, itemData, expandedItemIndex) => {
        internalFormFields.map(field => {
            if (field.name === panelName) {
                if (Array.isArray(field.dataList)) {
                    // 有 dataList，插入到指定位置
                    if (typeof expandedItemIndex === 'number' && expandedItemIndex >= 0) {
                        field.dataList.splice(expandedItemIndex + 1, 0, itemData);
                    } else {
                        field.dataList = [...field.dataList, itemData];
                    }
                } else if (Array.isArray(field.fields)) {
                    // 处理嵌套 fields 情况
                    field.fields = field.fields.map(subField => {
                        if (Array.isArray(subField.dataList)) {
                            if (typeof expandedItemIndex === 'number' && expandedItemIndex >= 0) {
                                subField.dataList.splice(expandedItemIndex + 1, 0, itemData);
                            } else {
                                subField.dataList = [...subField.dataList, itemData];
                            }
                        }
                        return subField;
                    });
                }
            }
            return field;
        });

        //基础表单逻辑
        if (panelName === 'basic') {
            internalFormFields.map(field => {
                if (field.type === 'structureList') {
                    field.dataList = [...field.dataList, itemData];
                }
                return field;
            })
        }

        // 更新内部状态
        setInternalFormFields(internalFormFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(internalFormFields, form);
        }
    };

    // 防抖处理的handleItemAdded函数
    const handleItemAdded = (panelName, fieldName, itemData, expandedItemIndex, formInstance, isCollapse) => {
        // 添加新的待处理项
        const newItem = { panelName, fieldName, itemData, expandedItemIndex };
        setPendingItems(prev => [...prev, newItem]);

        // 清除之前的定时器
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // 设置新的定时器
        debounceTimerRef.current = setTimeout(() => {
            debouncedHandleItems([...pendingItems, newItem]);
        }, 10);
    };

    // 在组件卸载时清理定时器
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // 处理排序的回调函数
    const handleSortItems = (panelName, oldIndex, newIndex) => {
        console.log(`排序: ${panelName}, 从 ${oldIndex} 到 ${newIndex}`);

        if (oldIndex === newIndex) {
            console.log('位置未改变，跳过排序');
            return;
        }

        try {
            // 递归处理字段的辅助函数
            const findAndSortItems = (field) => {
                // 如果当前字段有dataList，检查并排序
                if (field.name === panelName && Array.isArray(field.dataList)) {
                    // 确保数据存在
                    if (oldIndex < 0 || oldIndex >= field.dataList.length ||
                        newIndex < 0 || newIndex >= field.dataList.length) {
                        console.error('索引超出范围:', { oldIndex, newIndex, length: field.dataList.length });
                        return field;
                    }

                    // 使用 arrayMove 辅助函数移动数组中的项
                    const newDataList = arrayMove([...field.dataList], oldIndex, newIndex);
                    console.log('排序后的数据:', newDataList.map(item => item.id));

                    return {
                        ...field,
                        dataList: newDataList
                    };
                }

                // 如果当前字段有子字段，递归处理
                if (field.fields) {
                    return {
                        ...field,
                        fields: field.fields.map(subField => findAndSortItems(subField))
                    };
                }

                // 如果既没有匹配的dataList也没有子字段，返回原字段
                return field;
            };

            // 使用递归函数处理所有字段
            const updatedFields = internalFormFields.map(field => findAndSortItems(field));

            // 检查更新是否有效 - 递归查找修改的面板
            const findChangedPanel = (fields) => {
                for (const field of fields) {
                    if (field.name === panelName && field.dataList) {
                        return field;
                    }
                    if (field.fields) {
                        const found = findChangedPanel(field.fields);
                        if (found) return found;
                    }
                }
                return null;
            };

            const changedPanel = findChangedPanel(updatedFields);
            if (changedPanel && changedPanel.dataList) {
                console.log('更新状态');
                // 更新内部状态
                setInternalFormFields(updatedFields);

                // 通知父组件
                if (onFormFieldsChange) {
                    onFormFieldsChange(updatedFields, form);
                }

                // 如果父组件提供了onSortItems，也调用它（向后兼容）
                if (collapseFormConfig.onSortItems) {
                    collapseFormConfig.onSortItems(panelName, oldIndex, newIndex);
                }
            } else {
                console.error('无法找到面板或更新数据:', { panelName });
            }
        } catch (error) {
            console.error('排序处理出错:', error);
        }
    };

    // 处理删除项的回调函数
    const handleDeleteItem = (panelName, itemIndex) => {
        // 递归处理字段
        const processFields = (fields) => {
            return fields.map(field => {
                // 如果有子字段，递归处理
                if (Array.isArray(field.fields)) {
                    return {
                        ...field,
                        fields: processFields(field.fields)
                    };
                }

                // 如果找到匹配的面板名称且有 dataList，执行删除
                if (field.name === panelName && Array.isArray(field.dataList)) {
                    const newDataList = [...field.dataList];
                    newDataList.splice(itemIndex, 1);
                    return {
                        ...field,
                        dataList: newDataList
                    };
                }

                return field;
            });
        };

        const updatedFields = processFields(internalFormFields);
        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 如果父组件提供了onDeleteItem，也调用它（向后兼容）
        if (collapseFormConfig.onDeleteItem) {
            collapseFormConfig.onDeleteItem(panelName, itemIndex);
        }
    };
    // 递归处理字段的辅助函数
    const findAndCopyItem = (field, itemId) => {
        // 如果当前字段有dataList，检查并复制项
        if (field.dataList !== undefined && Array.isArray(field.dataList)) {
            const itemToCopy = field.dataList.find(item => item.id === itemId);
            if (itemToCopy) {
                // 创建一个新的项，包含与原项相同的属性但具有新的ID
                const newItem = {
                    ...itemToCopy
                };
                return {
                    ...field,
                    dataList: [...field.dataList, newItem]
                };
            }
        }

        // 如果当前字段有子字段，递归处理
        if (field.fields) {
            const updatedFields = field.fields.map(subField =>
                findAndCopyItem(subField, itemId)
            );
            return {
                ...field,
                fields: updatedFields
            };
        }

        // 如果既没有dataList也没有子字段，返回原字段
        return field;
    };
    // 处理复制项的回调函数
    const handleCopyItem = (panelName, itemId) => {
        // 使用递归函数处理所有字段
        const updatedFields = internalFormFields.map(field => {
            return findAndCopyItem(field, itemId);
        });
        console.log('updatedFields', updatedFields);
        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 如果父组件提供了onCopyItem，也调用它（向后兼容）
        if (collapseFormConfig.onCopyItem) {
            collapseFormConfig.onCopyItem(panelName, itemId);
        }
        // 如果父组件提供了onUpdateItem，也调用它（向后兼容）
        if (collapseFormConfig.onUpdateItem) {
            collapseFormConfig.onUpdateItem(panelName, itemId);
        }
    };
    const handleUpdateItem = (panelName, newItemData, itemId) => {
        const updatedFields = internalFormFields.map(field => {
            if (field.type === panelName && Array.isArray(field.dataList)) {
                // 更新数据列表中的指定项
                const updatedDataList = field.dataList.map(item => {
                    if (item.id === newItemData.id) {
                        return { ...item, ...newItemData };
                    }
                    return item;
                });

                return {
                    ...field,
                    dataList: updatedDataList
                };
            }
            return field;
        });
        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 如果父组件提供了onUpdateItem，也调用它（向后兼容）
        if (collapseFormConfig.onUpdateItem) {
            collapseFormConfig.onUpdateItem(panelName, newItemData, itemId);
        }
    };
    // 处理替换项的回调函数
    const handleReplaceItem = (panelName, itemId, newItemId, newItem, itemIndex) => {
        // 递归处理字段的辅助函数
        const findAndReplaceItem = (field) => {
            // 如果当前字段有dataList,检查并替换项
            if (field.dataList !== undefined && Array.isArray(field.dataList)) {
                // 如果提供了索引参数,则使用索引定位具体项目
                if (itemIndex !== undefined) {
                    const updatedItems = [...field.dataList];
                    // 确保索引有效
                    if (itemIndex >= 0 && itemIndex < updatedItems.length) {
                        updatedItems[itemIndex] = { ...newItem, id: newItemId };
                    }
                    return {
                        ...field,
                        dataList: updatedItems,
                    };
                } else {
                    // 如果没有提供索引,则使用ID匹配进行替换
                    const updatedItems = field.dataList.map(item =>
                        item.id === itemId ? { ...newItem, id: newItemId } : item
                    );
                    return {
                        ...field,
                        dataList: updatedItems,
                    };
                }
            }

            // 如果当前字段有子字段,递归处理
            if (field.fields) {
                return {
                    ...field,
                    fields: field.fields.map(subField => findAndReplaceItem(subField))
                };
            }

            // 如果既没有dataList也没有子字段,返回原字段
            return field;
        };

        // 使用递归函数处理所有字段
        const updatedFields = internalFormFields.map(field => {
            return findAndReplaceItem(field);
            return field;
        });

        console.log('updatedFields', updatedFields);

        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields, form);
        }

        // 如果父组件提供了onReplaceItem,也调用它（向后兼容）
        if (collapseFormConfig.onReplaceItem) {
            collapseFormConfig.onReplaceItem(panelName, itemId, newItemId, newItem, itemIndex);
        }
    };

    // 处理折叠面板展开的回调函数
    // const handleCollapseChange = useCallback((key) => {
    //     // 手风琴模式下，key是单个字符串而不是数组
    //     const keysArray = key ? [key] : [];
    //     console.log(activeCollapseKeys);
    //     debugger
    //     setActiveCollapseKeys(keysArray);

    //     // // 如果父组件提供了onCollapseChange，优先调用它
    //     // if (onCollapseChange) {
    //     //     onCollapseChange(keysArray, form);
    //     // }
    //     // // 如果collapseFormConfig中也提供了collapseChange回调，也调用它（向后兼容）
    //     // else if (collapseFormConfig.collapseChange) {
    //     //     collapseFormConfig.collapseChange(key, form);
    //     // }
    // }, []);
    const handleCollapseChange = (key) => {
        console.log(key);
        setActiveCollapseKeys(key);
        if (onCollapseChange) {
            onCollapseChange(key, form);
        }
    }

    // 转换日期
    const transformDatesInObject = (obj = {}, fields = []) => {

        fields.forEach(field => {
            if (field.fields) {
                transformDatesInObject(obj, field.fields)
            }
            if (field.type === 'date' || field.type === 'dateRange') {

                obj[field.name] = obj[field.name] ? dayjs(obj[field.name]) : null;
                if (field.type === 'dateRange') {
                    // 如果是日期范围，则将日期范围转换为dayjs数组
                    const { keys = dateRangeKeys } = field;
                    obj[field.name] = [obj[keys[0]] ? dayjs(obj[keys[0]]) : null, obj[keys[1]] ? dayjs(obj[keys[1]]) : null];
                }
            }
        });
        const structure = fields.find(field => field?.dataKey && field.dataKey);
        //数组帮定处理
        if (structure && Array.isArray(obj[structure.dataKey])) {
            console.log(1213123);

            if (structure.dataKey) {
                obj[structure.dataKey].forEach((entry, index) => {
                    const suffix = index === 0 ? '' : index + 1;

                    // 处理非 list 的属性，复制到 obj
                    Object.keys(entry).forEach(key => {
                        if (key !== structure.dataKey) {
                            obj[`${key}${suffix}`] = entry[key];
                        }
                    });

                    if (index === 0) {
                        // 第一个默认面板只绑定数据
                        // 在internalFormFields中找到与structure.name匹配的字段，并更新它的dataList
                        fields = fields.map(field => {
                            if (field.name === structure.name) {
                                return {
                                    ...field,
                                    dataList: entry[structure.dataKey]
                                };
                            }
                            return field;
                        });
                    } else {
                        // 创建新字段数组
                        const newFields = structure.fields.map(field => ({
                            ...field,
                            name: `${field.name}${suffix}`
                        }));

                        // 构建新的面板
                        const newPanel = {
                            name: `${structure.name}${index}`,
                            label: structure.label,
                            fields: newFields,
                            dataKey: structure.dataKey,
                            required: structure.required,
                            dataList: entry[structure.dataKey]
                        };

                        // 找到最后一个name为structure.name的面板的索引
                        const lastIndex = fields.map(field => Array.isArray(field.dataList))
                            .lastIndexOf(true);

                        // 在该索引后插入新面板
                        if (lastIndex !== -1) {
                            fields = [
                                ...fields.slice(0, lastIndex + 1),
                                newPanel,
                                ...fields.slice(lastIndex + 1)
                            ];
                        } else {
                            // 如果没找到，直接添加到末尾
                            fields.push(newPanel);
                        }

                        // handleAddCustomPanel(newPanel);
                    }
                });
            }
            if (onFormFieldsChange) {
                onFormFieldsChange(fields, form);
            }
        }
        return obj;
    }
    // 表单变更处理函数
    const handleFormValuesChange = (changedValues, allValues) => {
        if (!isFormDirty) {
            setIsFormDirty(true);
        }

        // 执行自定义表单变更处理器
        if (config.onFormChange) {
            config.onFormChange(changedValues, allValues, formConnected ? form : null);
        }

        // 调用父组件传入的回调函数，并传递 form 对象
        if (onFormValuesChange) {
            onFormValuesChange(changedValues, allValues, form);
        }
    };

    // 处理展开/折叠项目的函数
    const handleToggleExpandItem = useCallback((itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    }, []);

    // 处理添加项目的函数
    const handleAddItem = (panelIndex) => {
        const panel = structurePanels[panelIndex];
        if (!panel) return;

        const newItems = [...(panel.items || [])];
        const template = panel.itemTemplate || { title: `New Item ${newItems.length + 1}`, fields: [] };

        newItems.push({ ...template });

        const newPanels = [...structurePanels];
        newPanels[panelIndex] = { ...panel, items: newItems };

        // 更新面板状态
        setStructurePanels(newPanels);

        // 如果存在外部结构面板变更处理器，调用它
        if (complexConfig.onStructurePanelsChange) {
            complexConfig.onStructurePanelsChange(newPanels);
        }
    };

    // 处理移除项目的函数
    const handleRemoveItem = (panelIndex, itemIndex) => {
        const panel = structurePanels[panelIndex];
        if (!panel || !panel.items || !panel.items[itemIndex]) return;

        const newItems = [...panel.items];
        newItems.splice(itemIndex, 1);

        const newPanels = [...structurePanels];
        newPanels[panelIndex] = { ...panel, items: newItems };

        // 更新面板状态
        setStructurePanels(newPanels);

        // 如果存在外部结构面板变更处理器，调用它
        if (complexConfig.onStructurePanelsChange) {
            complexConfig.onStructurePanelsChange(newPanels);
        }
    };

    const fetchData = async () => {
        console.log('fetchData');

        let response = initialValues; // 初始化表单数据
        setLoading(true);
        // 如果id存在，则请求获取数据
        if (id) {
            const module = moduleKey || location.pathname.split('/')[1]; // 获取模块名称
            const url = `/${module}/detail/${id}`;
            const fetchFormData = initFormData || getformDataById;//公共方法--根据id获取表单数据
            response = await fetchFormData(url) || {};

            if (response.data) {
                if (isDuplicate) {
                    // 如果是复制，则将数据中的id设置为null
                    response.data.id = null;//重制id
                    response.data.status = null;//重制状态
                }
                // 递归处理字段映射的辅助函数
                const recursiveMapFields = (fields, responseData) => {
                    return fields.map(field => {
                        // 处理当前字段的 dataList
                        if (field.dataList) {
                            field.dataList = responseData[field.name];
                        }

                        // 如果字段有子字段，递归处理
                        if (field.fields && Array.isArray(field.fields)) {
                            field.fields = recursiveMapFields(field.fields, responseData);
                        }

                        return field;
                    });
                };

                // 使用递归函数处理所有字段
                const allFields = fields || formFields;
                const updatedFields = recursiveMapFields(allFields, response.data);

                // 通知父组件
                if (onFormFieldsChange) {
                    onFormFieldsChange(updatedFields, form);
                }
                // 获取数据后回调
                response = getDataAfter ? getDataAfter(response.data, {
                    setInternalFormFields,
                    updatedFields
                }) : response.data;
            }
        }

        const transformedData = transformDatesInObject(response, formType === 'basic' ? fields : internalFormFields); // 转换日期
        form.setFieldsValue(transformedData);

        // 确保表单值更新后，设置表单状态为"未修改"
        setIsFormDirty(false);

        // 在这里可以添加一个回调函数通知其他组件数据已加载完成
        if (config.onDataLoaded) {
            config.onDataLoaded(transformedData);
        }

        // 设置头部按钮状态
        if (changeHeader) {
            setHeaderButtons(transformedData);
        }

        setLoading(false);
    };
    // 初始化表单数据
    useEffect(() => {
        fetchData();
    }, [id]);

    // 设置页面标题和头部按钮
    useEffect(() => {
        if (headerContext.setCustomPageTitle) {
            // 设置自定义页面标题
            const pageTitle = config.title ?? `${id ? 'Edit' : 'Add'} ${config.formName}`;
            headerContext.setCustomPageTitle(pageTitle);
        }
    }, [
        config.formName,
        id,
        headerButtons,
        headerContext.setButtons,
        headerContext.setCustomPageTitle
    ]);

    // 从 collapseFormConfig 中获取 activeKeys, onCollapseChange, 和 handleAddCustomPanel
    const {
        fields: collapseFields, // 从配置中获取字段
        initialValues: collapseInitialValues, // 从配置中获取初始值
        activeKeys: configActiveKeys, // 从父组件接收 activeKeys
        onCollapseChange: configOnCollapseChange, // 从父组件接收 onCollapseChange
        handleAddCustomPanel: configHandleAddCustomPanel, // 从父组件接收 handleAddCustomPanel
        handleDeletePanel: configHandleDeletePanel,
        // 选中项和回调函数
        selectedItemFromList: configSelectedItemFromList,
        onItemAdded: configOnItemAdded,
        onSelectedItemProcessed: configOnSelectedItemProcessed,
        // 添加拖拽排序相关的回调
        onSortItems: configOnSortItems,
        onDeleteItem: configOnDeleteItem,
        onCopyItem: configOnCopyItem,
        onUpdateItem: configOnUpdateItem,
        onReplaceItem: configOnReplaceItem
    } = collapseFormConfig;

    // 当 collapseFormConfig 变化时更新依赖的状态 - 使用 useMemo 代替 useState + useEffect 组合
    const extractedConfig = useMemo(() => ({
        collapseFields: collapseFormConfig.fields,
        collapseInitialValues: collapseFormConfig.initialValues,
        configActiveKeys: collapseFormConfig.activeKeys,
        configOnCollapseChange: collapseFormConfig.onCollapseChange,
        configHandleAddCustomPanel: collapseFormConfig.handleAddCustomPanel,
        configHandleDeletePanel: collapseFormConfig.handleDeletePanel,
        // 新增提取的配置
        configSelectedItemFromList: collapseFormConfig.selectedItemFromList,
        configOnItemAdded: collapseFormConfig.onItemAdded,
        configOnSelectedItemProcessed: collapseFormConfig.onSelectedItemProcessed,
        // 添加拖拽排序相关的回调
        configOnSortItems: collapseFormConfig.onSortItems,
        configOnDeleteItem: collapseFormConfig.onDeleteItem,
        configOnCopyItem: collapseFormConfig.onCopyItem,
        configOnUpdateItem: collapseFormConfig.onUpdateItem,
        configOnReplaceItem: collapseFormConfig.onReplaceItem
    }), [
        // 明确列出所有依赖项，避免依赖整个 collapseFormConfig 对象
        collapseFormConfig.fields,
        collapseFormConfig.initialValues,
        collapseFormConfig.activeKeys,
        collapseFormConfig.onCollapseChange,
        collapseFormConfig.handleAddCustomPanel,
        collapseFormConfig.handleDeletePanel,
        collapseFormConfig.selectedItemFromList,
        collapseFormConfig.onItemAdded,
        collapseFormConfig.onSelectedItemProcessed,
        collapseFormConfig.onSortItems,
        collapseFormConfig.onDeleteItem,
        collapseFormConfig.onCopyItem,
        collapseFormConfig.onUpdateItem,
        collapseFormConfig.onReplaceItem
    ]);

    // 渲染结构面板
    const renderStructurePanels = () => {
        if (!complexConfig.includeStructurePanels || !structurePanels || structurePanels.length === 0) {
            return null;
        }

        return (
            <div className={styles.structurePanelsContainer}>
                {structurePanels.map((panel, panelIndex) => {
                    const panelItems = panel.items || [];

                    return (
                        <Card
                            key={`panel-${panelIndex}`}
                            title={panel.title}
                            className={styles.structurePanel}
                            extra={
                                <Space>
                                    {complexConfig.allowAddRemoveItems && (
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => handleAddItem(panelIndex)}
                                        >
                                            Add Item
                                        </Button>
                                    )}
                                </Space>
                            }
                        >
                            {panelItems.map((item, itemIndex) => (
                                <div key={`item-${panelIndex}-${itemIndex}`}>
                                    <div className={styles.itemHeader}>
                                        <h4>{item.title || `Item ${itemIndex + 1}`}</h4>
                                        {complexConfig.allowAddRemoveItems && (
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveItem(panelIndex, itemIndex)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <div className={styles.itemFields}>
                                        {renderPanelFields(panel, panelIndex, item, itemIndex, {
                                            form,
                                            formConnected,
                                            initialValues,
                                            mounted
                                        })}
                                    </div>
                                </div>
                            ))}
                        </Card>
                    );
                })}
            </div>
        );
    };

    // 渲染基础表单
    const renderBasicContent = () => {
        return (
            <div className={`${styles.basicEditorForm} ${!isCollapse && formType == 'advanced' && styles.advancedBasicForm}`}>
                <Spin spinning={loading}>
                    {
                        config.title && <div className={styles.title}>{`${config.title}`}</div>
                    }
                    <Form
                        form={form}
                        name={config.formName || 'basicForm'}
                        layout={config.layout || 'vertical'}
                        onValuesChange={handleFormValuesChange}
                        onFinish={handleEditorSubmit}
                        initialValues={initialValues}
                        className={styles.form}
                    >
                        {renderBasicForm(fields, {
                            form,
                            moduleKey,
                            operationName,
                            selectedItemFromList: selectedItemFromList,
                            onSelectedItemProcessed: handleSelectedItemProcessed,
                            onItemAdded: handleItemAdded,
                            onReplaceItem: handleReplaceItem,
                            onCopyItem: handleCopyItem,
                            onSortItems: handleSortItems,
                            onUpdateItem: handleUpdateItem,
                            onDeleteItem: handleDeleteItem,
                            commonListConfig: commonListConfig,
                            formConnected,
                            initialValues,
                            oneColumnKeys: config.oneColumnKeys || [],
                            mounted,
                        })}
                    </Form>
                </Spin>
            </div>
        );
    };

    // 渲染高级表单
    const renderAdvancedContent = () => {
        console.log('collapseFormConfig');

        // 使用最新的提取配置
        const {
            collapseFields: fields,
            collapseInitialValues: initValues,
            configActiveKeys: activeKeys,
            configOnCollapseChange: configOnCollapseChange,
            configHandleAddCustomPanel, // 不再重命名
            configHandleDeletePanel: configHandleDeletePanel,
            // 新增从提取配置中获取选中项和回调函数
            configSelectedItemFromList: externalSelectedItem,
            configOnItemAdded: configOnItemAdded,
            configOnSelectedItemProcessed: configOnSelectedItemProcessed,
            // 添加拖拽排序相关的回调
            configOnSortItems: configOnSortItems,
            configOnDeleteItem: configOnDeleteItem,
            configOnCopyItem: configOnCopyItem,
            configOnUpdateItem: configOnUpdateItem,
            configOnReplaceItem: configOnReplaceItem
        } = extractedConfig;

        // 使用内部状态的选中项，优先于从配置传入的选中项
        // 这允许组件独立管理选中项状态
        const effectiveSelectedItem = selectedItemFromList !== undefined
            ? selectedItemFromList
            : (externalSelectedItem !== undefined ? externalSelectedItem : null);
        console.log('-----');
        return (
            <div className={`${styles.advancedFormContent} ${commonListConfig ? '' : styles.collapseFormContent}`}>
                {/* 渲染左侧列表 */}
                {
                    commonListConfig && (
                        <CommonList
                            renderItemMata={renderItemMata}
                            {...commonListConfig}
                            onAddItem={handleCommonListItemAdd}
                        />
                    )
                }
                {/* 渲染右侧表单 isCollapse 是否按照折叠方式展示 */}
                {

                    isCollapse && <div className={`${styles.advancedEditorForm} ${commonListConfig ? '' : styles.withSidebar}`}>
                        <Spin spinning={loading}>
                            {
                                config.title && <div className={styles.title}>{`${config.title}`}</div>
                            }
                            <Form
                                form={form}
                                name={config.formName || 'advancedForm'}
                                layout={config.layout || 'vertical'}
                                onValuesChange={handleFormValuesChange}
                                onFinish={handleEditorSubmit}
                                initialValues={initialValues}
                                className={styles.form}
                            >
                                {/* 如果提供了折叠表单配置，则渲染CollapseForm组件 */}
                                {(internalFormFields && internalFormFields.length > 0) && (
                                    <CollapseForm
                                        fields={internalFormFields}
                                        form={form}
                                        moduleKey={moduleKey}
                                        operationName={operationName}
                                        renderItemMata={renderItemMata}
                                        commonListConfig={commonListConfig}
                                        selectedItemFromList={effectiveSelectedItem}
                                        activeKeys={activeCollapseKeys}
                                        onCollapseChange={handleCollapseChange}
                                        handleAddCustomPanel={handleAddCustomPanel} // 使用组件自己定义的方法，而不是从extractedConfig中获取的
                                        handleDeletePanel={handleDeletePanel}
                                        isCollapse={isCollapse !== false}
                                        // 添加回调函数 - 使用内部实现的方法
                                        onItemAdded={handleItemAdded}
                                        onSelectedItemProcessed={handleSelectedItemProcessed}
                                        // 添加排序相关的回调函数 - 使用内部实现的方法
                                        onSortItems={handleSortItems}
                                        onDeleteItem={handleDeleteItem}
                                        onCopyItem={handleCopyItem}
                                        onUpdateItem={handleUpdateItem}
                                        onReplaceItem={handleReplaceItem}
                                    />
                                )}
                                {/* 如果配置了结构面板，则渲染结构面板 */}
                                {complexConfig.includeStructurePanels && renderStructurePanels()}
                            </Form>
                        </Spin>
                    </div>
                }
                {
                    !isCollapse && <div className={styles.advancedBasicBox}>
                        {renderBasicContent()}
                    </div>
                }

            </div>
        );
    };

    // 在 useEffect 中设置表单引用
    useEffect(() => {
        console.log('scrollableContainerRef', scrollableContainerRef)
        if (setFormRef && form && handleStatusModalConfirmFromHook) {
            setFormRef({ form, triggerSave: handleStatusModalConfirmFromHook });
        }
    }, [setFormRef]);

    return (
        <div ref={scrollableContainerRef} className={`${styles.commonEditorContainer} ${formType === 'basic' ? styles.basicEditorContainer : styles.advancedEditorContainer} ${formType === 'basic' ? "basicEditorContainer" : "advancedEditorContainer"}`}>
            {contextHolder}
            {formType === 'basic' ? renderBasicContent() : renderAdvancedContent()}
            <FloatButton.BackTop target={() => scrollableContainerRef.current} visibilityHeight={50} />
        </div>
    );
}