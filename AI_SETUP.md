# AI Features Setup Guide

FlowCart uses **Mistral AI** (open-source) for AI-powered features. You can use either:

1. **Mistral AI API** (Free tier available)
2. **Self-hosted Ollama** with Mistral models (100% free, runs locally)

## Option 1: Mistral AI API (Recommended for Production)

1. Sign up at [Mistral AI](https://mistral.ai/)
2. Get your API key from the dashboard
3. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_MISTRAL_API_KEY=your_api_key_here
   NEXT_PUBLIC_MISTRAL_API_URL=https://api.mistral.ai/v1
   NEXT_PUBLIC_USE_SELF_HOSTED_AI=false
   ```

**Free Tier**: Includes generous free credits for testing

## Option 2: Self-Hosted Ollama (100% Free)

1. Install Ollama: https://ollama.ai
   - Windows: Download installer
   - Mac: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`

2. Pull Mistral models:
   ```bash
   ollama pull mistral          # 7B model (recommended)
   # or
   ollama pull mistral:7b       # Specific version
   # or
   ollama pull mixtral:8x7b    # Larger, more capable model
   ```

3. Start Ollama (runs automatically after install):
   ```bash
   ollama serve
   ```

4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_USE_SELF_HOSTED_AI=true
   NEXT_PUBLIC_SELF_HOSTED_AI_URL=http://localhost:11434
   ```

## Available AI Features

### 1. AI Chatbot
- Intelligent customer support
- Context-aware responses
- Product recommendations

### 2. AI Semantic Search
- Natural language product search
- Understands intent, not just keywords
- Example: "something spicy under ₹200"

### 3. AI Image Search
- Upload product image to find similar items
- Visual product discovery

### 4. AI Review Sentiment Analysis
- Automatically analyze review sentiment
- Extract key insights from customer feedback

### 5. AI Voice Search
- Voice-based product search
- Hands-free shopping experience

## Backend Integration

The backend should implement AI endpoints that use Mistral AI. Example:

```csharp
// Backend AI Controller
[HttpPost("chat")]
public async Task<IActionResult> Chat([FromBody] ChatRequest request)
{
    // Use Mistral AI SDK or API
    var response = await mistralService.ChatAsync(request.Messages);
    return Ok(response);
}
```

## Testing

1. Start your development server
2. Open the chatbot
3. Try asking: "What products do you have?" or "Show me spicy food"

## Troubleshooting

- **Ollama not responding**: Make sure `ollama serve` is running
- **API errors**: Check your Mistral API key is valid
- **Slow responses**: Use smaller models (mistral:7b) or upgrade to Mistral API

