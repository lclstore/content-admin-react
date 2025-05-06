import Programs from './components/Programs.jsx';
import Category from './components/Category.jsx'
// import Categories from './Categories';
import {HeaderContext} from '@/contexts/HeaderContext';
import React, {useContext, useEffect} from "react";
import {PlusOutlined} from "@ant-design/icons";
import {useNavigate} from 'react-router';
import {Tabs} from 'antd';

export default function CollectionsList() {
    const {setButtons, setCustomPageTitle} = useContext(HeaderContext);
    const navigate = useNavigate(); // 路由导航
    const tabItems = [
        {
            key: 'category',
            label: 'Category',
        },
        {
            key: 'program',
            label: 'Program',
        },
    ];

    function onChange(v) {
        console.log(v);
    }

    useEffect(() => {
        setButtons([
            {
                key: 'create',
                text: 'Create Workout',
                icon: <PlusOutlined/>,
                type: 'primary',
                onClick: () => navigate('/workouts/editor'),
            }
        ])
    }, []);
    return (
        <div>
            <Tabs style={{backgroundColor: 'white'}} defaultActiveKey="1" items={tabItems} onChange={onChange}/>
            <Programs/>
            <Category/>
        </div>
    );
}