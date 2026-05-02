export type PromptCategory =
  | "System Design & Architecture"
  | "AI Workflows"
  | "AI Workflows Advanced"
  | "Backend Development"
  | "Coding & Debugging";

export type PromptTemplate = {
  category: PromptCategory;
  title: string;
  prompt: string;
};

export const promptTemplates: PromptTemplate[] = [
  {
    category: "System Design & Architecture",
    title: "Document Processing Pipeline",
    prompt: "Design a pipeline that ingests [DESCRIBE DOCUMENT TYPES], extracts structured data, validates it, and stores it in a [DESCRIBE SYSTEM]. Handle OCR, various formats, and malformed inputs.",
  },
  {
    category: "System Design & Architecture",
    title: "Personalization Engine",
    prompt: "Design an AI personalization system for [DESCRIBE APPLICATION]. What signals should be used, how should recommendations be generated, and how should it handle new users?",
  },
  {
    category: "System Design & Architecture",
    title: "Monitoring System",
    prompt: "Design a monitoring system for an AI pipeline that tracks output quality, latency, cost, and failure rates. What stats should exist and what dashboards should be built?",
  },
  {
    category: "System Design & Architecture",
    title: "Human in the Loop System",
    prompt: "Design a system where AI handles [DESCRIBE TASKS] automatically and escalates low-confidence cases to humans. Define confidence thresholds, escalation paths, and how human feedback is incorporated.",
  },
  {
    category: "System Design & Architecture",
    title: "Knowledge Graph Extraction Pipeline",
    prompt: "Design a pipeline that reads [DESCRIBE DOCUMENTS] and extracts entities, relationships, and facts into a knowledge graph. How should deduplication and extraction quality work?",
  },
  {
    category: "System Design & Architecture",
    title: "Competitive Intelligence System",
    prompt: "Design an AI system that monitors [DESCRIBE COMPETITORS] and produces weekly intelligence reports covering [DESCRIBE AREAS]. What sources should it monitor?",
  },
  {
    category: "System Design & Architecture",
    title: "Meeting Intelligence System",
    prompt: "Design an AI system that processes meeting transcripts and produces [DESCRIBE OUTPUTS]. How should notes be summarized and how should it handle multiple speakers and engagement signals?",
  },
  {
    category: "System Design & Architecture",
    title: "Contract Analysis Pipeline",
    prompt: "Design a pipeline that analyzes contracts and tags [DESCRIBE FILE TYPES]. What clauses should trigger alerts, how should confidence be communicated, and when should lawyer review happen?",
  },
  {
    category: "System Design & Architecture",
    title: "Sentiment Analysis System",
    prompt: "Design a sentiment analysis system for [DESCRIBE DATA SOURCE]. What dimensions of sentiment matter, and how should results be aggregated?",
  },
  {
    category: "System Design & Architecture",
    title: "Lead Scoring System",
    prompt: "Design a lead scoring system for [DESCRIBE BUSINESS]. What signals predict conversion, how should scores be calculated, and how should the sales team use them?",
  },
  {
    category: "System Design & Architecture",
    title: "Content Recommendation Engine",
    prompt: "Design a content recommendation engine for [DESCRIBE PLATFORM]. What signals drive recommendations, how should diversity be maintained, and how should new content be handled?",
  },
  {
    category: "System Design & Architecture",
    title: "Anomaly Detection System",
    prompt: "Design an anomaly detection system for [DESCRIBE DATA]. What constitutes an anomaly, how should severity be classified, and what should happen when one is detected?",
  },
  {
    category: "System Design & Architecture",
    title: "Translation Workflow",
    prompt: "Design an AI translation workflow for [DESCRIBE CONTENT TYPE] from [SOURCE LANGUAGE] to [TARGET LANGUAGE]. Should terminology consistency be maintained, and how should quality be validated?",
  },
  {
    category: "System Design & Architecture",
    title: "Compliance Checking System",
    prompt: "Design an AI compliance checking system that validates [DESCRIBE CONTENT OR ACTIONS] against [DESCRIBE REGULATIONS]. How should violations be categorized, and what remediation steps should be suggested?",
  },
  {
    category: "AI Workflows",
    title: "Design an AI Agent",
    prompt: "Design an AI agent that can [DESCRIBE TASK]. What tools does it need, what decisions require human approval, and how should it handle failures?",
  },
  {
    category: "AI Workflows",
    title: "Build a Prompt Chain",
    prompt: "Design a multi-step prompt chain that takes [INPUT] and produces [OUTPUT]. Break it into discrete steps, define what each step outputs, and explain how outputs feed into the next step.",
  },
  {
    category: "AI Workflows",
    title: "Create a System Prompt",
    prompt: "Write a system prompt for an AI assistant acting as [DESCRIBE ROLE] for [DESCRIBE COMPANY/USE CASE]. Include capabilities, limitations, and how it should handle edge cases.",
  },
  {
    category: "AI Workflows",
    title: "Evaluate Prompt Quality",
    prompt: "Evaluate this prompt and tell me everything that's wrong with it. Then rewrite it to be more precise, actionable, and likely to produce the output I actually want. [PASTE PROMPT]",
  },
  {
    category: "AI Workflows",
    title: "Design a RAG System",
    prompt: "Design a Retrieval Augmented Generation system for [DESCRIBE USE CASE]. What should be indexed, how should chunking work, what model should be used, and what embedding model should be used?",
  },
  {
    category: "AI Workflows",
    title: "Build a Classification Pipeline",
    prompt: "Design an AI classification pipeline that categorizes [DESCRIBE INPUTS] into [DESCRIBE CATEGORIES]. Include data preprocessing, model selection, confidence thresholds, and edge cases.",
  },
  {
    category: "AI Workflows",
    title: "Create an Extraction Prompt",
    prompt: "Write a prompt that extracts [DESCRIBE INFORMATION] from [DESCRIBE DOCUMENT TYPE]. Output as structured JSON. Include missing fields gracefully and flag uncertainties.",
  },
  {
    category: "AI Workflows",
    title: "Design a Multi-Agent System",
    prompt: "Design a multi-agent system where [NUMBER] AI agents collaborate to [DESCRIBE GOAL]. Define each agent's role, how they communicate, and how conflicts are resolved.",
  },
  {
    category: "AI Workflows",
    title: "Build an AI Evaluation Framework",
    prompt: "Design a framework for evaluating the quality of outputs for [DESCRIBE USE CASE]. What metrics matter, how should they be measured, and what does good output look like?",
  },
  {
    category: "AI Workflows",
    title: "Create a Summarization Pipeline",
    prompt: "Design a pipeline that processes [DESCRIBE CONTENT TYPE] and produces [DESCRIBE SUMMARY FORMAT]. Include varying lengths, key entity extraction, and uncertainty flags.",
  },
  {
    category: "AI Workflows",
    title: "Content Moderation System",
    prompt: "Design an AI content moderation pipeline for [DESCRIBE PLATFORM]. What categories need detection, what thresholds trigger manual review, and how is the review queue managed?",
  },
  {
    category: "AI Workflows",
    title: "AI Writing Assistant",
    prompt: "Design an AI writing assistant for [DESCRIBE USE CASE]. What capabilities should it have, what constraints should it operate under, and how should it handle requests outside scope?",
  },
  {
    category: "AI Workflows",
    title: "Feedback Loop System",
    prompt: "Design a system where AI outputs are evaluated, feedback is collected, and the system improves over time for [DESCRIBE USE CASE]. How is quality measured and what triggers retraining?",
  },
  {
    category: "AI Workflows Advanced",
    title: "Data Enrichment Workflow",
    prompt: "Design a workflow that takes [DESCRIBE INPUT DATA] and enriches it with [DESCRIBE ADDITIONAL INFORMATION] using AI. Define the steps, prompts, and how to handle failures.",
  },
  {
    category: "Backend Development",
    title: "Implement Retry Logic",
    prompt: "Add retry logic to this function that handles rate limiting, transient errors, and uses exponential backoff. [PASTE FUNCTION]",
  },
  {
    category: "Backend Development",
    title: "Write a State Machine",
    prompt: "Implement a state machine for [DESCRIBE WITH STATES]. Define all states, transitions, guards, and actions.",
  },
  {
    category: "Backend Development",
    title: "Build a Queue System",
    prompt: "Implement a job queue in [LANGUAGE] that processes [DESCRIBE JOBS]. Include priority levels, retry logic, dead letter handling, and a way to monitor queue depth.",
  },
  {
    category: "Backend Development",
    title: "Build a Web Scraper",
    prompt: "Write a Python web scraper that extracts [DESCRIBE DATA] from [SITE]. Include pagination, rate limiting, and graceful handling for failed requests.",
  },
  {
    category: "Backend Development",
    title: "Code Architecture Review",
    prompt: "Review this architecture and tell me what problems you foresee and how I should fix it. [DESCRIBE ARCHITECTURE]",
  },
  {
    category: "Backend Development",
    title: "Add Error Handling",
    prompt: "Add comprehensive error handling to this code. Catch all possible failures, log them appropriately, and fail gracefully. [PASTE CODE]",
  },
  {
    category: "Backend Development",
    title: "Build a Cron Job",
    prompt: "Write a cron job in [LANGUAGE] that [DESCRIBE TASK]. It should run [DESCRIBE FREQUENCY], handle failures, and send an alert if something goes wrong.",
  },
  {
    category: "Backend Development",
    title: "Translate Between Languages",
    prompt: "Translate this code from [LANGUAGE A] to [LANGUAGE B]. Maintain all functionality and use idiomatic patterns for the target language. [PASTE CODE]",
  },
  {
    category: "Backend Development",
    title: "Write a Webhook Handler",
    prompt: "Write a webhook handler in [FRAMEWORK] that receives events from [SERVICE]. Validate the signature, parse the payload, and handle [DESCRIBE EVENTS].",
  },
  {
    category: "Backend Development",
    title: "Build a Rate Limiter",
    prompt: "Implement a rate limiter in [LANGUAGE] that allows [X] requests per [TIME PERIOD] per [DESCRIPTION]. Include a way to whitelist certain users.",
  },
  {
    category: "Backend Development",
    title: "Create a Middleware",
    prompt: "Write middleware for [FRAMEWORK] that [DESCRIBE WHAT IT SHOULD DO]. Make it reusable, well-documented, and handle all edge cases.",
  },
  {
    category: "Backend Development",
    title: "Design a Caching Strategy",
    prompt: "Design a caching strategy for [DESCRIBE SYSTEM]. What should be cached, for how long, when should it be invalidated, and what caching technology would work?",
  },
  {
    category: "Backend Development",
    title: "Write a Data Migration Script",
    prompt: "Write a database migration script that [DESCRIBE WHAT IT NEEDS TO DO]. Make it idempotent, reversible, and safe to run on a production database.",
  },
  {
    category: "Backend Development",
    title: "Build an Authentication System",
    prompt: "Design and write a JWT authentication system in [FRAMEWORK]. Include signup, login, token refresh, logout, and protected route middleware.",
  },
  {
    category: "Backend Development",
    title: "Generate Mock Data",
    prompt: "Write a script that generates realistic mock data for [DESCRIBE DATA STRUCTURE]. Generate [NUMBER] records and output as JSON.",
  },
  {
    category: "Backend Development",
    title: "Implement Pagination",
    prompt: "Add cursor-based pagination to this API endpoint. Include a page size limit, handle edge cases, and return proper metadata.",
  },
  {
    category: "Backend Development",
    title: "Write a CI/CD Pipeline",
    prompt: "Write a GitHub Actions workflow that runs tests, checks code quality, builds the application, and deploys to [PLATFORM] on every push to main.",
  },
  {
    category: "Backend Development",
    title: "Design a Microservice",
    prompt: "Design the architecture for a microservice that handles [DESCRIBE FUNCTIONALITY]. What endpoints does it need, how does it communicate, and what data model should it use?",
  },
  {
    category: "Coding & Debugging",
    title: "Code Review",
    prompt: "Review this code as a senior engineer. Identify bugs, security vulnerabilities, performance issues, and style problems. Explain each issue and suggest a fix: [PASTE CODE]",
  },
  {
    category: "Coding & Debugging",
    title: "Debug This Error",
    prompt: "I am getting this error: [ERROR MESSAGE]. Here is the relevant code: [PASTE CODE]. Walk me through every possible cause and fix each one.",
  },
  {
    category: "Coding & Debugging",
    title: "Refactor for Readability",
    prompt: "Refactor this code to be cleaner and more readable without changing its functionality. Add comments explaining complex logic: [PASTE CODE]",
  },
  {
    category: "Coding & Debugging",
    title: "Write Unit Tests",
    prompt: "Write comprehensive unit tests for this function. Cover the happy path, edge cases, null inputs, and error conditions: [PASTE FUNCTION]",
  },
  {
    category: "Coding & Debugging",
    title: "Optimize Performance",
    prompt: "Analyze this code for performance bottlenecks. Identify the slowest parts and rewrite them to be more efficient: [PASTE CODE]",
  },
  {
    category: "Coding & Debugging",
    title: "Convert to TypeScript",
    prompt: "Convert this JavaScript code to TypeScript. Add proper type definitions for all variables, parameters, and return values: [PASTE CODE]",
  },
  {
    category: "Coding & Debugging",
    title: "Explain This Code",
    prompt: "Explain this code in plain English. I have never seen it before. What does it do, how does it work, and why is it written this way: [PASTE CODE]",
  },
  {
    category: "Coding & Debugging",
    title: "Generate API Endpoint",
    prompt: "Write a REST API endpoint in [LANGUAGE/FRAMEWORK] that [DESCRIBE WHAT IT SHOULD DO]. Include input validation, error handling, and HTTP status codes.",
  },
  {
    category: "Coding & Debugging",
    title: "Database Query Optimization",
    prompt: "This SQL query is running slowly: [PASTE QUERY]. Analyze it, explain why it is slow, rewrite it to be faster, and suggest indexes that would help.",
  },
  {
    category: "Coding & Debugging",
    title: "Build a CLI Tool",
    prompt: "Write a command line tool in Python that [DESCRIBE FUNCTIONALITY]. Include argument parsing, error handling, help text, and usage examples.",
  },
  {
    category: "Coding & Debugging",
    title: "Write Documentation",
    prompt: "Write clear developer documentation for this function including purpose, parameters, return values, example usage, and edge cases: [PASTE FUNCTION]",
  },
  {
    category: "Coding & Debugging",
    title: "Security Audit",
    prompt: "Audit this code for security vulnerabilities. Check for SQL injection, XSS, authentication issues, exposed secrets, and other risks: [PASTE CODE]",
  },
  {
    category: "Coding & Debugging",
    title: "Write a Regex",
    prompt: "Write a regex pattern that matches [DESCRIBE WHAT TO MATCH]. Explain each part of the pattern and show example matches and non-matches.",
  },
  {
    category: "Coding & Debugging",
    title: "Convert Function to Async",
    prompt: "Convert this synchronous function to async/await. Handle all promise rejections properly and maintain the same functionality: [PASTE FUNCTION]",
  },
  {
    category: "Coding & Debugging",
    title: "Design a Data Schema",
    prompt: "Design a database schema for [DESCRIBE APPLICATION]. Include all tables, columns, data types, relationships, indexes, and explain your design decisions.",
  },
];

export const promptCategories = Array.from(new Set(promptTemplates.map(item => item.category)));
