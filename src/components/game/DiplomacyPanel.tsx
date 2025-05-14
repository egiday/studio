
'use client';

import type { RivalMovement, DiplomaticStance } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Handshake, Swords, Shield, Zap } from 'lucide-react'; // Zap for generic action
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DiplomacyPanelProps {
  rivalMovements: RivalMovement[];
  onDiplomaticAction: (rivalId: string, newStance: DiplomaticStance) => void;
  influencePoints: number; // To check for costs later
}

const STANCE_CHANGE_COST = 10; // Example cost

export function DiplomacyPanel({ rivalMovements, onDiplomaticAction, influencePoints }: DiplomacyPanelProps) {
  const getStanceBadgeVariant = (stance: DiplomaticStance): "default" | "secondary" | "destructive" => {
    switch (stance) {
      case 'Allied': return 'default'; // Primary/Greenish
      case 'Neutral': return 'secondary'; // Bluish
      case 'Hostile': return 'destructive'; // Reddish
      default: return 'secondary';
    }
  };

  const getStanceIcon = (stance: DiplomaticStance) => {
    switch (stance) {
      case 'Allied': return <Handshake className="h-4 w-4" />;
      case 'Neutral': return <Shield className="h-4 w-4" />;
      case 'Hostile': return <Swords className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Handshake className="mr-2 h-6 w-6 text-primary" />
          Diplomacy & Relations
        </CardTitle>
        <CardDescription>Manage your relationships with rival cultural movements.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rivalMovements.length === 0 && (
          <p className="text-sm text-muted-foreground">No rival movements detected yet.</p>
        )}
        {rivalMovements.map((rival) => (
          <div key={rival.id} className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <rival.icon className="h-6 w-6" style={{ color: rival.color }} />
                <span className="text-lg font-semibold" style={{ color: rival.color }}>{rival.name}</span>
              </div>
              <Badge variant={getStanceBadgeVariant(rival.playerStance)} className="flex items-center space-x-1.5 px-3 py-1">
                {getStanceIcon(rival.playerStance)}
                <span>{rival.playerStance}</span>
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Personality: {rival.personality} | Aggressiveness: {(rival.aggressiveness * 100).toFixed(0)}%
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              {rival.playerStance === 'Hostile' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDiplomaticAction(rival.id, 'Neutral')}
                  disabled={influencePoints < STANCE_CHANGE_COST}
                  title={`Cost: ${STANCE_CHANGE_COST} IP`}
                >
                  <Shield className="mr-2 h-4 w-4" /> Attempt Truce
                </Button>
              )}
              {rival.playerStance === 'Neutral' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                    onClick={() => onDiplomaticAction(rival.id, 'Allied')}
                    disabled={influencePoints < STANCE_CHANGE_COST}
                    title={`Cost: ${STANCE_CHANGE_COST} IP`}
                  >
                    <Handshake className="mr-2 h-4 w-4" /> Propose Alliance
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                     className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => onDiplomaticAction(rival.id, 'Hostile')}
                    disabled={influencePoints < STANCE_CHANGE_COST}
                    title={`Cost: ${STANCE_CHANGE_COST} IP`}
                  >
                    <Swords className="mr-2 h-4 w-4" /> Adopt Hostile Stance
                  </Button>
                </>
              )}
              {rival.playerStance === 'Allied' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-500 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
                  onClick={() => onDiplomaticAction(rival.id, 'Neutral')}
                  disabled={influencePoints < STANCE_CHANGE_COST}
                  title={`Cost: ${STANCE_CHANGE_COST} IP`}
                >
                  <Shield className="mr-2 h-4 w-4" /> Dissolve Alliance
                </Button>
              )}
            </div>
            {influencePoints < STANCE_CHANGE_COST && rival.playerStance !== 'Allied' && (
                 <p className="text-xs text-destructive text-center">Not enough IP to change stance.</p>
            )}
             {influencePoints < STANCE_CHANGE_COST && rival.playerStance === 'Allied' && (
                 <p className="text-xs text-destructive text-center">Not enough IP to dissolve alliance.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
