import {PRICE_SNAPSHOT} from './pricing-snapshot.js';
// RunLog Prompt Pricer - reference metadata plus a versioned provider price snapshot
// Unmatched legacy rows retain unknown-date reference rates; never label them current.
// Prices in USD per 1,000,000 tokens (or per unit/minute/image for generative media)

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/models';
export const CACHE_KEY_OPENROUTER = 'runlog_openrouter_models_cache';
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const COHORTS = {
  FRONTIER: 'frontier',
  WORKHORSE: 'workhorse',
  MEDIA: 'media'
};

export const PROVIDERS = {
  ANTHROPIC: 'Anthropic',
  OPENAI: 'OpenAI',
  GOOGLE: 'Google',
  DEEPSEEK: 'DeepSeek',
  META: 'Meta / LLaMA',
  MISTRAL: 'Mistral AI',
  XAI: 'xAI',
  COHERE: 'Cohere',
  FAL: 'fal.ai',
  ELEVENLABS: 'ElevenLabs',
  MIDJOURNEY: 'Midjourney',
  RUNWAY: 'Runway'
};

export const MODELS_DATA = [
  // =========================================================================
  // COHORT 1: TOP FRONTIER & EXTENDED REASONING
  // =========================================================================
  {
    id: 'claude-3-7-sonnet-thinking',
    name: 'Claude 3.7 Sonnet (Extended Thinking)',
    provider: PROVIDERS.ANTHROPIC,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
    thinkingPricePerM: 15.00,
    cachedInputPricePerM: 0.30, // 90% cache discount
    cacheWritePricePerM: 3.75,
    contextWindow: 200000,
    maxOutput: 64000,
    supportsThinking: true,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 1200,
    description: 'Hybrid reasoning frontier model with dynamic or budget-capped thinking tokens.'
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet (Standard)',
    provider: PROVIDERS.ANTHROPIC,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
    cachedInputPricePerM: 0.30,
    contextWindow: 200000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 650,
    description: 'Premier frontier coding & agentic orchestration engine.'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet (v2)',
    provider: PROVIDERS.ANTHROPIC,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
    cachedInputPricePerM: 0.30,
    contextWindow: 200000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 700,
    description: 'Industry benchmark for software development and computer use.'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: PROVIDERS.ANTHROPIC,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 15.00,
    outputPricePerM: 75.00,
    cachedInputPricePerM: 1.50,
    contextWindow: 200000,
    maxOutput: 4096,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 1800,
    description: 'Maximum depth for high-stakes philosophical and architectural synthesis.'
  },
  {
    id: 'openai-o1',
    name: 'OpenAI o1',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 15.00,
    outputPricePerM: 60.00,
    thinkingPricePerM: 60.00,
    cachedInputPricePerM: 7.50,
    contextWindow: 200000,
    maxOutput: 100000,
    supportsThinking: true,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 2800,
    description: 'Full-scale reasoning model designed for complex science, math and code.'
  },
  {
    id: 'openai-o3-mini-high',
    name: 'OpenAI o3-mini (High Effort)',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 1.10,
    outputPricePerM: 4.40,
    thinkingPricePerM: 4.40,
    cachedInputPricePerM: 0.55,
    contextWindow: 200000,
    maxOutput: 100000,
    supportsThinking: true,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 1400,
    description: 'Cost-efficient STEM reasoning model with deep chain-of-thought exploration.'
  },
  {
    id: 'openai-o3-mini-medium',
    name: 'OpenAI o3-mini (Medium Effort)',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 1.10,
    outputPricePerM: 4.40,
    thinkingPricePerM: 4.40,
    cachedInputPricePerM: 0.55,
    contextWindow: 200000,
    maxOutput: 100000,
    supportsThinking: true,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 900,
    description: 'Balanced speed and reasoning for agent loops and code generation.'
  },
  {
    id: 'openai-o1-mini',
    name: 'OpenAI o1-mini',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 1.10,
    outputPricePerM: 4.40,
    thinkingPricePerM: 4.40,
    cachedInputPricePerM: 0.55,
    contextWindow: 128000,
    maxOutput: 65536,
    supportsThinking: true,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 950,
    description: 'Fast STEM reasoning model predecessor.'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 2.50,
    outputPricePerM: 10.00,
    cachedInputPricePerM: 1.25,
    contextWindow: 128000,
    maxOutput: 16384,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: true,
    latencyMs: 520,
    description: 'Versatile multimodal flagship for text, vision, and structured data.'
  },
  {
    id: 'gpt-4-5-preview',
    name: 'GPT-4.5 Preview',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 75.00,
    outputPricePerM: 150.00,
    cachedInputPricePerM: 37.50,
    contextWindow: 128000,
    maxOutput: 16384,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 1600,
    description: 'Massive scale foundational model with nuanced EQ and broad knowledge.'
  },
  {
    id: 'gemini-2-0-pro-exp',
    name: 'Gemini 2.0 Pro Experimental',
    provider: PROVIDERS.GOOGLE,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 1.75,
    outputPricePerM: 7.00,
    thinkingPricePerM: 7.00,
    cachedInputPricePerM: 0.4375,
    contextWindow: 2000000,
    maxOutput: 8192,
    supportsThinking: true,
    supportsVision: true,
    supportsAudio: true,
    latencyMs: 850,
    description: '2M context flagship with competitive coding and benchmark scores.'
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    provider: PROVIDERS.GOOGLE,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 1.25,
    outputPricePerM: 5.00,
    cachedInputPricePerM: 0.3125,
    contextWindow: 2000000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: true,
    latencyMs: 980,
    description: 'Massive 2M token context window ideal for codebase-wide RAG and video analysis.'
  },
  {
    id: 'grok-3-beta',
    name: 'Grok 3 (Beta)',
    provider: PROVIDERS.XAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 4.00,
    outputPricePerM: 20.00,
    cachedInputPricePerM: 2.00,
    contextWindow: 131072,
    maxOutput: 16384,
    supportsThinking: true,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 800,
    description: 'Colossus cluster trained flagship with real-time X knowledge.'
  },
  {
    id: 'grok-2',
    name: 'Grok 2',
    provider: PROVIDERS.XAI,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 2.00,
    outputPricePerM: 10.00,
    cachedInputPricePerM: 1.00,
    contextWindow: 131072,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 720,
    description: 'Frontier reasoning and real-time retrieval model.'
  },
  {
    id: 'deepseek-r1-official',
    name: 'DeepSeek R1 (Direct API)',
    provider: PROVIDERS.DEEPSEEK,
    cohort: COHORTS.FRONTIER,
    inputPricePerM: 0.55,
    outputPricePerM: 2.19,
    thinkingPricePerM: 2.19,
    cachedInputPricePerM: 0.14,
    contextWindow: 64000,
    maxOutput: 8192,
    supportsThinking: true,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 1350,
    description: 'Open-weights reasoning powerhouse on par with OpenAI o1 at ~1/25th cost.'
  },

  // =========================================================================
  // COHORT 2: WORKHORSE & HIGH-SPEED OPEN WEIGHTS
  // =========================================================================
  {
    id: 'gemini-2-0-flash',
    name: 'Gemini 2.0 Flash',
    provider: PROVIDERS.GOOGLE,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.10,
    outputPricePerM: 0.40,
    cachedInputPricePerM: 0.025,
    contextWindow: 1000000,
    maxOutput: 8192,
    supportsThinking: true,
    supportsVision: true,
    supportsAudio: true,
    latencyMs: 240,
    description: 'Sub-300ms multimodal powerhouse with 1M context at disruptive pricing.'
  },
  {
    id: 'gemini-2-0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    provider: PROVIDERS.GOOGLE,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.075,
    outputPricePerM: 0.30,
    cachedInputPricePerM: 0.01875,
    contextWindow: 1000000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 180,
    description: 'Ultra-low-latency utility model for high-frequency micro-agents.'
  },
  {
    id: 'gemini-1-5-flash',
    name: 'Gemini 1.5 Flash',
    provider: PROVIDERS.GOOGLE,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.075,
    outputPricePerM: 0.30,
    cachedInputPricePerM: 0.01875,
    contextWindow: 1000000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: true,
    latencyMs: 310,
    description: 'High-throughput long-context summarizer and extractor.'
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 (Direct API)',
    provider: PROVIDERS.DEEPSEEK,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.14,
    outputPricePerM: 0.28,
    cachedInputPricePerM: 0.014,
    contextWindow: 64000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 380,
    description: '671B parameter MoE flagship delivering frontier quality at budget rates.'
  },
  {
    id: 'deepseek-r1-groq',
    name: 'DeepSeek R1 (Groq LPU)',
    provider: 'Groq',
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.75,
    outputPricePerM: 0.99,
    thinkingPricePerM: 0.99,
    cachedInputPricePerM: 0.75,
    contextWindow: 131072,
    maxOutput: 8192,
    supportsThinking: true,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 190,
    description: 'Ultra-fast token streaming (~280 tokens/sec) on Groq LPU hardware.'
  },
  {
    id: 'deepseek-r1-together',
    name: 'DeepSeek R1 (Together AI)',
    provider: 'Together AI',
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.55,
    outputPricePerM: 2.19,
    thinkingPricePerM: 2.19,
    cachedInputPricePerM: 0.55,
    contextWindow: 131072,
    maxOutput: 8192,
    supportsThinking: true,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 620,
    description: 'Serverless deployment with 131k context window support.'
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: PROVIDERS.ANTHROPIC,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.80,
    outputPricePerM: 4.00,
    cachedInputPricePerM: 0.08,
    contextWindow: 200000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 290,
    description: 'Next-gen lightning-fast model rivaling Claude 3 Opus on standard benchmarks.'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o-mini',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.15,
    outputPricePerM: 0.60,
    cachedInputPricePerM: 0.075,
    contextWindow: 128000,
    maxOutput: 16384,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 340,
    description: 'Default small model replacing GPT-3.5 Turbo across enterprise pipelines.'
  },
  {
    id: 'llama-3-3-70b-fireworks',
    name: 'LLaMA 3.3 70B (Fireworks)',
    provider: 'Fireworks AI',
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.90,
    outputPricePerM: 0.90,
    cachedInputPricePerM: 0.90,
    contextWindow: 131072,
    maxOutput: 4096,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 260,
    description: 'State-of-the-art 70B open model matching LLaMA 3.1 405B capabilities.'
  },
  {
    id: 'llama-3-3-70b-groq',
    name: 'LLaMA 3.3 70B Versatile (Groq)',
    provider: 'Groq',
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.59,
    outputPricePerM: 0.79,
    cachedInputPricePerM: 0.59,
    contextWindow: 131072,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 140,
    description: 'Sub-150ms time-to-first-token open weights inference.'
  },
  {
    id: 'llama-3-1-405b-together',
    name: 'LLaMA 3.1 405B (Together AI)',
    provider: 'Together AI',
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 3.50,
    outputPricePerM: 3.50,
    cachedInputPricePerM: 3.50,
    contextWindow: 131072,
    maxOutput: 4096,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 820,
    description: 'Massive open-weight frontier model for synthetic data and distillation.'
  },
  {
    id: 'qwen-2-5-72b-deepinfra',
    name: 'Qwen 2.5 72B Instruct (DeepInfra)',
    provider: 'DeepInfra',
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.35,
    outputPricePerM: 0.40,
    cachedInputPricePerM: 0.35,
    contextWindow: 131072,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 310,
    description: 'Top-ranking open model for multilingual and coding precision.'
  },
  {
    id: 'qwen-2-5-coder-32b',
    name: 'Qwen 2.5 Coder 32B (Together)',
    provider: 'Together AI',
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.80,
    outputPricePerM: 0.80,
    cachedInputPricePerM: 0.80,
    contextWindow: 32768,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 250,
    description: 'Specialized code generation and refactoring open model.'
  },
  {
    id: 'mistral-large-2411',
    name: 'Mistral Large 2 (2411)',
    provider: PROVIDERS.MISTRAL,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 2.00,
    outputPricePerM: 6.00,
    cachedInputPricePerM: 2.00,
    contextWindow: 128000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 540,
    description: 'Flagship multilingual reasoning and tool-calling model.'
  },
  {
    id: 'codestral-2501',
    name: 'Codestral 2501',
    provider: PROVIDERS.MISTRAL,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.30,
    outputPricePerM: 0.90,
    cachedInputPricePerM: 0.30,
    contextWindow: 256000,
    maxOutput: 8192,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 270,
    description: 'Specialized 256k-context model optimized for fill-in-the-middle code tasks.'
  },
  {
    id: 'mistral-small-3',
    name: 'Mistral Small 3',
    provider: PROVIDERS.MISTRAL,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.20,
    outputPricePerM: 0.60,
    cachedInputPricePerM: 0.20,
    contextWindow: 32768,
    maxOutput: 4096,
    supportsThinking: false,
    supportsVision: true,
    supportsAudio: false,
    latencyMs: 210,
    description: 'Lightweight enterprise engine with native vision support.'
  },
  {
    id: 'cohere-command-r-plus',
    name: 'Command R+ (08-2024)',
    provider: PROVIDERS.COHERE,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 2.50,
    outputPricePerM: 10.00,
    cachedInputPricePerM: 2.50,
    contextWindow: 128000,
    maxOutput: 4096,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 650,
    description: 'Optimized for high-precision enterprise RAG and multi-step tool citations.'
  },
  {
    id: 'cohere-command-r',
    name: 'Command R',
    provider: PROVIDERS.COHERE,
    cohort: COHORTS.WORKHORSE,
    inputPricePerM: 0.15,
    outputPricePerM: 0.60,
    cachedInputPricePerM: 0.15,
    contextWindow: 128000,
    maxOutput: 4096,
    supportsThinking: false,
    supportsVision: false,
    supportsAudio: false,
    latencyMs: 320,
    description: 'Cost-effective engine for search augmentation and entity extraction.'
  },

  // =========================================================================
  // COHORT 3: GENERATIVE MEDIA, AUDIO & VISION PIPELINES
  // =========================================================================
  {
    id: 'fal-flux-schnell',
    name: 'FLUX.1 Schnell (fal.ai)',
    provider: PROVIDERS.FAL,
    cohort: COHORTS.MEDIA,
    mediaType: 'image',
    unitName: 'image',
    costPerUnit: 0.003,
    inputPricePerM: 0,
    outputPricePerM: 0,
    latencyMs: 450,
    description: '4-step high-speed distillation for real-time visual generation.'
  },
  {
    id: 'fal-flux-dev',
    name: 'FLUX.1 Dev (fal.ai)',
    provider: PROVIDERS.FAL,
    cohort: COHORTS.MEDIA,
    mediaType: 'image',
    unitName: 'image',
    costPerUnit: 0.025,
    inputPricePerM: 0,
    outputPricePerM: 0,
    latencyMs: 2400,
    description: 'Open-weight non-commercial visual powerhouse with exceptional typography.'
  },
  {
    id: 'fal-flux-pro-1-1',
    name: 'FLUX 1.1 Pro (fal.ai)',
    provider: PROVIDERS.FAL,
    cohort: COHORTS.MEDIA,
    mediaType: 'image',
    unitName: 'image',
    costPerUnit: 0.05,
    inputPricePerM: 0,
    outputPricePerM: 0,
    latencyMs: 3100,
    description: 'Next-gen enterprise image synthesis with high prompt compliance.'
  },
  {
    id: 'openai-gpt-4o-realtime-audio',
    name: 'GPT-4o Realtime Audio API',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.MEDIA,
    mediaType: 'audio',
    unitName: 'audio min',
    inputPricePerM: 100.00,
    outputPricePerM: 200.00,
    costPerUnit: 0.06,
    contextWindow: 128000,
    latencyMs: 320,
    description: 'Direct speech-to-speech websocket connection with emotive modulation.'
  },
  {
    id: 'openai-whisper',
    name: 'Whisper Large v3 (OpenAI)',
    provider: PROVIDERS.OPENAI,
    cohort: COHORTS.MEDIA,
    mediaType: 'audio',
    unitName: 'audio min',
    costPerUnit: 0.006,
    inputPricePerM: 0,
    outputPricePerM: 0,
    latencyMs: 1800,
    description: 'Robust multilingual automatic speech recognition (ASR).'
  },
  {
    id: 'elevenlabs-multilingual-v2',
    name: 'ElevenLabs Multilingual v2',
    provider: PROVIDERS.ELEVENLABS,
    cohort: COHORTS.MEDIA,
    mediaType: 'voice',
    unitName: '1k chars',
    costPerUnit: 0.15,
    inputPricePerM: 0,
    outputPricePerM: 0,
    latencyMs: 400,
    description: 'Hyper-realistic AI voice cloning and speech synthesis.'
  },
  {
    id: 'midjourney-v6-1',
    name: 'Midjourney v6.1 (Avg Fast GPU)',
    provider: PROVIDERS.MIDJOURNEY,
    cohort: COHORTS.MEDIA,
    mediaType: 'image',
    unitName: 'image',
    costPerUnit: 0.045,
    inputPricePerM: 0,
    outputPricePerM: 0,
    latencyMs: 25000,
    description: 'Photorealistic composition, texture and cinematic rendering.'
  },
  {
    id: 'runway-gen3-alpha-turbo',
    name: 'Runway Gen-3 Alpha Turbo',
    provider: PROVIDERS.RUNWAY,
    cohort: COHORTS.MEDIA,
    mediaType: 'video',
    unitName: '5s video',
    costPerUnit: 0.25,
    inputPricePerM: 0,
    outputPricePerM: 0,
    latencyMs: 30000,
    description: 'High-fidelity cinematic generative video clips.'
  }
];

