import SideMenu from '../menu'
import { useNavigate } from 'react-router-dom'
import "./sider.css"

export default function Sider() {

    const navigate = useNavigate()

    const handleCreateWorkout = () => {
        navigate('/exercises/editor')
    }
    var users = localStorage.getItem('users');
        users = JSON.parse(users)
        console.log(users,'users')
    return (
        <div style={{ height: '100vh', overflow: "hidden" }}>
            <div className="createWorkoutBtn" onClick={handleCreateWorkout}>CREATE WORKOUT</div>
            <SideMenu />
            <div className='Profile' onClick={(res)=>{
                navigate('/profile/list')
            }} >
                <div className='Profile-avatar'></div>
                <div className='mask'>
                    <img src={users.avatar} alt="" />
                </div>
                <div style={{ 'margin': '16px 0' }}>
                    <div className='Profile-usename'>{users.name}</div>
                    <div className='Profile-eamil'>{users.email}</div>
                </div>
            </div>
        </div >
    )
}