import noDataImg from '@/assets/images/no-data.png'
import styles from './style.module.css'
export default function Empty({ title = '', img }) {
    return (
        <div className={styles.customEmptyWrapper}>
            <div className={styles.customEmptyImageWrapper}>
                <img src={img || noDataImg} alt="No Data" className={styles.customEmptyImage} />
            </div>
            <div className={styles.customEmptyTitle}>{
                title
            } </div>
        </div>
    )
}