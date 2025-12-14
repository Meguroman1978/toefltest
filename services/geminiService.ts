import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedContent, Passage, WritingTask, ListeningSet, SpeakingTask, QuestionType, PerformanceRecord } from "../types";
import { 
  createQuestionFingerprint, 
  isQuestionDuplicate, 
  addQuestionToHistory,
  getUnderusedTopics,
  needsCleanup,
  cleanupHistory 
} from "./questionHistory";
import { 
  loadKnowledgeBase, 
  needsUpdate as kbNeedsUpdate 
} from "./youtubeAnalyzer";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBoK-kckzwlPkmusNv3_sFL2GtBkxoQ0xA" });
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
  // Cleanup history if needed
  if (needsCleanup()) {
    cleanupHistory();
  }

  // Load knowledge base for enhanced strategies
  const kb = loadKnowledgeBase();
  const kbStrategies = kb?.reading.strategies.slice(0, 5).join('\n- ') || '';
  const kbTips = kb?.reading.tips.slice(0, 5).join('\n- ') || '';

  // If no topic specified, suggest underused topics
  if (!topic) {
    const allTopics = ['Biology', 'History', 'Art', 'Geology', 'Astronomy', 'Archaeology', 'Psychology', 'Economics', 'Environmental Science', 'Literature'];
    const underused = getUnderusedTopics('Reading', allTopics);
    if (underused.length > 0) {
      topic = underused[Math.floor(Math.random() * underused.length)];
      console.log(`Selected underused topic for variety: ${topic}`);
    }
  }

  let userPrompt = topic 
    ? `Generate a TOEFL Reading passage about "${topic}".`
    : `Generate a TOEFL Reading passage on a random academic topic (Biology, History, Art, or Geology).`;

  if (isIntensive && weakCategory) {
    userPrompt = `INTENSIVE TRAINING MODE. Generate a shorter passage (3-4 paragraphs) but create questions focused specifically on "${weakCategory}" (e.g. Inference, Vocabulary, Insert Text).`;
  }

  const systemInstruction = `
    You are an expert TOEFL test content generator, simulating ETS TPO (Test Practice Online) standards.
    
    ${kb && kbStrategies ? `**EXPERT STRATEGIES (from YouTube instructors)**:\n- ${kbStrategies}\n` : ''}
    
    1. **PASSAGE CREATION**:
       - Tone: Strictly Academic, University Textbook style.
       - Length: Approx 700 words (unless Intensive Mode).
       - Structure: Intro (Thesis) -> Body Paragraphs (Details/Arguments) -> Conclusion.
       - Formatting: **NO HTML**. Use markdown **bold** for vocabulary emphasis.
       - **INSERT TEXT MARKER (ABSOLUTELY REQUIRED)**: You MUST insert the EXACT marker "[■]" (square brackets containing a black square symbol U+25A0) exactly 4 times within ONE specific paragraph.
         * MANDATORY: Use this EXACT string: [■]
         * Place at natural sentence boundaries (between sentences)
         * Example paragraph: "Sentence one.[■] Sentence two here.[■] Another sentence.[■] Final sentence.[■] Conclusion."
         * This is CRITICAL for the "Insert Text" question to function properly.

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
       ${kb && kbTips ? `- ${kbTips}\n` : ''}
       - Provide tips in the style of top TOEFL instructors (like TST Prep or Juva).
       - Focus on: "Elimination strategy", "Identifying extreme words (always, never)", and "Finding the keyword connection".
  `;

  // Generate with retry logic for duplicates
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: readingResponseSchema,
        temperature: 0.3 + (attempts * 0.2), // Increase randomness on retry
      },
    });

    const content = JSON.parse(response.text!) as GeneratedContent;
    
    // Check for duplicates
    const fingerprint = createQuestionFingerprint('Reading', content);
    if (!isQuestionDuplicate(fingerprint)) {
      // Save to history
      addQuestionToHistory(fingerprint);
      return content;
    }

    console.warn(`Duplicate detected on attempt ${attempts + 1}, regenerating...`);
    attempts++;
  }

  // If all attempts failed, return anyway but log warning
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: readingResponseSchema,
      temperature: 0.8, // High randomness
    },
  });

  const content = JSON.parse(response.text!) as GeneratedContent;
  const fingerprint = createQuestionFingerprint('Reading', content);
  addQuestionToHistory(fingerprint);
  
  console.warn('Generated content may be similar to previous questions');
  return content;
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
    let questionType: string | undefined = undefined;
    
    // Weighted selection for variety
    if (taskTypeRoll < 0.5) {
        // Independent Task (50% chance) - Randomly select one of 5 types
        const independentTypes = [
            { type: 'AGREE_DISAGREE', example: 'Do you agree or disagree that students should bring their cellphones to school?' },
            { type: 'PREFERENCE', example: 'Would you prefer to have a higher-paying job with longer hours or a lower-paying job with shorter hours?' },
            { type: 'HYPOTHETICAL', example: 'If your friends from another country are going to visit your country, where do you suggest they go?' },
            { type: 'OPINION', example: 'Do you think bicycles will still be widely used in the future or replaced by other means of transportation?' },
            { type: 'DESCRIBE', example: 'Describe the most impressive moment in your life.' }
        ];
        
        const selectedType = independentTypes[Math.floor(Math.random() * independentTypes.length)];
        questionType = selectedType.type;
        promptText = `Generate Task 1 (Independent - ${selectedType.type}): Create a question similar to "${selectedType.example}"`;
    } else if (taskTypeRoll < 0.65) {
        promptText = "Generate Task 2 (Campus Situation): University Announcement (Reading) + Student Conversation (Listening).";
    } else if (taskTypeRoll < 0.8) {
        promptText = "Generate Task 3 (Academic Concept): General Concept (Reading) + Specific Example (Listening).";
    } else {
        promptText = "Generate Task 4 (Academic Lecture): Summary of a lecture topic.";
    }

    const systemInstruction = `
       Generate a TOEFL Speaking Task conforming to ETS Standards.
       
       **Task 1 (Independent) - 5 Question Types**:
       
       1. **AGREE_DISAGREE**: Present a statement and ask for agreement/disagreement.
          - Example: "Do you agree or disagree that students should bring their cellphones to school?"
          - Format: Clear yes/no stance with 2-3 supporting reasons
       
       2. **PREFERENCE**: Present two options and ask for preference.
          - Example: "Would you prefer to have a higher-paying job with longer hours or a lower-paying job with shorter hours?"
          - Format: State preference clearly, explain advantages/disadvantages
       
       3. **HYPOTHETICAL**: Present a hypothetical situation and ask for suggestions.
          - Example: "If your friends from another country are going to visit your country, where do you suggest they go?"
          - Format: Give specific suggestions with reasons
       
       4. **OPINION**: Ask for opinion on a future trend or general topic.
          - Example: "Do you think bicycles will still be widely used in the future or replaced by other means of transportation?"
          - Format: State opinion with supporting evidence or predictions
       
       5. **DESCRIBE**: Ask to describe a personal experience or memory.
          - Example: "Describe the most impressive moment in your life."
          - Format: Narrative structure with details and emotions
       
       - Prep: 15s, Speak: 45s for all Independent tasks.
       
       **Task 2 (Integrated - Campus)**:
       - Reading: A university announcement proposing a CHANGE.
       - Listening (Transcript): Two students discussion. Format as "Student 1: [text]\\nStudent 2: [text]" for multi-speaker TTS.
       - **Japanese Listening Transcript**: Provide a Japanese translation of the conversation.
       - Prompt: "The woman/man expresses his/her opinion. State the opinion and the reasons given."
       
       **Task 3 (Integrated - Academic)**:
       - Reading: Define an academic concept.
       - Listening (Transcript): "Professor: [text]" format for TTS. Professor gives a specific EXAMPLE illustrating the concept.
       - **Japanese Listening Transcript**: Provide a Japanese translation of the lecture.
       - Prompt: "Describe the concept of X and how the professor's example illustrates it."
       
       **Task 4 (Integrated - Lecture)**:
       - Listening (Transcript): "Professor: [text]" format. Professor discusses a topic with TWO distinct examples.
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
        questionType: questionType as any,
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

// --- VOCABULARY ENHANCEMENT ---

export const generateContextExamples = async (word: string, definition: string): Promise<{
    academic: string;
    daily: string;
    business: string;
    political: string;
}> => {
    const exampleSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            academic: { type: Type.STRING },
            daily: { type: Type.STRING },
            business: { type: Type.STRING },
            political: { type: Type.STRING }
        },
        required: ["academic", "daily", "business", "political"]
    };

    const prompt = `
