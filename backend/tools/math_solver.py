import sympy
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application


def math_solver(expression: str) -> dict:
    """Solve a mathematical expression or equation step by step.

    Args:
        expression: A mathematical expression or equation to solve.
                   Examples: "x**2 + 2*x - 3 = 0", "integrate(x**2, x)", "diff(sin(x), x)"

    Returns:
        A dictionary with the solution and steps.
    """
    try:
        x, y, z = sympy.symbols('x y z')
        transformations = standard_transformations + (implicit_multiplication_application,)

        # Check if it's an equation (contains =)
        if '=' in expression and '==' not in expression:
            left, right = expression.split('=', 1)
            left_expr = parse_expr(left.strip(), transformations=transformations)
            right_expr = parse_expr(right.strip(), transformations=transformations)
            equation = sympy.Eq(left_expr, right_expr)
            solutions = sympy.solve(equation)
            return {
                "type": "equation",
                "input": expression,
                "solutions": [str(s) for s in solutions],
                "simplified": str(sympy.simplify(left_expr - right_expr)),
            }
        else:
            expr = parse_expr(expression, transformations=transformations)
            simplified = sympy.simplify(expr)

            result = {
                "type": "expression",
                "input": expression,
                "simplified": str(simplified),
            }

            # Try to evaluate numerically if possible
            try:
                numerical = float(simplified.evalf())
                result["numerical_value"] = numerical
            except (TypeError, ValueError):
                pass

            return result

    except Exception as e:
        return {
            "type": "error",
            "input": expression,
            "error": str(e),
            "suggestion": "Try reformatting the expression. Use ** for powers, * for multiplication."
        }