// Active registry initialized with curated base models
export const MODEL_ALIASES = Object.freeze({
  'gpt-4o':'openai/gpt-4o','gpt-4o-mini':'openai/gpt-4o-mini','openai-o1':'openai/o1','openai-o1-mini':'openai/o1-mini',
  'gpt-4-5-preview':'openai/gpt-4.5-preview','claude-3-7-sonnet':'anthropic/claude-3.7-sonnet',
  'claude-3-5-sonnet':'anthropic/claude-3.5-sonnet','claude-3-opus':'anthropic/claude-3-opus','claude-3-5-haiku':'anthropic/claude-3.5-haiku',
  'gemini-2-0-flash':'google/gemini-2.0-flash-001','gemini-2-0-flash-lite':'google/gemini-2.0-flash-lite-001',
  'gemini-1-5-pro':'google/gemini-pro-1.5','gemini-1-5-flash':'google/gemini-flash-1.5',
  'deepseek-r1-official':'deepseek/deepseek-r1','deepseek-v3':'deepseek/deepseek-chat','qwen-2-5-coder-32b':'qwen/qwen-2.5-coder-32b-instruct',
  'mistral-large-2411':'mistralai/mistral-large-2411','codestral-2501':'mistralai/codestral-2501',
  'cohere-command-r-plus':'cohere/command-r-plus','cohere-command-r':'cohere/command-r'
});
export let ACTIVE_MODELS = [];
export const PRICE_PROVENANCE = {schema:PRICE_SNAPSHOT.schema,source:PRICE_SNAPSHOT.source,observed_at:PRICE_SNAPSHOT.observed_at};

