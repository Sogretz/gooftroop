import { useEffect, useState } from "react";
import { supabase } from '../supabaseClient.js'

function RaidOverview()
{
    const [raids, setRaidOverview] = useState([]);

    useEffect(() => {
        getRaidOverview();
    }, []);

    async function getRaidOverview() {
        const {data} = await supabase.from('raids').select('id')
        setRaidOverview(data);
    }

    const raidData = raids.map((raid) => (
        <li key={raid.id}>
            <Link to={`raid/${raid.id}`}>{raid.name}, {raid.player_mode}</Link>
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

export default RaidOverview