import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedContent, Passage, WritingTask, ListeningSet, SpeakingTask, QuestionType, PerformanceRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.0-flash";

// --- SCHEMAS ---

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questionText: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["SINGLE_CHOICE", "INSERT_TEXT", "PROSE_SUMMARY"] },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { id: { type: Type.STRING }, text: { type: Type.STRING } },
        required: ["id", "text"],
      },
    },
    correctOptionIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    paragraphRef: { type: Type.INTEGER },
    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
    category: { type: Type.STRING },
    categoryLabel: { type: Type.STRING },
    explanation: { type: Type.STRING },
    tips: { type: Type.STRING },
    relevantContext: { type: Type.STRING }
  },
  required: ["questionText", "type", "options", "correctOptionIds", "difficulty", "category", "categoryLabel", "explanation", "tips", "relevantContext"],
};

const readingResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
    questions: { type: Type.ARRAY, items: questionSchema }
  },
  required: ["title", "paragraphs", "questions"]
};

const listeningResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['CONVERSATION', 'LECTURE'] },
    title: { type: Type.STRING },
    transcript: { type: Type.STRING },
    japaneseTranscript: { type: Type.STRING },
    imageDescription: { type: Type.STRING },
    questions: { type: Type.ARRAY, items: questionSchema }
  },
  required: ["type", "title", "transcript", "japaneseTranscript", "questions"]
};

const speakingResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['INDEPENDENT', 'INTEGRATED'] },
    prompt: { type: Type.STRING },
    reading: { type: Type.STRING },
    listeningTranscript: { type: Type.STRING },
    japaneseListeningTranscript: { type: Type.STRING },
    preparationTime: { type: Type.INTEGER },
    recordingTime: { type: Type.INTEGER },
  },
  required: ["type", "prompt", "preparationTime", "recordingTime"]
};

const writingResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['INTEGRATED', 'ACADEMIC_DISCUSSION'] },
    title: { type: Type.STRING },
    reading: { type: Type.STRING },
    listeningTranscript: { type: Type.STRING },
    question: { type: Type.STRING },
    studentResponses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, text: { type: Type.STRING } }
      },
    }
  },
  required: ["type", "title", "question"]
};

// --- GENERATORS ---

