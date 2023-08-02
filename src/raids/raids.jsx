import { useEffect, useState } from "react";
import { supabase } from '../supabaseClient.js'
import {Link, Outlet} from "react-router-dom";

function Raids()
{
    const [raids, setRaids] = useState([]);

    useEffect(() => {
        getRaids();
    }, []);

    async function getRaids() {
        const {data} = await supabase.from('raids').select()
        setRaids(data);
    }

    const raidData = raids.map((raid) => (
        <li key={raid.id}>
            <Link to={`/raids/overview?raidId=${raid.id}`}>{raid.name}</Link>
        </li>
    ));

    // async function getRaidMembers() {
    //     const {data} = await
    // }
    // raidData.forEach((raid) => {
    //     console.log(score);
    // });

    return (
        <>
            <ul>
                {raidData}
            </ul>
            <div id="detail">
                <Outlet />
            </div>
        </>
);
}

export default Raids