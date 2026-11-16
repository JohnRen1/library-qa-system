import { FormEvent, useEffect, useRef, useState } from 'react'
import { questions } from '../../shared/questions'
import { formatDuration, loadStoredRows, maskPhone, saveRows, validPhone } from '../../shared/records'
import type { RecordRow } from '../../shared/types'

type Screen = 'intro' | 'quiz' | 'result'

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M11.5 3.5 6 9l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.2 6.4 11l6.1-6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [seconds, setSeconds] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [result, setResult] = useState<RecordRow | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const current = questions[index]
  const answered = selected !== null
  const correct = answered && selected === current.answer

  useEffect(() => {
    if (screen !== 'quiz') return
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [screen, startedAt])

  useEffect(() => {
    if (screen !== 'quiz') return
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [screen])

  function start(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('请填写姓名')
      nameRef.current?.focus()
      return
    }
    if (!validPhone(phone)) {
      setError('请输入有效的 11 位手机号')
      phoneRef.current?.focus()
      return
    }
    setError('')
    setAnswers([])
    setIndex(0)
    setSelected(null)
    setResult(null)
    setStartedAt(Date.now())
    setSeconds(0)
    setScreen('quiz')
  }

  function choose(optionIndex: number) {
    if (selected !== null) return
    setSelected(optionIndex)
  }

  function next() {
    if (selected === null) return
    const allAnswers = [...answers, selected]
    if (index === questions.length - 1) {
      const penaltySeconds = allAnswers.reduce((sum, answer, questionIndex) => sum + (answer === questions[questionIndex].answer ? 0 : 10), 0)
      const row: RecordRow = {
        id: crypto.randomUUID(),
        name: name.trim(),
        phone: maskPhone(phone),
        score: allAnswers.reduce((count, answer, questionIndex) => count + (answer === questions[questionIndex].answer ? 1 : 0), 0),
        wrongCount: allAnswers.filter((answer, questionIndex) => answer !== questions[questionIndex].answer).length,
        baseDuration: seconds,
        penaltySeconds,
        finalDuration: seconds + penaltySeconds,
        submittedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      }
      saveRows([...loadStoredRows(), row])
      setResult(row)
      setScreen('result')
      return
    }
    setAnswers((value) => [...value, selected])
    setIndex((value) => value + 1)
    setSelected(null)
  }

  function leaveQuiz() {
    if (!window.confirm('离开后，这次答题不会保存。')) return
    setScreen('intro')
    setSelected(null)
    setAnswers([])
    setIndex(0)
  }

  function reset() {
    setScreen('intro')
    setName('')
    setPhone('')
    setError('')
    setResult(null)
  }

  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      {screen === 'intro' && (
        <main id="main" className="login-page">
          <form className="login" onSubmit={start}>
            <h1>民俗知识挑战</h1>
            <label>
              <span className="visually-hidden">姓名</span>
              <input
                ref={nameRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                name="name"
                placeholder="姓名"
                autoComplete="name"
                maxLength={60}
                aria-invalid={error === '请填写姓名'}
              />
            </label>
            <label>
              <span className="visually-hidden">手机号</span>
              <input
                ref={phoneRef}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                type="tel"
                name="phone"
                inputMode="numeric"
                maxLength={11}
                placeholder="手机号"
                autoComplete="tel"
                spellCheck={false}
                aria-invalid={error.startsWith('请输入有效')}
              />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="primary" type="submit">开始答题</button>
          </form>
        </main>
      )}
      {screen === 'quiz' && (
        <main id="main" className="quiz-page">
          <div className="frame">
            <header className="top">
              <button className="back" type="button" aria-label="返回" onClick={leaveQuiz}>
                <Chevron />
              </button>
              <h1>民俗知识挑战</h1>
              <span />
            </header>
            <div className="status">
              <span>用时 {formatDuration(seconds)}</span>
              <span>{index + 1}/{questions.length}</span>
            </div>
            <section className="sheet">
              <h2>{current.text}</h2>
              <div className="options">
                {current.options.map((option, optionIndex) => {
                  const state = !answered ? '' : optionIndex === current.answer ? 'correct' : optionIndex === selected ? 'wrong' : ''
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`option ${state}`}
                      onClick={() => choose(optionIndex)}
                      disabled={answered}
                    >
                      <span>{String.fromCharCode(65 + optionIndex)} {option}</span>
                      {answered && optionIndex === current.answer && <Check />}
                    </button>
                  )
                })}
              </div>
              {answered && (
                <div className="explain" aria-live="polite">
                  <h3>答案解析</h3>
                  <p>正确答案：{String.fromCharCode(65 + current.answer)}</p>
                  <p>{correct ? current.note : `答错，用时增加 10 秒。${current.note}`}</p>
                </div>
              )}
              {answered && (
                <button className="primary" type="button" onClick={next}>
                  {index === questions.length - 1 ? '完成' : '下一题'}
                </button>
              )}
            </section>
          </div>
        </main>
      )}
      {screen === 'result' && result && (
        <main id="main" className="quiz-page">
          <div className="frame">
            <header className="top">
              <span />
              <h1>民俗知识挑战</h1>
              <span />
            </header>
            <section className="sheet result">
              <h2>{result.name}，答题完成</h2>
              <dl>
                <div><dt>答对</dt><dd>{result.score} / {questions.length}</dd></div>
                <div><dt>用时</dt><dd>{formatDuration(result.finalDuration)}</dd></div>
                <div><dt>惩罚</dt><dd>{result.penaltySeconds} 秒</dd></div>
              </dl>
              <button className="primary" type="button" onClick={reset}>再答一次</button>
            </section>
          </div>
        </main>
      )}
    </>
  )
}

export default App
