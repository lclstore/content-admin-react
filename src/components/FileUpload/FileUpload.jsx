import React from 'react';
import PropTypes from 'prop-types';
import { Upload, Button, message } from 'antd';
import { CameraOutlined, UploadOutlined } from '@ant-design/icons';
import './FileUpload.css';

/**
 * @description 自定义文件上传控件
 * @param {string} title - 主标题
 * @param {string} recommendation - 推荐文本
 * @param {function} onChange - 文件状态改变时的回调 (Ant Design Upload 的 onChange)
 * @param {object} uploadProps - 传递给 Ant Design Upload 组件的其他 props
 * @param {string} value - (可选) 用于 Form 集成
 * @param {boolean} isRequired - (可选) 标题旁边是否显示红色星号
 */
const FileUpload = ({
    title,
    recommendation = null, // 默认无推荐文本
    onChange = () => { }, // 默认空回调
    uploadProps = {}, // 默认无额外 Upload props
    value = null, // 默认无图片
    isRequired = false, // 默认非必填
}) => {

    const showPlaceholder = !value;

    const internalUploadProps = {
        name: 'file', // 后端接收的文件字段名
        showUploadList: false,
        beforeUpload: (file) => {
            // 检查文件类型是否为 PNG 或 WEBP
            const isPngOrWebp = file.type === 'image/png' || file.type === 'image/webp';
            if (!isPngOrWebp) {
                message.error('Only PNG or WEBP image formats are allowed!');
            }
            // 返回校验结果。决定文件是否进入 onChange。
            return isPngOrWebp;
        },
        onChange: (info) => {
            if (info.file.status === 'uploading') {
                return;
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
                // 示例：通常在这里调用 props.onChange 将结果传递给 Form
                // onChange(info.file.response.url);
            }
            if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
            // 调用外部传入的 onChange
            if (typeof onChange === 'function') {
                onChange(info);
            }
        },
        ...uploadProps,
    };

    return (
        <div className="file-upload-container">
            <Upload {...internalUploadProps} className="upload-area-wrapper">
                <div className="upload-area">
                    {showPlaceholder ? (
                        <CameraOutlined className="upload-icon" />
                    ) : (
                        <img src={value} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    )}
                </div>
            </Upload>

            <div className="upload-info">
                <h4 className={isRequired ? 'required' : undefined}>
                    {title}
                </h4>
                {recommendation && <p className="recommendation">{recommendation}</p>}
            </div>

            <Upload {...internalUploadProps}>
                <Button color="default" variant="filled" className="upload-trigger-button" icon={<UploadOutlined />}>
                    {showPlaceholder ? 'Upload' : 'Change'}
                </Button>
            </Upload>
        </div>
    );
};

FileUpload.propTypes = {
    title: PropTypes.string.isRequired,
    recommendation: PropTypes.string,
    onChange: PropTypes.func,
    uploadProps: PropTypes.object,
    value: PropTypes.string,
    isRequired: PropTypes.bool,
};

export default FileUpload; 