// Helper to retrieve a model by ID
export function getModelById(id) {
  return ACTIVE_MODELS.find(m => m.id === id || m.canonicalId === id);
}

// Helper to filter models by search, cohort, and provider
export function filterModels({ search = '', cohort = 'all', provider = 'all' } = {}) {
  return ACTIVE_MODELS.filter(model => {
    const matchesSearch = !search || 
      model.name.toLowerCase().includes(search.toLowerCase()) ||
      model.provider.toLowerCase().includes(search.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCohort = cohort === 'all' || model.cohort === cohort;
    const matchesProvider = provider === 'all' || model.provider === provider;

    return matchesSearch && matchesCohort && matchesProvider;
  });
}

/**
 * Live Fetcher: Pulls authoritative, real-time pricing and newly released models
 * directly from OpenRouter API, caching in localStorage with graceful fallback.
 */
export async function syncLiveOpenRouterPrices() {
  try {
    // 1. Check local storage cache
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem(CACHE_KEY_OPENROUTER);
      if (cached) {
        try {
          const { timestamp, data } = JSON.parse(cached);
          if (Number.isSafeInteger(timestamp) && timestamp <= Date.now() && Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
            mergeOpenRouterModels(data,new Date(timestamp).toISOString());
            return { success: true, count: ACTIVE_MODELS.length, fromCache: true };
          }
        } catch (e) {
          console.warn('Invalid OpenRouter cache in localStorage', e);
        }
      }
    }

    // 2. Fetch fresh data from OpenRouter API
    const resp = await fetch(OPENROUTER_API_URL);
    if (!resp.ok) throw new Error(`OpenRouter API responded with HTTP ${resp.status}`);
    const json = await resp.json();
    const liveList = json.data || [];

    // Cache result
    if (typeof window !== 'undefined' && window.localStorage && liveList.length > 0) {
      localStorage.setItem(CACHE_KEY_OPENROUTER, JSON.stringify({
        timestamp: Date.now(),
        data: liveList
      }));
    }

    mergeOpenRouterModels(liveList);
    return { success: true, count: ACTIVE_MODELS.length, fromCache: false };
  } catch (err) {
    console.warn('OpenRouter live sync fell back to built-in catalog:', err);
    return { success: false, count: ACTIVE_MODELS.length, error: err.message };
  }
}

