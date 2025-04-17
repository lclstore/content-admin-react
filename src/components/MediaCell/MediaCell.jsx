import React from 'react';
import { Image } from 'antd';
import { FileImageOutlined, PlayCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { formatDuration } from '@/utils'; // 从 @/utils/index.js 导入
import './MediaCell.css';

const WorkoutMediaCell = ({ record, onVideoClick }) => {

    const { image, type, duration, name, newStartTime, newEndTime } = record;

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
    const newTagElement = showNewTag ? <div className="new-tag">New</div> : null;

    if (!image) {
        return <div className="imageContainer noImage"><FileImageOutlined /></div>;
    }

    if (type === 'video') {
        return (
            <div className="videoContainer" onClick={(e) => onVideoClick(e, image)}>
                {newTagElement}
                <video
                    src={image}
                    className="tabVideo"
                    preload="metadata"
                    muted
                    playsInline
                >
                </video>
                <div className="videoOverlay videoPlayIconOverlay">
                    <PlayCircleOutlined />
                </div>
                {duration !== undefined && (
                    <div className="videoDurationOverlay">
                        {formatDuration(duration)}
                    </div>
                )}
                <div className="videoOverlay videoPreviewHintOverlay">
                    <EyeOutlined />
                    <span style={{ marginLeft: '5px' }}>Preview</span>
                </div>
            </div>
        );
    } else {
        return (
            <div className="imageContainer">
                {newTagElement}
                <Image
                    src={image}
                    alt={`${name}'s image`}
                    onClick={(e) => e.stopPropagation()} // 防止点击图片触发行点击事件
                />
            </div>
        );
    }
};

export default WorkoutMediaCell; 