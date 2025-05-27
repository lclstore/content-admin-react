import styles from './list.module.css';
import { useEffect, useContext } from 'react';
import { HomeOutlined } from '@ant-design/icons';
import { HeaderContext } from '@/contexts/HeaderContext';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';



export default function Home() {
    // 1. 状态定义 - 组件内部状态管理
    const { setButtons, setCustomPageTitle } = useContext(HeaderContext); // 更新为新的API
    const navigate = useNavigate(); // 路由导航
    //设置导航栏按钮
    useEffect(() => {
        // 设置自定义页面标题
        setCustomPageTitle('Home');
        return () => {
            // 组件卸载时清理
            setButtons([]);
            setCustomPageTitle(null);
        };
    }, [setButtons, setCustomPageTitle, navigate]);


    return (
        <div className={styles.homeContainer}>
            <div className={styles.homeSidebar}>
                <div className={`${styles.homeBox} ${styles.info}`}>
                    <div className={styles.titleBar}>
                        Info
                    </div>
                </div>
                <div className={`${styles.homeBox} ${styles.help}`}>
                    <div className={styles.titleBar}>
                        Help
                    </div>
                </div>
            </div>
            <div className={`${styles.homeBox} ${styles.logs}`}>
                <div className={styles.titleBar}>
                    Logs
                </div>
            </div>
        </div>
    );
}