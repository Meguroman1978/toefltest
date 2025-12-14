<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TOEFL AI Simulator

An AI-powered TOEFL practice application that generates unlimited TPO-style passages and questions using Google Gemini.

**Live Demo**: https://toefltest.fly.dev/

**AI Studio**: https://ai.studio/apps/drive/1kD_ANT6L9kDPWNSdQBDtvTlCqdmLVjEh

---

## 🚀 Quick Deploy to Fly.io

**⚠️ If you see a white screen at https://toefltest.fly.dev/, follow these steps:**

See [QUICKSTART.md](./QUICKSTART.md) for a 3-step deployment guide.

Or use these commands:

```bash
# 1. Login to Fly.io
flyctl auth login

# 2. Set your Gemini API Key
flyctl secrets set GEMINI_API_KEY="your-api-key-here"

# 3. Deploy
flyctl deploy
```

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 💻 Run Locally

**Prerequisites**: Node.js 18+

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Meguroman1978/toefltest.git
   cd toefltest
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set the Gemini API Key**:
   
   Create a `.env.local` file in the root directory:
   ```bash
   echo "GEMINI_API_KEY=your-api-key-here" > .env.local
   ```
   
   Get your API key from: https://aistudio.google.com/

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: http://localhost:3000

---

## 📱 Features

- ✅ **Unlimited AI-Generated Questions** - TPO-style reading passages on any topic
- ✅ **4 Skills Coverage** - Reading, Listening, Speaking, Writing
- ✅ **AI Grading & Feedback** - Automatic evaluation for Speaking and Writing
- ✅ **Performance Tracking** - Save and analyze your test history
- ✅ **Weakness Analysis** - AI Coach identifies weak areas
- ✅ **Text-to-Speech** - Native-like audio for listening practice
- ✅ **Voice Recording** - Practice speaking with microphone recording
- ✅ **Timer Features** - Realistic test time limits

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **Deployment**: Fly.io (nginx + Docker)
- **Audio**: Web Speech API (TTS), MediaRecorder API

---

## 📖 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - 3-step deployment guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines (coming soon)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

If you encounter any issues:

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting
2. Open an issue in this repository
3. Contact Fly.io support: https://fly.io/docs/about/support/

---

**Happy studying! 📚🎓**
