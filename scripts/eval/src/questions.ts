export interface EvalQuestion {
  id: string;
  text: string;
  category: string;
}

export const TEST_QUESTIONS: EvalQuestion[] = [
  {
    id: 'Q1',
    text: 'Should I switch careers from engineering to teaching?',
    category: 'Personal Decision',
  },
  {
    id: 'Q2',
    text: 'Should I pull my child out of public school and homeschool them?',
    category: 'Personal Decision',
  },
  {
    id: 'Q3',
    text: 'Should cities invest in light rail or bus rapid transit?',
    category: 'Public Policy',
  },
  {
    id: 'Q4',
    text: 'Should the United States adopt universal basic income?',
    category: 'Public Policy',
  },
  {
    id: 'Q5',
    text: 'Should our team rewrite our monolith as microservices?',
    category: 'Technical Tradeoff',
  },
  {
    id: 'Q6',
    text: 'Should a hospital adopt AI-assisted diagnostic tools?',
    category: 'Technical Tradeoff',
  },
  {
    id: 'Q7',
    text: 'Is it ethical to use gene editing to prevent genetic diseases in embryos?',
    category: 'Ethical Dilemma',
  },
  {
    id: 'Q8',
    text: 'Should social media platforms be required to verify users\' real identities?',
    category: 'Ethical Dilemma',
  },
  {
    id: 'Q9',
    text: 'Is remote work better for productivity than in-office work?',
    category: 'Contested Empirical',
  },
  {
    id: 'Q10',
    text: 'Should I buy an electric vehicle?',
    category: 'Personal-Systemic',
  },
];
