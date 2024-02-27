import { useEffect, useState } from 'react'
import { IoMdSend } from 'react-icons/io'
import { FaStop } from 'react-icons/fa'
import { FaUndo } from 'react-icons/fa'
import OpenAI from 'openai' // Assuming you have an OpenAI package installed
import './App.css'

const API_KEY = process.env.REACT_APP_OPENAI_API_KEY

const BOTS = ['dipper', 'mabel']

const App = () => {
  const [topic, setTopic] = useState('')
  const [conversation, setConversation] = useState([])
  const [shouldStopConversation, setShouldStopConversation] = useState(false)

  useEffect(() => {
    if (conversation.length > 0) {
      const sendMessageToOpenAI = async () => {
        try {
          const openai = new OpenAI({ apiKey: API_KEY, dangerouslyAllowBrowser: true })

          const responder = BOTS.find(bot => bot !== conversation[conversation.length - 1].role) || BOTS[0]
          const messages = conversation.map(message => ({
            role: message.role === 'system' ? 'system' : (message.role === responder ? 'assistant' : 'user'),
            content: message.content
          }))
          
          const response = await openai.chat.completions.create({ model: 'gpt-4', messages })
          const botResponse = response.choices[0].message.content.trim()
          setConversation(prevConversation => [...prevConversation, { role: responder, content: botResponse }])
        } catch (error) {
          console.error('Error:', error)
        }
      }
  
      if (!shouldStopConversation) {
        sendMessageToOpenAI(conversation)
      }
    }
  }, [conversation, shouldStopConversation])

  const systemCommand = topic => {
    return `You are a conversationalist.
You will discuess ${topic} with the user.
Please present questions and respond to the answers as if you were having a conversation with a human.
Keep asking follow-up questions to keep the conversation going until it reaches a natrual resolution.
Keep your answers short, maximum 50 words, and use the user's answers to guide the conversation.
Don't talk about being an AI or about the conversation itself.`
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
  }

  return (
    <div className='openai-form'>
      <div className='conversation'>
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      {conversation.length > 0 ? (
        shouldStopConversation ? (
          <div className='bottom'>
            <button onClick={clear}><FaUndo /> Reset</button>
          </div>
        ) : (
          <div className='bottom'>
            <button onClick={stopConversation}><FaStop /> Stop Conversation</button>
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