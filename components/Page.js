import styles from './Page.module.css'

function Page({ children }) {
  return (
    <div className={styles.page}>
      {children}
    </div>
  )
}

Page.Header = function({ children }) {
  return (
    <header className={styles.header}>
      {children}
    </header>
  )
}

Page.Content = function({ children }) {
  return (
    <section className={styles.content}>
      {children}
    </section>
  )
}

export default Page
