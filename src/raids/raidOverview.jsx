import * as React from "react";
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

            const fetchScheduledRaids = async (raidId) => {
                const { data: scheduledRaids, error } = await supabase
                    .from('scheduled_raids')
                    .select('scheduled_at')
                    .eq('raid_id', raidId);

                if (error) {
                    console.error('Error fetching scheduled raids:', error);
                    return [];
                }

                return scheduledRaids;
            };

            const fetchRaidRegisters = async (scheduledRaidId) => {
                const { data: raidRegisters, error } = await supabase
                    .from('raid_registers')
                    .select('*')
                    .eq('raid_id', scheduledRaidId);

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

            const fetchStrikesByRaidRegister = async (raidRegisterId) => {
                const { data: raidRegisterStrikes, error } = await supabase
                    .from('raid_register_strikes')
                    .select('strike_id')
                    .eq('raid_register_id', raidRegisterId);

                if (error) {
                    console.error('Error fetching raid_register_strikes:', error);
                    return [];
                }

                const strikeIds = raidRegisterStrikes.map((strike) => strike.strike_id);

                const { data: strikes, error: strikesError } = await supabase
                    .from('strikes')
                    .select('*')
                    .in('id', strikeIds);

                if (strikesError) {
                    console.error('Error fetching strikes:', strikesError);
                    return [];
                }

                return strikes;
            };

            const fetchScheduledRaidById = async (scheduledRaidId) => {
                const { data, error } = await supabase
                    .from('scheduled_raids')
                    .select('*')
                    .eq('id', scheduledRaidId);

                if (error) {
                    console.error('Error fetching scheduled raid:', error);
                    return null;
                }

                if (data.length === 0) {
                    console.error('Scheduled raid not found.');
                    return null;
                }

                return data[0];
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

            const scheduledRaids = await fetchScheduledRaids(raidId);

            if (!scheduledRaids) {
                setLoading(false);
                return;
            }

            raidDetails.scheduled_raids = scheduledRaids.map((scheduledRaid) => scheduledRaid.scheduled_at);

            const raidRegisters = await fetchRaidRegisters(raidId);

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

                    const raidRegistersData = await Promise.all(
                        characterRaidRegisters.map(async (register) => {
                            const scheduledRaid = await fetchScheduledRaidById(register.scheduled_raid_id);
                            const strikes = await fetchStrikesByRaidRegister(register.id);
                            return { ...register, scheduled_at: scheduledRaid ? scheduledRaid.scheduled_at : null, strikes };
                        })
                    );

                    return {
                        ...character,
                        raid_registers_sum: raidRegistersCount,
                        raid_registers_data: raidRegistersData
                    };
                })
            );

            setRaidDetails(raidDetails);
            console.log(raidDetails);
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
            <h1>Raid Overview</h1>
            <table>
                <thead>
                <tr>
                    <th>Character Name</th>
                    <th>Class / Main Spec / Off Spec</th>
                    <th>Attendance Items Ratio</th>
                </tr>
                </thead>
                <tbody>
                {raidDetails.characters.map((character) => (
                    <tr key={character.id}>
                        <td>{character.name}</td>
                        <td style={{ whiteSpace: 'pre-wrap' }}>
                            {`${character.class} / ${character.main_spec} / ${character.off_spec || ''}`}
                        </td>
                        <td>Attendance Items Ratio</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}

export default RaidOverview