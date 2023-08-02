import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from '../supabaseClient.js';

function RaidOverview()
{
    // const [raids, setRaidOverview] = useState([]);
    //
    // useEffect(() => {
    //     getRaidOverview();
    // }, []);
    //
    // async function getRaidOverview() {
    //     const {data} = await supabase.from('raids').select('id')
    //     setRaidOverview(data);
    // }
    //
    // const raidData = raids.map((raid) => (
    //     <li key={raid.id}>
    //         <Link to={`raid/${raid.id}`}>{raid.name}, {raid.player_mode}</Link>
    //     </li>
    // ));

    const [queryParameters] = useSearchParams();
    const [raidData, setRaidData] = useState([]);

    useEffect(() => {
        getRaidMembers();
    }, [])

    async function getRaidMembers() {
        const {data} = await supabase
            .from('raids')
            .select('id, name, player_mode, difficulty, raid_registers ( id, raid_id, character_id, signed, present, characters ( id, name, class, main_spec, off_spec ))')
            .eq('id', queryParameters.get("raidId"))
        setRaidData(data);
    }

    console.log(raidData);
    const raidRegisters = raidData[0]['raid_registers'];
    console.log(raidRegisters);
    // const raidCharacters = raidRegisters.map
    // raidData.forEach((raid) => {
    //     console.log(score);
    // });

    return (
        <ul>
            {raidRegisters}
        </ul>
    );
}

export default RaidOverview