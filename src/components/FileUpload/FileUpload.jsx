import React, { useCallback, useRef, useState, useMemo, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { Upload, Button, Image, Spin, Typography, message, Modal } from 'antd';
import {
    PlusOutlined,
    DownloadOutlined,
    CloseOutlined,
    FileOutlined,
    CaretRightOutlined,
    ReloadOutlined,
    PauseOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { getFullUrl } from '@/utils';
import settings from '@/config/settings';
const { file: fileSettings } = settings;
import styles from './FileUpload.module.css';
import Hls from 'hls.js';

const { Text } = Typography;

// 添加全局音频管理
const audioManager = {
    currentAudio: null,
    currentCallback: null,
    stopCurrent: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
            if (this.currentCallback) {
                this.currentCallback(false);
            }
        }
    },
    setCurrentAudio: function (audio, callback) {
        this.stopCurrent();
        this.currentAudio = audio;
        this.currentCallback = callback;
    }
};

const MediaPreviewModal = memo(({ type, url, visible, onCancel }) => {
    // 使用ref引用modal容器，避免事件冒泡
    const modalContainerRef = React.useRef(null);

    const isVideo = type === 'video';
    // 处理关闭按钮点击事件
    const handleCloseClick = useCallback((e) => {
        // 阻止事件冒泡但不阻止默认行为
        if (e) e.stopPropagation();
        onCancel();
    }, [onCancel]);

    const fullUrl = getFullUrl(url);

    return (
        <Modal
            open={visible}
            onCancel={handleCloseClick}
            footer={null}
            destroyOnClose
            centered
            width={800}
            maskClosable={true}
            closeIcon={
                <CloseCircleOutlined style={{ fontSize: '30px', color: '#fff' }} />
            }
            wrapClassName="media-preview-modal-wrap prevent-row-click"
            styles={{
                mask: {
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    pointerEvents: 'auto'
                },
                wrapper: { pointerEvents: 'auto' },
                content: {
                    background: 'transparent',
                    boxShadow: 'none',
                },
                body: {
                    padding: '20px',
                    background: 'transparent'
                },
                header: {
                    borderBottom: 'none',
                    background: 'transparent',
                    color: '#fff',
                    padding: '16px 20px',
                    height: 'auto',
                    fontSize: '50px'
                },
                closeButton: {
                    pointerEvents: 'auto',
                    zIndex: 1001,
                    color: '#fff',
                    fontSize: '50px',
                    top: '50px',
                    right: '50px',
                    position: 'fixed'
                }
            }}
        >
            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
                {isVideo ? (
                    <>
                        <video
                            src={fullUrl}
                            controls
                            style={{ width: '576px', display: 'block', height: '576px',}}
                            onClick={(e) => e.stopPropagation()}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </>
                ) : (
                        <audio
                            src={fullUrl}
                            controls
                            autoPlay={'play'}
                            className={styles.audio}
                        >
                        </audio>
                )}
            </div>
        </Modal>
    );
});
/**
 * @description 自定义文件上传控件
 * @param {Object} field - 字段配置，包含上传逻辑、URL、限制等
 * @param {boolean} disabled - 是否禁用
 * @param {string} name - 字段名
 * @param {function} onChange - 文件状态改变时的回调 (Form.Item 注入)
 * @param {string} value - 当前文件值 (Form.Item 注入)
 */
