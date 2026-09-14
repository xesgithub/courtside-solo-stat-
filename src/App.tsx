import { useMemo } from 'react';
import { LivePage } from './components/LivePage';
import { createMockGame } from './lib/mock';

export default function App() {
  const mockGame = useMemo(() => createMockGame(), []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand__logo">◎</div>
          <div>
            <div className="brand__title">COURTSIDE</div>
            <div className="brand__sub">The Solo Stat Desk</div>
          </div>
        </div>
        <div className="header-spacer" />
        <span className="tag">เดโม UI · mock</span>
      </header>

      <LivePage initialGame={mockGame} />

      <div className="app-footer-note">
        เดโมหน้า Live — ยังไม่บันทึกถาวร (ต่อ localStorage ในขั้นถัดไป)
      </div>
    </div>
  );
}
