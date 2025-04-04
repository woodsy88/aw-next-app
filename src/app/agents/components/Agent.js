'use client'

import { getCurrentWeather, getLocation } from "./tool"
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const systemPrompt = `
You cycle through Thought, Action, PAUSE, Observation. At the end of the loop you output a final Answer. Your final answer should be highly specific to the observations you have from running
the actions.
1. Thought: Describe your thoughts about the question you have been asked.
2. Action: run one of the actions available to you - then return PAUSE.
3. PAUSE
4. Observation: will be the result of running those actions.

Available actions:
- getCurrentWeather: 
    E.g. getCurrentWeather: Salt Lake City
    Returns the current weather of the location specified.
- getLocation:
    E.g. getLocation: null
    Returns user's location details. No arguments needed.

Example session:
Question: Please give me some ideas for activities to do this afternoon.
Thought: I should look up the user's location so I can give location-specific activity ideas.
Action: getLocation: null
PAUSE

You will be called again with something like this:
Observation: "New York City, NY"

Then you loop again:
Thought: To get even more specific activity ideas, I should get the current weather at the user's location.
Action: getCurrentWeather: New York City
PAUSE

You'll then be called again with something like this:
Observation: { location: "New York City, NY", forecast: ["sunny"] }

You then output:
Answer: <Suggested activities based on sunny weather that are highly specific to New York City and surrounding areas.>
`

// Move actionMap outside the component
const actionMap = {
  'getLocation': getLocation,
  'getCurrentWeather': getCurrentWeather
}

export default function Agent() {
  const [messages, setMessages] = useState([
    { role: "system", content: systemPrompt },
    { role: "user", content: "what are some activities to do this afternoon?" }
  ])
  const [error, setError] = useState(null)

  const handleChat = async () => {
    try {
      setError(null)
      const MAX_ITERATIONS = 5
      const actionRegex = /^Action: (\w+): (.*)$/
      let updatedMessages = [...messages]

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await fetch("https://openai-api-worker.andrewwoods88.workers.dev/chat-turbo", {
          method: "POST",
          body: JSON.stringify(updatedMessages)
        })

        const data = await response.json()
        const content = data.content
        const lines = content.split('\n')

        updatedMessages.push({ role: "assistant", content: content })

        const foundActionStr = lines.find(str => actionRegex.test(str))
        const actions = actionRegex.exec(foundActionStr)
      
        if (!actions) {
          break // Exit loop if no more actions found
        }

        const actionFunction = actions[1]
        const actionParams = actions[2].trim()
        
        if (!actionMap.hasOwnProperty(actionFunction)) {
          setError(`Unknown action "${actionFunction}"`)
          return
        }
        
        let result
        if (actionFunction === 'getCurrentWeather') {
          result = await getCurrentWeather(actionParams)
        } else if (actionFunction === 'getLocation') {
          result = await getLocation()
        }
        
        updatedMessages.push({ role: "user", content: `Observation: ${JSON.stringify(result)}` })
      }

      setMessages(updatedMessages)
    } catch (error) {
      setError(error.message)
      console.error('Error in handleChat:', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Agent</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-l-red-500 text-red-700">
          {error}
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        {messages.map((message, index) => (
          <Card key={index} className={cn(
            "p-4",
            message.role === 'system' && "bg-blue-50 border-l-4 border-l-blue-500",
            message.role === 'user' && "bg-green-50 border-l-4 border-l-green-500",
            message.role === 'assistant' && "bg-orange-50 border-l-4 border-l-orange-500"
          )}>
            <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
              {message.role}
            </div>
            <div className="whitespace-pre-wrap">
              {message.content.split('\n').map((line, i) => (
                <p key={i} className="py-1">
                  {line}
                </p>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={handleChat} variant="default">
        Chat
      </Button>
    </div>
  )
}


/**
 * uses n/ to seperates the thought and action
Thought: To recommend a self-help book, I would need to know the user's location to provide specific suggestions based on availability. 
Action: getLocation: null
PAUSE

 */

