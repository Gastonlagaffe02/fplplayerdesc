import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

interface Team {
  team_id: string;
  name: string;
  short_name: string;
  logo_url: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamLogos, setShowTeamLogos] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();
  
  // Don't show header on auth pages
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // You'll need to import your Supabase client here
        // import { supabase } from '../lib/supabase';
        
        // const { data, error } = await supabase
        //   .from('teams')
        //   .select('team_id, name, short_name, logo_url')
        //   .order('name');
        
        // if (error) throw error;
        // setTeams(data || []);
        
        // For now, using mock data - replace with actual Supabase call
        const mockTeams: Team[] = [
          { team_id: '1', name: 'Esperance Tunis', short_name: 'EST', logo_url: '/logos/est.png' },
          { team_id: '2', name: 'Club Africain', short_name: 'CA', logo_url: '/logos/ca.png' },
          { team_id: '3', name: 'Etoile Sahel', short_name: 'ESS', logo_url: '/logos/ess.png' },
          // Add more teams as needed
        ];
        setTeams(mockTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    fetchTeams();
  }, []);

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/teams': return 'Teams';
      case '/players': return 'Players';
      case '/users': return 'Users';
      case '/leagues': return 'Leagues';
      case '/matches': return 'Matches';
      case '/simulation': return 'Match Simulation';
      case '/my-team': return 'My Team';
      case '/fixtures': return 'Fixtures';
      default: return '';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-md p-1 mr-2"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Team Logos Section */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setShowTeamLogos(!showTeamLogos)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <span>Teams</span>
              <svg className={`h-4 w-4 transition-transform ${showTeamLogos ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showTeamLogos && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  All Teams
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {teams.map((team) => (
                      <div
                        key={team.team_id}
                        className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                        title={team.name}
                      >
                        <div className="w-8 h-8 mb-1 flex items-center justify-center">
                          {team.logo_url ? (
                            <img
                              src={team.logo_url}
                              alt={`${team.name} logo`}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs ${team.logo_url ? 'hidden' : ''}`}>
                            {team.short_name}
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 text-center truncate w-full">
                          {team.short_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Team Logos Bar (always visible on larger screens) */}
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-lg">
            {teams.slice(0, 6).map((team) => (
              <div
                key={team.team_id}
                className="w-6 h-6 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                title={team.name}
              >
                {team.logo_url ? (
                  <img
                    src={team.logo_url}
                    alt={`${team.name} logo`}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs ${team.logo_url ? 'hidden' : ''}`}>
                  {team.short_name.charAt(0)}
                </div>
              </div>
            ))}
            {teams.length > 6 && (
              <button
                onClick={() => setShowTeamLogos(!showTeamLogos)}
                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors text-xs font-medium"
              >
                +{teams.length - 6}
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="hidden md:block pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url as string}
                  alt={userName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                  {userInitial}
                </div>
              )}
              <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                {userName}
              </span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}