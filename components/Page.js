import styles from './Page.module.css'

export default function Page({ children }) {

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {children}
      </div>
    </div>
  )
}
