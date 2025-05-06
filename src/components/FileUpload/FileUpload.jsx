import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Upload, Button, Image, Spin, Typography, message } from 'antd';
import {
    PlusOutlined,
    DownloadOutlined,
    CloseCircleFilled,
    FileOutlined,
} from '@ant-design/icons';
import { getFullUrl } from '@/utils';
import settings from '@/config/settings';
const { file: fileSettings } = settings;
import styles from './FileUpload.module.css';

const { Text } = Typography;

/**
 * @description 自定义文件上传控件
 * @param {Object} field - 字段配置，包含上传逻辑、URL、限制等
 * @param {boolean} disabled - 是否禁用
 * @param {string} name - 字段名
 * @param {function} onChange - 文件状态改变时的回调 (Form.Item 注入)
 * @param {string} value - 当前文件值 (Form.Item 注入)
 */
const FileUpload = ({
    field = {},
    disabled = false,
    name,
    onChange,
    value
}) => {
    // 消息提示API
    const [messageApi, contextHolder] = message.useMessage();

    // 上传组件引用
    const draggerRef = useRef(null);
    // 文件输入引用
    const fileInputRef = useRef(null);
    // 上传状态
    const [uploading, setUploading] = useState(false);

    // 从 Form.Item 接收原始值并处理
    const [internalValue, setInternalValue] = useState(value);

    // 当外部 value 变化时更新内部状态
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const displayValue = internalValue ? getFullUrl(internalValue) : null;
    // 是否有文件
    const hasFile = !!displayValue;

    // 获取预览尺寸
    const previewWidth = field.previewWidth || '296px';
    const previewHeight = field.previewHeight || '96px';

    // 获取文件名 - 移动到前面定义，确保在使用前已初始化
    const getFileName = (url) => {
        if (!url) return '';
        try {
            if (url.startsWith('data:')) {
                const match = url.match(/name=([^;,]+)/);
                if (match) return decodeURIComponent(match[1]);
                const mimeMatch = url.match(/^data:([^;,]+)/);
                return `file.${mimeMatch ? mimeMatch[1].split('/')[1] || 'bin' : 'bin'}`;
            } else {
                const path = new URL(url, window.location.origin).pathname;
                return decodeURIComponent(path.substring(path.lastIndexOf('/') + 1)) || 'File';
            }
        } catch (e) {
            try {
                return decodeURIComponent(url.split('/').pop().split('?')[0].split('#')[0]) || 'File';
            } catch (fallbackError) {
                return 'File';
            }
        }
    };

    // 判断文件类型
    const getFileType = useMemo(() => {
        if (!displayValue) return 'none';

        // 获取文件扩展名
        const fileName = getFileName(displayValue);
        const extension = fileName.split('.').pop()?.toLowerCase();

        // 图片扩展名
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        // 音频扩展名
        const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
        // 视频扩展名
        const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'];

        // 判断类型
        if (imageExtensions.includes(extension)) {
            return 'image';
        } else if (audioExtensions.includes(extension)) {
            return 'audio';
        } else if (videoExtensions.includes(extension)) {
            return 'video';
        }

        // 通过URL中的MIME类型判断
        if (displayValue.startsWith('data:')) {
            const mime = displayValue.split(';')[0].split(':')[1];
            if (mime.startsWith('image/')) return 'image';
            if (mime.startsWith('audio/')) return 'audio';
            if (mime.startsWith('video/')) return 'video';
        }

        return 'other';
    }, [displayValue]);

    // 修复acceptedFileTypes格式
    const formatAcceptedFileTypes = useMemo(() => {
        if (!field.acceptedFileTypes) return undefined;

        // 处理数组或字符串格式
        const types = typeof field.acceptedFileTypes === 'string'
            ? field.acceptedFileTypes.split(',')
            : field.acceptedFileTypes;

        return types.map(type => {
            type = type.trim();
            // 确保是MIME类型或带点的扩展名
            if (type && !type.startsWith('.') && !type.includes('/')) {
                return `.${type}`;
            }
            return type;
        }).filter(Boolean).join(',');
    }, [field.acceptedFileTypes]);

    // 动态生成上传区域的描述文本
    const uploadDescription = useMemo(() => {
        const parts = [];

        // 文件类型描述
        if (field.acceptedFileTypes) {
            const typesText = (typeof field.acceptedFileTypes === 'string' ? field.acceptedFileTypes.split(',') : field.acceptedFileTypes)
                .map(t => t.trim().toUpperCase().replace(/^\./, '')) // 提取并大写类型/扩展名
                .filter(Boolean)
                .join('/');
            if (typesText) parts.push(`${typesText} format`);
        } else {
            parts.push("Supports common formats");
        }

        // 文件大小限制描述
        if (field.maxFileSize && typeof field.maxFileSize === 'number') {
            parts.push(`Max ${field.maxFileSize}KB`);
        }

        return field.uploadDescription || parts.join(', '); // 使用配置的描述或自动生成
    }, [field.acceptedFileTypes, field.maxFileSize, field.uploadDescription]);

    // 处理清除文件
    const handleClearFile = useCallback(() => {
        // 更新内部状态
        setInternalValue(null);
        // 通知外部状态变化
        if (onChange) {
            onChange(null);
        }
        setUploading(false);

        // 确保清空后触发重新渲染
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }, 0);
    }, [onChange]);

    // 上传失败处理
    const handleUploadError = useCallback((error) => {
        console.error('Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
        const failMsg = `${field.uploadErrorMessage || 'Upload failed'}: ${errorMessage}`;
        messageApi.error(failMsg);
        setUploading(false);
    }, [field.uploadErrorMessage, messageApi]);

    // 自定义上传请求
    const customUploadRequestHandler = useCallback(async (options) => {
        const { onSuccess, onError, file, onProgress } = options;

        const uploadFunction = field.uploadFn || fileSettings?.uploadFile;

        if (!uploadFunction) {
            const errorMsg = "Upload function not configured";
            console.error(errorMsg);
            onError(new Error(errorMsg));
            handleUploadError(new Error(errorMsg));
            return;
        }

        setUploading(true);
        try {
            const result = await uploadFunction({
                file,
                dirKey: field.dirKey || 'default',
                onProgress: (event) => {
                    if (onProgress && typeof event?.percent === 'number') {
                        onProgress({ percent: event.percent });
                    }
                }
            });

            if (result && result.error) {
                const errorToThrow = result.error instanceof Error ?
                    result.error : new Error(String(result.error.message || result.error || 'Unknown upload error'));
                throw errorToThrow;
            }

            // 只调用一次上传成功回调，避免多次触发消息提示
            onSuccess(result);

            // 直接处理结果，不再调用handleUploadSuccess
            const urlToSet = result?.fileUrl || result?.fileRelativeUrl ||
                (typeof result === 'string' ? result : null);

            if (urlToSet) {
                // 更新内部状态
                setInternalValue(urlToSet);
                if (onChange) {
                    onChange(urlToSet);
                }

                // 显示成功消息 - 在这里处理一次即可
                const successMsg = field.uploadSuccessMessage || 'Upload successful!';
                messageApi.success(successMsg);
            } else {
                console.error('Upload did not return valid URL:', result);
                const failMsg = field.uploadFailMessage || 'Failed to get file upload URL';
                messageApi.error(failMsg);
            }

            setUploading(false);
        } catch (err) {
            onError(err);
            handleUploadError(err);
        }
    }, [field.uploadFn, field.dirKey, handleUploadError, onChange, setInternalValue, field.uploadSuccessMessage, field.uploadFailMessage, messageApi]);

    // 处理 Upload 组件的 onChange - 确保这里不会重复显示消息
    const handleAntUploadChange = useCallback((info) => {
        if (info.file.status === 'uploading' && !uploading) {
            setUploading(true);
        } else if (['done', 'error', 'removed'].includes(info.file.status) && uploading) {
            setUploading(false);
        } else if (info.file.status === 'removed') {
            handleClearFile();
        }

        // 不在这里处理上传成功的消息提示
    }, [handleClearFile, uploading]);

    // 上传前验证
    const handleBeforeUpload = useCallback((file) => {
        let isValid = true;
        const errorMessages = [];

        // 文件类型验证
        if (field.acceptedFileTypes) {
            const acceptedTypes = (typeof field.acceptedFileTypes === 'string'
                ? field.acceptedFileTypes.split(',')
                : field.acceptedFileTypes)
                .map(t => t.trim().toLowerCase())
                .filter(Boolean);

            if (acceptedTypes.length > 0) {
                const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                const isAccepted = acceptedTypes.some(type => {
                    // 移除点前缀进行比较
                    return type.replace(/^\./, '') === fileExt;
                });
                if (!isAccepted) {
                    isValid = false;
                    const typesText = acceptedTypes.map(t => t.replace(/^\./, '')).join(', ');
                    errorMessages.push(`Unsupported file type. Allowed: ${typesText}`);
                }
            }
        }

        // 文件大小验证
        if (field.maxFileSize && typeof field.maxFileSize === 'number') {
            const maxSizeInBytes = field.maxFileSize * 1024;
            if (file.size > maxSizeInBytes) {
                isValid = false;
                errorMessages.push(`File size exceeds limit ${field.maxFileSize}KB`);
            }
        }

        // 自定义验证
        if (typeof field.beforeUpload === 'function') {
            try {
                const result = field.beforeUpload(file);
                if (result === false) {
                    isValid = false;
                    if (errorMessages.length === 0) {
                        errorMessages.push('File rejected by custom validation');
                    }
                } else if (result instanceof Promise) {
                    return result.catch(err => {
                        messageApi.error(`Upload check failed: ${err?.message || 'Rejected by custom check'}`);
                        return Promise.reject(err);
                    });
                }
            } catch (e) {
                console.error("Custom validation function error:", e);
                isValid = false;
                errorMessages.push(`Custom validation error: ${e.message}`);
            }
        }

        if (!isValid && errorMessages.length > 0) {
            messageApi.error(errorMessages.join('. '));
            return false;
        }

        return true;
    }, [field.acceptedFileTypes, field.maxFileSize, field.beforeUpload, messageApi]);

    // 处理文件选择
    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件
        const isValid = handleBeforeUpload(file);
        if (!isValid) return;

        // 手动上传文件
        customUploadRequestHandler({
            file,
            onSuccess: () => {
                // 不在这里调用handleUploadSuccess，避免重复处理
            },
            onError: (error) => {
                handleUploadError(error);
            },
            onProgress: (event) => {
                // 处理上传进度
            }
        });

        // 重置文件输入，以便下次选择同一文件时也能触发change事件
        event.target.value = '';
    }, [handleBeforeUpload, customUploadRequestHandler, handleUploadError]);

    // 手动触发文件选择对话框
    const triggerFileSelect = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        } else if (draggerRef.current?.upload?.uploader?.fileInput) {
            draggerRef.current.upload.uploader.fileInput.click();
        }
    }, []);

    // 上传组件属性
    const uploadProps = useMemo(() => ({
        name: name,
        beforeUpload: handleBeforeUpload,
        onChange: handleAntUploadChange,
        accept: formatAcceptedFileTypes, // 使用格式化后的类型
        multiple: false,
        disabled: disabled || uploading,
        showUploadList: false,
        customRequest: customUploadRequestHandler,
        // 确保打开文件选择对话框
        openFileDialogOnClick: true,
        ...(field.props || {})
    }), [
        name, handleBeforeUpload, handleAntUploadChange, formatAcceptedFileTypes,
        disabled, uploading, customUploadRequestHandler, field.props
    ]);

    // 预览区域样式
    const previewAreaStyle = {
        width: previewWidth,
        height: previewHeight,
        marginRight: '16px'
    };

    // 渲染文件预览
    const renderFilePreview = () => {
        if (!hasFile) return null;

        switch (getFileType) {
            case 'image':
                return (
                    <Image
                        src={displayValue}
                        alt={getFileName(displayValue)}
                        className={styles.avatarImg}
                    />
                );

            case 'audio':
                return (
                    <div className={styles.audioPreview}>
                        <audio
                            src={displayValue}
                            controls
                            className={styles.audioPlayer}
                            style={{ width: '100%', maxWidth: previewWidth }}
                        />
                    </div>
                );

            case 'video':
                return (
                    <div className={styles.videoPreview}>
                        <video
                            src={displayValue}
                            controls
                            className={styles.videoPlayer}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: previewWidth,
                                height: previewHeight,
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                );

            default:
                return (
                    <div className={styles.filePreview}>
                        <FileOutlined style={{ fontSize: '42px' }} />
                        <div className={styles.fileExtension}>
                            {getFileName(displayValue).split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={styles.uploadContainer}>
            {contextHolder}
            <Spin spinning={uploading} size="small">
                <div className={styles.uploadContentWrapper}>
                    {/* 隐藏的文件输入框，用于触发文件选择 */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept={formatAcceptedFileTypes}
                        disabled={disabled || uploading}
                    />

                    {/* 左侧区域：预览或上传区 */}
                    <div className={styles.uploadLeftSection}>
                        <div className={styles.uploadArea} style={previewAreaStyle}>
                            {hasFile ? (
                                <div className={styles.previewContainer}>
                                    {renderFilePreview()}
                                </div>
                            ) : (
                                <Upload.Dragger
                                    ref={draggerRef}
                                    {...uploadProps}
                                    className={styles.avatarUploader}
                                >
                                    <div className={styles.uploadButton}>
                                        {!uploading && <PlusOutlined className={styles.uploadIcon} />}
                                    </div>
                                </Upload.Dragger>
                            )}
                        </div>

                        {/* 清除按钮 */}
                        {hasFile && !uploading && (
                            <Button

                                icon={<CloseCircleFilled />}
                                type="text"
                                danger
                                size="small"
                                className={styles.clearButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearFile();
                                }}
                                disabled={disabled}
                                title="Remove file"
                            />
                        )}

                        {/* 文件信息 */}
                        <div className={styles.uploadInfo} style={{ flex: '1', minWidth: 0 }}>
                            <div className={styles.uploadTitle}
                                title={hasFile ? getFileName(displayValue) : ""}
                                style={{
                                    wordBreak: 'break-word',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden',
                                    maxWidth: '100%'
                                }}>
                                {uploading
                                    ? "Uploading..."
                                    : hasFile
                                        ? getFileName(displayValue)
                                        : field.uploadPlaceholder || "Click or drag file to upload"
                                }
                            </div>
                            <Text type="secondary" className={styles.uploadDescription}>
                                {uploadDescription}
                            </Text>
                        </div>
                    </div>

                    {/* 右侧区域：操作按钮 */}
                    <div className={styles.uploadActions}>
                        {/* 下载按钮 */}
                        {hasFile && !uploading && (
                            <Button
                                color="default" variant="filled"
                                icon={<DownloadOutlined />}
                                type="text"
                                className={styles.actionButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(displayValue, '_blank');
                                }}
                                disabled={disabled}
                                title="Download file"
                            />
                        )}

                        {/* 上传/更改按钮 */}
                        {!uploading && (
                            <>
                                {hasFile ? (
                                    <Button
                                        color="default" variant="filled"
                                        className={styles.changeButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            triggerFileSelect();
                                        }}
                                        disabled={disabled || uploading}
                                    >
                                        {field.changeButtonText || "Change"}
                                    </Button>
                                ) : (
                                    <Button
                                        color="default" variant="filled"
                                        className={styles.changeButton}
                                        onClick={() => triggerFileSelect()}
                                        disabled={disabled || uploading}
                                    >
                                        {field.uploadButtonText || "Upload"}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Spin>
        </div>
    );
};

FileUpload.propTypes = {
    field: PropTypes.object,
    disabled: PropTypes.bool,
    name: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.string
};

export default FileUpload; 