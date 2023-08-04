import * as React from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from '../supabaseClient.js';
import "./raidOverview.css";
import Navbar from '../Navbar';
function RaidOverviewTable({ charactersByClass, scheduledRaids }) {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const raidId = searchParams.get("raidId");

    const calculateTotalStrikes = (character) => {
        let totalStrikes = 0;
        Object.values(character.raidRegistersWithAdditionalData).forEach((register) => {
            totalStrikes += register.strikes.length;
        });
        return totalStrikes;
    };

    const [showDialog, setShowDialog] = useState(false);

    // State to store the character ID for the clicked button
    const [selectedCharacterId, setSelectedCharacterId] = useState(null);
    const [scheduledRaidId, setScheduledRaidId] = useState(null);

    const [itemName, setItemName] = useState('');

    // Function to handle the click of the 'Add' button
    const handleAddClick = (characterId, scheduledRaidId) => {
        setSelectedCharacterId(characterId);
        setScheduledRaidId(scheduledRaidId);
        setShowDialog(true);
    };

    // Function to handle the close of the custom dialog
    const handleCloseDialog = () => {
        setShowDialog(false);
        setItemName(''); // Reset the item name input field
    };

    // Function to handle the create button click in the dialog
    const handleCreateClick = async () => {
        try {
            console.log('teast', selectedCharacterId, ',', scheduledRaidId)
            // Insert into 'strikes' table
            const { data: newStrike, error: strikeError } = await supabase
                .from("strikes")
                .upsert([
                    {
                        raid_id: raidId,
                        character_id: selectedCharacterId,
                        item: itemName,
                    },
                ])
                .select()
                .single();

            if (strikeError) {
                console.error("Error inserting strike:", strikeError.message);
                return;
            }

            console.log('Im in')
            console.log("New Strike:", newStrike);

            // Fetch 'raid_registers' by 'character_id' and 'scheduled_raid_id'
            const { data: raidRegistersData, error: raidRegistersError } = await supabase
                .from("raid_registers")
                .select("*")
                .eq("character_id", selectedCharacterId)
                .eq("scheduled_raid_id", scheduledRaidId);

            if (raidRegistersError) {
                console.error("Error fetching raid registers:", raidRegistersError.message);
                return;
            }

            console.log('Im in')
            // Get the ID of the fetched 'raid_registers'
            const raidRegisterId = raidRegistersData[0].id;

            // Insert into 'raid_register_strikes' with 'raid_register_id' and 'strike_id'
            const { error: raidRegisterStrikesError } = await supabase
                .from("raid_register_strikes")
                .insert([
                    {
                        raid_register_id: raidRegisterId,
                        strike_id: newStrike.id,
                    },
                ]);

            if (raidRegisterStrikesError) {
                console.error("Error inserting raid register strikes:", raidRegisterStrikesError.message);
                return;
            }

            // Close the dialog
            handleCloseDialog();
        } catch (error) {
            console.error("Error creating item:", error.message);
        }
    };

    // Render the table
    return (
        <div>
            <table>
                <thead>
                <tr>
                    <th>Player Name</th>
                    <th>Class</th>
                    <th>Details</th>
                    <th>Sum</th>
                    {scheduledRaids.map((scheduledRaid) => (
                        <th key={scheduledRaid.id}>{scheduledRaid.scheduled_at}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {Object.entries(charactersByClass).map(([className, characters]) => (
                    <React.Fragment key={className}>
                        {characters.map((character) => (
                            <tr key={character.id}>
                                <td className="table-cell-centered">{character.name}</td>
                                <td className="table-cell-centered">{character.class}</td>
                                <td className="table-cell-centered">Attendance<br />Items<br />Ratio</td>
                                <td className="table-cell-centered">{character.raidRegistersWithAdditionalData.length}<br />{calculateTotalStrikes(character)}<br />{calculateTotalStrikes(character) / character.raidRegistersWithAdditionalData.length}</td>
                                {scheduledRaids.map((scheduledRaid, index) => {
                                    const raidRegistersForRaid = character.raidRegistersWithAdditionalData.find(
                                        (data) => data.raidRegisters[0].scheduled_raid_id === scheduledRaid.id
                                    );
                                    if (raidRegistersForRaid) {
                                        return (
                                            <td key={scheduledRaid.id}>
                                                {raidRegistersForRaid.strikes.map((strike) => (
                                                    <React.Fragment key={strike.id}>
                                                        {strike.item}
                                                        <br/>
                                                    </React.Fragment>
                                                ))}
                                                {index === 0 && (
                                                    <button onClick={() => handleAddClick(character.id, scheduledRaid.id)}>Add</button>
                                                )}
                                            </td>
                                        );
                                    }
                                })}
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
            {showDialog && (
                <div className="modal-container">
                    <h3>Add Item</h3>
                    {/* Input field for item name */}
                    <input
                        type="text"
                        placeholder="Item Name"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                    />
                    {/* Create button */}
                    <button onClick={handleCreateClick} className="create-button">Create</button>
                    {/* Close button */}
                    <button onClick={handleCloseDialog} className="close-button">Close</button>
                </div>
            )}
        </div>
    );
}

function RaidOverview() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const raidId = searchParams.get("raidId");

    // State to store the fetched raid and scheduled raids data
    const [raid, setRaid] = useState(null);
    const [scheduledRaids, setScheduledRaids] = useState([]);
    const [charactersByClass, setCharactersByClass] = useState({});

    useEffect(() => {
        async function fetchRaidAndScheduledRaids() {
            try {
                // Fetch the raid data
                const { data: raidData, error: raidError } = await supabase
                    .from("raids")
                    .select("*")
                    .eq("id", raidId)
                    .single();

                if (raidError) {
                    console.error("Error fetching raid:", raidError.message);
                } else {
                    setRaid(raidData);
                    console.log('raid data:', raidData);
                }

                // Fetch the scheduled_raids data associated with the raid_id and order them by scheduled_at (newest to oldest)
                const { data: scheduledRaidsData, error: scheduledRaidsError } = await supabase
                    .from("scheduled_raids")
                    .select("*")
                    .eq("raid_id", raidId)
                    .order("scheduled_at", { ascending: false });

                if (scheduledRaidsError) {
                    console.error("Error fetching scheduled raids:", scheduledRaidsError.message);
                } else {
                    setScheduledRaids(scheduledRaidsData);
                    console.log('scheduled Raids:', scheduledRaidsData);
                }
            } catch (error) {
                console.error("Error fetching data:", error.message);
            }
        }

        if (raidId) {
            fetchRaidAndScheduledRaids();
        }
    }, [raidId]);

    // Function to fetch the additional data for all characters
    const fetchCharacterData = async (characters) => {
        const charactersWithAdditionalData = await Promise.all(
            characters.map(async (character) => {
                try {
                    // Fetch the raid_registers data associated with the raid_id and character_id
                    const { data: raidRegistersData, error: raidRegistersError } = await supabase
                        .from("raid_registers")
                        .select("*")
                        .eq("raid_id", raidId)
                        .eq("character_id", character.id);

                    if (raidRegistersError) {
                        console.error("Error fetching raid registers:", raidRegistersError.message);
                        return { ...character, raidRegistersWithAdditionalData: [] };
                    }

                    // Group character's raid registers by scheduled_raid_id
                    const groupedRaidRegisters = {};
                    raidRegistersData.forEach((register) => {
                        if (!groupedRaidRegisters[register.scheduled_raid_id]) {
                            groupedRaidRegisters[register.scheduled_raid_id] = [];
                        }
                        groupedRaidRegisters[register.scheduled_raid_id].push(register);
                    });

                    // Fetch raid_register_strikes and corresponding strikes for each raid register
                    const raidRegistersWithAdditionalData = await Promise.all(
                        Object.values(groupedRaidRegisters).map(async (raidRegisters) => {
                            const raidRegisterIds = raidRegisters.map((register) => register.id);

                            // Fetch raid_register_strikes data associated with the raid_register_ids
                            const { data: raidRegisterStrikesData, error: raidRegisterStrikesError } = await supabase
                                .from("raid_register_strikes")
                                .select("*")
                                .in("raid_register_id", raidRegisterIds);

                            if (raidRegisterStrikesError) {
                                console.error("Error fetching raid register strikes:", raidRegisterStrikesError.message);
                                return { raidRegisters, raidRegisterStrikes: [], strikes: [] };
                            }

                            // Fetch strikes data for each raid_register_strike
                            const strikeIds = raidRegisterStrikesData.map((strike) => strike.strike_id);
                            const { data: strikesData, error: strikesError } = await supabase
                                .from("strikes")
                                .select("*")
                                .in("id", strikeIds);

                            if (strikesError) {
                                console.error("Error fetching strikes:", strikesError.message);
                                return { raidRegisters, raidRegisterStrikes: raidRegisterStrikesData, strikes: [] };
                            }

                            return { raidRegisters, raidRegisterStrikes: raidRegisterStrikesData, strikes: strikesData };
                        })
                    );

                    return { ...character, raidRegistersWithAdditionalData };
                } catch (error) {
                    console.error("Error fetching character data:", error.message);
                    return { ...character, raidRegistersWithAdditionalData: [] };
                }
            })
        );

        const groupedCharacters = {};
        charactersWithAdditionalData.forEach((character) => {
            if (!groupedCharacters[character.class]) {
                groupedCharacters[character.class] = [];
            }
            groupedCharacters[character.class].push(character);
        });

        setCharactersByClass(groupedCharacters);
        console.log('grouped characters:', groupedCharacters);
    };

    useEffect(() => {
        // Check if characters are available for fetching additional data
        if (scheduledRaids.length > 0) {
            // Fetch all characters associated with the newest scheduled raid
            const newestScheduledRaidId = scheduledRaids[0].id;
            const fetchCharactersForRaid = async () => {
                try {
                    const { data: raidRegistersData, error: raidRegistersError } = await supabase
                        .from("raid_registers")
                        .select("character_id")
                        .eq("raid_id", raidId)
                        .eq("scheduled_raid_id", newestScheduledRaidId);

                    if (raidRegistersError) {
                        console.error("Error fetching raid registers for characters:", raidRegistersError.message);
                        return [];
                    }

                    const characterIds = raidRegistersData.map((register) => register.character_id);

                    // Fetch all characters associated with the character_ids
                    const { data: charactersData, error: charactersError } = await supabase
                        .from("characters")
                        .select("*")
                        .in("id", characterIds);

                    if (charactersError) {
                        console.error("Error fetching characters:", charactersError.message);
                        return [];
                    }

                    // Fetch additional data for all characters
                    fetchCharacterData(charactersData);
                } catch (error) {
                    console.error("Error fetching character data:", error.message);
                }
            };

            fetchCharactersForRaid();
        }
    }, [scheduledRaids, raidId]);

    // Render the component with the fetched raid, scheduled raids, and grouped characters data
    return (
        <div>
            <Navbar />
            {raid ? (
                <div>
                    <h2>{raid.name}</h2>
                    <p>Player Mode: {raid.player_mode}</p>
                    {/* Render other raid details as needed */}
                </div>
            ) : (
                <p>Loading...</p>
            )}

            {/* ... Rest of the code ... */}
            {Object.keys(charactersByClass).length > 0 && scheduledRaids.length > 0 ? (
                <RaidOverviewTable charactersByClass={charactersByClass} scheduledRaids={scheduledRaids} />
            ) : (
                <p>No characters found for the newest scheduled raid</p>
            )}
        </div>
    );
}

export default RaidOverview;
