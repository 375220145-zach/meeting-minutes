import styles from './Header.module.css';

interface Props {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
}

export function Header({ title, breadcrumb, actions }: Props) {
  return (
    <div className={styles.header}>
      <div>
        {breadcrumb && <div className={styles.breadcrumb}>{breadcrumb}</div>}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
