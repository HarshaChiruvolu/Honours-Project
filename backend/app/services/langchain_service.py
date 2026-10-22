"""
LangChain Generative AI & Remediation Service
==============================================
Uses LangChain with Google Gemini (gemini-3.8-flash via ChatGoogleGenerativeAI)
and Pydantic output parsing to formulate structured, hallucination-free recovery roadmaps
and interactive conversational responses grounded in the curriculum.
"""

import re
import json
from typing import List, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from backend.app.core.config import settings
from backend.app.models.schemas import (
    StudentInput,
    PredictionResult,
    ExplainResult,
    RetrievedCurriculumChunk,
    RemediationPlan,
    StudyDay,
    PracticeProblem,
    ChatMessage,
    ChatResponse,
)
from backend.app.services.vector_service import vector_service

def extract_text(content: Any) -> str:
    """Extracts raw text from string or Gemini structured block list."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        extracted = []
        for block in content:
            if isinstance(block, dict) and "text" in block:
                extracted.append(block["text"])
            elif hasattr(block, "text"):
                extracted.append(block.text)
            else:
                extracted.append(str(block))
        return "\n".join(extracted)
    return str(content)

class LangChainService:
    def __init__(self):
        self.llm = None
        self._init_llm()

    def _init_llm(self):
        """Initializes ChatGoogleGenerativeAI with Gemini model and API key."""
        api_key = settings.GEMINI_API_KEY
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model=settings.GEMINI_MODEL,
                    google_api_key=api_key,
                    temperature=0.2,
                )
            except Exception as e:
                print(f"Warning: Failed to initialize ChatGoogleGenerativeAI: {e}")
                self.llm = None
        else:
            print("Notice: GEMINI_API_KEY not configured or placeholder detected.")
            self.llm = None

    def generate_remediation(
        self,
        student: StudentInput,
        prediction: PredictionResult,
        explainability: ExplainResult,
        retrieved_chunks: List[RetrievedCurriculumChunk],
    ) -> RemediationPlan:
        """
        Orchestrates an LCEL chain to generate a grounded, adaptive 3-day recovery roadmap
        and 2 targeted diagnostic practice questions.
        """
        if self.llm is None:
            self._init_llm()

        # Format context excerpts
        context_str = ""
        for i, chunk in enumerate(retrieved_chunks, 1):
            context_str += f"\n--- Source {i}: {chunk.title} ({chunk.section}) ---\n{chunk.excerpt}\n"

        # Format top deficits
        deficits_str = ", ".join([ 
            f"{imp.display_name} (SHAP impact: {imp.shap_value} pts)"
            for imp in explainability.feature_impacts
            if imp.shap_value < 0
        ])
        if not deficits_str:
            deficits_str = "No severe negative deficits identified (student performing above baseline)."

        # Determine academic tier and difficulty policy based on ML prediction
        predicted_score = prediction.predicted_score
        is_pass = prediction.pass_fail_status.lower() == "pass"

        if predicted_score < 50 or not is_pass:
            tier_name = "At-Risk (Projected Fail / Severe Deficits)"
            difficulty_rule = (
                "DIFFICULTY & ROADMAP MANDATE FOR AT-RISK STUDENT:\n"
                "- Practice Problem 1 difficulty MUST be 'Easy'. Focus on core conceptual definition, syntax, or identifying base cases.\n"
                "- Practice Problem 2 difficulty MUST be 'Easy-Medium'. Focus on simple call stack tracing or null pointer pitfalls.\n"
                "- The 3-day roadmap must be titled 'Emergency Core Remediation Roadmap', prioritizing high-yield passing concepts to reach >= 50% without cognitive overload."
            )
        elif predicted_score < 75:
            tier_name = "Borderline (Projected Pass / Moderate Competence)"
            difficulty_rule = (
                "DIFFICULTY & ROADMAP MANDATE FOR BORDERLINE STUDENT:\n"
                "- Practice Problem 1 difficulty MUST be 'Medium'. Focus on standard algorithmic execution and manual call stack analysis.\n"
                "- Practice Problem 2 difficulty MUST be 'Medium'. Focus on edge cases, memory pitfalls, or standard tree recursions.\n"
                "- The 3-day roadmap must be titled 'Targeted Gap-Bridging Roadmap', explicitly attacking the negative TreeSHAP deficits to elevate performance past 75%."
            )
        else:
            tier_name = "High Achiever (Top Mastery / Honors Level)"
            difficulty_rule = (
                "DIFFICULTY & ROADMAP MANDATE FOR HIGH ACHIEVER STUDENT:\n"
                "- Practice Problem 1 difficulty MUST be 'Hard'. Focus on non-trivial recurrence relations, tree rebalancing, or cache-conscious traversal.\n"
                "- Practice Problem 2 difficulty MUST be 'Hard' or 'Advanced'. Focus on formal asymptotic space-time proofs, tail recursion compiler optimizations, or memory hierarchy limits.\n"
                "- The 3-day roadmap must NOT be remedial. Title it 'Honors Mastery & Acceleration Roadmap', challenging the student with deep optimization, formal analysis, and competitive problem solving."
            )

        parser = JsonOutputParser(pydantic_object=RemediationPlan)

        system_instruction = (
            "You are a Senior Computer Science Professor and Academic Remediation Specialist at IIIT Kottayam.\n"
            "Your mandate is to generate a personalized, mathematically grounded diagnostic plan for an undergraduate student.\n\n"
            "STRICT GROUNDING & DIFFICULTY CONSTRAINTS:\n"
            "1. Base all conceptual advice and practice problems STRICTLY on the provided curriculum sources. Do not invent unapproved topics.\n"
            "2. Address the student's quantified SHAP negative deficits directly in the diagnostic summary and roadmap.\n"
            f"3. STRICT DIFFICULTY ENFORCEMENT:\n{difficulty_rule}\n"
            "4. Return ONLY a valid JSON object matching the requested schema. The difficulty field of each problem MUST strictly reflect this assigned tier.\n"
            f"{parser.get_format_instructions()}\n"
        )

        user_content = (
            f"STUDENT DIAGNOSTIC PROFILE:\n"
            f"- Academic Performance Tier: {tier_name}\n"
            f"- Predicted Exam Score: {prediction.predicted_score}/100\n"
            f"- Pass/Fail Status: {prediction.pass_fail_status} (Threshold: {prediction.passing_threshold})\n"
            f"- Score Margin: {prediction.score_margin:+.1f} points\n"
            f"- Top Deficits Identified by TreeSHAP:\n{deficits_str}\n\n"
            f"DIFFICULTY & ROADMAP RULES TO FOLLOW:\n"
            f"{difficulty_rule}\n\n"
            f"GROUNDED CURRICULUM SOURCES RETRIEVED FROM CHROMADB:\n"
            f"{context_str if context_str else 'Core Computer Science curriculum on recursion, trees, memory, and sorting.'}\n\n"
            f"Generate the comprehensive diagnostic summary, adaptive 3-day roadmap, and 2 targeted practice problems with strict difficulty labeling as valid JSON."
        )

        if self.llm is not None:
            try:
                response = self.llm.invoke([
                    ("system", system_instruction),
                    ("user", user_content),
                ])
                raw_text = extract_text(response.content)
                
                # Clean any markdown code fences if returned
                cleaned_text = re.sub(r"^```json\s*", "", raw_text.strip())
                cleaned_text = re.sub(r"\s*```$", "", cleaned_text.strip())

                parsed_dict = json.loads(cleaned_text)
                return RemediationPlan(**parsed_dict)
            except Exception as e:
                print(f"LLM chain failed or returned invalid JSON ({e}). Falling back to grounded template generator.")

        # Grounded deterministic fallback (ensures zero downtime even if API rate limits or network issues occur)
        return self._generate_grounded_fallback(prediction, explainability, retrieved_chunks)

    def _generate_grounded_fallback(
        self,
        prediction: PredictionResult,
        explainability: ExplainResult,
        retrieved_chunks: List[RetrievedCurriculumChunk],
    ) -> RemediationPlan:
        """Deterministic, grounded remediation generator adapted per student tier when LLM API is unavailable."""
        predicted_score = prediction.predicted_score
        is_pass = prediction.pass_fail_status.lower() == "pass"
        day1_topic = retrieved_chunks[0].title if retrieved_chunks else "Module 2: Recursion & Trees"
        day2_topic = retrieved_chunks[1].title if len(retrieved_chunks) > 1 else "Module 1: Memory & Pointers"

        primary_deficit = next((imp.display_name for imp in explainability.feature_impacts if imp.shap_value < 0), "core study pace")

        # --- Tier 1: At-Risk (Score < 50) ---
        if predicted_score < 50 or not is_pass:
            summary = (
                f"Urgent Diagnostic Alert: Your projected exam score is {predicted_score}/100 ({prediction.pass_fail_status.upper()}). "
                f"TreeSHAP analysis indicates your performance is pulled down significantly by {primary_deficit}. "
                f"This 3-day recovery roadmap focuses strictly on high-yield core concepts and foundational problem solving to safely reach the passing mark (50%)."
            )
            roadmap = [
                StudyDay(
                    day=1,
                    focus_topic=f"Base Cases & Safety: {day1_topic}",
                    allocated_hours=3.0,
                    action_items=[
                        "Master the definition of recursive base cases and understand why missing base cases cause stack overflow crashes.",
                        "Step through simple 3-node recursion tracing on paper without looking at solutions.",
                        "Review lecture notes on call stack activation records to visualize stack push and pop operations."
                    ]
                ),
                StudyDay(
                    day=2,
                    focus_topic=f"Memory Fundamentals & Safety: {day2_topic}",
                    allocated_hours=2.5,
                    action_items=[
                        "Learn the core difference between Stack (automatic local variables) and Heap (manual malloc/free) storage.",
                        "Identify the #1 exam pitfall: dereferencing NULL pointers or dangling pointers after freeing.",
                        "Complete basic practice tracing dynamic allocation routines."
                    ]
                ),
                StudyDay(
                    day=3,
                    focus_topic="Passing Triage & High-Yield Diagnostic Review",
                    allocated_hours=2.5,
                    action_items=[
                        "Solve the two Easy/Easy-Medium diagnostic questions below to verify fundamental grasp.",
                        "Review standard exam definitions for Big-O notation best/worst case scenarios.",
                        "Re-run self-audit on simple binary tree traversals (In-order, Pre-order)."
                    ]
                ),
            ]
            problems = [
                PracticeProblem(
                    id="prob_01",
                    topic="Recursion Fundamentals: Base Cases",
                    difficulty="Easy",
                    question="Identify the fatal flaw in the following recursive function: 'int countdown(int n) { return countdown(n - 1); }'. What happens when executed, and how do you fix it?",
                    hint="A recursive function requires both an inductive step and a stopping condition. What happens to the call stack if there is no termination check?",
                    expected_approach="The function lacks a base case. Each call pushes an activation frame onto the call stack indefinitely until memory is exhausted, causing a Stack Overflow. Fix by adding: 'if (n <= 0) return 0;'."
                ),
                PracticeProblem(
                    id="prob_02",
                    topic="Memory Layout: Stack vs Heap Basics",
                    difficulty="Easy-Medium",
                    question="Why is accessing a local function variable after the function has returned dangerous in C/C++? What part of memory did it reside in?",
                    hint="Local variables reside in the call stack frame. What happens to the frame when a function returns?",
                    expected_approach="Local variables reside on the Call Stack. When the function returns, its stack frame is popped and invalidated. Returning a pointer to a local variable creates a dangling pointer, leading to undefined behavior."
                ),
            ]

        # --- Tier 2: Borderline (Score 50 - 74) ---
        elif predicted_score < 75:
            summary = (
                f"Your projected exam score is {predicted_score}/100 ({prediction.pass_fail_status.upper()}). "
                f"TreeSHAP analysis indicates you have a solid foundation, but {primary_deficit} is holding you back by {abs(prediction.score_margin):.1f} points from a distinction. "
                f"This 3-day roadmap targets the precise conceptual edge-cases needed to elevate your grade into the 75%+ band."
            )
            roadmap = [
                StudyDay(
                    day=1,
                    focus_topic=f"Foundations & Tracing: {day1_topic}",
                    allocated_hours=2.5,
                    action_items=[
                        "Review core inductive base cases and activation record stack frame behavior.",
                        "Practice tracing call stacks manually on paper for 3 tree traversal scenarios.",
                        "Audit past exam questions where stack overflow and recursive boundaries were tested."
                    ]
                ),
                StudyDay(
                    day=2,
                    focus_topic=f"Mechanisms & Pitfalls: {day2_topic}",
                    allocated_hours=2.0,
                    action_items=[
                        "Examine Stack vs Heap dynamic allocation rules and memory layout.",
                        "Debug dangling pointer references and implement manual deallocation safeguards.",
                        "Implement a clean binary search tree node deletion routine with post-order traversal."
                    ]
                ),
                StudyDay(
                    day=3,
                    focus_topic="Timed Diagnostic Self-Test & Synthesis",
                    allocated_hours=2.5,
                    action_items=[
                        "Solve the two Medium diagnostic practice problems below under strict exam conditions.",
                        "Self-audit edge cases: null pointers, single-node trees, and divide-and-conquer recurrences.",
                        "Verify time and space complexity bounds using Asymptotic Big-O analysis."
                    ]
                ),
            ]
            problems = [
                PracticeProblem(
                    id="prob_01",
                    topic="Binary Tree Traversal and Call Stack Depth",
                    difficulty="Medium",
                    question="Write a recursive algorithm to calculate the maximum depth of a binary tree. What is the worst-case auxiliary space complexity on a skewed tree?",
                    hint="Recall that each recursive level pushes an activation record onto the call stack. What happens if the tree degenerates into a linked list?",
                    expected_approach="Base case: if root is null return 0. Inductive step: return 1 + max(depth(left), depth(right)). Auxiliary space is O(h) where h=N for skewed trees."
                ),
                PracticeProblem(
                    id="prob_02",
                    topic="Dynamic Memory Allocation & Dangling Pointers",
                    difficulty="Medium",
                    question="Explain why freeing dynamically allocated binary tree nodes using pre-order traversal triggers a segmentation fault or undefined behavior.",
                    hint="Consider what happens to root->left and root->right if root is freed first before accessing children.",
                    expected_approach="Pre-order traversal visits root before its subtrees. Freeing the parent node invalidates its memory block, leaving dangling pointers to child nodes. Post-order traversal (Left, Right, Root) is mandatory."
                ),
            ]

        # --- Tier 3: High Achiever (Score >= 75) ---
        else:
            summary = (
                f"Distinction Performance Track: Your projected exam score is {predicted_score}/100 ({prediction.pass_fail_status.upper()}). "
                f"You are performing significantly above baseline across all core syllabus features. "
                f"This Honors Acceleration Roadmap focuses on advanced algorithm optimization, formal complexity proofs, and compiler-level memory behavior to push for a perfect score."
            )
            roadmap = [
                StudyDay(
                    day=1,
                    focus_topic=f"Formal Recurrence Proofs & Asymptotics: {day1_topic}",
                    allocated_hours=2.0,
                    action_items=[
                        "Apply the Akra-Bazzi method and Master Theorem to non-standard divide-and-conquer recurrences.",
                        "Analyze worst-case auxiliary call stack depth on unbalanced hierarchical structures and evaluate self-balancing tree invariants (AVL/Red-Black).",
                        "Design cache-oblivious recursive algorithms for tree traversals."
                    ]
                ),
                StudyDay(
                    day=2,
                    focus_topic=f"Architecture, Compilers & Memory: {day2_topic}",
                    allocated_hours=2.0,
                    action_items=[
                        "Investigate Tail-Call Optimization (TCO) at the assembly level and explain how the compiler converts recursion into an O(1) auxiliary jump instruction.",
                        "Audit dynamic heap allocator internals: fragmentation, memory aligners, and slab/buddy allocation strategies.",
                        "Implement an iterative DFS using an explicit heap-allocated stack to prevent OS call stack exhaustion."
                    ]
                ),
                StudyDay(
                    day=3,
                    focus_topic="Honors Competitive Problem Set & Amortized Analysis",
                    allocated_hours=2.5,
                    action_items=[
                        "Solve the two Hard/Advanced diagnostic challenges below.",
                        "Formulate formal aggregate and potential function amortized complexity proofs.",
                        "Audit spatial and temporal cache locality for array-based vs pointer-based tree representations."
                    ]
                ),
            ]
            problems = [
                PracticeProblem(
                    id="prob_01",
                    topic="Call Stack Dynamics and Tail Recursion Optimization",
                    difficulty="Hard",
                    question="Given a recursive tree traversal or factorial routine, explain the exact compiler optimization mechanism that enables Tail-Call Elimination (TCO) to execute in O(1) auxiliary stack space. Why can pre-order traversal not be fully tail-call optimized without an accumulator?",
                    hint="Consider whether the recursive call is the strict final operation before return and how activation records can be overwritten rather than pushed.",
                    expected_approach="Tail-Call Optimization occurs when the compiler detects the recursive call is the absolute last operation; the current stack frame's parameters are updated and a JMP instruction is executed instead of CALL. Pre-order has two recursive branches (left, right); only the right branch can be tail-call optimized, leaving the left branch on the stack."
                ),
                PracticeProblem(
                    id="prob_02",
                    topic="Cache Locality & Hierarchical Memory Hierarchy",
                    difficulty="Hard",
                    question="Contrast the cache-miss penalty of traversing a 1,000,000-node binary search tree stored via scattered pointer allocations in heap memory versus an array-backed implicit complete binary tree (Breadth-First layout). How does spatial locality impact Asymptotic wall-clock latency?",
                    hint="Pointer nodes reside at arbitrary virtual addresses scattered across pages. How does a CPU cache line (typically 64 bytes) behave during sequential versus pointer-chasing access?",
                    expected_approach="Pointer-based trees suffer from 'pointer chasing' where each node dereference causes a cache miss (cold/capacity) and potential TLB miss due to scattered heap addresses. Array-based heaps exploit spatial locality within 64-byte cache lines, prefetching child nodes and reducing wall-clock runtime by an order of magnitude despite identical O(log N) Big-O bounds."
                ),
            ]

        return RemediationPlan(
            diagnostic_summary=summary,
            roadmap=roadmap,
            practice_problems=problems,
        )

    def chat_tutor(
        self,
        message: str,
        history: List[ChatMessage],
        student_context: Optional[Dict[str, Any]] = None,
    ) -> ChatResponse:
        """
        Grounded conversational tutor answering student questions using ChromaDB retrieval and Gemini.
        """
        if self.llm is None:
            self._init_llm()

        # Retrieve relevant curriculum context for the user's question
        retrieved = vector_service.retrieve(message, top_k=2)
        sources = [f"{c.title} - {c.section}" for c in retrieved]

        context_str = "\n\n".join([f"[{c.title} - {c.section}]: {c.excerpt}" for c in retrieved])

        system_instruction = (
            "You are an encouraging, academically rigorous Computer Science Professor and Tutor at IIIT Kottayam.\n"
            "Answer the student's question clearly, precisely, and grounded in the provided curriculum excerpts.\n"
            "If the student's question relates to recursion, trees, memory, pointers, or sorting, provide concrete code examples and time/space complexity analysis.\n"
            "Do not hallucinate facts outside computer science best practices.\n"
        )

        messages = [("system", system_instruction)]

        if context_str:
            messages.append(("system", f"Approved Course Curriculum Context:\n{context_str}"))

        for h in history[-4:]:  # last 4 conversation turns
            messages.append((h.role if h.role in ["user", "assistant"] else "user", h.content))

        messages.append(("user", message))

        if self.llm is not None:
            try:
                response = self.llm.invoke(messages)
                reply_text = extract_text(response.content)
                return ChatResponse(reply=reply_text, grounded_sources=sources)
            except Exception as e:
                print(f"Chat LLM error: {e}")

        # Fallback response
        fallback_reply = (
            f"Regarding your query on '{message}': In Data Structures & Algorithms, understanding memory layout "
            f"and recursive activation records is paramount. Ensure you always define valid base cases to avoid stack overflow, "
            f"and use post-order traversal when freeing hierarchical structures to avoid dereferencing dangling pointers."
        )
        return ChatResponse(reply=fallback_reply, grounded_sources=sources)

langchain_service = LangChainService()