export function mergeOpenRouterModels(openRouterList, observedAt = new Date().toISOString(), live = true) {
  const modelMap=new Map(MODELS_DATA.map(m=>[m.id,{...m,canonicalId:MODEL_ALIASES[m.id] || m.id,pricingProvenance:{source:'legacy-reference',observed_at:null},isLiveSynced:false}]));
  const numeric = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value)) && Number(value)>=0;
  for(const item of openRouterList) {
    if(typeof item.id!=='string' || !numeric(item.pricing?.prompt) || !numeric(item.pricing?.completion)) continue;
    const supportsReasoning=numeric(item.pricing.internal_reasoning) || (item.supported_parameters || []).some(p=>p==='reasoning'||p==='include_reasoning');
    const existing=[...modelMap.values()].find(m=>m.canonicalId===item.id);
    const pricing={inputPricePerM:Number(item.pricing.prompt)*1e6,outputPricePerM:Number(item.pricing.completion)*1e6,
      thinkingPricePerM:numeric(item.pricing.internal_reasoning)?Number(item.pricing.internal_reasoning)*1e6:undefined,
      cachedInputPricePerM:numeric(item.pricing.input_cache_read)?Number(item.pricing.input_cache_read)*1e6:undefined,
      pricingProvenance:{source:OPENROUTER_API_URL,observed_at:observedAt},isLiveSynced:live};
    if(existing){Object.assign(existing,pricing);existing.supportsThinking ||= supportsReasoning;if(item.context_length)existing.contextWindow=item.context_length;continue;}
    modelMap.set(item.id,{id:item.id,canonicalId:item.id,name:item.name||item.id,provider:({openai:PROVIDERS.OPENAI,anthropic:PROVIDERS.ANTHROPIC,google:PROVIDERS.GOOGLE,deepseek:PROVIDERS.DEEPSEEK,'meta-llama':PROVIDERS.META,mistralai:PROVIDERS.MISTRAL,'x-ai':PROVIDERS.XAI,cohere:PROVIDERS.COHERE})[item.id.split('/')[0]] || item.id.split('/')[0],cohort:COHORTS.WORKHORSE,
      ...pricing,contextWindow:item.context_length||null,maxOutput:item.top_provider?.max_completion_tokens||null,
      supportsThinking:supportsReasoning,supportsVision:item.architecture?.input_modalities?.includes('image')||false,
      supportsAudio:item.architecture?.input_modalities?.includes('audio')||false,latencyMs:null,description:'Provider catalog price; token forecasts are heuristic.'});
  }
  ACTIVE_MODELS=[...modelMap.values()];return ACTIVE_MODELS;
}
mergeOpenRouterModels(PRICE_SNAPSHOT.models,PRICE_SNAPSHOT.observed_at,false);
