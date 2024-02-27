import { useEffect, useState } from 'react'
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
You will discuess ${topic}.
Please present questions and respond to the answers as if you were having a conversation with a human.
Keep asking follow-up questions to keep the conversation going.`
  }

  const startConversation = e => {
    e.preventDefault()
    setConversation([{ role: 'system', content: systemCommand(topic) }])
    setTopic('')
  }

  const stopConversation = () => {
    setShouldStopConversation(true)
  }

  return (
    <div className="openai-form">
      <div className="conversation">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      {conversation.length > 0 && !stopConversation ? (
        <button onClick={stopConversation}>Stop Conversation</button>
      ) : (
        <form onSubmit={startConversation}>
          <label htmlFor="topic">Please Discuss:</label>
          <input
            type="text"
            className="topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            label="topic"
            placeholder="the effect of climate change on the economy"
          />
          <button type="submit" className="send-button">Send</button>
        </form>
      )}
    </div>
  )
}

export default App