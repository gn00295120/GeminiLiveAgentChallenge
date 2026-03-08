import random


def quiz_generator(topic: str, num_questions: int = 3, difficulty: str = "medium") -> dict:
    """Generate quiz questions for a topic to test student understanding.

    The tutor should use the generated framework to verbally quiz the student
    during the conversation.

    Args:
        topic: The topic to generate questions about
        num_questions: Number of questions to generate (1-5)
        difficulty: One of "easy", "medium", "hard"

    Returns:
        A quiz framework with question templates.
    """
    num_questions = max(1, min(5, num_questions))

    question_types = {
        "easy": [
            f"What is the definition of {topic}?",
            f"Can you name one example of {topic}?",
            f"True or False: [statement about {topic}]",
            f"Fill in the blank: {topic} is ___",
            f"Which of these is related to {topic}?",
        ],
        "medium": [
            f"Explain how {topic} works in your own words.",
            f"What would happen if [condition related to {topic}] changed?",
            f"Compare and contrast {topic} with [related concept].",
            f"Solve this problem using {topic}: [problem]",
            f"Why is {topic} important in [context]?",
        ],
        "hard": [
            f"Design a solution using {topic} for [complex scenario].",
            f"What are the limitations of {topic}?",
            f"How does {topic} connect to [advanced concept]?",
            f"Debug this example that misuses {topic}: [example]",
            f"Teach {topic} to someone who knows nothing about it.",
        ],
    }

    templates = question_types.get(difficulty, question_types["medium"])
    selected = random.sample(templates, min(num_questions, len(templates)))

    return {
        "topic": topic,
        "difficulty": difficulty,
        "num_questions": num_questions,
        "question_templates": selected,
        "instructions": (
            "Use these templates to create specific questions based on what "
            "you've seen in the student's materials. Replace bracketed placeholders "
            "with actual content from the conversation. Ask one question at a time "
            "and wait for the student's response before moving on."
        ),
        "encouragement_phrases": [
            "Great job! Let's try another one.",
            "Almost! Think about it this way...",
            "Exactly right! You really understand this.",
            "Good effort! Let me give you a hint...",
        ],
    }
