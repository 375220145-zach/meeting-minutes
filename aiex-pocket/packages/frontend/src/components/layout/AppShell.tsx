import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import styles from './AppShell.module.css';

const navItems = [
  { to: '/', label: 'Home', icon: '◫' },
  { to: '/training', label: 'Train', icon: '⊞' },
  { to: '/meetings/new', label: 'New', icon: '＋' },
  { to: '/meetings', label: 'History', icon: '☰' },
  { to: '/settings', label: 'Setting', icon: '⚙' },
];

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{children}</main>

      <nav className={styles.bottomBar}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.bottomBarItem} ${isActive ? styles.bottomBarItemActive : ''}`
            }
          >
            <span className={styles.bottomBarIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
