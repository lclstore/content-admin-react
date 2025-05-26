import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Form, Button, Card, Space, Spin } from 'antd';
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
 */
export default function CommonEditor(props) {
    const {
        formType = 'basic', // 默认为基础表单
        config = {},
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
        setFormRef // 添加表单引用设置属性
    } = props;
    // 添加选中项状态管理 - 存储从列表中选择的当前项
    const [selectedItemFromList, setSelectedItemFromList] = useState(null); // 左侧列表添加item
    // 添加onSubmitCallback状态
    const [onSubmitCallback, setOnSubmitCallback] = useState(null);
    // 内部维护一份formFields状态，优先使用父组件传入的
    const [internalFormFields, setInternalFormFields] = useState(
        collapseFormConfig.fields || formFields || fields || []
    );

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
    const id = params.get('id');
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
        getLatestValues
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
    const { headerButtons } = useHeaderConfig({
        config,
        id,
        onSubmit: onSubmitCallback, // 使用state中的callback
        fieldsToValidate,
        enableDraft,
        isFormDirty,
        form,
        formConnected,
        validate,
        onSave,
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
        getLatestValues
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

        const lastIndexWithDatalist = [...internalFormFields]
            .map((item, index) => item.dataList ? index : -1)
            .filter(index => index !== -1)
            .pop();

        let updatedFields;
        if (lastIndexWithDatalist !== undefined && lastIndexWithDatalist !== -1) {
            updatedFields = [...internalFormFields];
            updatedFields.splice(lastIndexWithDatalist + 1, 0, newPanel);
        } else {
            // 如果没有任何项包含 datalist，则默认追加到末尾
            updatedFields = [...internalFormFields, newPanel];
        }

        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields);
        }

        // 如果父组件提供了handleAddCustomPanel，也调用它（向后兼容）
        if (collapseFormConfig.handleAddCustomPanel) {
            collapseFormConfig.handleAddCustomPanel(newPanel);
        }
    };

    // 删除面板的回调函数
    const handleDeletePanel = (panelName) => {
        const updatedFields = internalFormFields.filter(item => item.name !== panelName);

        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields);
        }

        // 如果父组件提供了handleDeletePanel，也调用它（向后兼容）
        if (collapseFormConfig.handleDeletePanel) {
            collapseFormConfig.handleDeletePanel(panelName);
        }
    };

    // 处理选中项被添加到表单后的回调
    const handleItemAdded = (panelName, fieldName, itemData, expandedItemId, formInstance) => {
        // 创建 formFields 的深拷贝
        const updatedFields = internalFormFields.map(field => {
            // 找到匹配的面板
            if (field.name === panelName) {
                // 判断itemData是否为数组
                const itemsToAdd = Array.isArray(itemData) ? itemData : [itemData];

                // 检查是否有展开的项
                if (expandedItemId && Array.isArray(field.dataList)) {
                    // 查找展开项的索引
                    const expandedItemIndex = field.dataList.findIndex(item => item.id === expandedItemId);

                    if (expandedItemIndex !== -1) {
                        // 如果找到展开的项，在其后插入新项（可能是多个）
                        const newDataList = [...field.dataList];
                        newDataList.splice(expandedItemIndex + 1, 0, ...itemsToAdd);

                        return {
                            ...field,
                            dataList: newDataList
                        };
                    }
                }
                const newDataList = Array.isArray(field.dataList)
                    ? [...field.dataList, ...itemsToAdd] // 如果是数组，创建新数组并添加新项（可能是多个）
                    : itemsToAdd;


                // 默认行为：如果没有展开的项或找不到展开的项，添加到末尾
                return {
                    ...field,
                    dataList: newDataList // 如果不是数组，创建新数组
                };
            }

            if (panelName === 'basic' && field.type === 'structureList') {
                const itemsToAdd = Array.isArray(itemData) ? itemData : [itemData];
                return {
                    ...field,
                    dataList: [...(field.dataList || []), ...itemsToAdd]

                };
            }

            return field; // 返回未修改的其他面板
        });
        console.log('updatedFields', updatedFields);


        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields);
        }

        // 如果父组件提供了onItemAdded，也调用它（向后兼容）
        if (collapseFormConfig.onItemAdded) {
            collapseFormConfig.onItemAdded(panelName, fieldName, itemData, expandedItemId, formInstance);
        }
    };

    // 处理排序的回调函数
    const handleSortItems = (panelName, oldIndex, newIndex) => {
        console.log(`排序: ${panelName}, 从 ${oldIndex} 到 ${newIndex}`);

        if (oldIndex === newIndex) {
            console.log('位置未改变，跳过排序');
            return;
        }

        try {
            const updatedFields = internalFormFields.map(field => {
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
                return field;
            });

            // 检查更新是否有效
            const changedPanel = updatedFields.find(f => f.name === panelName);
            if (changedPanel && changedPanel.dataList) {
                console.log('更新状态');
                // 更新内部状态
                setInternalFormFields(updatedFields);

                // 通知父组件
                if (onFormFieldsChange) {
                    onFormFieldsChange(updatedFields);
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
        const updatedFields = internalFormFields.map(field => {
            if (field.name === panelName && Array.isArray(field.dataList)) {
                // 使用索引删除数组中的元素，而不是通过ID过滤
                const newDataList = [...field.dataList];
                newDataList.splice(itemIndex, 1);

                return {
                    ...field,
                    dataList: newDataList
                };
            }
            return field;
        });

        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields);
        }

        // 如果父组件提供了onDeleteItem，也调用它（向后兼容）
        if (collapseFormConfig.onDeleteItem) {
            collapseFormConfig.onDeleteItem(panelName, itemIndex);
        }
    };

    // 处理复制项的回调函数
    const handleCopyItem = (panelName, itemId) => {
        const updatedFields = internalFormFields.map(field => {
            if (field.name === panelName && Array.isArray(field.dataList)) {
                // 找到要复制的项
                const itemToCopy = field.dataList.find(item => item.id === itemId);
                if (itemToCopy) {
                    // 创建一个新的项，包含与原项相同的属性但具有新的ID
                    const newItem = {
                        ...itemToCopy,
                        id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
                    };

                    // 返回更新后的字段，包括新项
                    return {
                        ...field,
                        dataList: [...field.dataList, newItem]
                    };
                }
            }
            return field;
        });

        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields);
        }

        // 如果父组件提供了onCopyItem，也调用它（向后兼容）
        if (collapseFormConfig.onCopyItem) {
            collapseFormConfig.onCopyItem(panelName, itemId);
        }
    };

    // 处理替换项的回调函数
    const handleReplaceItem = (panelName, itemId, newItemId, newItem, itemIndex) => {
        //折叠面板
        const updatedFields = internalFormFields.map(panel => {
            if (panel.name !== panelName) return panel;
            // 如果提供了索引参数，则使用索引定位具体项目
            if (itemIndex !== undefined) {
                const updatedItems = [...panel.dataList];
                // 确保索引有效
                if (itemIndex >= 0 && itemIndex < updatedItems.length) {
                    updatedItems[itemIndex] = { ...newItem, id: newItemId };
                }
                return {
                    ...panel,
                    dataList: updatedItems,
                };
            } else {
                // 向后兼容：如果没有提供索引，则使用ID匹配（可能替换多个）
                const updatedItems = panel.dataList.map(item =>
                    item.id === itemId ? { ...newItem, id: newItemId } : item
                );
                return {
                    ...panel,
                    dataList: updatedItems,
                };
            }
        });
        console.log('updatedFields', updatedFields);

        // 更新内部状态
        setInternalFormFields(updatedFields);

        // 通知父组件
        if (onFormFieldsChange) {
            onFormFieldsChange(updatedFields);
        }

        // 如果父组件提供了onReplaceItem，也调用它（向后兼容）
        if (collapseFormConfig.onReplaceItem) {
            collapseFormConfig.onReplaceItem(panelName, itemId, newItemId, newItem, itemIndex);
        }
    };

    // 处理折叠面板展开的回调函数
    const handleCollapseChange = useCallback((key) => {
        // 手风琴模式下，key是单个字符串而不是数组
        const keysArray = key ? [key] : [];
        setActiveCollapseKeys(keysArray);

        // 如果父组件提供了onCollapseChange，优先调用它
        if (onCollapseChange) {
            onCollapseChange(keysArray, form);
        }
        // 如果collapseFormConfig中也提供了collapseChange回调，也调用它（向后兼容）
        else if (collapseFormConfig.collapseChange) {
            collapseFormConfig.collapseChange(key, form);
        }
    }, [collapseFormConfig, form, onCollapseChange]);

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
        const structure = fields.find(field => field.dataKey);
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
                onFormFieldsChange(fields);
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
            response = await initFormData(id) || {};
        }

        const transformedData = transformDatesInObject(response, formType === 'basic' ? fields : internalFormFields); // 转换日期

        form.setFieldsValue(transformedData);

        // 确保表单值更新后，设置表单状态为"未修改"
        setIsFormDirty(false);

        // 在这里可以添加一个回调函数通知其他组件数据已加载完成
        if (config.onDataLoaded) {
            config.onDataLoaded(transformedData);
        }
        // 设置头部按钮: 如果id存在，且status不为0，则禁用保存按钮 或者表单内容没修改时禁用按钮
        if (headerContext.setButtons && changeHeader) {
            const isNonZeroStatus = id && transformedData.status !== undefined && transformedData.status !== 0 && transformedData.status !== 2;
            headerButtons[0].disabled = isNonZeroStatus;
            const saveButton = headerButtons.find(button => button.key === 'save');
            saveButton.disabled = isNonZeroStatus && saveButton.disabled;
            headerContext.setButtons(headerButtons);
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
                            selectedItemFromList: selectedItemFromList,
                            onSelectedItemProcessed: handleSelectedItemProcessed,
                            onItemAdded: handleItemAdded,
                            onReplaceItem: handleReplaceItem,
                            onCopyItem: handleCopyItem,
                            onSortItems: handleSortItems,
                            onDeleteItem: handleDeleteItem,
                            commonListConfig: commonListConfig,
                            formConnected,
                            initialValues,
                            oneColumnKeys: config.oneColumnKeys || [],
                            mounted
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
            configOnReplaceItem: configOnReplaceItem
        } = extractedConfig;

        // 使用内部状态的选中项，优先于从配置传入的选中项
        // 这允许组件独立管理选中项状态
        const effectiveSelectedItem = selectedItemFromList !== null
            ? selectedItemFromList
            : (externalSelectedItem !== undefined ? externalSelectedItem : null);

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
        if (setFormRef && form) {
            setFormRef(form);
        }
    }, [form, setFormRef]);

    return (
        <div className={`${styles.commonEditorContainer} ${formType === 'basic' ? styles.basicEditorContainer : styles.advancedEditorContainer} ${formType === 'basic' ? "basicEditorContainer" : "advancedEditorContainer"}`}>
            {contextHolder}
            {formType === 'basic' ? renderBasicContent() : renderAdvancedContent()}
        </div>
    );
}