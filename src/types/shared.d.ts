export interface GetQuestionsQuery {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  filter?: string;
}

export interface GetAnswersQuery {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  filter?: string;
}

export interface RecommendedParams {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
}
