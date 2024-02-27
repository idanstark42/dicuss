import { useEffect, useState, useRef } from 'react'
import { IoMdSend } from 'react-icons/io'
import { GiFinishLine } from 'react-icons/gi'
import { FaUndo } from 'react-icons/fa'
import OpenAI from 'openai' // Assuming you have an OpenAI package installed
import './App.css'

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY

const BOTS = ['dipper', 'mabel']
const LAST_MESSAGE = 'Make this next message the last one. Include a conclusion or summary of the conversation, and bring it to a satisfying ending.'

const App = () => {
  const [topic, setTopic] = useState('')
  const [conversation, setConversation] = useState([])
  const [shouldStopConversation, setShouldStopConversation] = useState(false)
  const [lastMessage, setLastMessage] = useState()
  const lastMessageRef = useRef()

  useEffect(() => {
    if (conversation.length > 0 && !lastMessage) {
      const sendMessageToOpenAI = async () => {
        try {
          const openai = new OpenAI({ apiKey: API_KEY, dangerouslyAllowBrowser: true })

          let previousMessage = conversation[conversation.length - 1]
          if (previousMessage.role === 'system') previousMessage = conversation[conversation.length - 2]
          const responder = previousMessage ? BOTS.find(bot => bot !== previousMessage.role) : BOTS[0]
          const messages = conversation.map(message => ({
            role: message.role === 'system' ? 'system' : (message.role === responder ? 'assistant' : 'user'),
            content: message.content
          }))
          
          const stream = await openai.chat.completions.create({ model: 'gpt-4', messages, stream: true })
          let first = true
          let lastMessageContent = ''
          for await (const chunk of stream) {
            const delta = chunk.choices[0] ? (chunk.choices[0].delta ? chunk.choices[0].delta.content : undefined) : undefined
            if (!first && !delta) break
            
            first = false
            lastMessageContent += delta
            setLastMessage({ role: responder, content: lastMessageContent })
            if (lastMessageRef.current) {
              lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
            }
          }

          if (lastMessageContent) {
            const newMessages = [{ role: responder, content: lastMessageContent }]
            if (shouldStopConversation) {
              newMessages.push({ role: 'system', content: LAST_MESSAGE })
            }
            setConversation(prevConversation => [...prevConversation, ...newMessages])
            setLastMessage(undefined)
          }
        } catch (error) {
          console.error('Error:', error)
        }
      }
  
      console.log(Array.from(conversation), shouldStopConversation, lastMessage)
      if (!shouldStopConversation || conversation.every((msg, index) => msg.content !== LAST_MESSAGE || index === conversation.length - 1)) {
        sendMessageToOpenAI(conversation)
      }
    }
  }, [conversation, shouldStopConversation, lastMessage])

  const systemCommand = topic => {
    return `You are a conversationalist.
You will discuess ${topic} with the user.
Please present questions and respond to the answers as if you were having a conversation with a human.
Keep asking follow-up questions to keep the conversation going until it reaches a natrual resolution.
Keep your answers short, maximum 50 words, and use the user's answers to guide the conversation.
Very Important: don't talk about being an AI or about the conversation itself! If you are asked something you can't respond to, like an opinion, just take an opposition to the user's opinion, or just make something up.`
  }

  const startConversation = e => {
    e.preventDefault()
    setConversation([{ role: 'system', content: systemCommand(topic) }])
    setTopic('')
  }

  const stopConversation = () => {
    setShouldStopConversation(true)
  }

  const clear = () => {
    setConversation([])
    setShouldStopConversation(false)
    setLastMessage(undefined)
  }

  return (
    <div className='openai-form'>
      <div className='conversation'>
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {lastMessage ? <div ref={lastMessageRef} className={`message ${lastMessage.role}`}>{lastMessage.content}</div> : ''}
      </div>
      {conversation.length > 0 ? (
        shouldStopConversation ? (
          <div className='bottom'>
            <button onClick={clear}><FaUndo /> Reset</button>
          </div>
        ) : (
          <div className='bottom'>
            <button onClick={stopConversation}><GiFinishLine /> Wrap it up</button>
          </div>
        )
      ) : (
        <form onSubmit={startConversation}>
          <label htmlFor='topic'>Discuss</label>
          <input
            type='text'
            className='topic-input'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            label='topic'
            placeholder='the effect of chocolate consumption on hadnwriting speed'
          />
          <button type='submit' className='send-button'><IoMdSend /> Send</button>
        </form>
      )}
    </div>
  )
}

export default App