
import { useRef } from "react"

export default () => {
    const info = useRef({ number: 1 })

    return (
        <div>
            <h1 onClick={() => {
                info.current.number = info.current.number + 1
            }}>add</h1>
            <h1>{info.current.number}</h1>
            bbb
        </div>
    )
}