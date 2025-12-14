# Quick Integration Guide - Phase 3

## 🎯 Goal
Connect the new Full Test and Score Report features to the user interface.

---

## Step 1: Install Chart.js (5 minutes)

```bash
cd ~/toefltest
npm install chart.js react-chartjs-2
git add package.json package-lock.json
git commit -m "deps: Add Chart.js for score trend visualization"
git push origin main
```

---

## Step 2: Update HomeScreen.tsx (15 minutes)

### Location: `screens/HomeScreen.tsx`

### A. Add State for Past Reports Modal

Find the existing state declarations (around line 20-30) and add:
```typescript
const [showPastScoreReports, setShowPastScoreReports] = useState(false);
```

### B. Add Imports at Top

```typescript
import PastScoreReportsScreen from './PastScoreReportsScreen';
import { ScoreReport } from '../types';
```

### C. Add Full Test Button

Find the "Test Modes" section (where Reading, Listening, etc. buttons are) and add:

```typescript
<button
  onClick={() => onStart('', 'FULL_TEST')}
  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
>
  <div className="flex items-center justify-between mb-2">
    <i className="fas fa-clipboard-check text-3xl"></i>
    <span className="bg-white/20 text-xs px-2 py-1 rounded-full">NEW!</span>
  </div>
  <div className="text-xl font-bold">Full Test</div>
  <div className="text-sm opacity-90">スコアレポート付き</div>
  <div className="text-xs mt-2 opacity-75">~116 minutes | All 4 sections</div>
</button>
```

### D. Add Past Score Reports Button in Tools Section

Find the Tools section and add AFTER "単語・熟語帳" button:

```typescript
<button
  onClick={() => setShowPastScoreReports(true)}
  className="bg-white p-4 rounded-lg hover:bg-slate-50 transition-colors shadow-md border border-slate-200"
>
  <i className="fas fa-chart-line text-2xl text-indigo-600 mb-2"></i>
  <div className="text-sm font-bold text-slate-800">過去のスコアレポート</div>
  <div className="text-xs text-slate-500 mt-1">Past Score Reports</div>
</button>
```

### E. Add Modal at End of Component (before closing div)

```typescript
{showPastScoreReports && (
  <PastScoreReportsScreen
    onViewReport={(report: ScoreReport) => {
      // This will be handled by App.tsx
      alert('Viewing report: ' + report.id);
      setShowPastScoreReports(false);
    }}
    onClose={() => setShowPastScoreReports(false)}
  />
)}
```

---

## Step 3: Update App.tsx (30 minutes)

### Location: `App.tsx`

### A. Add Imports at Top

```typescript
import FullTestScreen from './screens/FullTestScreen';
import ScoreReportScreen from './screens/ScoreReportScreen';
import PastScoreReportsScreen from './screens/PastScoreReportsScreen';
import { ScoreReport } from './types';
```

### B. Update Screen State Type

Find the line that starts with `const [screen, setScreen] = useState<...>` and update it:

```typescript
const [screen, setScreen] = useState<
  'HOME' | 'TEST' | 'WRITING_TEST' | 'LISTENING_TEST' | 'SPEAKING_TEST' | 
  'RESULT' | 'FEEDBACK_RESULT' | 'FULL_TEST' | 'SCORE_REPORT'
>('HOME');
```

### C. Add New State Variables

After the `feedbackData` state declaration, add:

```typescript
const [currentScoreReport, setCurrentScoreReport] = useState<ScoreReport | null>(null);
const [showPastReports, setShowPastReports] = useState(false);
```

### D. Add Full Test Handler

After the `handleIntensiveTraining` function, add:

```typescript
const startFullTest = () => {
  setScreen('FULL_TEST');
};

const handleFullTestComplete = (report: ScoreReport) => {
  setCurrentScoreReport(report);
  setScreen('SCORE_REPORT');
};
```

### E. Update handleStart Function

Find the `handleStart` function and add a case for FULL_TEST:

```typescript
const handleStart = (topic: string, mode: TestMode, isIntensive = false, weakCat = "") => {
  if (mode === 'READING') {
    startReadingTest(topic, isIntensive, weakCat);
  } else if (mode === 'VOCAB_LESSON') {
    startVocabLesson();
  } else if (mode === 'WRITING') {
    startWritingTest();
  } else if (mode === 'LISTENING') {
    startListeningTest();
  } else if (mode === 'SPEAKING') {
    startSpeakingTest();
  } else if (mode === 'FULL_TEST') {  // NEW
    startFullTest();
  }
};
```

### F. Update TestMode Type

In `types.ts`, find TestMode and update:

