import { useEffect, useState } from "react";
import { supabase } from '../supabaseClient.js'
import {Link} from "react-router-dom";

function Raids()
{
    const [raids, setRaids] = useState([]);

    useEffect(() => {
        getRaids();
    }, []);

    async function getRaids() {
        const {data} = await supabase.from('raids').select('id')
        setRaids(data);
    }

    const raidData = raids.map((raid) => (
        <li key={raid}>{raid}
        </li>
    ));

    // async function getRaidMembers() {
    //     const {data} = await
    // }
    // raidData.forEach((raid) => {
    //     console.log(score);
    // });

    return (
        <ul>
            {raidData}
        </ul>
    );
}

export default Raids