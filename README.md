<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TOEFL AI Simulator

An AI-powered TOEFL practice application that generates unlimited TPO-style passages and questions using Google Gemini.

**Live Demo**: https://toefltest.fly.dev/

**AI Studio**: https://ai.studio/apps/drive/1kD_ANT6L9kDPWNSdQBDtvTlCqdmLVjEh

---

## 🚀 Quick Deploy to Fly.io

**✅ Latest Fix (2025-12-14)**: API Key issue resolved! See [FINAL_DEPLOY.md](./FINAL_DEPLOY.md) for the complete solution.

### Fast Deploy (3 commands):

```bash
# 1. Set API Key environment variable
export GEMINI_API_KEY="your-api-key-here"

# 2. Pull latest code
git pull origin main

# 3. Deploy with build argument
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY
```

**⚠️ Important**: You must pass `--build-arg GEMINI_API_KEY=$GEMINI_API_KEY` during deployment for the API key to be embedded in the build.

### Troubleshooting Guides:

- **[FINAL_DEPLOY.md](./FINAL_DEPLOY.md)** - Complete deployment guide with API key fix ⭐
- **[FIX_API_KEY.md](./FIX_API_KEY.md)** - API Key error solutions
- **[FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md)** - White screen fix
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment documentation

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

### Deployment Guides
- **[FINAL_DEPLOY.md](./FINAL_DEPLOY.md)** - ⭐ Latest complete deployment guide
- [FIX_API_KEY.md](./FIX_API_KEY.md) - API Key troubleshooting
- [FIX_BLANK_PAGE.md](./FIX_BLANK_PAGE.md) - White screen fix
- [QUICKSTART.md](./QUICKSTART.md) - Quick 3-step guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed documentation

### Development
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
