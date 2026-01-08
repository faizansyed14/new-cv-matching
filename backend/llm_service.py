import httpx
import json
from typing import Dict, List, Optional
import asyncio
from openai import AsyncOpenAI

import os

# LLM Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://51.112.105.60:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:32b")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class LLMService:
    def __init__(self):
        self.ollama_url = OLLAMA_URL
        self.ollama_model = OLLAMA_MODEL
        if OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        else:
            self.openai_client = None
            print("⚠️ Warning: OPENAI_API_KEY is not set. OpenAI features will not work.")
        self.timeout = 180.0
    
    async def categorize_document_openai(self, text: str, doc_type: str, model: str = "gpt-4o-mini") -> str:
        """Categorize using OpenAI models."""
        if not self.openai_client:
            print("❌ Error: OpenAI client not initialized. Check your OPENAI_API_KEY.")
            return "Other"
        prompt = f"""Analyze the following {doc_type.upper()} and categorize it into ONE of these categories:
- Software Engineering
- Artificial Intelligence / Machine Learning
- Cybersecurity
- Sales & Marketing
- Finance & Accounting
- Human Resources
- Operations & Logistics
- Healthcare
- Legal
- Design & Creative
- Data Science
- Product Management
- Other

{doc_type.upper()} Content:
{text[:3000]}

Respond with ONLY the category name, nothing else."""

        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert HR categorization assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=50
            )
            category = response.choices[0].message.content.strip()
            return category
        except Exception as e:
            print(f"Error categorizing with OpenAI ({model}): {e}")
            return "Other"
    
    async def categorize_document_ollama(self, text: str, doc_type: str) -> str:
        """Categorize using Ollama."""
        prompt = f"""Analyze the following {doc_type.upper()} and categorize it into ONE of these categories:
- Software Engineering
- Artificial Intelligence / Machine Learning
- Cybersecurity
- Sales & Marketing
- Finance & Accounting
- Human Resources
- Operations & Logistics
- Healthcare
- Legal
- Design & Creative
- Data Science
- Product Management
- Other

{doc_type.upper()} Content:
{text[:3000]}

Respond with ONLY the category name, nothing else."""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False
                    }
                )
                response.raise_for_status()
                result = response.json()
                category = result.get("response", "Other").strip()
                return category
        except Exception as e:
            print(f"Error categorizing with Ollama: {e}")
            return "Other"
    
    async def categorize_document(self, text: str, doc_type: str, model: str = "gpt-4o-mini") -> str:
        """Categorize a document using specified model."""
        if model == "ollama":
            return await self.categorize_document_ollama(text, doc_type)
        else:
            return await self.categorize_document_openai(text, doc_type, model)
    
    async def match_cv_to_jd_openai(self, cv_text: str, jd_text: str, cv_name: str, model: str = "gpt-4o-mini") -> Dict:
        """Match CV to JD using OpenAI models with enhanced prompts."""
        if not self.openai_client:
            return {
                "cv_name": cv_name,
                "score": 0,
                "match_level": "Error",
                "key_matches": [],
                "gaps": [],
                "summary": "Error: OPENAI_API_KEY is not set in Render environment variables."
            }
        
        # Enhanced prompt for better accuracy
        prompt = f"""You are an expert HR recruiter with 20+ years of experience in talent acquisition. Perform a comprehensive analysis of how well this candidate's CV matches the Job Description.

JOB DESCRIPTION:
{jd_text[:3000]}

CANDIDATE CV:
{cv_text[:3000]}

ANALYSIS INSTRUCTIONS:
1. Carefully evaluate the candidate's skills, experience, education, and achievements against the job requirements
2. Consider both hard skills (technical abilities, certifications) and soft skills (leadership, communication)
3. Assess years of experience, industry relevance, and career progression
4. Identify specific matching points with concrete examples from the CV
5. Note any gaps or missing qualifications that are critical for the role
6. Provide an honest, objective assessment with a numerical score

Provide your analysis in the following JSON format:
{{
    "score": <number between 0-100, where:
        90-100 = Exceptional match, highly recommended
        75-89 = Strong match, recommended
        60-74 = Good match, consider for interview
        40-59 = Fair match, has potential but gaps exist
        0-39 = Poor match, significant gaps>,
    "match_level": "<Excellent/Good/Fair/Poor>",
    "key_matches": [
        "Specific skill or experience that matches (with evidence from CV)",
        "Another matching qualification (with evidence)",
        "Continue for all major matches..."
    ],
    "gaps": [
        "Specific missing requirement or skill gap",
        "Another gap or concern",
        "Continue for all significant gaps..."
    ],
    "summary": "A detailed 3-4 sentence professional assessment explaining: (1) why this score was given, (2) the candidate's strongest qualifications for this role, (3) the most critical gaps if any, and (4) your recommendation"
}}

Respond with ONLY valid JSON, no additional text."""

        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert HR recruiter performing detailed CV-JD matching analysis. Always provide thorough, evidence-based assessments in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,  # Lower temperature for more consistent scoring
                max_tokens=1200,
                response_format={"type": "json_object"}
            )
            
            llm_response = response.choices[0].message.content
            match_data = json.loads(llm_response)
            match_data["cv_name"] = cv_name
            
            # Ensure score is valid
            if not isinstance(match_data.get("score"), (int, float)):
                match_data["score"] = 50
            else:
                # Clamp score between 0-100
                match_data["score"] = max(0, min(100, match_data["score"]))
            
            return match_data
        except Exception as e:
            print(f"Error matching with OpenAI ({model}, {cv_name}): {e}")
            return {
                "cv_name": cv_name,
                "score": 0,
                "match_level": "Error",
                "key_matches": [],
                "gaps": [],
                "summary": f"Error during analysis: {str(e)[:100]}"
            }
    
    async def match_cv_to_jd_ollama(self, cv_text: str, jd_text: str, cv_name: str) -> Dict:
        """Match CV to JD using Ollama."""
        prompt = f"""You are an expert HR recruiter. Analyze how well this CV matches the Job Description.

JOB DESCRIPTION:
{jd_text[:2500]}

CANDIDATE CV:
{cv_text[:2500]}

Provide your analysis in the following JSON format:
{{
    "score": <number between 0-100>,
    "match_level": "<Excellent/Good/Fair/Poor>",
    "key_matches": ["list of matching skills/experiences"],
    "gaps": ["list of missing requirements"],
    "summary": "Brief 2-3 sentence explanation of the match"
}}

Respond with ONLY valid JSON, no additional text."""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "num_predict": 500
                        }
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"HTTP {response.status_code}")
                
                result = response.json()
                llm_response = result.get("response", "")
                
                # Extract JSON
                if "```json" in llm_response:
                    llm_response = llm_response.split("```json")[1].split("```")[0].strip()
                elif "```" in llm_response:
                    llm_response = llm_response.split("```")[1].split("```")[0].strip()
                
                match_data = json.loads(llm_response)
                match_data["cv_name"] = cv_name
                
                if not isinstance(match_data.get("score"), (int, float)):
                    match_data["score"] = 50
                
                return match_data
        except Exception as e:
            print(f"Error matching with Ollama ({cv_name}): {e}")
            return {
                "cv_name": cv_name,
                "score": 0,
                "match_level": "Error",
                "key_matches": [],
                "gaps": [],
                "summary": f"Ollama Error: {str(e)[:100]}"
            }
    
    async def match_cv_to_jd(self, cv_text: str, jd_text: str, cv_name: str, model: str = "gpt-4o-mini") -> Dict:
        """Match CV to JD using specified model."""
        if model == "ollama":
            return await self.match_cv_to_jd_ollama(cv_text, jd_text, cv_name)
        else:
            # Support for GPT-5 and all other OpenAI models
            return await self.match_cv_to_jd_openai(cv_text, jd_text, cv_name, model)
    
    async def batch_match(self, cv_list: List[Dict], jd_text: str, model: str = "gpt-4o-mini", batch_size: int = 5) -> List[Dict]:
        """
        Match multiple CVs against a JD in batches.
        Optimized batch sizes for different models.
        """
        # Adjust batch size based on model
        if model == "ollama":
            batch_size = 3  # Ollama needs smaller batches
        elif model in ["gpt-5", "gpt-4o", "gpt-4-turbo"]:
            batch_size = 4  # Advanced models, moderate batching
        else:
            batch_size = 5  # GPT-4o-mini and GPT-3.5-turbo can handle more
        
        all_results = []
        
        for i in range(0, len(cv_list), batch_size):
            batch = cv_list[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1} with {model} ({len(batch)} CVs)...")
            
            tasks = []
            for cv in batch:
                task = self.match_cv_to_jd(cv["text"], jd_text, cv["name"], model)
                tasks.append(task)
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, Exception):
                    all_results.append({
                        "cv_name": "Unknown",
                        "score": 0,
                        "match_level": "Error",
                        "key_matches": [],
                        "gaps": [],
                        "summary": f"Error: {str(result)}"
                    })
                else:
                    all_results.append(result)
            
            # Small delay between batches
            if i + batch_size < len(cv_list):
                await asyncio.sleep(0.5)
        
        # Sort by score descending
        sorted_results = sorted(all_results, key=lambda x: x.get("score", 0), reverse=True)
        return sorted_results

# Singleton instance
llm_service = LLMService()
