import React, { useState, useCallback, useEffect } from 'react';
import { Image, Modal } from 'antd';
import { FileImageOutlined, PlayCircleOutlined, EyeOutlined, LockFilled, CaretRightFilled } from '@ant-design/icons';
import { formatDuration } from '@/utils'; // 从 @/utils/index.js 导入
import styles from './MediaCell.module.less'; // 导入 CSS Modules
// MediaType[] = ['video', 'audio', 'image'];
// 全局状态标记，用于跟踪是否有图片预览处于激活状态
// 这样其他组件可以检查这个标记来避免处理点击事件
window.IMAGE_PREVIEW_ACTIVE = false;
// 全局状态标记，用于跟踪是否有视频预览处于激活状态
window.VIDEO_PREVIEW_ACTIVE = false;
// 全局状态标记，用于跟踪是否有音频预览处于激活状态
window.AUDIO_PREVIEW_ACTIVE = false;

const WorkoutMediaCell = ({ record, processedCol }) => {
    const { image, duration, name, newStartTime, newEndTime, posterImage, Premium } = record;
    const { mediaType, showNewBadge, showLock, dataIndex } = processedCol;
    const [imgError, setImgError] = useState(false);
    // 跟踪 Antd 图片预览可见性状态
    const [isAntdPreviewVisible, setIsAntdPreviewVisible] = useState(false);

    // 视频/音频预览状态和处理函数
    const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
    const [previewVideoUrl, setPreviewVideoUrl] = useState('');
    const [previewAudioUrl, setPreviewAudioUrl] = useState('');
    const [previewType, setPreviewType] = useState(''); // 'video' 或 'audio'

    // 使用ref引用modal容器
    const modalContainerRef = React.useRef(null);

    // 当预览状态改变时，更新全局标记并设置全局事件处理器
    useEffect(() => {
        window.IMAGE_PREVIEW_ACTIVE = isAntdPreviewVisible;
        window.VIDEO_PREVIEW_ACTIVE = isPreviewModalVisible && previewType === 'video';
        window.AUDIO_PREVIEW_ACTIVE = isPreviewModalVisible && previewType === 'audio';

        // 全局事件拦截器 - 当模态框显示时阻止点击事件传播
        const handleGlobalClick = (e) => {
            if ((isPreviewModalVisible || isAntdPreviewVisible) &&
                e.target && e.target.classList &&
                (e.target.classList.contains('ant-modal-wrap') ||
                    e.target.classList.contains('ant-modal-mask') ||
                    e.target.classList.contains('ant-image-preview-mask'))) {
                e.stopPropagation();
                e.preventDefault();
                console.log('Global click intercepted on modal mask/wrap');

                // 如果是视频/音频预览模态框的蒙层，关闭模态框
                if (isPreviewModalVisible &&
                    (e.target.classList.contains('ant-modal-wrap') ||
                        e.target.classList.contains('ant-modal-mask'))) {
                    handlePreviewModalCancelInternal();
                }
            }
        };

        // 使用捕获阶段处理事件，确保比冒泡更早捕获
        if (isPreviewModalVisible || isAntdPreviewVisible) {
            document.addEventListener('click', handleGlobalClick, true);
            document.addEventListener('mousedown', handleGlobalClick, true);
        }

        return () => {
            // 清理函数，确保组件卸载时标记被重置
            if (isAntdPreviewVisible) {
                window.IMAGE_PREVIEW_ACTIVE = false;
            }
            if (isPreviewModalVisible) {
                window.VIDEO_PREVIEW_ACTIVE = false;
                window.AUDIO_PREVIEW_ACTIVE = false;
            }
            // 移除事件监听器
            document.removeEventListener('click', handleGlobalClick, true);
            document.removeEventListener('mousedown', handleGlobalClick, true);
        };
    }, [isAntdPreviewVisible, isPreviewModalVisible, previewType]);

    const handleVideoClickInternal = useCallback((e, url) => {
        e.stopPropagation(); // 阻止事件冒泡
        console.log("Attempting to preview video:", url); // 打印将要预览的 URL
        setPreviewVideoUrl(url);
        setPreviewAudioUrl('');
        setPreviewType('video');
        setIsPreviewModalVisible(true);
        window.VIDEO_PREVIEW_ACTIVE = true; // 立即设置全局标记
    }, []); // 无依赖项

    // 处理音频点击事件
    const handleAudioClickInternal = useCallback((e, url) => {
        e.stopPropagation(); // 阻止事件冒泡
        console.log("Attempting to preview audio:", url); // 打印将要预览的 URL
        setPreviewAudioUrl(url);
        setPreviewVideoUrl('');
        setPreviewType('audio');
        setIsPreviewModalVisible(true);
        window.AUDIO_PREVIEW_ACTIVE = true; // 立即设置全局标记
    }, []); // 无依赖项

    const handlePreviewModalCancelInternal = useCallback(() => {
        setIsPreviewModalVisible(false);
        setPreviewVideoUrl(''); // 关闭时清空视频 URL
        setPreviewAudioUrl(''); // 关闭时清空音频 URL

        // 短暂保持标志为 true，防止关闭操作触发行点击
        setTimeout(() => {
            window.VIDEO_PREVIEW_ACTIVE = false;
            window.AUDIO_PREVIEW_ACTIVE = false;
            console.log('Reset media preview flags to false after delay');
        }, 500);
    }, []); // 无依赖项

    // 判断当前时间是否在newStartTime和newEndTime之间显示new标签
    const showNewTag = React.useMemo(() => {
        const now = new Date().getTime();
        const start = newStartTime ? new Date(newStartTime).getTime() : null;
        const end = newEndTime ? new Date(newEndTime).getTime() : null;
        if (start && end) {
            return now >= start && now <= end;
        }
        return false;
    }, [newStartTime, newEndTime]);
    const newTagElement = showNewTag && showNewBadge ? <div className={styles['new-tag']}>New</div> : null;

    // 判断是否显示锁图标
    const showLockIcon = Premium && showLock;
    const lockElement = showLockIcon ? <div className={styles['lock-icon']}><LockFilled /></div> : null;

    // 确定媒体类型：优先使用传入的 'mediaType'，否则根据 record.videoUrl 判断

    // 图片加载错误处理
    const handleImageError = useCallback(() => {
        setImgError(true);
    }, []);

    // 处理预览状态改变
    const handlePreviewVisibleChange = useCallback((visible) => {
        console.log(`Image preview visible changed: ${visible}`);
        // 更新预览可见性状态
        setIsAntdPreviewVisible(visible);
        // 同时更新全局标记
        window.IMAGE_PREVIEW_ACTIVE = visible;

        // 当预览关闭时，短暂保持标志为 true，防止关闭操作触发行点击
        if (!visible) {
            // 保持标志 500ms，足够让关闭事件完成而不触发行点击
            setTimeout(() => {
                window.IMAGE_PREVIEW_ACTIVE = false;
                console.log('Reset IMAGE_PREVIEW_ACTIVE to false after delay');
            }, 500);
        }
    }, []);

    // 媒体预览Modal - 所有媒体类型共用
    const mediaPreviewModal = (
        <Modal
            title={previewType === 'video' ? "video preview" : "audio preview"}
            open={isPreviewModalVisible}
            onCancel={(e) => {
                if (e && typeof e.stopPropagation === 'function') {
                    e.stopPropagation(); // 阻止事件冒泡到行
                }
                handlePreviewModalCancelInternal(); // 调用状态更新逻辑
            }}
            footer={null}
            destroyOnClose
            centered
            width={800}
            maskClosable={true} // 允许点击蒙层关闭模态框
            wrapClassName="media-preview-modal-wrap prevent-row-click" // 添加类名便于外部样式定位和事件处理
            modalRender={(modal) => (
                <div
                    ref={modalContainerRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Modal container click stopped');
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        console.log('Modal container mousedown stopped');
                    }}
                >
                    {modal}
                </div>
            )}
            // 使用styles.mask代替废弃的maskStyle
            styles={{
                mask: { pointerEvents: 'auto' },
                wrapper: { pointerEvents: 'auto' }
            }}
            // 组合使用多个事件处理器
            onMouseDown={(e) => {
                e.stopPropagation();
                // 确保只处理蒙层点击，不处理Modal内部点击
                const target = e.target;
                const className = target.className;
                console.log('Modal mousedown event on:', className);
                // 检查点击的是否是蒙层
                if (typeof className === 'string' &&
                    (className.includes('ant-modal-wrap') || className.includes('ant-modal-mask'))) {
                    e.preventDefault();
                    e.stopPropagation();
                    // 避免事件传播到表格行
                    console.log('Prevented modal mask mousedown propagation');
                }
            }}
            onClick={(e) => {
                e.stopPropagation();
                console.log('Modal click event handled');
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ width: '100%' }}
            >
                {previewType === 'video' && previewVideoUrl && (
                    <video
                        src={previewVideoUrl}
                        controls // 显示浏览器控件
                        style={{ width: '100%', display: 'block' }} // 确保视频适应 Modal
                        onClick={(e) => e.stopPropagation()} // 防止视频点击冒泡
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
                {previewType === 'audio' && previewAudioUrl && (
                    <audio
                        src={previewAudioUrl}
                        controls // 显示浏览器控件
                        style={{ width: '100%', display: 'block' }} // 确保音频控件适应 Modal
                        onClick={(e) => e.stopPropagation()} // 防止音频点击冒泡
                    >
                        Your browser does not support the audio tag.
                    </audio>
                )}
            </div>
        </Modal>
    );

    if (mediaType === 'video') {
        const videoSrc = record[dataIndex];

        if (!videoSrc) {
            // 如果没有视频源，则显示容器（保持布局）
            return <div className={`${styles.videoContainer} ${styles.mediaCell}`}></div>;
        }
        return (
            <> {/* 使用 Fragment 包裹元素和 Modal */}
                <div
                    className={`${styles.videoContainer} ${styles.mediaCell}`}
                    onClick={(e) => handleVideoClickInternal(e, videoSrc)} // 使用内部处理函数
                >
                    {newTagElement}
                    {lockElement}
                    <video
                        poster={posterImage || undefined} // 如果有海报图则使用
                        src={videoSrc}
                        className={styles.tabVideo}
                        preload="metadata"
                        muted
                        playsInline
                        onClick={(e) => e.stopPropagation()} // 防止视频点击冒泡
                    // 考虑添加 onError 处理视频标签加载错误
                    >
                    </video>
                    <div className={`${styles.videoOverlay} ${styles.videoPlayIconOverlay}`}>
                        <PlayCircleOutlined />
                    </div>
                    {duration !== undefined && (
                        <div className={styles.videoDurationOverlay}>
                            {formatDuration(duration)}
                        </div>
                    )}
                    <div className={`${styles.videoOverlay} ${styles.videoPreviewHintOverlay}`}>
                        <EyeOutlined />
                        <span style={{ marginLeft: '5px' }}>Preview</span>
                    </div>
                </div>
                {mediaPreviewModal}
            </>
        );
    } else if (mediaType === 'audio') {
        // 处理音频类型
        const audioSrc = record[dataIndex];
        if (!audioSrc) {
            // 如果没有音频源，则显示容器（保持布局）
            return <div className={`${styles.audioContainer} ${styles.mediaCell}`}></div>;
        }
        return (
            <> {/* 使用 Fragment 包裹元素和 Modal */}
                <div
                    className={`${styles.audioContainer} ${styles.mediaCell}`}
                    onClick={(e) => handleAudioClickInternal(e, audioSrc)} // 使用音频内部处理函数
                >
                    {newTagElement}
                    {lockElement}
                    {/* 简化为只显示音频图标 */}
                    <CaretRightFilled className={styles.audioIcon} />
                </div>
                {mediaPreviewModal}
            </>
        );
    } else {
        // 渲染为图片
        if (!image) {
            // 如果没有图片源，则显示容器（保持布局）
            return <div className={`${styles.imageContainer} ${styles.mediaCell}`}></div>;
        }
        if (imgError) {
            // 图片加载出错时，显示容器（保持布局）
            return <div className={`${styles.imageContainer} ${styles.mediaCell}`}></div>;
        }

        return (
            <div
                className={`${styles.imageContainer} ${styles.mediaCell}`}
            >
                {newTagElement}
                {lockElement}
                <Image
                    src={record[dataIndex]}
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Image clicked, prevented bubbling');
                    }}
                    alt={`${name || 'Media'}'s image`}
                    preview={{
                        onVisibleChange: handlePreviewVisibleChange,
                        mask: (
                            <div >
                                <EyeOutlined />
                                <span>Preview</span>
                            </div>
                        )
                    }}
                    onError={handleImageError}
                />
            </div>
        );
    }
};

export default WorkoutMediaCell; 