# Centralized Gemini AI Router Examples

The new `/api/ai/:type` endpoint provides specialized AI responses based on context.

## Available Types

- `document` - Professional technical/business writer
- `code` - Full-stack developer expert
- `legal` - Legal assistant and document drafter
- `chat` - General conversational assistant
- `creative` - Creative writing and content creation
- `analysis` - Data analysis and research

## Usage Examples

### Document Generation
```javascript
const response = await fetch('/api/ai/document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a professional business proposal for a web development project'
  })
});
const { text } = await response.json();
```

### Code Generation
```javascript
const response = await fetch('/api/ai/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a React component for a user authentication form'
  })
});
const { text } = await response.json();
```

### Legal Document Drafting
```javascript
const response = await fetch('/api/ai/legal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Draft a software development service agreement'
  })
});
const { text } = await response.json();
```

### General Chat
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Explain the benefits of renewable energy'
  })
});
const { text } = await response.json();
```

### Creative Writing
```javascript
const response = await fetch('/api/ai/creative', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Write a compelling product description for a smart home device'
  })
});
const { text } = await response.json();
```

### Data Analysis
```javascript
const response = await fetch('/api/ai/analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Analyze the trends in web development technologies for 2024'
  })
});
const { text } = await response.json();
```

## Error Handling

```javascript
try {
  const response = await fetch('/api/ai/document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Your request here' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('AI Error:', error.error);
    return;
  }
  
  const { text } = await response.json();
  // Use the generated text
} catch (error) {
  console.error('Network error:', error);
}
```

## Health Check

```javascript
const health = await fetch('/api/ai/health');
const status = await health.json();
console.log('Available types:', status.supportedTypes);
```