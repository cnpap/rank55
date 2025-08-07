/**
 * 表达式提取工具
 */

/**
 * 找到所有括号表达式，正确处理嵌套括号
 */
export function findAllBracketExpressions(text: string): string[] {
  const expressions: string[] = [];
  const stack: number[] = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') {
      stack.push(i);
    } else if (text[i] === ')') {
      if (stack.length > 0) {
        const startIndex = stack.pop()!;
        const expression = text.substring(startIndex + 1, i);

        // 只添加最内层的表达式（不包含其他括号的表达式）
        if (!expression.includes('(') && !expression.includes(')')) {
          expressions.push(expression);
        }
      }
    }
  }

  return expressions;
}

/**
 * 从技能描述中提取所有计算表达式
 */
export function extractExpressions(description: string): string[] {
  const expressions: string[] = [];

  // 找到所有括号对，包括嵌套的情况
  const allMatches = findAllBracketExpressions(description);

  for (const expression of allMatches) {
    // 清理表达式：去除空白和换行符
    const cleanExpression = expression
      .replace(/\\s+/g, ' ')
      .replace(/\\n/g, '')
      .trim();

    // 过滤掉明显不是计算表达式的内容
    if (
      cleanExpression &&
      !cleanExpression.includes('最大') &&
      !cleanExpression.includes('来自') &&
      !cleanExpression.includes('作为') &&
      !cleanExpression.includes('至多') &&
      !cleanExpression.includes('每个') &&
      !cleanExpression.includes('每次') &&
      !cleanExpression.includes('每层') &&
      !cleanExpression.includes('持续') &&
      !cleanExpression.includes('冷却时间') &&
      !cleanExpression.includes('秒') &&
      (cleanExpression.includes('%') ||
        cleanExpression.includes('/') ||
        cleanExpression.includes('+') ||
        cleanExpression.includes('-') ||
        cleanExpression.includes('【') ||
        /\\d/.test(cleanExpression))
    ) {
      expressions.push(cleanExpression);
    }
  }

  return expressions;
}

/**
 * 技能表达式数据结构
 */
export interface SkillExpressionData {
  fileName: string;
  heroName: string;
  spellKey: string; // P, Q, W, E, R
  spellName: string;
  originalDescription: string;
  expressions: string[];
}