export const generateTOEFLSet = async (topic?: string, isIntensive: boolean = false, weakCategory?: string): Promise<GeneratedContent> => {
  let userPrompt = topic 
    ? `Generate a TOEFL Reading passage about "${topic}".`
    : `Generate a TOEFL Reading passage on a random academic topic (Biology, History, Art, or Geology).`;

  if (isIntensive && weakCategory) {
    userPrompt = `INTENSIVE TRAINING MODE. Generate a shorter passage (3-4 paragraphs) but create questions focused specifically on "${weakCategory}" (e.g. Inference, Vocabulary, Insert Text).`;
  }

  const systemInstruction = `
    You are an expert TOEFL test content generator, simulating ETS TPO (Test Practice Online) standards.
    
    1. **PASSAGE CREATION**:
       - Tone: Strictly Academic, University Textbook style.
       - Length: Approx 700 words (unless Intensive Mode).
       - Structure: Intro (Thesis) -> Body Paragraphs (Details/Arguments) -> Conclusion.
       - Formatting: **NO HTML**. Use markdown **bold** for vocabulary emphasis.
       - **INSERT TEXT MARKER**: You MUST insert the marker [■] exactly 4 times within ONE specific paragraph to allow for an "Insert Text" question.

    2. **QUESTION GENERATION** (10 Questions):
       - Questions must follow the TPO order: Vocabulary -> Detail/Factual -> Negative Factual -> Inference -> Rhetorical Purpose -> Sentence Simplification -> Insert Text -> Prose Summary.
       - **Category Labels (Japanese)**:
         - Factual Information -> 内容一致問題
         - Negative Factual -> 内容不一致問題
         - Inference -> 推論問題
         - Rhetorical Purpose -> 意図問題
         - Vocabulary -> 語彙問題
         - Reference -> 指示語問題
         - Sentence Simplification -> 言い換え問題
         - Insert Text -> 挿入問題 
         - Prose Summary -> 要約問題

    3. **CONTENT RULES**:
       - **Prose Summary**: You MUST provide exactly **6 options**. 3 correct, 3 distractors. The option text MUST be full, descriptive sentences summarizing the passage. **NEVER** use generic labels like "Option A" or "Choice 1".
       - **Distractors**: Must be plausible but incorrect (minor details, wrong causality, or not mentioned).
       - **Vocabulary**: Provide 4 options. 1 synonym (correct), 3 distractors.

    4. **TIPS & STRATEGY (Based on Top Instructors)**:
       - Provide tips in the style of top TOEFL instructors (like TST Prep or Juva).
       - Focus on: "Elimination strategy", "Identifying extreme words (always, never)", and "Finding the keyword connection".
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: readingResponseSchema,
      temperature: 0.3, 
    },
  });

  return JSON.parse(response.text!) as GeneratedContent;
};

export const generateListeningSet = async (): Promise<ListeningSet> => {
    const isLecture = Math.random() > 0.4; // 60% chance of lecture
    const prompt = isLecture 
        ? "Generate a TOEFL Listening Lecture (Academic topic: Biology, Art History, Astronomy, or Anthropology)."
        : "Generate a TOEFL Listening Conversation (Campus life: Student & Professor or Service Employee).";

    const systemInstruction = `
      Generate authentic TOEFL Listening content (TPO Style).
      
      **TRANSCRIPT STYLE**:
      - **Natural Speech**: Include authentic features like hesitations ("um", "well", "let me see"), self-corrections ("I mean...", "Or rather..."), and natural pauses. It should NOT sound like a written essay read aloud.
      - **Structure (Lecture)**: Introduction (Topic) -> Definitions -> Examples/Experiments -> Counter-points/Implications -> Conclusion. Use clear Signal Words ("First", "However", "On the other hand").
      - **Structure (Conversation)**: Problem -> Proposed Solution -> Complication -> Final Decision.
      - **Japanese Translation**: You MUST provide a full Japanese translation of the transcript in the 'japaneseTranscript' field.

      **QUESTIONS (CRITICAL)**:
      - **Question Text**: The 'questionText' field must be a CLEAR, COMPLETE question. Do NOT leave it vague. 
      - Example Correct: "What does the professor imply about the student's hypothesis?"
      - Example Incorrect: "Implication question."
      - Types: Main Idea, Detail, Function (Why did the professor say...?), Attitude, Inference.
      - **Strategy Tips**: Reference "Signal Words" (e.g., "Listen for 'However' as it indicates a shift") and "Note-taking" (e.g., "Focus on the cause-and-effect relationship mentioned here").
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: listeningResponseSchema,
        }
    });

    const data = JSON.parse(response.text!);
    
    // MAP RAW JSON TO INTERNAL INTERFACE
    // ensuring questionText is mapped to prompt
    const questions = data.questions.map((q: any, i: number) => ({
        id: `lq_${i}`,
        type: q.type as QuestionType,
        prompt: q.questionText,
        options: q.options,
        correctAnswers: q.correctOptionIds,
        paragraphReference: q.paragraphRef,
        difficulty: q.difficulty,
        category: q.category,
        categoryLabel: q.categoryLabel,
        explanation: q.explanation,
        tips: q.tips,
        relevantContext: q.relevantContext
    }));

    return {
        id: `listening_${Date.now()}`,
        type: data.type,
        title: data.title,
        transcript: data.transcript,
        japaneseTranscript: data.japaneseTranscript,
        imageDescription: data.imageDescription,
        questions: questions
    };
};

