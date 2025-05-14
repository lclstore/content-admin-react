import CommonList from './CommonList'; //左侧列表数据
import CollapseForm from './CollapseForm'; //右侧折叠表单
import styles from './style.module.css';
export default function AdvancedFormContent(props) {
    const { fields, initialValues, onSave, formType } = props;
    return (
        <div className="advanced-form-content">
            <CommonList />
            <CollapseForm />
        </div>
    )
}