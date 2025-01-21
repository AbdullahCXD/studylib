# StudyLib 📚

A powerful library documentation generator powered by AI (OpenAI GPT-4 and Google Gemini).

## Features

- 🤖 AI-powered documentation generation
- 🔄 Support for both OpenAI and Google Gemini
- 📝 Detailed method documentation with parameter and return type information
- 🎨 Beautiful CLI output with syntax highlighting
- 📄 Pagination support for large libraries
- ⚡ Fast and efficient processing

## Installation

```bash
npm install -g studylib
# or
pnpm add -g studylib
# or
yarn global add studylib
```

## Configuration

Create a `.env` file in your project root with your AI API keys:

```env
# Required API Keys
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional Configuration
DEFAULT_AI_TOOL=openai      # or gemini (default: openai)
DEFAULT_ITEMS_PER_PAGE=20   # Number of items per page (default: 20)
OPENAI_MODEL=gpt-4         # OpenAI model to use (default: gpt-4)
GEMINI_MODEL=gemini-pro    # Gemini model to use (default: gemini-pro)
DEBUG=false               # Enable debug mode (default: false)
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key |
| `GEMINI_API_KEY` | Yes | - | Your Google Gemini API key |
| `DEFAULT_AI_TOOL` | No | `openai` | Default AI tool to use (`openai` or `gemini`) |
| `DEFAULT_ITEMS_PER_PAGE` | No | `20` | Default number of items to show per page |
| `OPENAI_MODEL` | No | `gpt-4` | OpenAI model to use |
| `GEMINI_MODEL` | No | `gemini-pro` | Gemini model to use |
| `DEBUG` | No | `false` | Enable debug mode for detailed error messages |

## Usage

```bash
studylib <library-name> [options]
```

### Options

- `-t, --ai-tool <tool>`: AI tool to use (openai or gemini)
- `-p, --page <number>`: Page number for pagination
- `-i, --items-per-page <number>`: Number of items to show per page
- `-h, --help`: Display help information
- `-v, --version`: Display version information

### Examples

```bash
# Study lodash using OpenAI
studylib lodash -t openai

# Study React using Gemini, showing 30 items per page
studylib react -t gemini -i 30

# View page 2 of Express documentation
studylib express -p 2
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the project:
   ```bash
   pnpm build
   ```
4. Run in development mode:
   ```bash
   pnpm dev
   ```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure both `OPENAI_API_KEY` and `GEMINI_API_KEY` are set in your `.env` file
   - Verify the API keys are valid and have sufficient permissions

2. **Invalid Configuration**
   - Check that `DEFAULT_AI_TOOL` is either `openai` or `gemini`
   - Ensure `DEFAULT_ITEMS_PER_PAGE` is a positive number

3. **Documentation Generation Errors**
   - Try switching between OpenAI and Gemini if one service fails
   - Enable debug mode by setting `DEBUG=true` for detailed error messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License 