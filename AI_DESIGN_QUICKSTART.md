# AI Design Feature - Quick Start Guide

## Setup (Required Before Use)

### 1. Get API Keys

**OpenAI** (for text, layouts, elements):
- Visit https://platform.openai.com/api-keys
- Create a new API key

**DeepAI** (for image generation):
- Visit https://deepai.org/dashboard/profile
- Get your API key (free tier available)

### 2. Add to Environment
Create `.env.local` in project root:
```env
OPENAI_API_KEY=sk-your-openai-key-here
DEEPAI_API_KEY=your-deepai-key-here
```

### 3. Restart Server
```bash
npm run dev
```

## How to Use

1. **Click** the purple "AI Design" button in the toolbar (magic wand icon)
2. **Enter** what you want to create
3. **Select** design type:
   - **Text**: AI-generated text with styling
   - **Image**: AI-generated image from DeepAI
   - **Element**: Shapes and graphics
   - **Layout**: Complete multi-element design
4. **Choose** a style (Modern, Minimalist, Vibrant, Professional)
5. **Generate** - Click button or press Cmd/Ctrl + Enter

## Example Prompts

### Text
- "Create a bold birthday greeting in red"
- "Elegant wedding invitation text"

### Image (DeepAI)
- "A futuristic cityscape at sunset"
- "Abstract geometric pattern in blue and gold"
- "Cute cartoon birthday cake"

### Layout
- "Birthday card design with balloons"
- "Professional business card layout"

## Cost

- **OpenAI GPT-3.5**: ~$0.002 per generation
- **DeepAI**: Free tier available, then ~$0.005 per image

## Deployment to Cloudflare

Add both API keys in Cloudflare Pages dashboard:
Settings → Environment variables
- `OPENAI_API_KEY`
- `DEEPAI_API_KEY`

Then deploy:
```bash
npm run deploy
```

## Support

See [walkthrough.md](file:///Users/daniel.stuart/.gemini/antigravity/brain/313c96bb-9add-4867-9cba-e89780583d40/walkthrough.md) for detailed documentation.
