import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = API_CONFIG.GROQ.API_KEY;
    this.baseUrl = API_CONFIG.GROQ.BASE_URL;
    this.model = API_CONFIG.GROQ.MODEL;
  }

  async chat(messages: GroqMessage[]): Promise<string> {
    try {
      const response = await fetch(API_ENDPOINTS.GROQ_CHAT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are Lunchbox.ai, a friendly AI assistant that helps teens organize their tasks using a lunchbox metaphor. 
              
              Keep responses SHORT and CONCISE - max 2-3 sentences. Be casual and teen-friendly, not formal.
              
              When users tell you about tasks, help organize them into these categories:
              - Sweets: Fun tasks they want to do (games, hanging out, hobbies)
              - Vegetables: Important tasks they need to do (homework, studying, appointments)
              - Savory: Neutral tasks (chores, errands, routine activities)
              - Sides: Small filler tasks (quick calls, organizing, planning)
              
              Be encouraging but brief. No long explanations.`
            },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 150,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I couldn\'t process that request.';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return 'Sorry, I\'m having trouble connecting right now. Please try again later.';
    }
  }

  async generateTaskSuggestions(userInput: string): Promise<string[]> {
    try {
      const response = await this.chat([
        {
          role: 'user',
          content: `Based on this user input: "${userInput}", suggest 2-3 specific, actionable tasks that would help them. Format as a simple list.`
        }
      ]);

      // Parse the response into task suggestions
      const tasks = response
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(task => task.length > 0);

      return tasks.slice(0, 3); // Return max 3 tasks
    } catch (error) {
      console.error('Error generating task suggestions:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const groqService = new GroqService();
