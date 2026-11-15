import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  ArrowDownLeft,
  ArrowUpRight,
  LoaderCircle,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react'
import './App.css'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function App() {
  const [transactions, setTransactions] = useState([])
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadTransactions() {
      try {
        const response = await axios.get('/api/transactions')
        if (active) setTransactions(response.data)
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.error || 'Could not load transactions. Check that the backend is running.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadTransactions()
    return () => {
      active = false
    }
  }, [])

  const totals = useMemo(() => transactions.reduce(
    (result, transaction) => {
      if (transaction.type === 'income') result.income += transaction.amount
      else result.expenses += transaction.amount
      return result
    },
    { income: 0, expenses: 0 },
  ), [transactions])

  const balance = totals.income - totals.expenses

  async function addTransaction(event) {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!text.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return

    setIsSaving(true)
    setError('')
    try {
      const response = await axios.post('/api/transactions', {
        text: text.trim(),
        amount: numericAmount,
        type,
      })
      setTransactions((current) => [response.data, ...current])
      setText('')
      setAmount('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not add this transaction. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteTransaction(id) {
    setDeletingId(id)
    setError('')
    try {
      await axios.delete(`/api/transactions/${id}`)
      setTransactions((current) => current.filter((transaction) => transaction._id !== id))
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not delete this transaction. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="PaiseWise home">
          <span className="brand-mark"><Wallet size={19} strokeWidth={2.2} /></span>
          <span>PaiseWise</span>
        </a>
        <span className="topbar-note">Your money, in perspective</span>
      </header>

      <section className="intro">
        <p className="eyebrow">PERSONAL FINANCE</p>
        <h1>Know where it goes.</h1>
        <p className="intro-copy">A clearer picture of your money starts with the little things.</p>
      </section>

      <section className="summary-grid" aria-label="Your financial summary">
        <article className="summary-card balance-card">
          <div className="summary-label"><span>Current balance</span><Wallet size={18} /></div>
          <p className="summary-value">{currency.format(balance)}</p>
          <p className="summary-hint">Income minus expenses</p>
        </article>
        <article className="summary-card">
          <div className="summary-label"><span>Total income</span><span className="summary-icon income-icon"><ArrowDownLeft size={17} /></span></div>
          <p className="summary-value">{currency.format(totals.income)}</p>
          <p className="summary-hint">Money in</p>
        </article>
        <article className="summary-card">
          <div className="summary-label"><span>Total expenses</span><span className="summary-icon expense-icon"><ArrowUpRight size={17} /></span></div>
          <p className="summary-value">{currency.format(totals.expenses)}</p>
          <p className="summary-hint">Money out</p>
        </article>
      </section>

      <div className="content-grid">
        <section className="panel transactions-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ACTIVITY</p>
              <h2>Recent transactions</h2>
            </div>
            <span className="transaction-count">{transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}</span>
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}

          {isLoading ? (
            <div className="empty-state"><LoaderCircle className="loading-icon" size={24} /><p>Loading your transactions…</p></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Wallet size={22} /></span>
              <h3>No transactions yet</h3>
              <p>Add your first income or expense to see your finances take shape.</p>
            </div>
          ) : (
            <ul className="transaction-list">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === 'income'
                return (
                  <li className="transaction-row" key={transaction._id}>
                    <span className={`transaction-icon ${isIncome ? 'income-icon' : 'expense-icon'}`}>
                      {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </span>
                    <span className="transaction-details">
                      <span className="transaction-name">{transaction.text}</span>
                      <span className="transaction-date">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                    <span className={`transaction-amount ${isIncome ? 'positive' : ''}`}>
                      {isIncome ? '+' : '−'}{currency.format(transaction.amount)}
                    </span>
                    <button
                      className="delete-button"
                      type="button"
                      aria-label={`Delete ${transaction.text}`}
                      disabled={deletingId === transaction._id}
                      onClick={() => deleteTransaction(transaction._id)}
                    >
                      {deletingId === transaction._id
                        ? <LoaderCircle className="loading-icon" size={17} />
                        : <Trash2 size={17} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEW ENTRY</p>
              <h2>Add a transaction</h2>
            </div>
            <span className="add-icon"><Plus size={19} /></span>
          </div>

          <form className="transaction-form" onSubmit={addTransaction}>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              placeholder="e.g. Monthly salary"
              maxLength={120}
              value={text}
              onChange={(event) => setText(event.target.value)}
              required
            />

            <label htmlFor="amount">Amount</label>
            <div className="amount-input">
              <span aria-hidden="true">₹</span>
              <input
                id="amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <label htmlFor="type">Transaction type</label>
            <select id="type" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <button className="submit-button" type="submit" disabled={isSaving}>
              {isSaving ? <LoaderCircle className="loading-icon" size={18} /> : <Plus size={18} />}
              {isSaving ? 'Adding…' : 'Add transaction'}
            </button>
          </form>
          <p className="form-footnote">Amounts are entered in Indian rupees.</p>
        </section>
      </div>

      <footer className="footer">Small steps make a big difference.</footer>
    </main>
  )
}

export default App
