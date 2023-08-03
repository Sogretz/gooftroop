import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from '../supabaseClient.js';

function RaidOverview()
{
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const raidId = searchParams.get("raidId");
    console.log(raidId);

    const [raidDetails, setRaidDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompleteRaidDetails = async (raidId) => {
            const fetchRaidDetails = async (raidId) => {
                const { data: raids, error } = await supabase
                    .from('raids')
                    .select('*')
                    .eq('id', raidId);

                if (error) {
                    console.error('Error fetching raid: ', error);
                    return null;
                }

                if (raids.length === 0) {
                    console.error('Raid not found');
                    return null;
                }

                const raid = raids[0];
                const raidDetails = { ...raid };
                return raidDetails;
            };

            const fetchScheduledRaid = async (raidId) => {
                const { data: scheduledRaids, error } = await supabase
                    .from('scheduled_raids')
                    .select('*')
                    .eq('raid_id', raidId);

                if (error) {
                    console.error('Error fetching scheduled raid:', error);
                    return null;
                }

                if (scheduledRaids.length === 0) {
                    console.error('Scheduled raid not found.');
                    return null;
                }

                const scheduledRaid = scheduledRaids[0];
                return scheduledRaid;
            }

            const fetchRaidRegisters = async (scheduledRaidId) => {
                const { data: raidRegisters, error } = await supabase
                    .from('raid_registers')
                    .select('*')
                    .eq('scheduled_raid_id', scheduledRaidId);

                if (error) {
                    console.error('Error fetching raid registers: ', error);
                    return null;
                }

                return raidRegisters;
            }

            const fetchCharactersByIds = async (characterIds) => {
                const { data: characters, error } = await supabase
                    .from('characters')
                    .select('*')
                    .in('id', characterIds);

                if (error) {
                    console.error('Error fetching characters: ', error);
                    return null;
                }

                return characters;
            }

            const fetchCharacterStrikes = async (characterId, raidId) => {
                const { data: strikes, error } = await supabase
                    .from('strikes')
                    .select('')
                    .eq('character_id', characterId)
                    .eq('raid_id', raidId);

                if (error) {
                    console.error('Error fetching strikes: ', error);
                    return null;
                }

                return strikes;
            };

            const raidDetails = await fetchRaidDetails(raidId);

            if (!raidDetails) {
                setLoading(false);
                return;
            }

            const scheduledRaid = await fetchScheduledRaid(raidId);

            if (!scheduledRaid) {
                setLoading(false);
                return;
            }

            const raidRegisters = await fetchRaidRegisters(scheduledRaid.id);

            if (!raidRegisters) {
                setLoading(false);
                return;
            }

            const characterIds = raidRegisters.map((register) => register.character_id);
            const characters = await fetchCharactersByIds(characterIds);

            raidDetails.scheduled_at = scheduledRaid.scheduled_at;
            raidDetails.characters = await Promise.all(
                characters.map(async (character) => {
                    const characterRaidRegisters = raidRegisters.filter(
                        (register) => register.character_id === character.id
                    );

                    const raidRegistersCount = characterRaidRegisters.length;

                    const strikes = await fetchCharacterStrikes(character.id, raidId)

                    return {
                        ...character,
                        raid_registers_sum: raidRegistersCount,
                        strikes: strikes,
                    };
                })
            );

            setRaidDetails(raidDetails);
            setLoading(false);
        };

        fetchCompleteRaidDetails(raidId);
    }, [raidId])

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!raidDetails) {
        return <div>Raid not found.</div>;
    }

    return (
        <div>
            <h2>{raidDetails.name}</h2>
            <p>Scheduled at: {raidDetails.scheduled_at}</p>
            <h3>Characters:</h3>
            <ul>
                {raidDetails.characters.map((character) => (
                    <li key={character.id}>{character.name}, {character.class}, {character.main_spec}, {character.raid_registers_sum} {character.strikes.map((strike) => (<p key={strike.id}>, {strike.item}</p>))}</li>
                ))}
            </ul>
        </div>
    )
}

export default RaidOverview