import { BaseTool, ToolInputSchema } from './base'

export class CalculatorTool extends BaseTool {
  readonly name = 'calculate'
  readonly description = 'Calculate mathematical expressions safely'
  readonly inputSchema: ToolInputSchema = {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (supports +, -, *, /, %, ^, sqrt, sin, cos, tan, log, ln, abs, round, floor, ceil)'
      }
    },
    required: ['expression']
  }

  private readonly allowedOperators = [
    '+', '-', '*', '/', '%', '^', '(', ')', '.',
    'sqrt', 'sin', 'cos', 'tan', 'log', 'ln', 'abs', 'round', 'floor', 'ceil',
    'pi', 'e'
  ]

  private readonly mathConstants = {
    pi: Math.PI,
    e: Math.E
  }

  private readonly mathFunctions = {
    sqrt: Math.sqrt,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log10,
    ln: Math.log,
    abs: Math.abs,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil
  }

  async execute(args: Record<string, any>): Promise<string> {
    const { expression } = this.validateInput(args)
    
    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression is required and must be a string')
    }

    const sanitized = this.sanitizeExpression(expression)
    
    try {
      const result = this.evaluateExpression(sanitized)
      
      if (!isFinite(result)) {
        throw new Error('Result is not a finite number')
      }
      
      return `${expression} = ${result}`
    } catch (error) {
      throw new Error(`Invalid expression: ${this.formatError(error)}`)
    }
  }

  private sanitizeExpression(expression: string): string {
    let sanitized = expression
      .toLowerCase()
      .replace(/\s/g, '')
      .replace(/\^/g, '**')

    for (const [name, value] of Object.entries(this.mathConstants)) {
      sanitized = sanitized.replace(new RegExp(name, 'g'), value.toString())
    }

    for (const funcName of Object.keys(this.mathFunctions)) {
      const regex = new RegExp(`${funcName}\\(([^)]+)\\)`, 'g')
      sanitized = sanitized.replace(regex, (match, args) => {
        return `Math.${funcName}(${args})`
      })
    }

    if (!this.isValidExpression(sanitized)) {
      throw new Error('Expression contains invalid characters or functions')
    }

    return sanitized
  }

  private isValidExpression(expression: string): boolean {
    const allowedPattern = /^[0-9+\-*/.()%\s]*$/
    const mathFuncPattern = /Math\.(sqrt|sin|cos|tan|log|ln|abs|round|floor|ceil)\([^)]*\)/g
    
    const withoutMathFunctions = expression.replace(mathFuncPattern, '1')
    
    return allowedPattern.test(withoutMathFunctions)
  }

  private evaluateExpression(expression: string): number {
    try {
      const func = new Function('Math', `return ${expression}`)
      return func(Math)
    } catch (error) {
      throw new Error('Failed to evaluate expression')
    }
  }
} 