export const generateSpeakingTask = async (): Promise<SpeakingTask> => {
    const taskTypeRoll = Math.random();
    let promptText = "";
    
    // Weighted selection for variety
    if (taskTypeRoll < 0.25) promptText = "Generate Task 1 (Independent): Choice or Agree/Disagree.";
    else if (taskTypeRoll < 0.5) promptText = "Generate Task 2 (Campus Situation): University Announcement (Reading) + Student Conversation (Listening).";
    else if (taskTypeRoll < 0.75) promptText = "Generate Task 3 (Academic Concept): General Concept (Reading) + Specific Example (Listening).";
    else promptText = "Generate Task 4 (Academic Lecture): Summary of a lecture topic.";

    const systemInstruction = `
       Generate a TOEFL Speaking Task conforming to ETS Standards.
       
       **Task 1 (Independent)**:
       - Prompt: "Some people prefer X, others prefer Y. Which do you prefer?" or "Do you agree or disagree...?"
       - Prep: 15s, Speak: 45s.
       
       **Task 2 (Integrated - Campus)**:
       - Reading: A university announcement proposing a CHANGE.
       - Listening (Transcript): Two students discussion. One explicitly AGREES or DISAGREES.
       - **Japanese Listening Transcript**: Provide a Japanese translation of the conversation.
       - Prompt: "The woman/man expresses his/her opinion. State the opinion and the reasons given."
       
       **Task 3 (Integrated - Academic)**:
       - Reading: Define an academic concept.
       - Listening (Transcript): Professor gives a specific EXAMPLE illustrating the concept.
       - **Japanese Listening Transcript**: Provide a Japanese translation of the lecture.
       - Prompt: "Describe the concept of X and how the professor's example illustrates it."
       
       **Task 4 (Integrated - Lecture)**:
       - Listening (Transcript): Professor discusses a topic with TWO distinct examples.
       - **Japanese Listening Transcript**: Provide a Japanese translation of the lecture.
       - Prompt: "Using points and examples from the lecture, explain..."
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: promptText,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: speakingResponseSchema,
        }
    });

    const data = JSON.parse(response.text!);
    return {
        id: `speaking_${Date.now()}`,
        ...data
    };
}

export const generateWritingTask = async (): Promise<WritingTask> => {
  const isIntegrated = Math.random() > 0.5;
  const prompt = isIntegrated 
    ? "Generate a TOEFL Integrated Writing Task." 
    : "Generate a TOEFL Writing for an Academic Discussion task.";

  const systemInstruction = `
    You are an expert TOEFL Writing Task generator.
    
    **Type 1: Integrated Writing Task**:
    - **Topic**: Academic (e.g., Archaeology, Ecology, History).
    - **Reading**: Present 3 clear arguments/points supporting a theory.
    - **Listening**: A lecture that CASTS DOUBT on each of the 3 points from the reading. It must DIRECTLY contradict them.
    - **Question**: "Summarize the points made in the lecture, being sure to explain how they cast doubt on specific points made in the reading passage."
    
    **Type 2: Academic Discussion Task**:
    - **Context**: An online university forum.
    - **Professor**: Asks an open-ended question about a social or educational issue (e.g., "Should grading be abolished?").
    - **Student 1 (Paul)**: Gives an opinion with a reason.
    - **Student 2 (Claire)**: Gives a different opinion/perspective.
    - **Question**: "Write a post responding to the professor's question. In your response, you should express and support your opinion and contribute to the discussion."
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: writingResponseSchema,
    },
  });

  const data = JSON.parse(response.text!);
  return { id: `writing_${Date.now()}`, ...data };
};

export const generateVocabLesson = async (): Promise<GeneratedContent> => {
    const prompt = `
      Generate 10 TOEFL Vocabulary/Idiom practice questions.
      Target word should be bolded using markdown **word**.
      Category Label: "語彙・熟語特訓".
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: readingResponseSchema,
        },
    });

    return JSON.parse(response.text!) as GeneratedContent;
};

// --- GRADING & ANALYSIS ---

export const gradeWritingResponse = async (task: WritingTask, userResponse: string): Promise<{ score: number, feedback: string }> => {
    const prompt = `
      Act as a certified TOEFL iBT Writing Rater.
      
      **Task**: ${task.type}
      **Question**: ${task.question}
      
      **Rubric Criteria**:
      1. **Development**: Is the idea well-developed? (Integrated: Did they accurately connect Reading & Listening?)
      2. **Organization**: Is there a clear structure (Intro, Body, Conclusion)?
      3. **Language Use**: Grammar, vocabulary variety, sentence complexity.
      
      **Inputs**:
      - Reading Source: ${task.reading || "N/A"}
      - Listening Source: ${task.listeningTranscript || "N/A"}
      - User Essay: "${userResponse}"
      
      **Output**:
      1. Estimated Scaled Score (0-5).
      2. Actionable Feedback in Japanese (Start with "Good points", then "Improvements").
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                },
                required: ["score", "feedback"]
            }
        }
    });

    return JSON.parse(response.text!);
};

