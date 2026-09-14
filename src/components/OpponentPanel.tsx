interface Props {
  opponentName: string;
  score: number;
  onDelta: (delta: number) => void;
}

export function OpponentPanel({ opponentName, score, onDelta }: Props) {
  return (
    <section className="panel">
      <div className="panel__head">
        <span className="panel__label">Team · คู่แข่ง</span>
      </div>
      <h2 className="team-name opp">{opponentName}</h2>
      <div className="opp-score" style={{ marginTop: 12 }}>
        <div className="opp-score__big">{score}</div>
        <div className="opp-score__controls">
          <button className="opp-btn" onClick={() => onDelta(-1)}>
            −1
          </button>
          <button className="opp-btn" onClick={() => onDelta(1)}>
            +1
          </button>
        </div>
        <p className="opp-note">
          บันทึกเฉพาะคะแนนรวม · ฟาวล์ของเราจะบวกให้คู่แข่งอัตโนมัติ
        </p>
      </div>
    </section>
  );
}
