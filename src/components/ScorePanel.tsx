interface Props {
  teamName: string;
  teamScore: number;
  opponentName: string;
  opponentScore: number;
  onTeamDelta: (delta: number) => void;
  onOpponentDelta: (delta: number) => void;
}

export function ScorePanel({
  teamName,
  teamScore,
  opponentName,
  opponentScore,
  onTeamDelta,
  onOpponentDelta,
}: Props) {
  return (
    <div className="score-panel">
      {/* ทีมเรา */}
      <div className="score-panel__side">
        <div className="score-panel__name team">{teamName}</div>
        <div className="score-panel__score-box team">
          <button
            className="adj-btn team"
            onClick={() => onTeamDelta(-1)}
            aria-label="ทีมเรา −1"
          >
            −
          </button>
          <span className="score-panel__score team">{teamScore}</span>
          <button
            className="adj-btn adj-btn--plus team"
            onClick={() => onTeamDelta(1)}
            aria-label="ทีมเรา +1"
          >
            +
          </button>
        </div>
      </div>

      <div className="score-panel__vs">VS</div>

      {/* คู่แข่ง */}
      <div className="score-panel__side">
        <div className="score-panel__name opp">{opponentName}</div>
        <div className="score-panel__score-box opp">
          <button
            className="adj-btn opp"
            onClick={() => onOpponentDelta(-1)}
            aria-label="คู่แข่ง −1"
          >
            −
          </button>
          <span className="score-panel__score opp">{opponentScore}</span>
          <button
            className="adj-btn adj-btn--plus opp"
            onClick={() => onOpponentDelta(1)}
            aria-label="คู่แข่ง +1"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