Generate 4 example sentences for the word/phrase "${word}" (meaning: ${definition}) in different contexts:

1. **Academic Context**: A sentence that would appear in academic writing, research papers, or university lectures.
2. **Daily Conversation Context**: A casual, everyday sentence that native speakers would use in informal settings.
3. **Business Context**: A professional sentence suitable for business meetings, emails, or corporate communications.
4. **Political Context**: A sentence related to politics, government, or international relations.

**Requirements**:
- Each sentence must naturally use the word "${word}"
- Sentences should be 10-20 words long
- Use varied vocabulary and sentence structures
- Make sentences realistic and contextually appropriate
- Ensure the word is used correctly according to its definition

Respond in JSON format with keys: academic, daily, business, political
`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: exampleSchema,
            temperature: 0.8,
        },
    });

    return JSON.parse(response.text || '{"academic":"","daily":"","business":"","political":""}');
};

// --- GRADING & ANALYSIS ---

export const gradeWritingResponse = async (task: WritingTask, userResponse: string): Promise<{ score: number, feedback: string }> => {
    const isIntegrated = task.type === 'INTEGRATED';
    
    const prompt = `
      Act as a certified TOEFL iBT Writing Rater using the OFFICIAL ETS TOEFL Scoring Rubric.
      
      **Task Type**: ${task.type}
      **Question**: ${task.question}
      
      **OFFICIAL TOEFL iBT WRITING RUBRIC (0-5 Scale)**:
      
      ${isIntegrated ? `
      **INTEGRATED WRITING TASK RUBRIC**:
      
      **SCORE 5 (High)**
      • Successfully selects important information from lecture and presents it coherently in relation to reading
      • Well organized; occasional language errors do not result in inaccurate presentation of content
      • Minor lexical or grammatical errors
      
      **SCORE 4 (Good)**
      • Generally good in selecting important information and presenting it in relation to reading
      • Coherent; minor omissions or inaccuracies acceptable
      • Some language errors but meaning generally clear
      
      **SCORE 3 (Fair)**
      • Contains some important information but may have omissions or inaccuracies
      • May omit key point or contain vague/incorrect information
      • Errors may obscure connections or meaning
      
      **SCORE 2 (Limited)**
      • Contains some relevant information but significant omissions/inaccuracies
      • Limited development; marked language difficulties
      
      **SCORE 1 (Weak)**
      • Provides little or no meaningful response
      • Minimal content from source materials
      • Serious language difficulties
      
      **SCORE 0**
      • Merely copies from source, in language other than English, off-topic, or blank
      
      **EVALUATION CRITERIA FOR INTEGRATED WRITING**:
      1. **Accuracy**: Correctly identify and explain main points from lecture
      2. **Completeness**: Include all major points (typically 3 key points)
      3. **Relationship**: Clearly explain how lecture relates to/challenges reading
      4. **Organization**: Logical structure with clear connections
      5. **Language**: Grammar and vocabulary adequate to convey meaning
      6. **Objectivity**: No personal opinion (summary only)
      ` : `
      **INDEPENDENT WRITING TASK RUBRIC**:
      
      **SCORE 5 (High)**
      • Effectively addresses topic and task
      • Well organized and well developed; appropriate reasons, examples, details
      • Displays unity, progression, coherence
      • Displays consistent facility in language use
      • Minor lexical or grammatical errors
      
      **SCORE 4 (Good)**
      • Generally addresses topic/task; task may be somewhat developed
      • Generally well organized and developed; reasons/examples may lack detail
      • Displays unity and progression
      • Some variety in sentence structure and range of vocabulary
      • Occasional noticeable minor language errors
      
      **SCORE 3 (Fair)**
      • Addresses topic/task with some development
      • Display of organization or connection of ideas
      • May demonstrate inconsistent facility with complex structures
      • Inappropriate word choice or word form; accumulation of errors
      
      **SCORE 2 (Limited)**
      • Limited development of topic
      • Inadequate organization/connection of ideas
      • Limited range of vocabulary or frequent errors
      • Errors that obscure meaning
      
      **SCORE 1 (Weak)**
      • Seriously limited in development or lacks substance
      • Little organization
      • Serious and frequent errors in grammar/usage
      • Difficult to understand
      
      **SCORE 0**
      • Merely copies the prompt, in language other than English, off-topic, or blank
      
      **EVALUATION CRITERIA FOR INDEPENDENT WRITING**:
      1. **Thesis**: Clear position stated in introduction
      2. **Development**: Well-developed ideas with specific examples and details (minimum 300 words)
      3. **Organization**: Clear structure (intro, body paragraphs, conclusion); logical flow
      4. **Coherence**: Effective use of transitions; unity and progression of ideas
      5. **Language Use**: Variety in sentence structures; appropriate and accurate vocabulary
      6. **Grammar**: Grammatical accuracy; errors do not interfere with meaning
      `}
      
      **SOURCE MATERIALS FOR THIS RESPONSE**:
      - Reading Passage: ${task.reading || "N/A"}
      - Listening Transcript: ${task.listeningTranscript || "N/A"}
      
      **USER'S ESSAY**:
      "${userResponse}"
      
      **Word Count**: ${userResponse.split(/\s+/).length} words ${!isIntegrated ? '(minimum 300 recommended)' : '(150-225 recommended)'}
      
      **OUTPUT REQUIREMENTS**:
      1. **Score**: Integer from 0-5 based on official rubric
      2. **Feedback**: Comprehensive Japanese feedback (Start DIRECTLY with content, NO greeting phrases)
      
      **FEEDBACK STRUCTURE** (in Japanese):
      
      ## 📊 総合評価
      [Overall score and justification based on rubric level]
      
      ## 📝 評価項目別の分析
      
      ${isIntegrated ? `
      ### 1. 情報の正確性 (Accuracy)
      [Are main points from lecture correctly identified?]
      
      ### 2. 内容の完全性 (Completeness)
      [Are all major points included? Any omissions?]
      
      ### 3. Reading-Listening関係の説明 (Relationship)
      [How well is the relationship explained?]
      
      ### 4. 構成 (Organization)
      [Logical structure? Clear transitions?]
      
      ### 5. 言語使用 (Language)
      [Grammar and vocabulary evaluation]
      ` : `
      ### 1. 論点の明確性 (Thesis)
      [Is there a clear position/thesis statement?]
      
      ### 2. 内容の展開 (Development)
      [Quality and quantity of supporting details and examples]
      [Word count assessment]
      
      ### 3. 構成 (Organization)
      [Intro-Body-Conclusion structure]
      [Paragraph organization]
      
      ### 4. 一貫性 (Coherence)
      [Use of transitions]
      [Unity and logical flow]
      
      ### 5. 言語使用 (Language)
      [Sentence variety]
      [Vocabulary range and accuracy]
      [Grammatical accuracy]
      `}
      
      ## ✅ 良かった点
      [2-3 specific strengths with examples from essay]
      
      ## 📝 改善が必要な点
      [2-3 specific weaknesses with examples]
      [Specific error corrections with explanations]
      
      ## 🚀 スコアアップのための具体的アドバイス
      ${isIntegrated ? `
      - テンプレート活用: "The reading passage discusses... The lecturer challenges this by..."
      - 3つの主要ポイントを明確に
      - 個人的な意見は不要（客観的要約のみ）
      - パラフレーズを使い、直接コピーしない
      ` : `
      - より具体的な例や詳細を追加
      - トピックセンテンスを各段落に
      - 接続詞を効果的に使う（However, Furthermore, In addition, etc.）
      - 文の多様性を高める（simple, compound, complex sentences）
      - 最低300語を目指す
      `}
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

    const result = JSON.parse(response.text!);
    
    // Remove greeting phrases from feedback
    const greetingPatterns = [
      /^はい、承知しました。\s*/,
      /^はい、わかりました。\s*/,
      /^承知しました。\s*/,
      /^かしこまりました。\s*/,
      /^了解しました。\s*/,
    ];
    
    for (const pattern of greetingPatterns) {
      result.feedback = result.feedback.replace(pattern, '');
    }
    
    result.feedback = result.feedback.trim();
    
    return result;
};

