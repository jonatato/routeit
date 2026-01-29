import { useState, useEffect } from 'react';
import { UserPlus, Settings, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { listCollaborators } from '../../services/sharing';

interface Collaborator {
  id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  has_accepted: boolean;
  is_pending: boolean;
}

interface CollaboratorsWidgetProps {
  itineraryId: string;
  currentUserId: string;
  onInvite?: () => void;
  onManagePermissions?: () => void;
}

export function CollaboratorsWidget({
  itineraryId,
  currentUserId,
  onInvite,
  onManagePermissions,
}: CollaboratorsWidgetProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollaborators();
  }, [itineraryId]);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const data = await listCollaborators(itineraryId);
      setCollaborators(data);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'editor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'viewer':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return '';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      owner: 'Propietario',
      editor: 'Editor',
      viewer: 'Visor',
    };
    return labels[role as keyof typeof labels] || role;
  };

  // Mock online status (would need real-time implementation)
  const getOnlineStatus = () => Math.random() > 0.5;

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            Colaboradores
            <span className="text-muted-foreground">({collaborators.length})</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Collaborators List */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {collaborators.map((collab) => {
            const isOnline = getOnlineStatus();
            
            return (
              <div key={collab.id} className="flex items-start gap-3 rounded-lg border border-border p-2 transition-colors hover:bg-muted/30">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-xs font-semibold text-white">
                    {getInitials(collab.email)}
                  </div>
                  {/* Online Status Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <Circle
                      className={`h-3 w-3 ${
                        isOnline
                          ? 'fill-emerald-500 text-emerald-500'
                          : 'fill-gray-400 text-gray-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {collab.email.split('@')[0]}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {collab.email}
                      </div>
                    </div>
                  </div>
                  
                  {/* Role and Status */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${getRoleBadgeColor(collab.role)}`}>
                      {getRoleLabel(collab.role)}
                    </span>
                    {collab.is_pending && (
                      <span className="rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pendiente
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {collaborators.length === 0 && (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">👥</div>
            <div className="text-sm text-muted-foreground">
              No hay colaboradores aún
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            onClick={onInvite}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar
          </Button>
          {onManagePermissions && (
            <Button
              onClick={onManagePermissions}
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
