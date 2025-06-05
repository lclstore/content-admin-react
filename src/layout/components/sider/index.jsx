import SideMenu from '../menu'
import { useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react';
import "./sider.css"
import request from "@/request";
import CMS from "@/assets/images/logo_laien.png"

export default function Sider() {
    const [users, setUser] = useState('');
    const navigate = useNavigate();
    const getUser = async () => {
        return new Promise(resolve => {
            request.get({
                url: `/user/getMyInfo`,
                load: true,
                callback: res => {
                    console.log(res)
                    setUser(res.data.data)
                }
            });
        })
    }
    useEffect(() => {
        getUser().then()
    }, []);

    const handleCreateWorkout = () => {

        navigate('/exercises/editor')
    }
    const goProfile = () => {
        navigate('/profile/list')
    }
    return (
        <div style={{ height: '100vh', overflow: "hidden" }}>
            {/* <div className="createWorkoutBtn" onClick={handleCreateWorkout}>CREATE WORKOUT</div> */}
            <div className='createWorkoutBtn1_box'>
                <img className='createWorkoutBtn1_img' src={CMS} alt="" />
            <div className='createWorkoutBtn1'>Content System</div>
            </div>
            <SideMenu />
            <div className='Profile' onClick={goProfile} >
                <div className='Profile-avatar'></div>
                <div className='mask'>
                    <img src={users?.avatar} alt="" />
                </div>
                <div style={{ 'margin': '16px 0' }}>
                    <div className='Profile-usename'>{users?.name}</div>
                    <div className='Profile-eamil'>{users?.email}</div>
                </div>
            </div>
        </div >
    )
}