import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Trophy, Calendar, Edit, Save, X, Plus, Minus, Crown, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Player, Team, FantasyTeam, Roster } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import TeamCreation from './TeamCreation';
import PlayerProfileModal from './PlayerProfileModal';
import toast from 'react-hot-toast';

interface PlayerWithTeam extends Player {
  team_name?: string;
  team_jersey?: string;
}

interface RosterPlayer extends Roster {
  player: PlayerWithTeam;
}

export default function MyTeam() {
  const { user } = useAuth();
  const [fantasyTeam, setFantasyTeam] = useState<FantasyTeam | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerWithTeam[]>([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [replacingRosterId, setReplacingRosterId] = useState<string | null>(null);
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<PlayerWithTeam | null>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);

  const TRANSFER_DEADLINE = new Date('2025-06-30');
  const canMakeChanges = new Date() <= TRANSFER_DEADLINE;

  useEffect(() => {
    if (user) {
      fetchFantasyTeam();
    }
  }, [user]);

  const fetchFantasyTeam = async () => {
    if (!user) return;

    try {
      // First check if user has a fantasy team
      const { data: teamData, error: teamError } = await supabase
        .from('fantasy_teams')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (teamError) {
        if (teamError.code === 'PGRST116') {
          // No team found - user needs to create one
          setFantasyTeam(null);
          setLoading(false);
          return;
        }
        throw teamError;
      }

      setFantasyTeam(teamData);

      // Fetch roster if team exists
      if (teamData) {
        await fetchRoster(teamData.fantasy_team_id);
      }
    } catch (error) {
      console.error('Error fetching fantasy team:', error);
      toast.error('Failed to fetch your team');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoster = async (fantasyTeamId: string) => {
    try {
      const { data, error } = await supabase
        .from('rosters')
        .select(`
          *,
          player:player_id (
            *,
            teams:team_id (
              name,
              jersey
            )
          )
        `)
        .eq('fantasy_team_id', fantasyTeamId)
        .order('squad_position');

      if (error) throw error;

      const rosterWithTeamNames = data?.map(rosterItem => ({
        ...rosterItem,
        player: {
          ...rosterItem.player,
          team_name: rosterItem.player?.teams?.name,
          team_jersey: rosterItem.player?.teams?.jersey
        }
      })) || [];

      setRoster(rosterWithTeamNames);
    } catch (error) {
      console.error('Error fetching roster:', error);
      toast.error('Failed to fetch roster');
    }
  };

  const fetchAvailablePlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          teams:team_id (
            name,
            jersey
          )
        `)
        .order('name');

      if (error) throw error;

      const playersWithTeamNames = data?.map(player => ({
        ...player,
        team_name: player.teams?.name,
        team_jersey: player.teams?.jersey
      })) || [];

      setAvailablePlayers(playersWithTeamNames);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to fetch players');
    }
  };

  const getPlayersByPosition = (position: string, isStarter: boolean) => {
    return roster.filter(r => 
      r.player?.position === position && 
      r.is_starter === isStarter
    );
  };

  const getFormationCounts = () => {
    const starters = roster.filter(r => r.is_starter);
    return {
      defenders: starters.filter(r => r.player?.position === 'DEF').length,
      midfielders: starters.filter(r => r.player?.position === 'MID').length,
      forwards: starters.filter(r => r.player?.position === 'FWD').length,
    };
  };

  const handlePlayerReplace = async (rosterId: string, newPlayerId: string) => {
    try {
      const { error } = await supabase
        .from('rosters')
        .update({ player_id: newPlayerId })
        .eq('roster_id', rosterId);

      if (error) throw error;

      toast.success('Player replaced successfully');
      if (fantasyTeam) {
        await fetchRoster(fantasyTeam.fantasy_team_id);
      }
      setShowPlayerModal(false);
      setReplacingRosterId(null);
    } catch (error) {
      console.error('Error replacing player:', error);
      toast.error('Failed to replace player');
    }
  };

  const setCaptain = async (rosterId: string) => {
    try {
      // Remove captain from all players
      await supabase
        .from('rosters')
        .update({ is_captain: false })
        .eq('fantasy_team_id', fantasyTeam?.fantasy_team_id);

      // Set new captain
      const { error } = await supabase
        .from('rosters')
        .update({ is_captain: true })
        .eq('roster_id', rosterId);

      if (error) throw error;

      toast.success('Captain updated');
      if (fantasyTeam) {
        await fetchRoster(fantasyTeam.fantasy_team_id);
      }
    } catch (error) {
      console.error('Error setting captain:', error);
      toast.error('Failed to set captain');
    }
  };

  const setViceCaptain = async (rosterId: string) => {
    try {
      // Remove vice captain from all players
      await supabase
        .from('rosters')
        .update({ is_vice_captain: false })
        .eq('fantasy_team_id', fantasyTeam?.fantasy_team_id);

      // Set new vice captain
      const { error } = await supabase
        .from('rosters')
        .update({ is_vice_captain: true })
        .eq('roster_id', rosterId);

      if (error) throw error;

      toast.success('Vice captain updated');
      if (fantasyTeam) {
        await fetchRoster(fantasyTeam.fantasy_team_id);
      }
    } catch (error) {
      console.error('Error setting vice captain:', error);
      toast.error('Failed to set vice captain');
    }
  };

  const handlePlayerClick = (player: PlayerWithTeam) => {
    setSelectedPlayerForProfile(player);
    setShowPlayerProfile(true);
  };

  const handleTeamCreated = () => {
    // Refresh the team data after creation
    fetchFantasyTeam();
  };

  const openPlayerModal = (rosterId: string, position: string) => {
    setReplacingRosterId(rosterId);
    setSelectedPosition(position);
    setShowPlayerModal(true);
  };

  const closePlayerModal = () => {
    setShowPlayerModal(false);
    setReplacingRosterId(null);
    setSelectedPosition('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // If user doesn't have a fantasy team, show team creation
  if (!fantasyTeam) {
    return <TeamCreation onTeamCreated={handleTeamCreated} />;
  }

  const formation = getFormationCounts();
  const starters = roster.filter(r => r.is_starter);
  const bench = roster.filter(r => !r.is_starter);
  const captain = roster.find(r => r.is_captain);
  const viceCaptain = roster.find(r => r.is_vice_captain);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Team Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{fantasyTeam.team_name}</h1>
            <p className="text-gray-600">Your Fantasy Soccer Team</p>
          </div>
          <div className="flex items-center space-x-4">
            {canMakeChanges && (
              <button
                onClick={() => {
                  setEditMode(!editMode);
                  if (!editMode) {
                    fetchAvailablePlayers();
                  }
                }}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  editMode 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {editMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Team
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-emerald-600 mr-2" />
              <div>
                <p className="text-sm text-emerald-600">Total Points</p>
                <p className="text-lg font-semibold text-emerald-900">{fantasyTeam.total_points}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">This Gameweek</p>
                <p className="text-lg font-semibold text-blue-900">{fantasyTeam.gameweek_points}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-purple-600">Budget Left</p>
                <p className="text-lg font-semibold text-purple-900">£{fantasyTeam.budget_remaining}M</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm text-orange-600">Rank</p>
                <p className="text-lg font-semibold text-orange-900">#{fantasyTeam.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {!canMakeChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Transfer deadline has passed. You can no longer make changes to your team.
            </p>
          </div>
        )}
      </div>

      {/* Formation and Pitch */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Formation: {formation.defenders}-{formation.midfielders}-{formation.forwards}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {captain && (
              <div className="flex items-center">
                <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                Captain: {captain.player?.name}
              </div>
            )}
            {viceCaptain && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-gray-500 mr-1" />
                Vice: {viceCaptain.player?.name}
              </div>
            )}
          </div>
        </div>

        {/* Soccer Pitch */}
        <div 
          className="relative rounded-lg min-h-[600px] bg-cover bg-center bg-no-repeat p-8"
          style={{
            backgroundImage: `url('https://i.imgur.com/x6NH58g.png')`,
            backgroundSize: 'cover'
          }}
        >
          {/* Starting XI */}
          <div className="relative h-full flex flex-col justify-between py-8">
            {/* Goalkeeper */}
            <div className="flex justify-center mb-8">
              {getPlayersByPosition('GK', true).map((rosterPlayer) => (
                <PlayerCard
                  key={rosterPlayer.roster_id}
                  rosterPlayer={rosterPlayer}
                  editMode={editMode}
                  onReplace={() => openPlayerModal(rosterPlayer.roster_id, 'GK')}
                  onSetCaptain={() => setCaptain(rosterPlayer.roster_id)}
                  onSetViceCaptain={() => setViceCaptain(rosterPlayer.roster_id)}
                  onPlayerClick={() => handlePlayerClick(rosterPlayer.player)}
                />
              ))}
            </div>

            {/* Defenders */}
            <div className="flex justify-center space-x-6 mb-8">
              {getPlayersByPosition('DEF', true).map((rosterPlayer) => (
                <PlayerCard
                  key={rosterPlayer.roster_id}
                  rosterPlayer={rosterPlayer}
                  editMode={editMode}
                  onReplace={() => openPlayerModal(rosterPlayer.roster_id, 'DEF')}
                  onSetCaptain={() => setCaptain(rosterPlayer.roster_id)}
                  onSetViceCaptain={() => setViceCaptain(rosterPlayer.roster_id)}
                  onPlayerClick={() => handlePlayerClick(rosterPlayer.player)}
                />
              ))}
            </div>

            {/* Midfielders */}
            <div className="flex justify-center space-x-6 mb-8">
              {getPlayersByPosition('MID', true).map((rosterPlayer) => (
                <PlayerCard
                  key={rosterPlayer.roster_id}
                  rosterPlayer={rosterPlayer}
                  editMode={editMode}
                  onReplace={() => openPlayerModal(rosterPlayer.roster_id, 'MID')}
                  onSetCaptain={() => setCaptain(rosterPlayer.roster_id)}
                  onSetViceCaptain={() => setViceCaptain(rosterPlayer.roster_id)}
                  onPlayerClick={() => handlePlayerClick(rosterPlayer.player)}
                />
              ))}
            </div>

            {/* Forwards */}
            <div className="flex justify-center space-x-6">
              {getPlayersByPosition('FWD', true).map((rosterPlayer) => (
                <PlayerCard
                  key={rosterPlayer.roster_id}
                  rosterPlayer={rosterPlayer}
                  editMode={editMode}
                  onReplace={() => openPlayerModal(rosterPlayer.roster_id, 'FWD')}
                  onSetCaptain={() => setCaptain(rosterPlayer.roster_id)}
                  onSetViceCaptain={() => setViceCaptain(rosterPlayer.roster_id)}
                  onPlayerClick={() => handlePlayerClick(rosterPlayer.player)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bench */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Substitutes</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {bench.map((rosterPlayer) => (
            <div key={rosterPlayer.roster_id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col items-center">
                {/* Jersey Image */}
                <div 
                  className="w-16 h-16 mb-1 relative cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => handlePlayerClick(rosterPlayer.player)}
                >
                  {rosterPlayer.player?.team_jersey ? (
                    <img
                      src={rosterPlayer.player.team_jersey}
                      alt={`${rosterPlayer.player?.team_name} jersey`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full bg-gray-300 rounded-lg flex items-center justify-center ${
                      rosterPlayer.player?.team_jersey ? 'hidden' : 'flex'
                    }`}
                  >
                    <span className="text-xs text-gray-500">No Jersey</span>
                  </div>
                  
                  {/* Captain/Vice Captain badges */}
                  {rosterPlayer.is_captain && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-1">
                      <Crown className="h-3 w-3" />
                    </div>
                  )}
                  {rosterPlayer.is_vice_captain && (
                    <div className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full p-1">
                      <Star className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="text-center">
                  <div 
                    className="font-medium text-gray-900 text-sm mb-1 cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={() => handlePlayerClick(rosterPlayer.player)}
                  >
                    {rosterPlayer.player?.name}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">£{rosterPlayer.player?.price}M</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    rosterPlayer.player?.position === 'GK' ? 'bg-purple-100 text-purple-800' :
                    rosterPlayer.player?.position === 'DEF' ? 'bg-blue-100 text-blue-800' :
                    rosterPlayer.player?.position === 'MID' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {rosterPlayer.player?.position}
                  </span>
                </div>

                {editMode && canMakeChanges && (
                  <button
                    onClick={() => openPlayerModal(rosterPlayer.roster_id, rosterPlayer.player?.position || '')}
                    className="mt-2 text-emerald-600 hover:text-emerald-700 text-xs"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Replacement Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Replace {selectedPosition} Player</h3>
              <button onClick={closePlayerModal}>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availablePlayers
                .filter(player => player.position === selectedPosition)
                .map((player) => (
                  <div key={player.player_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12">
                        {player.team_jersey ? (
                          <img
                            src={player.team_jersey}
                            alt={`${player.team_name} jersey`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Jersey</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-500">{player.team_name} • £{player.price}M</div>
                      </div>
                    </div>
                    <button
                      onClick={() => replacingRosterId && handlePlayerReplace(replacingRosterId, player.player_id)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Player Profile Modal */}
      {showPlayerProfile && selectedPlayerForProfile && (
        <PlayerProfileModal
          player={selectedPlayerForProfile}
          onClose={() => {
            setShowPlayerProfile(false);
            setSelectedPlayerForProfile(null);
          }}
        />
      )}
    </div>
  );
}

// Player Card Component
interface PlayerCardProps {
  rosterPlayer: RosterPlayer;
  editMode: boolean;
  onReplace: () => void;
  onSetCaptain: () => void;
  onSetViceCaptain: () => void;
  onPlayerClick: () => void;
}

function PlayerCard({ rosterPlayer, editMode, onReplace, onSetCaptain, onSetViceCaptain, onPlayerClick }: PlayerCardProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Jersey Image */}
      <div 
        className="w-60 h-60 relative cursor-pointer hover:scale-105 transition-transform"
        onClick={onPlayerClick}
      >
        {rosterPlayer.player?.team_jersey ? (
          <img
            src={rosterPlayer.player.team_jersey}
            alt={`${rosterPlayer.player?.team_name} jersey`}
            className="w-full h-full object-contain drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full bg-white rounded-lg flex items-center justify-center shadow-lg ${
            rosterPlayer.player?.team_jersey ? 'hidden' : 'flex'
          }`}
        >
          <span className="text-xs text-gray-500">No Jersey</span>
        </div>
        
        {/* Captain/Vice Captain badges */}
        {rosterPlayer.is_captain && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1 shadow-lg">
            <Crown className="h-4 w-4" />
          </div>
        )}
        {rosterPlayer.is_vice_captain && (
          <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-1 shadow-lg">
            <Star className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Player Info Card - Very close to jersey */}
      <div 
        className="bg-white rounded-lg shadow-lg p-1 min-w-[180px] text-center -mt-1 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onPlayerClick}
      >
        <div className="font-semibold text-base text-gray-900 truncate px-1">
          {rosterPlayer.player?.name}
        </div>
        <div className="text-sm font-medium text-gray-700">
          £{rosterPlayer.player?.price}M
        </div>
      </div>

      {editMode && (
        <div className="mt-2 flex space-x-1">
          <button
            onClick={onReplace}
            className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs hover:bg-emerald-200"
          >
            Replace
          </button>
          <button
            onClick={onSetCaptain}
            className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs hover:bg-yellow-200"
          >
            C
          </button>
          <button
            onClick={onSetViceCaptain}
            className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200"
          >
            VC
          </button>
        </div>
      )}
    </div>
  );
}