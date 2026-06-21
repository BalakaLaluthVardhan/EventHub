/**
 * Service to interact with the OpenRouter API for campus event AI features.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Helper to check if the API key is a placeholder/mock key
 */
function isMockKey(key) {
  return !key || key.includes('...') || key === 'your_openrouter_api_key_here';
}

/**
 * Helper to call the OpenRouter API
 */
async function callOpenRouter(messages, formatJson = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (isMockKey(apiKey)) {
    throw new Error('OPENROUTER_API_KEY is mock or not defined in your .env file. Please add your real OpenRouter API key to use AI features.');
  }

  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'College Event Hub'
  };

  const payload = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  };

  if (formatJson) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    throw new Error('Invalid response received from OpenRouter API.');
  }

  return data.choices[0].message.content;
}

/**
 * 1. AI Event Description Generator
 */
async function generateDescription(title, notes) {
  if (isMockKey(process.env.OPENROUTER_API_KEY)) {
    console.warn('⚠️  OPENROUTER_API_KEY is missing or mock. Simulating AI description generation.');
    return `### Welcome to ${title}!

**About this Event:**
${notes}

**Key Highlights:**
- Learn about core concepts and workflows.
- Interact with industry professionals and peers.
- Hands-on practical assignments and workshops.

**Who Should Attend:**
- Students eager to grow their skills in this domain.
- Anyone interested in learning more about these topics.

*This description was automatically simulated because no OpenRouter API key is configured.*`;
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a professional campus event copywriter. Write a structured, engaging, and professional event description based on the event title and basic notes. Use clean markdown formatting. Include headings, a summary, key highlights, and who should attend.'
    },
    {
      role: 'user',
      content: `Event Title: ${title}\nNotes/Highlights: ${notes}`
    }
  ];

  return await callOpenRouter(messages);
}

/**
 * 2. Smart Event Categorization
 * Predicts the category (Workshop, Hackathon, Seminar, Cultural, Sports) and relevant tags.
 */
async function categorizeEvent(title, description) {
  if (isMockKey(process.env.OPENROUTER_API_KEY)) {
    console.warn('⚠️  OPENROUTER_API_KEY is missing or mock. Simulating AI event categorization.');
    const textToScan = `${title} ${description}`.toLowerCase();
    let category = 'Workshop';
    if (textToScan.includes('hackathon') || textToScan.includes('coding') || textToScan.includes('dev')) {
      category = 'Hackathon';
    } else if (textToScan.includes('sports') || textToScan.includes('tournament') || textToScan.includes('football') || textToScan.includes('cricket')) {
      category = 'Sports';
    } else if (textToScan.includes('cultural') || textToScan.includes('dance') || textToScan.includes('music') || textToScan.includes('fest')) {
      category = 'Cultural';
    } else if (textToScan.includes('seminar') || textToScan.includes('panel') || textToScan.includes('talk') || textToScan.includes('speaker')) {
      category = 'Seminar';
    }
    
    return {
      category,
      tags: ['campus', category.toLowerCase()]
    };
  }

  const messages = [
    {
      role: 'system',
      content: `Analyze the event title and description and output a JSON object containing the best-fit category and an array of relevant tags.
The category MUST be exactly one of: 'Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports'.
Output only JSON matching this schema:
{
  "category": "Workshop|Hackathon|Seminar|Cultural|Sports",
  "tags": ["tag1", "tag2", "tag3"]
}`
    },
    {
      role: 'user',
      content: `Title: ${title}\nDescription: ${description}`
    }
  ];

  const responseText = await callOpenRouter(messages, true);
  try {
    // Extract JSON block using regex to avoid issues with conversational text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response.');
    }
    const result = JSON.parse(jsonMatch[0]);
    
    // Validate category selection
    const validCategories = ['Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Sports'];
    if (!validCategories.includes(result.category)) {
      result.category = 'Workshop'; // Fallback
    }
    return result;
  } catch (err) {
    console.error('Error parsing categorization AI response:', err);
    // Dynamic fallbacks based on keyword matches if parse fails
    const textToScan = `${title} ${description}`.toLowerCase();
    let category = 'Workshop';
    if (textToScan.includes('hackathon') || textToScan.includes('coding') || textToScan.includes('dev')) {
      category = 'Hackathon';
    } else if (textToScan.includes('sports') || textToScan.includes('tournament') || textToScan.includes('football') || textToScan.includes('cricket')) {
      category = 'Sports';
    } else if (textToScan.includes('cultural') || textToScan.includes('dance') || textToScan.includes('music') || textToScan.includes('fest')) {
      category = 'Cultural';
    } else if (textToScan.includes('seminar') || textToScan.includes('panel') || textToScan.includes('talk') || textToScan.includes('speaker')) {
      category = 'Seminar';
    }
    
    return {
      category,
      tags: ['campus', 'event']
    };
  }
}

/**
 * 3. AI Review Summarizer
 * Summarizes ratings and reviews for an event organizer.
 */
async function summarizeReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    return 'No reviews have been submitted for this event yet.';
  }

  if (isMockKey(process.env.OPENROUTER_API_KEY)) {
    console.warn('⚠️  OPENROUTER_API_KEY is missing or mock. Simulating AI review summary.');
    const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
    return `### Review Feedback Summary (Average Rating: ${avgRating}/5)

**Overall Sentiment:** 
Based on ${reviews.length} review(s), the overall response is highly positive. 

**What Went Well:**
- Attendees loved the interactive session and structure.
- The coordinator did an excellent job organizing the timeline.

**Areas for Improvement:**
- A few attendees noted that seating/capacity could be improved.
- Some participants requested longer Q&A sessions.

*This review summary was simulated because no OpenRouter API key is configured.*`;
  }

  const reviewText = reviews.map((r, idx) => `Review #${idx + 1} (Rating: ${r.rating}/5): ${r.comment}`).join('\n\n');

  const messages = [
    {
      role: 'system',
      content: 'You are an event analyst. Summarize attendee feedback from a set of event reviews. Provide a brief, concise, and structured summary highlighting what went well, what could be improved, and overall feedback. Keep it under 150 words.'
    },
    {
      role: 'user',
      content: `Here are the attendee reviews:\n\n${reviewText}`
    }
  ];

  return await callOpenRouter(messages);
}

module.exports = {
  generateDescription,
  categorizeEvent,
  summarizeReviews
};
