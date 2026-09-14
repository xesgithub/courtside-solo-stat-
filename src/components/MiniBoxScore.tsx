import type { Player } from '../types';
import type { BoxScore } from '../lib/stats';

interface Props {
  players: Player[];
  box: BoxScore;
}

export function MiniBoxScore({ players, box }: Props) {
  const nameById = new Map(players.map((p) => [p.id, p]));
  return (
    <section className="panel mini-box">
      <div className="panel__head">
        <span className="panel__label">Box score · เรียลไทม์</span>
      </div>
      <table>
        <thead>
          <tr>
            <th className="name">ผู้เล่น</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>STL</th>
            <th>BLK</th>
            <th>TO</th>
            <th>PF</th>
          </tr>
        </thead>
        <tbody>
          {box.lines.map((l) => {
            const p = nameById.get(l.playerId);
            return (
              <tr key={l.playerId}>
                <td className="name">
                  #{p?.number} {p?.name}
                </td>
                <td>{l.pts}</td>
                <td>{l.reb}</td>
                <td>{l.ast}</td>
                <td>{l.stl}</td>
                <td>{l.blk}</td>
                <td>{l.to}</td>
                <td>{l.pf}</td>
              </tr>
            );
          })}
          {(box.teamLine.ast > 0 || box.teamLine.reb > 0) && (
            <tr>
              <td className="name">ทีม (ไม่ระบุตัว)</td>
              <td>{box.teamLine.pts}</td>
              <td>{box.teamLine.reb}</td>
              <td>{box.teamLine.ast}</td>
              <td>{box.teamLine.stl}</td>
              <td>{box.teamLine.blk}</td>
              <td>{box.teamLine.to}</td>
              <td>{box.teamLine.pf}</td>
            </tr>
          )}
          <tr className="totals">
            <td className="name">รวม</td>
            <td>{box.totals.pts}</td>
            <td>{box.totals.reb}</td>
            <td>{box.totals.ast}</td>
            <td>{box.totals.stl}</td>
            <td>{box.totals.blk}</td>
            <td>{box.totals.to}</td>
            <td>{box.totals.pf}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
