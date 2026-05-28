import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◫' },
  { to: '/training', label: 'Training', icon: '⊞' },
  { to: '/meetings/new', label: 'New Meeting', icon: '＋' },
  { to: '/meetings', label: 'History', icon: '☰' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        AI Execution Pocket
        <span className={styles.brandSub}>v1.1.0 — Zachary</span>
      </div>

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
          }
        >
          <span className={styles.navIcon}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      <div className={styles.storageInfo}>
        Local Storage
        <div className={styles.storageBar}>
          <div className={styles.storageFill} style={{ width: '12%' }} />
        </div>
      </div>
    </aside>
  );
}
