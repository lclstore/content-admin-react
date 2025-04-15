import SideMenu from '../menu'
import { useNavigate } from 'react-router-dom'
import "./sider.css"

export default function Sider() {
    const navigate = useNavigate()

    const handleCreateWorkout = () => {
        navigate('/exercises-editor')
    }

    return (
        <div>
            <div className="createWorkoutBtn" onClick={handleCreateWorkout}>CREATE WORKOUT</div>
            <SideMenu />
        </div >
    )
}