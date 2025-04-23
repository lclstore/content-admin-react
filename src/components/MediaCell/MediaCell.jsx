import React, { useState, useCallback, useEffect } from 'react';
import { Image, Modal } from 'antd';
import { FileImageOutlined, PlayCircleOutlined, EyeOutlined, LockFilled } from '@ant-design/icons';
import { formatDuration } from '@/utils'; // 从 @/utils/index.js 导入
import styles from './MediaCell.module.css'; // 导入 CSS Modules

// 全局状态标记，用于跟踪是否有图片预览处于激活状态
// 这样其他组件可以检查这个标记来避免处理点击事件
window.IMAGE_PREVIEW_ACTIVE = false;
// 全局状态标记，用于跟踪是否有视频预览处于激活状态
window.VIDEO_PREVIEW_ACTIVE = false;

const WorkoutMediaCell = ({ record, processedCol }) => {
    const { image, duration, name, newStartTime, newEndTime, posterImage, Premium } = record;
    const { type, showNewBadge, showLock } = processedCol;
    const [imgError, setImgError] = useState(false);
    // 跟踪 Antd 图片预览可见性状态
    const [isAntdPreviewVisible, setIsAntdPreviewVisible] = useState(false);

    // 视频预览状态和处理函数
    const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
    const [previewVideoUrl, setPreviewVideoUrl] = useState('');

    // 当预览状态改变时，更新全局标记
    useEffect(() => {
        window.IMAGE_PREVIEW_ACTIVE = isAntdPreviewVisible;
        window.VIDEO_PREVIEW_ACTIVE = isPreviewModalVisible;
        return () => {
            // 清理函数，确保组件卸载时标记被重置
            if (isAntdPreviewVisible) {
                window.IMAGE_PREVIEW_ACTIVE = false;
            }
            if (isPreviewModalVisible) {
                window.VIDEO_PREVIEW_ACTIVE = false;
            }
        };
    }, [isAntdPreviewVisible, isPreviewModalVisible]);

    const handleVideoClickInternal = useCallback((e, url) => {
        e.stopPropagation(); // 阻止事件冒泡
        console.log("Attempting to preview video:", url); // 打印将要预览的 URL
        setPreviewVideoUrl(url);
        setIsPreviewModalVisible(true);
        window.VIDEO_PREVIEW_ACTIVE = true; // 立即设置全局标记
    }, []); // 无依赖项

    const handlePreviewModalCancelInternal = useCallback(() => {
        setIsPreviewModalVisible(false);
        setPreviewVideoUrl(''); // 关闭时清空 URL

        // 短暂保持标志为 true，防止关闭操作触发行点击
        setTimeout(() => {
            window.VIDEO_PREVIEW_ACTIVE = false;
            console.log('Reset VIDEO_PREVIEW_ACTIVE to false after delay');
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

    // 确定媒体类型：优先使用传入的 'type'，否则根据 record.videoUrl 判断
    // 'type' 属性现在由 ConfigurableTable 根据列定义直接传递
    const effectiveType = type

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

    if (effectiveType === 'video') {
        const videoSrc = record.videoUrl || image; // 优先使用 videoUrl
        if (!videoSrc) {
            // 如果没有视频源，则显示容器（保持布局）
            return <div className={styles.videoContainer}></div>;
        }
        return (
            <> {/* 使用 Fragment 包裹元素和 Modal */}
                <div
                    className={styles.videoContainer} // 已移除 media-cell-container
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
                {/* 视频预览 Modal */}
                <Modal
                    title="Video Preview"
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
                    maskClosable={false} // 防止点击遮罩层关闭并触发行点击
                    modalRender={(modal) => (
                        <div onClick={(e) => e.stopPropagation()}>
                            {modal}
                        </div>
                    )}
                >
                    {previewVideoUrl && (
                        <video
                            src={previewVideoUrl}
                            controls // 显示浏览器控件
                            style={{ width: '100%', display: 'block' }} // 确保视频适应 Modal
                            onClick={(e) => e.stopPropagation()} // 防止视频点击冒泡
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </Modal>
            </>
        );
    } else {
        // 渲染为图片
        if (!image) {
            // 如果没有图片源，则显示容器（保持布局）
            return <div className={styles.imageContainer}></div>;
        }
        if (imgError) {
            // 图片加载出错时，显示容器（保持布局）
            return <div className={styles.imageContainer}></div>;
        }

        return (
            <div
                className={styles.imageContainer}
            >
                {newTagElement}
                {lockElement}
                <Image
                    src={image}
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