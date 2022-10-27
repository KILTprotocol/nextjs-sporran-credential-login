import styles from './Page.module.css'

function Page({ children }) {
  return <div className={styles.page}>{children}</div>
}

Page.Header = function ({ children }) {
  return <header className={styles.header}>{children}</header>
}
//@ts-ignore
Page.Header.displayName = 'Page.Header'

Page.Content = function ({ children }) {
  return <section className={styles.content}>{children}</section>
}

//@ts-ignore
Page.Content.displayName = 'Page.Content'

export default Page
