def concept_explainer(concept: str, difficulty_level: str = "beginner") -> dict:
    """Create a structured explanation for an academic concept.

    This tool creates a framework for explaining concepts. The AI tutor
    should use this structure to guide its explanation.

    Args:
        concept: The concept to explain (e.g., "photosynthesis", "recursion", "quadratic formula")
        difficulty_level: One of "beginner", "intermediate", "advanced"

    Returns:
        A structured explanation framework.
    """
    frameworks = {
        "beginner": {
            "concept": concept,
            "level": difficulty_level,
            "approach": "Use simple analogies and everyday examples",
            "structure": [
                f"1. What is {concept}? (one simple sentence)",
                "2. Real-world analogy that makes it relatable",
                "3. Why does it matter? (practical relevance)",
                "4. One simple example to try together",
            ],
            "tips": "Avoid jargon. Use 'imagine...' and 'think of it like...' phrases.",
        },
        "intermediate": {
            "concept": concept,
            "level": difficulty_level,
            "approach": "Build on fundamentals with more detail",
            "structure": [
                f"1. Definition of {concept} with key terms",
                "2. How it works (mechanism/process)",
                "3. Common misconceptions to address",
                "4. Practice problem to work through together",
            ],
            "tips": "Introduce proper terminology but explain each term.",
        },
        "advanced": {
            "concept": concept,
            "level": difficulty_level,
            "approach": "Deep dive with connections to related topics",
            "structure": [
                f"1. Formal definition of {concept}",
                "2. Underlying principles and theory",
                "3. Edge cases and exceptions",
                "4. Connections to related concepts",
                "5. Challenge problem for mastery check",
            ],
            "tips": "Use precise terminology. Encourage critical thinking about why, not just what.",
        },
    }

    return frameworks.get(difficulty_level, frameworks["beginner"])
