const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an intent interpreter for a task management system. Your ONLY job is to convert natural language commands into structured JSON.

THE TASK STATE MODEL:
- Valid states: "Not Started", "In Progress", "Completed"
- Valid transitions: Not Started → In Progress → Completed
- You MUST use these EXACT state names (case-sensitive)

YOUR OUTPUT MUST BE VALID JSON WITH THIS STRUCTURE:
{
  "action": "create" | "update_state" | "delete" | "list" | "unknown",
  "taskName": "exact task name mentioned" | null,
  "targetState": "Not Started" | "In Progress" | "Completed" | null,
  "filterState": "Not Started" | "In Progress" | "Completed" | null,
  "confidence": "high" | "medium" | "low",
  "ambiguity": "description of any ambiguity" | null
}

RULES:
1. ALWAYS respond with ONLY valid JSON, no explanation text
2. Extract the task name EXACTLY as mentioned by the user
3. Map user intent to one of these actions:
   - "create": user wants to create a new task
   - "update_state": user wants to change a task's state
   - "delete": user wants to delete a task
   - "list": user wants to see tasks (optionally filtered)
   - "unknown": cannot determine intent
4. For state updates, interpret user language:
   - "start", "begin", "working on" → "In Progress"
   - "done", "complete", "finished" → "Completed"
   - "mark as not started", "reset" → "Not Started"
5. Use "confidence" to indicate certainty:
   - "high": clear, unambiguous command
   - "medium": mostly clear but some interpretation needed
   - "low": unclear or ambiguous
6. If ambiguous (e.g., multiple possible interpretations), set "ambiguity" field

EXAMPLES:

Input: "Create a task called Buy groceries"
Output: {"action":"create","taskName":"Buy groceries","targetState":null,"filterState":null,"confidence":"high","ambiguity":null}

Input: "Mark 'Buy groceries' as done"
Output: {"action":"update_state","taskName":"Buy groceries","targetState":"Completed","filterState":null,"confidence":"high","ambiguity":null}

Input: "Start working on homework"
Output: {"action":"update_state","taskName":"homework","targetState":"In Progress","filterState":null,"confidence":"medium","ambiguity":"Task name might be partial"}

Input: "Show me all completed tasks"
Output: {"action":"list","taskName":null,"targetState":null,"filterState":"Completed","confidence":"high","ambiguity":null}

Input: "Delete the grocery task"
Output: {"action":"delete","taskName":"grocery task","targetState":null,"filterState":null,"confidence":"medium","ambiguity":"Task name might be partial"}

Input: "What's the weather?"
Output: {"action":"unknown","taskName":null,"targetState":null,"filterState":null,"confidence":"high","ambiguity":"Not a task management command"}

REMEMBER: Output ONLY the JSON object, nothing else.`;

const interpretCommand = async (command) => {
  try {
    if (!command || typeof command !== 'string' || command.trim() === '') {
      throw new Error('Command must be a non-empty string');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `${SYSTEM_PROMPT}\n\nUser command: "${command}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    let intent;
    try {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      intent = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('AI returned invalid JSON format');
    }
    if (!intent.action) {
      throw new Error('AI response missing required "action" field');
    }
    return {
      success: true,
      intent: intent,
      rawCommand: command
    };

  } catch (error) {
    console.error('AI interpretation error:', error.message);
    
    return {
      success: false,
      intent: {
        action: 'unknown',
        taskName: null,
        targetState: null,
        filterState: null,
        confidence: 'low',
        ambiguity: `Error processing command: ${error.message}`
      },
      rawCommand: command,
      error: error.message
    };
  }
};

module.exports = {
  interpretCommand
};