import styles from './Logo.module.css'

export default function Logo() {
  return (
    <div className={styles.container}>
      <img src="/kilt-logo.svg" className={styles.logo} />
      <h1 className={styles.heading}>Sign-in With Credentials</h1>
    </div>
  )
}