export const gradeSpeakingResponse = async (task: SpeakingTask, transcript: string): Promise<{ score: number, feedback: string }> => {
     const prompt = `
      Act as a certified TOEFL iBT Speaking Rater using the OFFICIAL ETS TOEFL Scoring Rubric.
      
      **Task Type**: ${task.type}
      **Prompt**: ${task.prompt}
      
      **OFFICIAL TOEFL iBT SPEAKING RUBRIC (0-4 Scale)**:
      
      **SCORE 4 (Advanced)**
      • Delivery: Generally clear, fluid speech; good pronunciation; natural pacing; minor lapses do not affect overall intelligibility
      • Language Use: Effective use of grammar and vocabulary; displays sustained control of complex structures; minor errors do not obscure meaning
      • Topic Development: Response fully addresses the task; ideas are well developed and coherent; relationships between ideas are clear; use all or most of the time allowed
      
      **SCORE 3 (Good)**
      • Delivery: Speech generally clear with some fluidity; some minor pronunciation, intonation, or pacing issues; overall intelligibility not significantly affected
      • Language Use: Fairly automatic and effective use of grammar and vocabulary; range may be limited; errors do not seriously interfere with communication
      • Topic Development: Response generally addresses the task; ideas fairly well developed and coherent; relationships between ideas generally clear but may be incomplete or unclear in places
      
      **SCORE 2 (Fair)**
      • Delivery: Speech clear at times but with problems with pronunciation, intonation, or pacing; may require some listener effort
      • Language Use: Limited range and control of grammar and vocabulary; errors may obscure meaning at times
      • Topic Development: Response addresses task but development is limited; relationships between ideas may be unclear; may not use full time
      
      **SCORE 1 (Limited)**
      • Delivery: Consistent pronunciation, stress, and intonation difficulties; speech choppy or fragmented; significant listener effort required
      • Language Use: Very limited range and control of grammar and vocabulary; errors frequently obscure meaning
      • Topic Development: Limited relevant content; unclear connections between ideas; may fail to complete task
      
      **SCORE 0 (Weak)**
      • No response, only repeats prompt, off-topic, or in a language other than English
      
      **EVALUATION DIMENSIONS**:
      1. **Delivery** (発音・流暢さ):
         - Pronunciation clarity (individual sounds, word stress)
         - Natural pacing and rhythm
         - Fluency and smooth transitions
         - Intonation patterns
      
      2. **Language Use** (文法・語彙):
         - Grammatical accuracy and range (simple vs complex structures)
         - Vocabulary appropriateness and precision
         - Use of idiomatic expressions
         - Error frequency and impact on meaning
      
      3. **Topic Development** (内容の展開):
         - Completeness: Fully addresses all parts of the question
         - Coherence: Logical flow and organization of ideas
         - Detail: Appropriate examples and supporting information
         - ${task.type === 'INTEGRATED' ? 'Synthesis: Accurate integration of reading/listening content' : 'Reasoning: Clear explanations and justifications'}
         - Time management: Uses most/all of allowed time effectively
      
      **CONTEXT FOR THIS RESPONSE**:
      - Reading Material: ${task.reading || "N/A"}
      - Listening Transcript: ${task.listeningTranscript || "N/A"}
      - User's Speech Transcript: "${transcript}"
      
      **OUTPUT REQUIREMENTS**:
      1. **Score**: Integer from 0-4 based on official rubric
      2. **Feedback**: Comprehensive Japanese feedback (Start DIRECTLY with content, NO greeting phrases)
      
      **FEEDBACK STRUCTURE** (in Japanese):
      
      ## 📊 総合評価
      [Overall assessment and score justification]
      
      ## 🎯 各評価項目の分析
      
      ### 1. Delivery (発音・流暢さ)
      [Specific comments on pronunciation, pacing, fluency]
      [Score level for this dimension: 1-4]
      
      ### 2. Language Use (文法・語彙)
      [Specific comments on grammar and vocabulary]
      [Notable errors and suggestions]
      [Score level for this dimension: 1-4]
      
      ### 3. Topic Development (内容の展開)
      [Completeness of response]
      [Quality of examples/details]
      [Organization and coherence]
      [Score level for this dimension: 1-4]
      
      ## ✅ 良かった点
      [2-3 specific strengths]
      
      ## 📝 改善点
      [2-3 specific areas for improvement with examples]
      
      ## 🚀 スコアアップのための具体的アドバイス
      [Actionable tips based on official TOEFL strategies]
      ${task.type === 'INTEGRATED' ? '- テンプレート例: "The reading passage states that... However, the professor argues that..."' : '- 個人的な経験を具体的に述べる'}
      - 時間管理のコツ
      - よく使える表現やフレーズ
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

    const result = JSON.parse(response.text!);
    
    // Remove greeting phrases from feedback
    const greetingPatterns = [
      /^はい、承知しました。\s*/,
      /^はい、わかりました。\s*/,
      /^承知しました。\s*/,
      /^かしこまりました。\s*/,
      /^了解しました。\s*/,
    ];
    
    for (const pattern of greetingPatterns) {
      result.feedback = result.feedback.replace(pattern, '');
    }
    
    result.feedback = result.feedback.trim();
    
    return result;
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
  
  // Remove greeting phrases like "はい、承知しました。" from the beginning
  let analysis = response.text || "解析できませんでした。";
  const greetingPatterns = [
    /^はい、承知しました。\s*/,
    /^はい、わかりました。\s*/,
    /^承知しました。\s*/,
    /^かしこまりました。\s*/,
    /^了解しました。\s*/,
  ];
  
  for (const pattern of greetingPatterns) {
    analysis = analysis.replace(pattern, '');
  }
  
  return analysis.trim();
}

export const generateHistoryAnalysis = async (history: PerformanceRecord[]): Promise<string> => {
    // 1. Group Data by Section (Reading, Listening, Speaking, Writing)
    const sections: Record<string, Record<string, { correct: number, total: number }>> = {
        'Reading': {},
        'Listening': {},
        'Speaking': {},
        'Writing': {}
    };
    
    // 2. Track Speaking question types separately
    const speakingTypes: Record<string, { correct: number, total: number }> = {};

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
        
        // Track Speaking question types
        if (mainSection === 'Speaking' && record.questionType) {
            const qType = record.questionType;
            if (!speakingTypes[qType]) {
                speakingTypes[qType] = { correct: 0, total: 0 };
            }
            speakingTypes[qType].correct += record.correct;
            speakingTypes[qType].total += record.total;
        }
    });

    const prompt = `
        You are an elite TOEFL Tutor. Analyze the student's performance history data below.
        
        **Overall Performance Data:**
        ${JSON.stringify(sections, null, 2)}
        
        **Speaking Question Type Breakdown:**
        ${JSON.stringify(speakingTypes, null, 2)}
        
        Question Type Meanings:
        - AGREE_DISAGREE: 賛成/反対 (e.g., "Do you agree or disagree that...")
        - PREFERENCE: 2択 (e.g., "Would you prefer A or B?")
        - HYPOTHETICAL: 仮定 (e.g., "If your friends visit, where would you suggest?")
        - OPINION: 自由意見 (e.g., "Do you think X will happen in the future?")
        - DESCRIBE: 描写 (e.g., "Describe the most impressive moment...")
        
        Provide a **Comprehensive Performance Report in Japanese** using standard Markdown.
        
        **RESPONSE STRUCTURE (Strictly Follow):**

        # 📊 TOEFL Performance Report

        (For EACH Section that has data - Reading/Listening/Speaking/Writing):
        ## [Icon] [Section Name] Section
        ### 📉 弱点と傾向 (Weakness Analysis)
        - Analyze the sub-categories or scores.
        - **For Speaking Section**: Analyze performance by question type (AGREE_DISAGREE, PREFERENCE, etc.)
        - Explain *why* the student might be failing (e.g., "AGREE_DISAGREE questions require clear thesis statement...").
        ### 🚀 具体的対策 (Actionable Training)
        - Provide specific exercises (e.g., "Shadowing for Listening", "Template usage for Speaking").
        - **For Speaking Section**: Provide type-specific strategies:
          - AGREE_DISAGREE: テンプレート「I strongly agree/disagree because...」
          - PREFERENCE: 比較対照テクニック
          - HYPOTHETICAL: 具体的な提案と理由
          - OPINION: 根拠と予測の組み合わせ
          - DESCRIBE: 時系列・感情の描写
        
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

/**
 * Generate Grammar Questions based on Cambridge Grammar principles
 * @param level - Grammar difficulty level (BEGINNER, INTERMEDIATE, ADVANCED)
 * @param count - Number of questions to generate (default: 10)
 */
export const generateGrammarQuestions = async (
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  count: number = 10
) => {
  const grammarPointsByLevel = {
    BEGINNER: [
      'Present Simple vs Present Continuous',
      'Past Simple',
      'be動詞 (am/is/are/was/were)',
      'have/has',
      'can/could',
      '単数形・複数形',
      '冠詞 (a/an/the)',
      '前置詞 (in/on/at)',
      'some/any',
      'There is/There are'
    ],
    INTERMEDIATE: [
      'Present Perfect',
      'Past Perfect',
      'Future forms (will/going to)',
      '受動態 (Passive Voice)',
      '関係代名詞 (who/which/that)',
      '条件文 (If clauses)',
      '不定詞 vs 動名詞',
      '比較級・最上級',
      '仮定法過去',
      'Modal verbs (must/should/might)'
    ],
    ADVANCED: [
      '完了進行形',
      '分詞構文',
      '仮定法過去完了',
      '関係副詞 (where/when/why)',
      '強調構文 (It is...that)',
      '倒置',
      '省略',
      'wish/if only',
      '間接話法',
      '複雑な時制の一致'
    ]
  };

  const bookReference = {
    BEGINNER: 'Essential Grammar in Use (Cambridge)',
    INTERMEDIATE: 'English Grammar in Use (Cambridge)',
    ADVANCED: 'Advanced Grammar in Use (Cambridge)'
  };

  const grammarPoints = grammarPointsByLevel[level];
  const selectedPoints = grammarPoints.sort(() => Math.random() - 0.5).slice(0, Math.min(count, grammarPoints.length));

  const grammarQuestionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            grammarPoint: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ['id', 'text']
              }
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            example: { type: Type.STRING }
          },
          required: ['grammarPoint', 'question', 'options', 'correctAnswer', 'explanation', 'example']
        }
      }
    },
    required: ['questions']
  };

  const prompt = `
    Generate ${count} grammar questions based on Cambridge Grammar principles.
    Level: ${level}
    
    Grammar Points to Cover:
    ${selectedPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
    
    Reference Book: ${bookReference[level]}
    
    **REQUIREMENTS:**
    1. Each question should test ONE specific grammar point
    2. Provide 4 options (A, B, C, D) with exactly ONE correct answer
    3. Make distractors realistic and test common mistakes
    4. Explanation should be clear and in Japanese
    5. Example sentence should demonstrate correct usage
    
    **QUESTION FORMAT:**
    - Question: A clear sentence with a blank or a grammar correction task
    - Options: 4 realistic choices
    - Correct Answer: The option ID (e.g., "opt_0")
    - Explanation: Why this is correct and why others are wrong (in Japanese)
    - Example: A natural example sentence using the correct grammar
    
    **EXAMPLE (Present Perfect):**
    Question: "I _____ to Paris three times."
    Options:
      A) go
      B) have gone
      C) went
      D) am going
    Correct: B
    Explanation: 過去から現在までの経験を表す場合は現在完了形 (have/has + 過去分詞) を使います。"three times"という回数を示す表現と共に使われることが多いです。
    Example: "She has visited Japan twice."
    
    Generate varied question types:
    - Fill in the blank
    - Error correction
    - Choose the correct form
    - Sentence transformation
    
    Make questions progressively challenging within the ${level} level.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: grammarQuestionSchema,
      }
    });

    const data = JSON.parse(response.text);
    
    // Transform to GrammarQuestion format
    const questions = data.questions.map((q: any, idx: number) => ({
      id: `grammar_${level}_${Date.now()}_${idx}`,
      level: level,
      grammarPoint: q.grammarPoint,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      example: q.example,
      reference: `${bookReference[level]} - ${q.grammarPoint}`
    }));

    return questions;
  } catch (error) {
    console.error('Grammar generation error:', error);
    throw new Error('文法問題の生成に失敗しました');
  }
};