const FileUpload = ({
    form,
    acceptedFileTypes,  // 接受的文件类型，字符串或数组，如 ['jpg', 'png'] 或 '.jpg,.png'
    maxFileSize,        // 最大文件大小，单位为KB
    disabled = false,   // 是否禁用上传功能
    name,               // 表单项名称
    onChange,           // 值变化时的回调函数
    value,              // 当前文件的URL值
    uploadDescription,  // 自定义上传区域描述文本，不提供则自动生成
    uploadErrorMessage, // 自定义上传错误消息
    uploadFn = fileSettings?.uploadFile, // 自定义上传函数
    dirKey, // 上传目录键名
    uploadSuccessMessage, // 自定义上传成功消息
    uploadFailMessage,    // 自定义上传失败消息
    beforeUpload,         // 上传前的自定义验证函数
    props = {},           // 传递给底层Upload组件的额外属性
    uploadPlaceholder,    // 上传区域占位文本
    changeButtonText,     // 更改按钮文本
    uploadButtonText,     // 上传按钮文本
    field,                // 字段配置
    style = {
        width: '96px',
        height: '96px'
    },
}) => {
    // 消息提示API
    const [messageApi, contextHolder] = message.useMessage();

    // 上传组件引用
    const draggerRef = useRef(null);
    // 文件输入引用
    const fileInputRef = useRef(null);
    // HLS <video> 元素引用
    const videoRef = useRef(null);
    // HLS.js 实例引用
    const hlsRef = useRef(null);
    // 上传状态
    const [uploading, setUploading] = useState(false);

    // 从 Form.Item 接收原始值并处理
    const [internalValue, setInternalValue] = useState(value);

    // HLS 相关状态
    const [hlsLoading, setHlsLoading] = useState(false);
    const [hlsError, setHlsError] = useState(null);

    // 添加音频相关状态
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState('');
    const audioRef = useRef(null);

    // 媒体预览状态
    const [previewState, setPreviewState] = useState({
        visible: false,
        url: '',
        type: '' // 'video' 或 'audio'
    });

    // 当外部 value 变化时更新内部状态
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const displayValue = internalValue ? getFullUrl(internalValue) : null;
    // 是否有文件
    const hasFile = !!displayValue;


    // 媒体元素样式，不直接传递自定义属性到DOM
    const mediaElementStyle = useMemo(() => ({
        maxWidth: '100%',
        maxHeight: '100%',
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    }), []);

    // 获取文件名 - 移动到前面定义，确保在使用前已初始化
    const getFileName = (url) => {
        if (!url) return '';
        // 移除查询参数和哈希片段
        const [cleanUrl] = url.split(/[?#]/);
        // 处理 data URI
        if (cleanUrl.startsWith('data:')) {
            // 优先匹配 name 参数
            const nameMatch = cleanUrl.match(/(?:name=)([^;,]+)/);
            if (nameMatch && nameMatch[1]) {
                return decodeURIComponent(nameMatch[1]);
            }
            // 使用 MIME 类型作为扩展名回退
            const mimeMatch = cleanUrl.match(/^data:([^;,]+)/);
            const ext = mimeMatch ? mimeMatch[1].split('/')[1] : 'bin';
            return `file.${ext}`;
        }

        try {
            // 通过 URL API 解析路径并提取文件名
            const pathname = new URL(cleanUrl, window.location.origin).pathname;
            const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
            return decodeURIComponent(filename) || 'File';
        } catch {
            // URL API 解析失败时的简单回退
            const fallback = cleanUrl.split('/').pop();
            return decodeURIComponent(fallback) || 'File';
        }
    }

    // 判断文件类型
    const getFileType = useMemo(() => {
        if (!displayValue) return 'none';

        // 通用：去除参数和哈希
        const [cleanUrl] = displayValue.split(/[?#]/);

        // 定义各类扩展名集合
        const EXT = {
            hls: ['m3u8'],
            ts: ['ts'],
            image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
            audio: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'],
            video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv']
        };

        // Helper: 通过扩展名匹配
        const getByExt = () => {
            const name = getFileName(cleanUrl);
            const ext = name.split('.').pop().toLowerCase();
            for (const [type, exts] of Object.entries(EXT)) {
                if (exts.includes(ext)) return type;
            }
            return null;
        };

        // 1. 精确扩展名匹配
        const byExt = getByExt();
        if (byExt) {
            if (byExt === 'hls') return 'hlsManifest';
            if (byExt === 'ts') return 'tsVideo';
            return byExt;
        }

        // 2. 处理 data URI
        if (cleanUrl.startsWith('data:')) {
            const mime = cleanUrl.slice(5).split(';')[0];
            if (['application/vnd.apple.mpegurl', 'audio/mpegurl'].includes(mime)) return 'hlsManifest';
            if (mime === 'video/mp2t') return 'tsVideo';
            const main = mime.split('/')[0];
            if (['image', 'audio', 'video'].includes(main)) return main;
        }

        // 3. URL 后缀检查（防止伪装）
        if (cleanUrl.toLowerCase().endsWith('.ts')) {
            return 'tsVideo';
        }

        return 'other';
    }, [displayValue]);
    // 修复acceptedFileTypes格式
    const formatAcceptedFileTypes = useMemo(() => {
        if (!acceptedFileTypes) return undefined;

        // 处理数组或字符串格式
        const types = typeof acceptedFileTypes === 'string'
            ? acceptedFileTypes.split(',')
            : acceptedFileTypes;

        return types.map(type => {
            type = type.trim();
            // 确保是MIME类型或带点的扩展名
            if (type && !type.startsWith('.') && !type.includes('/')) {
                return `.${type}`;
            }
            return type;
        }).filter(Boolean).join(',');
    }, [acceptedFileTypes]);

    // 动态生成上传区域的描述文本
    const generatedUploadDescription = useMemo(() => {
        const parts = [];

        // 文件类型描述
        if (acceptedFileTypes) {
            const types = (typeof acceptedFileTypes === 'string' ? acceptedFileTypes.split(',') : acceptedFileTypes);
            const isPlural = types.length > 1;//是否是复数
            const typesText = types.map(t => t.trim().toUpperCase().replace(/^\./, '')) // 提取并大写类型/扩展名
                .filter(Boolean)
                .join('/');
            if (typesText) parts.push(`Only ${typesText} file${isPlural ? 's' : ''} ${isPlural ? 'are' : 'is'} accepted.`);
        } else {
            parts.push("Supports common formats");
        }

        // 文件大小限制描述
        if (maxFileSize && typeof maxFileSize === 'number') {
            if (maxFileSize >= 1024) {
                const sizeInMB = (maxFileSize / 1024);
                // 如果是整数则不显示小数点，如果有小数则保留一位小数
                const formattedSize = Number.isInteger(sizeInMB) ? sizeInMB.toString() : sizeInMB.toFixed(1);
                parts.push(`Max ${formattedSize}MB`);
            } else {
                parts.push(`Max ${maxFileSize}KB`);
            }
        }

        return parts.join(', '); // 生成描述文本
    }, [acceptedFileTypes, maxFileSize]);

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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // 清理视频资源
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }

        // 清理HLS实例
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setHlsError(null);
        setHlsLoading(false);

    }, [onChange]);

    // 上传失败处理
    const handleUploadError = useCallback((error) => {
        console.error('Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
        const failMsg = `${uploadErrorMessage || 'Upload failed'}: ${errorMessage}`;
        messageApi.error(failMsg);
        setUploading(false);
    }, [uploadErrorMessage, messageApi]);

    // 自定义上传请求
    const customUploadRequestHandler = useCallback(async (options) => {
        const { onSuccess, onError, file, onProgress } = options;
        if (!uploadFn) {
            const errorMsg = "Upload function not configured";
            console.error(errorMsg);
            onError(new Error(errorMsg));
            handleUploadError(new Error(errorMsg));
            return;
        }

        setUploading(true);
        try {
            const result = await uploadFn({
                file,
                dirKey: dirKey,
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
                console.log(`File upload successful, URL: ${urlToSet}`);

                // 获取文件扩展名，确定正确的处理方式
                const fileName = getFileName(urlToSet);
                const extension = fileName.split('.').pop()?.toLowerCase();
                console.log(`File type: ${extension}`);

                // 确保清除任何现有的 HLS 实例和错误状态
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
                setHlsError(null);
                setHlsLoading(false);

                // 确保清除任何现有的视频元素的src属性
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.removeAttribute('src');
                    videoRef.current.load();
                }

                // 重置所有视频元素的重试标记
                document.querySelectorAll('video').forEach(video => {
                    if (video.dataset && video.dataset.recoveryAttempted) {
                        delete video.dataset.recoveryAttempted;
                    }
                });

                // 更新内部状态 - 这将触发 useEffect 和重新渲染
                setInternalValue(urlToSet);

                // 更新表单值
                if (onChange) {
                    onChange(urlToSet, file, form);
                }

                // 显示成功消息 - 在这里处理一次即可
                const successMsg = uploadSuccessMessage || 'Upload successfully!';
                // messageApi.success(successMsg);
            } else {
                console.error('Upload did not return valid URL:', result);
                const failMsg = uploadFailMessage || 'Failed to get file upload URL';
                messageApi.error(failMsg);
            }

            setUploading(false);
        } catch (err) {
            onError(err);
            handleUploadError(err);
        }
    }, [uploadFn, dirKey, handleUploadError, onChange, setInternalValue, uploadSuccessMessage, uploadFailMessage, messageApi, getFileName]);

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
        if (acceptedFileTypes) {
            const acceptedTypes = (typeof acceptedFileTypes === 'string'
                ? acceptedFileTypes.split(',')
                : acceptedFileTypes)
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
                    errorMessages.push(`This file type is not supported. Allowed types: ${typesText}`);
                }
            }
        }

        // 文件大小验证
        if (maxFileSize && typeof maxFileSize === 'number') {
            const maxSizeInBytes = maxFileSize * 1024;
            if (file.size > maxSizeInBytes) {
                isValid = false;
                errorMessages.push(`File size exceeds limit ${maxFileSize}KB`);
            }
        }

        // 自定义验证
        if (typeof beforeUpload === 'function') {
            try {
                const result = beforeUpload(file);
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
    }, [acceptedFileTypes, maxFileSize, beforeUpload, messageApi]);

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
        ...(props || {})
    }), [
        name, handleBeforeUpload, handleAntUploadChange, formatAcceptedFileTypes,
        disabled, uploading, customUploadRequestHandler, props
    ]);

    // Effect Hook 用于管理 HLS 播放器
    useEffect(() => {
        const currentVideoElement = videoRef.current;
        const currentFileType = getFileType; // 从 useMemo 获取当前文件类型

        // 只有 .m3u8 清单文件需要 HLS.js 处理
        if (currentFileType !== 'hlsManifest') {
            setHlsLoading(false);
            setHlsError(null);

            // 清理任何现有的 HLS 实例
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            return;
        }

        // 以下是处理 HLS 清单文件的逻辑
        // 重置 HLS 相关状态
        setHlsLoading(true);
        setHlsError(null);

        // 确保视频元素和文件 URL 都存在
        if (!displayValue || !currentVideoElement) {
            setHlsLoading(false);
            return;
        }

        // 确保视频元素被重置
        currentVideoElement.pause();
        currentVideoElement.removeAttribute('src');
        currentVideoElement.load();

        let isComponentMounted = true;

        // 尝试使用 HLS.js
        if (Hls.isSupported()) {
            // 如果已存在 HLS 实例，先销毁它
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            // 创建新的 HLS 实例，带优化配置
            const hls = new Hls({
                // 高级配置选项
                maxBufferLength: 30,          // 最大缓冲区长度（秒）
                maxMaxBufferLength: 60,       // 极端情况下的最大缓冲区长度
                enableWorker: true,           // 启用 Web Worker 提高解码性能
                lowLatencyMode: false,        // 非低延迟模式更稳定
                startLevel: -1,               // 自动选择初始质量级别（-1）
                autoStartLoad: true,          // 自动开始加载
                abrEwmaDefaultEstimate: 500000, // 初始带宽估计值（500kbps）
                // 调试选项
                debug: false,                 // 生产环境禁用调试
                // 分段加载优化
                fragLoadingMaxRetry: 6,       // 分段加载失败最大重试次数
                manifestLoadingMaxRetry: 4,   // 清单加载失败最大重试次数
                levelLoadingMaxRetry: 4,      // 级别加载最大重试次数
            });

            // 加载视频源
            hls.loadSource(displayValue);
            hls.attachMedia(currentVideoElement);

            // 监听 HLS 事件
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isComponentMounted) {
                    setHlsLoading(false);
                }
                // 允许播放但不自动开始，让用户控制
                // currentVideoElement.play().catch(e => console.warn('Auto-play was prevented:', e));
            });

            // 监听 HLS 级别切换事件
            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                // 可以在这里记录或响应质量级别的变化
                console.debug(`HLS 切换到质量级别: ${data.level}`);
            });

            // 添加媒体加载事件监听
            currentVideoElement.addEventListener('loadeddata', () => {
                if (isComponentMounted) {
                    setHlsLoading(false);
                }
            });

            // 错误处理
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS 错误:', data);

                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // 网络错误，可尝试恢复
                            const networkErrorMsg = 'Video network loading error, trying to recover...';
                            if (isComponentMounted) {
                                setHlsError(networkErrorMsg);
                                messageApi.error(networkErrorMsg);
                            }

                            // 尝试恢复网络错误
                            hls.startLoad();
                            break;

                        case Hls.ErrorTypes.MEDIA_ERROR:
                            // 媒体错误，可尝试恢复
                            const mediaErrorMsg = 'Video decoding error, trying to recover...';
                            if (isComponentMounted) {
                                setHlsError(mediaErrorMsg);
                                messageApi.error(mediaErrorMsg);
                            }

                            // 尝试恢复媒体错误
                            hls.recoverMediaError();
                            break;

                        default:
                            // 其他致命错误，无法恢复
                            const fatalMsg = 'An unrecoverable error occurred while playing the video';
                            if (isComponentMounted) {
                                setHlsError(fatalMsg);
                                setHlsLoading(false);
                                messageApi.error(fatalMsg);
                            }

                            // 销毁实例
                            hls.destroy();
                            hlsRef.current = null;
                            break;
                    }
                } else {
                    // 非致命错误，记录但不中断播放
                    console.warn('HLS 非致命错误:', data);
                }
            });

            // 保存 HLS 实例
            hlsRef.current = hls;
        } else if (currentVideoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // 浏览器原生支持 HLS (例如 Safari)
            try {
                // 设置源并监听事件
                currentVideoElement.src = displayValue;

                // 添加加载事件监听
                const loadedHandler = () => {
                    if (isComponentMounted) {
                        setHlsLoading(false);
                    }
                };

                // 添加错误处理
                const errorHandler = (error) => {
                    console.error('HLS 原生播放错误:', error);

                    if (isComponentMounted) {
                        setHlsError('Video playback failed, please check if the file is valid');
                        setHlsLoading(false);
                        messageApi.error('Video playback failed');
                    }
                };

                currentVideoElement.addEventListener('loadeddata', loadedHandler);
                currentVideoElement.addEventListener('error', errorHandler);

                // 清理函数中移除事件监听
                return () => {
                    isComponentMounted = false;
                    currentVideoElement.removeEventListener('loadeddata', loadedHandler);
                    currentVideoElement.removeEventListener('error', errorHandler);

                    // 移除源
                    currentVideoElement.removeAttribute('src');
                    currentVideoElement.load();
                };
            } catch (error) {
                console.error('原生 HLS 播放设置失败:', error);

                if (isComponentMounted) {
                    setHlsError(`Video playback failed: ${error.message}`);
                    setHlsLoading(false);
                    messageApi.error('Video player setup failed');
                }
            }
        } else {
            // 既不支持 HLS.js 也不支持原生 HLS
            const unsupportedMsg = 'Your browser does not support HLS video playback';

            if (isComponentMounted) {
                setHlsError(unsupportedMsg);
                setHlsLoading(false);
                messageApi.warning(unsupportedMsg);
            }
        }

        // 清理函数
        return () => {
            isComponentMounted = false;

            // 清理 HLS.js 实例
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [displayValue, getFileType, messageApi]);

    // 重试 HLS 加载的函数
    const retryHlsLoad = useCallback(() => {
        // 只有当文件类型是 HLS 清单时才应用 HLS 重试逻辑
        if (getFileType !== 'hlsManifest') {
            return;
        }

        // 重置状态
        setHlsError(null);
        setHlsLoading(true);

        // 如果有 HLS 实例，先销毁
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // 如果有视频元素，重置它
        if (videoRef.current) {
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }

        // 消息提示
        messageApi.loading('Reloading video...');

        // 轻微延迟后重新加载，给清理过程一些时间
        setTimeout(() => {
            // 依赖项变化会触发 useEffect，从而重新初始化 HLS
            // 为了确保触发，我们可以重新设置一下 displayValue
            // 这里我们只通知状态变化，而不是真的修改 URL
            setInternalValue(prev => {
                // 实际上是同一个值，但会触发状态更新
                if (prev === displayValue) {
                    return prev + '?reload=' + Date.now();
                }
                return prev;
            });
        }, 100);
    }, [displayValue, messageApi, getFileType]);

    // 修改格式化时间函数
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    };

    // 添加获取时长的函数
    const getDuration = useCallback(async (url) => {
        return new Promise((resolve) => {
            const audio = new Audio(url);
            audio.addEventListener('loadedmetadata', () => {
                const duration = formatTime(audio.duration);
                resolve(duration);
                audio.remove(); // 清理临时音频元素
            });
            audio.addEventListener('error', () => {
                resolve('00:00:00,000'); // 加载失败时返回默认值
                audio.remove(); // 清理临时音频元素
            });
        });
    }, [formatTime]);

    // 添加初始化时获取时长的效果
    useEffect(() => {
        if (displayValue && (getFileType === 'audio' || getFileType === 'video')) {
            getDuration(displayValue).then(duration => {
                setAudioDuration(duration);
            });
        } else {
            setAudioDuration('');
        }
    }, [displayValue, getFileType, getDuration]);

    // 处理音频加载完成
    const handleAudioLoaded = useCallback(() => {
        if (audioRef.current) {
            const duration = formatTime(audioRef.current.duration);
            setAudioDuration(duration);
        }
    }, []);

    // 处理音频播放结束
    const handleAudioEnded = useCallback(() => {
        setIsPlaying(false);
        audioManager.currentAudio = null;
        audioManager.currentCallback = null;
    }, []);

    // 处理音频播放/暂停
    const handleAudioToggle = useCallback(() => {
        if (!audioRef.current) {
            // 如果音频元素不存在，创建一个新的
            audioRef.current = new Audio(displayValue);
            audioRef.current.addEventListener('loadedmetadata', handleAudioLoaded);
            audioRef.current.addEventListener('ended', handleAudioEnded);
        }

        if (isPlaying) {
            audioRef.current.pause();
            audioManager.currentAudio = null;
            audioManager.currentCallback = null;
        } else {
            // 停止其他正在播放的音频
            audioManager.stopCurrent();
            // 设置当前音频为活动音频
            audioManager.setCurrentAudio(audioRef.current, setIsPlaying);
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, displayValue, handleAudioLoaded, handleAudioEnded]);

    // 清理音频资源
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('loadedmetadata', handleAudioLoaded);
                audioRef.current.removeEventListener('ended', handleAudioEnded);
                audioRef.current.pause();
                if (audioManager.currentAudio === audioRef.current) {
                    audioManager.currentAudio = null;
                    audioManager.currentCallback = null;
                }
                audioRef.current = null;
            }
        };
    }, [handleAudioLoaded, handleAudioEnded]);

    // 当文件改变时重置音频状态
    useEffect(() => {
        setIsPlaying(false);
        setAudioDuration('');
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }, [displayValue]);

    // 渲染文件预览
    const RenderFilePreview = () => {
        if (!hasFile) return null;
        switch (getFileType) {
            case 'image':
                return (
                    <Image
                        src={displayValue}
                        alt={getFileName(displayValue)}
                        className={styles.avatarImg}
                        preview={{ mask: null }}
                    />
                );

            case 'audio':
                return (
                    <div className={styles.audioPreview}>
                        <div
                            className={styles.audioPreview_box}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAudioToggle();
                            }}
                        >
                            {isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
                        </div>
                    </div>
                );

            case 'video':
                return (
                    <div className={styles.videoPreview}>
                        <video
                            src={displayValue}
                            className={styles.videoPlayer}
                            style={mediaElementStyle}
                        >
                            Your browser does not support playing this video
                        </video>
                    </div>
                );

            case 'hlsManifest': // HLS 清单文件 (.m3u8)
                return (
                    <div className={styles.videoPreview}>
                        {/* 添加加载指示器 */}
                        {hlsLoading && (
                            <div className={styles.hlsLoadingOverlay}>
                                <Spin tip="Loading video..." />
                            </div>
                        )}

                        {/* 添加错误显示和重试按钮 */}
                        {hlsError && (
                            <div className={styles.hlsErrorOverlay}>
                                <div className={styles.hlsErrorMessage}>{hlsError}</div>
                                <Button
                                    type="primary"
                                    icon={<ReloadOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation(); // 防止触发上层点击
                                        retryHlsLoad();
                                    }}
                                >
                                    Retry
                                </Button>
                            </div>
                        )}

                        {/* HLS 视频播放器 */}
                        <video
                            ref={videoRef}
                            controls
                            className={`${styles.videoPlayer} ${hlsError ? styles.videoPlayerError : ''}`}
                            style={mediaElementStyle}
                            playsInline // 在 iOS 上内联播放
                            preload="metadata" // 只预加载元数据，减少初始加载时间
                        />
                    </div>
                );

            case 'tsVideo': // TS 视频片段 - 尝试直接播放而不是通过 HLS.js
                return (
                    <div className={styles.videoPreview}>
                        <video
                            controls
                            className={styles.videoPlayer}
                            style={mediaElementStyle}
                            playsInline
                            preload="auto"
                            onError={(e) => {
                                console.error('视频播放错误，尝试替代方案');
                                const videoElement = e.target;

                                if (videoElement && typeof videoElement.play === 'function') {
                                    // 检查是否已尝试过恢复，避免无限循环
                                    if (videoElement.dataset.recoveryAttempted === 'true') {
                                        console.warn('已尝试过播放恢复，不再继续。');
                                        return;
                                    }

                                    // 标记已尝试恢复
                                    videoElement.dataset.recoveryAttempted = 'true';

                                    // 移除现有的所有子节点 (包括所有 source 元素和文本节点)
                                    while (videoElement.firstChild) {
                                        videoElement.removeChild(videoElement.firstChild);
                                    }

                                    // 创建新的 source 元素
                                    const sourceMp2t = document.createElement('source');
                                    sourceMp2t.src = displayValue;
                                    sourceMp2t.type = 'video/mp2t';

                                    const sourceMp4 = document.createElement('source');
                                    sourceMp4.src = displayValue;
                                    sourceMp4.type = 'video/mp4'; // 备选

                                    // 添加新的 source 元素
                                    videoElement.appendChild(sourceMp2t);
                                    videoElement.appendChild(sourceMp4);

                                    // 重新加载视频
                                    try {
                                        if (videoElement instanceof HTMLVideoElement && typeof videoElement.load === 'function') {
                                            videoElement.load();
                                            // videoElement.play().catch(err => console.warn("Play after recovery failed:", err));
                                        } else {
                                            console.error('videoElement.load 不是一个有效的函数');
                                        }
                                    } catch (err) {
                                        console.error('视频重载失败', err);
                                    }
                                } else {
                                    console.error('videoElement 无效或不是媒体元素');
                                }
                            }}
                        >
                            Your browser does not support playing this video
                        </video>
                    </div>
                );

            default:
                return (
                    <div className={styles.filePreview}>
                        <FileOutlined style={{ fontSize: '42px' }} />
                        {/* <div className={styles.fileExtension}>
                            {getFileName(displayValue).split('.').pop()?.toUpperCase() || 'FILE'}
                        </div> */}
                    </div>
                );
        }
    };

    // 媒体预览关闭处理
    const handleMediaPreviewClose = useCallback(() => {
        // 重置全局预览状态
        if (previewState.type === 'video') {
            window.MEDIA_PREVIEW.VIDEO = false;
        } else if (previewState.type === 'audio') {
            window.MEDIA_PREVIEW.AUDIO = false;
        }
        setPreviewState(prev => ({ ...prev, visible: false }));
    }, [previewState.type]);

    // 媒体预览模态框状态控制
    const handleMediaPreview = useCallback((url, type) => {
        // 设置全局预览状态
        if (type === 'video') {
            window.MEDIA_PREVIEW.VIDEO = true;
        } else if (type === 'audio') {
            window.MEDIA_PREVIEW.AUDIO = true;
        }
        setPreviewState({ visible: true, url, type });
    }, []);
    // 视频预览处理

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
                        <div className={styles.uploadArea} style={{ ...style }}>
                            {hasFile ? (
                                <div className={styles.previewContainer} onClick={() => getFileType === "video" && setPreviewState({ visible: true })}>
                                    <RenderFilePreview></RenderFilePreview>
                                    <MediaPreviewModal
                                        type="video"
                                        url={displayValue}
                                        visible={previewState.visible}
                                        onCancel={handleMediaPreviewClose}
                                    />
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

                        {/* 文件信息 */}
                        <div className={styles.uploadInfo} style={{ flex: '1', minWidth: 0 }}>
                            <div className={`${styles.uploadLabel} ${field?.required ? styles.uploadLabelRequired : ''}`}>
                                {field?.label}
                            </div>
                            <Text type="secondary" className={styles.uploadDescription}>
                                {uploadDescription || generatedUploadDescription}
                            </Text>
                            <div>
                                <Text type="secondary" className={styles.uploadDescription}>
                                    {audioDuration || ''}
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* 右侧区域：操作按钮 */}
                    <div className={styles.uploadActions}>
                        {hasFile && !uploading && (
                            <Button
                                icon={<CloseOutlined />}
                                type="text"
                                danger
                                color="default" variant="filled"
                                className={styles.clearButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearFile();
                                }}
                                disabled={disabled}
                                title="Remove file"
                            />
                        )}
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
                                        {changeButtonText || "Change"}
                                    </Button>
                                ) : (
                                    <Button
                                        color="default" variant="filled"
                                        className={styles.changeButton}
                                        onClick={() => triggerFileSelect()}
                                        disabled={disabled || uploading}
                                    >
                                        {uploadButtonText || "Upload"}
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