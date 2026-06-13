import { useEffect, useState } from 'react';
import { getEmergencyScenarios } from '../lib/api';
import type { EmergencyScenario } from '../lib/types';
import { Zap, Loader2 } from 'lucide-react';

interface EmergencyChipsProps {
  onSelect: (scenario: string) => void;
  isLoading: boolean;
  activeScenario: string | null;
}

// Fallback hardcoded scenarios if API fails
const FALLBACK_SCENARIOS: EmergencyScenario[] = [
  { id: 'sick', label: "I'm Sick", emoji: "🤒", description: "ORS, medicines, light food" },
  { id: 'guests', label: "Guests Coming", emoji: "🎉", description: "Snacks, drinks, namkeen" },
  { id: 'out_of_staples', label: "Out of Staples", emoji: "🏠", description: "Milk, bread, eggs, dal" },
  { id: 'baby_emergency', label: "Baby Emergency", emoji: "👶", description: "Diapers, wipes, formula" },
  { id: 'power_cut', label: "Power Cut", emoji: "🔦", description: "Candles, water, ready-to-eat" },
];

export default function EmergencyChips({ onSelect, isLoading, activeScenario }: EmergencyChipsProps) {
  const [scenarios, setScenarios] = useState<EmergencyScenario[]>(FALLBACK_SCENARIOS);

  useEffect(() => {
    getEmergencyScenarios()
      .then(res => {
        if (res.scenarios && res.scenarios.length > 0) {
          setScenarios(res.scenarios);
        }
      })
      .catch(err => console.error("Failed to load emergency scenarios:", err));
  }, []);

  return (
    <section className="emergency-section">
      <div className="emergency-header">
        <Zap size={14} className="emergency-icon" />
        <span className="emergency-title">Emergency</span>
      </div>
      <div className="emergency-chips-scroll">
        <div className="emergency-chips">
          {scenarios.map(scenario => {
            const isActive = activeScenario === scenario.id;
            return (
              <button
                key={scenario.id}
                className={`emergency-chip ${isActive ? 'active' : ''} ${isActive && isLoading ? 'loading' : ''}`}
                onClick={() => onSelect(scenario.id)}
                disabled={isLoading && !isActive}
                aria-label={scenario.description}
                title={scenario.description}
              >
                <span className="emergency-chip-emoji">{scenario.emoji}</span>
                <span className="emergency-chip-label">{scenario.label}</span>
                {isActive && isLoading && <Loader2 size={12} className="spin emergency-spinner" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