export const gradeSpeakingResponse = async (task: SpeakingTask, transcript: string): Promise<{ score: number, feedback: string }> => {
     const prompt = `
      Act as a certified TOEFL iBT Speaking Rater.
      
      **Task**: ${task.type}
      **Prompt**: ${task.prompt}
      
      **Rubric Criteria**:
      1. **Delivery**: Flow, pacing, pronunciation (simulated check), natural pauses.
      2. **Language Use**: Grammar, effective vocab.
      3. **Topic Development**: Did they answer the prompt? Did they use details from the sources?
      
      **Advice Style**:
      - Base advice on top strategies (e.g., TST Prep/Juva style).
      - Did they use a clear template? (e.g., "The reading states... The professor disagrees...")
      - Did they use transition words?
      
      **Context**:
      - Reading: ${task.reading || "N/A"}
      - Listening: ${task.listeningTranscript || "N/A"}
      - User Speech Transcript: "${transcript}"
      
      **Output**:
      1. Estimated Score (0-4).
      2. Actionable Feedback in Japanese (Focus on template usage and signal words).
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                },
                required: ["score", "feedback"]
            }
        }
    });

    return JSON.parse(response.text!);
};

export const generatePerformanceAnalysis = async (
  passage: Passage, 
  userAnswers: Record<string, string[]>
): Promise<string> => {
  const resultsSummary = passage.questions.map((q, i) => {
    const userAns = userAnswers[q.id] || [];
    const isCorrect = userAns.length === q.correctAnswers.length && userAns.every(a => q.correctAnswers.includes(a));
    return `Q${i+1} [${q.categoryLabel}]: ${isCorrect ? "Correct" : "Incorrect"}`;
  }).join("\n");

  const prompt = `
    Analyze these TOEFL Reading results like a tutor.
    Topic: ${passage.title}
    Results: ${resultsSummary}
    
    Provide a Japanese analysis covering:
    1. **Weakness Identification**: Which question types (Inference, Summary, etc.) were missed?
    2. **Score Estimate**: Approximate TOEFL Reading score (0-30).
    3. **Actionable Advice**: Specific study tips based on the missed questions.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });
  return response.text || "解析できませんでした。";
}

export const generateHistoryAnalysis = async (history: PerformanceRecord[]): Promise<string> => {
    // 1. Group Data by Section (Reading, Listening, Speaking, Writing)
    const sections: Record<string, Record<string, { correct: number, total: number }>> = {
        'Reading': {},
        'Listening': {},
        'Speaking': {},
        'Writing': {}
    };

    history.forEach(record => {
        let mainSection = 'Reading'; // Default
        if (record.category === 'Speaking') mainSection = 'Speaking';
        else if (record.category === 'Writing') mainSection = 'Writing';
        else if (record.category.toLowerCase().includes('listening') || record.category === 'Conversation' || record.category === 'Lecture') mainSection = 'Listening';
        
        if (!sections[mainSection][record.category]) {
            sections[mainSection][record.category] = { correct: 0, total: 0 };
        }
        sections[mainSection][record.category].correct += record.correct;
        sections[mainSection][record.category].total += record.total;
    });

    const prompt = `
        You are an elite TOEFL Tutor. Analyze the student's performance history data below.
        
        ${JSON.stringify(sections, null, 2)}
        
        Provide a **Comprehensive Performance Report in Japanese** using standard Markdown.
        
        **RESPONSE STRUCTURE (Strictly Follow):**

        # 📊 TOEFL Performance Report

        (For EACH Section that has data - Reading/Listening/Speaking/Writing):
        ## [Icon] [Section Name] Section
        ### 📉 弱点と傾向 (Weakness Analysis)
        - Analyze the sub-categories or scores.
        - Explain *why* the student might be failing (e.g., "Inference questions require understanding implied meaning...").
        ### 🚀 具体的対策 (Actionable Training)
        - Provide specific exercises (e.g., "Shadowing for Listening", "Template usage for Speaking").
        
        ---
        
        ## 🧠 重点ボキャブラリー (Priority Vocabulary)
        - Based on weak topics (e.g., Biology, Arts), list 5-10 essential TOEFL words.
        - Format: **Word** (Meaning): Example usage context.

        ## 💡 総合アドバイス (Overall Strategy)
        - 3 key takeaways for the next test.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
    });
    
    return response.text || "分析データを生成できませんでした。";
};