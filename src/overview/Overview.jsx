import Raids from "../raids/raids.jsx";
import {Link} from "react-router-dom";

export default function Overview() {
    return (
        <div className="row">
            <div className="col-4">
                <Link to={Raids}>Raids</Link>
            </div>
            <div className="col-4">
                <a href="http://localhost:5173/raids">My Characters</a>
            </div>
            <div className="col-4">
                <a href="http://localhost:5173/raids">Strikelist</a>
            </div>
        </div>
    )
}