```typescript
export type TestMode = 'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING' | 'VOCAB_LESSON' | 'FULL_TEST';
```

### G. Add Render Logic for New Screens

Find where the screens are rendered (after `{screen === 'FEEDBACK_RESULT' && ...}`) and add:

```typescript
{screen === 'FULL_TEST' && (
  <FullTestScreen 
    onComplete={handleFullTestComplete}
    onExit={goHomeSafe}
  />
)}

{screen === 'SCORE_REPORT' && currentScoreReport && (
  <ScoreReportScreen
    report={currentScoreReport}
    onHome={goHomeForce}
  />
)}

{showPastReports && (
  <PastScoreReportsScreen
    onViewReport={(report) => {
      setCurrentScoreReport(report);
      setShowPastReports(false);
      setScreen('SCORE_REPORT');
    }}
    onClose={() => setShowPastReports(false)}
  />
)}
```

### H. Update HomeScreen Past Reports Button Handler

In the HomeScreen component call, update the props to handle past reports:

```typescript
<HomeScreen 
  onStart={handleStart}
  onIntensiveTraining={handleIntensiveTraining}
  onViewPastReports={() => setShowPastReports(true)}  // NEW
/>
```

And in HomeScreen.tsx, add the prop:

```typescript
interface HomeScreenProps {
  onStart: (topic: string, mode: TestMode, isIntensive?: boolean, weakCat?: string) => void;
  onIntensiveTraining: (category: string) => void;
  onViewPastReports?: () => void;  // NEW
}
```

Then use it in the Past Reports button:

```typescript
<button
  onClick={() => onViewPastReports && onViewPastReports()}
  // ... rest of button
>
```

---

## Step 4: Test Build (5 minutes)

```bash
cd ~/toefltest
npm run build
```

If successful, you should see:
```
✓ 47+ modules transformed
dist/index.html: ~1.34 kB
dist/assets/index-*.js: ~620 kB (with Chart.js)
✓ built in ~3s
```

---

## Step 5: Deploy (10 minutes)

```bash
cd ~/toefltest

# Commit changes
git add -A
git commit -m "feat: Integrate Full Test and Score Report features with UI

- Added Full Test button to HomeScreen
- Added Past Score Reports button to Tools section
- Connected Full Test flow in App.tsx
- Added FULL_TEST to TestMode type
- Installed Chart.js for trend visualization
- All features now accessible from main interface"

# Push to GitHub
git push origin main

# Deploy to Fly.io
export GEMINI_API_KEY="AIzaSyBtd5Nvp-H5WRXuFxLMGzNkbk8oocz3_9E"
flyctl deploy --build-arg GEMINI_API_KEY=$GEMINI_API_KEY

# Check deployment
flyctl status
```

---

## Step 6: Verify Deployment (10 minutes)

### Open: https://toefltest.fly.dev/

### Test Checklist:
1. ✅ Home screen loads correctly
2. ✅ "Full Test" button visible in Test Modes
3. ✅ "過去のスコアレポート" button visible in Tools
4. ✅ Click Full Test → Shows Full Test screen
5. ✅ Progress through sections works
6. ✅ Score report generates correctly
7. ✅ Past Reports modal opens
8. ✅ Can view historical reports
9. ✅ Charts display (if multiple tests exist)
10. ✅ All existing features still work

---

## Troubleshooting

### Chart.js Import Errors:
```bash
npm install --force chart.js react-chartjs-2
```

### Type Errors with FULL_TEST:
- Make sure TestMode type includes 'FULL_TEST'
- Check all switch/if statements handle FULL_TEST case

### Build Fails:
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Past Reports Modal Not Opening:
- Check state is properly declared in both HomeScreen and App
- Verify onViewPastReports prop is passed correctly
- Console.log to debug

---

## Estimated Time: ~75 minutes total

- Chart.js installation: 5 min
- HomeScreen updates: 15 min
- App.tsx updates: 30 min
- Testing: 5 min
- Deployment: 10 min
- Verification: 10 min

---

## Need Help?

- **Syntax Errors**: Check all brackets and parentheses
- **Type Errors**: Ensure all imports are correct
- **Build Errors**: Read error messages carefully
- **Runtime Errors**: Check browser console (F12)

---

## Success Criteria ✅

When complete, users should be able to:
1. Start a Full Test from home screen
2. Complete all 4 sections sequentially
3. See comprehensive score report automatically
4. View past score reports with trends
5. Click historical reports to see details
6. Track progress over time with charts

---

**Ready to go! Follow the steps above to complete Phase 3 integration.**

_Last Updated: December 14, 2024_
